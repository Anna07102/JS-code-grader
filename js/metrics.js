function numOfLines(code) {
  if (!code) return 0;
  return code.split(/\r\n|\r|\n/).length;
}

function numOfVariables(code) {
  const ast = parseWithAcorn(code);
  if (ast && typeof acornWalk !== "undefined") {
    let count = 0;
    acornWalk.simple(ast, {
      VariableDeclaration(node) {
        count += node.declarations.length;
      },
      FunctionDeclaration(node) {
        count += node.params.length;
      },
      FunctionExpression(node) {
        count += node.params.length;
      },
      ArrowFunctionExpression(node) {
        count += node.params.length;
      },
    });
    return count;
  }
  const matches = code.match(/\b(let|const|var)\s+[a-zA-Z_$][\w$]*/g);
  const paramMatches = code.match(/function\s*[a-zA-Z_$][\w$]*\s*\(([^)]*)\)/g) || [];
  const arrowMatches = code.match(/\(([^)]*)\)\s*=>/g) || [];
  let paramCount = 0;
  [...paramMatches, ...arrowMatches].forEach(fn => {
    const inner = fn.replace(/.*\(/, "").replace(/\).*/, "").trim();
    if (inner) paramCount += inner.split(",").filter(p => p.trim()).length;
  });
  return (matches ? matches.length : 0) + paramCount;
}

function numOfFunctions(code) {
  const ast = parseWithAcorn(code);
  if (ast && typeof acornWalk !== "undefined") {
    let count = 0;
    acornWalk.simple(ast, {
      FunctionDeclaration() { count++; },
      FunctionExpression() { count++; },
      ArrowFunctionExpression() { count++; },
    });
    return count;
  }
  const normal = (code.match(/\bfunction\s+[a-zA-Z_$][\w$]*/g) || []).length;
  const arrow  = (code.match(/\b[a-zA-Z_$][\w$]*\s*=\s*\([^)]*\)\s*=>/g) || []).length;
  return normal + arrow;
}

function numOfLoops(code) {
  const ast = parseWithAcorn(code);
  if (ast && typeof acornWalk !== "undefined") {
    let count = 0;
    acornWalk.simple(ast, {
      ForStatement() { count++; },
      WhileStatement() { count++; },
      DoWhileStatement() { count++; },
    });
    return count;
  }
  const matches = code.match(/\b(for|while|do)\b/g);
  return matches ? matches.length : 0;
}

function averageLengthOfNames(code) {
  const ast = parseWithAcorn(code);
  if (ast && typeof acornWalk !== "undefined") {
    const names = [];
    acornWalk.simple(ast, {
      VariableDeclarator(node) {
        if (node.id && node.id.name) names.push(node.id.name);
      },
      FunctionDeclaration(node) {
        if (node.id && node.id.name) names.push(node.id.name);
        node.params.forEach(p => { if (p.name) names.push(p.name); });
      },
      FunctionExpression(node) {
        if (node.id && node.id.name) names.push(node.id.name);
        node.params.forEach(p => { if (p.name) names.push(p.name); });
      },
      ArrowFunctionExpression(node) {
        node.params.forEach(p => { if (p.name) names.push(p.name); });
      },
    });
    if (names.length === 0) return 0;
    const sum = names.reduce((acc, n) => acc + n.length, 0);
    return parseFloat((sum / names.length).toFixed(2));
  }
  const names = [];
  (code.match(/\b(let|const|var)\s+([a-zA-Z_$][\w$]*)/g) || [])
      .forEach(v => names.push(v.split(/\s+/)[1]));
  (code.match(/\bfunction\s+([a-zA-Z_$][\w$]*)/g) || [])
      .forEach(f => names.push(f.split(/\s+/)[1]));
  const paramMatches = code.match(/function\s*[a-zA-Z_$][\w$]*\s*\(([^)]*)\)/g) || [];
  paramMatches.forEach(fn => {
    const inner = fn.replace(/.*\(/, "").replace(/\).*/, "").trim();
    if (inner) inner.split(",").forEach(p => { const n = p.trim(); if (n) names.push(n); });
  });
  if (names.length === 0) return 0;
  const sum = names.reduce((acc, n) => acc + n.length, 0);
  return parseFloat((sum / names.length).toFixed(2));
}

function numOfRepeats(code) {
  const lines = code
      .split(/\r\n|\r|\n/)
      .map(l => l.trim())
      .filter(l => l !== "" && l !== "{" && l !== "}");

  const counts = new Map();
  for (let size = 1; size <= Math.floor(lines.length / 2); size++) {
    for (let i = 0; i <= lines.length - size; i++) {
      const block = lines.slice(i, i + size).join("\n");
      counts.set(block, (counts.get(block) ?? 0) + 1);
    }
  }

  const repeated = [...counts.entries()]
      .filter(([, count]) => count >= 2)
      .map(([block, count]) => ({ block, count, size: block.split("\n").length }))
      .sort((a, b) => b.size - a.size);

  const maximal = [];
  for (const entry of repeated) {
    const isSub = maximal.some(
        larger => larger.size > entry.size && larger.block.includes(entry.block)
    );
    if (!isSub) maximal.push(entry);
  }
  return maximal.reduce((sum, { count }) => sum + count, 0);
}