
function workingMemory(rawCode) {
  const code = cut(rawCode);
  if (!code) return { max: 0, perLine: [] };

  const lines = code.split(/\r?\n/);

  const ast = parseWithAcorn(code);
  if (ast && typeof acornWalk !== "undefined") {
    return _memoryFromAST(ast, lines, code);
  }
  return _memoryHeuristic(lines);
}

function _memoryFromAST(ast, lines, code) {
  const bindings = [];

  acornWalk.ancestor(ast, {
    VariableDeclarator(node, ancestors) {
      if (!node.id || !node.id.name) return;

      let kind = "var";
      for (let i = ancestors.length - 1; i >= 0; i--) {
        if (ancestors[i].type === "VariableDeclaration") {
          kind = ancestors[i].kind;
          break;
        }
      }

      const scope = kind === "var"
          ? _findFunctionScope(ancestors)
          : _findBlockScope(ancestors);

      bindings.push({
        name: node.id.name,
        scopeStart: scope.start,
        scopeEnd: scope.end,
        declPos: node.start,
      });
    },

    FunctionDeclaration(node, ancestors) {
      if (node.id && node.id.name) {
        const scope = _findBlockScope(ancestors);
        bindings.push({
          name: node.id.name,
          scopeStart: scope.start,
          scopeEnd: scope.end,
          declPos: node.start,
        });
      }
      _addParams(node.params, node.body, bindings);
    },

    FunctionExpression(node) {
      _addParams(node.params, node.body, bindings);
    },

    ArrowFunctionExpression(node) {
      _addParams(node.params, node.body, bindings);
    },
  });

  const lineStartOffsets = _buildLineOffsets(code);

  const perLine = lines.map((lineText, idx) => {
    const lineOffset = lineStartOffsets[idx];
    const lineEnd    = lineOffset + lineText.length;
    const seen = new Set();
    for (const b of bindings) {
      if (b.declPos <= lineEnd &&
          b.scopeStart <= lineEnd &&
          b.scopeEnd >= lineOffset) {
        seen.add(b.name);
      }
    }
    return { lineNum: idx + 1, lineText, count: seen.size };
  });

  const max = perLine.reduce((m, r) => Math.max(m, r.count), 0);
  return { max, perLine };
}

function _addParams(params, body, bindings) {
  const scopeStart = body.start;
  const scopeEnd   = body.end;
  params.forEach(p => {
    if (p.type === "Identifier" && p.name) {
      bindings.push({ name: p.name, scopeStart, scopeEnd, declPos: scopeStart });
    } else {
      _collectIds(p).forEach(name => {
        bindings.push({ name, scopeStart, scopeEnd, declPos: scopeStart });
      });
    }
  });
}

function _collectIds(node) {
  if (!node) return [];
  if (node.type === "Identifier") return [node.name];
  if (node.type === "RestElement") return _collectIds(node.argument);
  if (node.type === "AssignmentPattern") return _collectIds(node.left);
  if (node.type === "ObjectPattern")
    return node.properties.flatMap(p => _collectIds(p.value || p));
  if (node.type === "ArrayPattern")
    return node.elements.flatMap(e => e ? _collectIds(e) : []);
  return [];
}

function _findBlockScope(ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if (a.type === "BlockStatement" || a.type === "Program") return a;
  }
  return ancestors[0];
}

function _findFunctionScope(ancestors) {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a = ancestors[i];
    if (
        a.type === "FunctionDeclaration" ||
        a.type === "FunctionExpression" ||
        a.type === "ArrowFunctionExpression"
    ) {
      return a.body && a.body.type === "BlockStatement" ? a.body : a.body;
    }
    if (a.type === "Program") return a;
  }
  return ancestors[0];
}

function _buildLineOffsets(code) {
  const offsets = [0];
  for (let i = 0; i < code.length; i++) {
    if (code[i] === "\n") offsets.push(i + 1);
  }
  return offsets;
}

function _memoryHeuristic(lines) {
  const bindings = [];
  let depth = 0;
  const fnDepthStack = [0];
  const perLine = [];

  const varRe   = /\b(let|const|var)\s+([a-zA-Z_$][\w$]*)/g;
  const paramRe = /\bfunction\s*(?:[a-zA-Z_$][\w$]*)?\s*\(([^)]*)\)|\(([^)]*)\)\s*=>/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const opens  = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;

    if (closes > 0) {
      const newDepth = Math.max(0, depth - closes);
      for (let j = bindings.length - 1; j >= 0; j--) {
        if (bindings[j].kind !== "var" && bindings[j].depth > newDepth) {
          bindings.splice(j, 1);
        }
      }
      while (fnDepthStack.length > 1 && fnDepthStack[fnDepthStack.length - 1] > newDepth) {
        const fnDepth = fnDepthStack.pop();
        for (let j = bindings.length - 1; j >= 0; j--) {
          if (bindings[j].kind === "var" && bindings[j].fnDepth === fnDepth) {
            bindings.splice(j, 1);
          }
        }
      }
      depth = newDepth;
    }

    if (/\bfunction\b|\=>/.test(line) && opens > 0) {
      fnDepthStack.push(depth + 1);
    }

    depth += opens;

    let m;
    varRe.lastIndex = 0;
    while ((m = varRe.exec(line)) !== null) {
      const fnDepth = fnDepthStack[fnDepthStack.length - 1];
      bindings.push({ name: m[2], kind: m[1], depth, fnDepth });
    }

    paramRe.lastIndex = 0;
    while ((m = paramRe.exec(line)) !== null) {
      const paramStr = (m[1] || m[2] || "").trim();
      const fnDepth = fnDepthStack[fnDepthStack.length - 1];
      if (paramStr) {
        paramStr.split(",").forEach(p => {
          const name = p.trim().replace(/[=\s].*/, "");
          if (name && /^[a-zA-Z_$]/.test(name)) {
            bindings.push({ name, kind: "let", depth, fnDepth });
          }
        });
      }
    }

    const seen = new Set(bindings.map(b => b.name));
    perLine.push({ lineNum: i + 1, lineText: line, count: seen.size });
  }

  const max = perLine.reduce((m, r) => Math.max(m, r.count), 0);
  return { max, perLine };
}