function parseWithAcorn(code) {
  if (typeof acorn === "undefined") return null;
  try {
    return acorn.parse(code, { ecmaVersion: "latest", sourceType: "module" });
  } catch (err) {
    try {
      const fixed = code.replace(
        /if\s*(\([^)]*\))\s*(let|const|var)\s*([^;]+;)/g,
        "if $1 { $2 $3 }"
      );
      return acorn.parse(fixed, { ecmaVersion: "latest", sourceType: "module" });
    } catch (err2) {
      return null;
    }
  }
}

function getDepth(code) {
  const ast = parseWithAcorn(code);
  if (ast && typeof acornWalk !== "undefined") {
    const incTypes = new Set([
      "TryStatement", "CatchClause",
      "ArrowFunctionExpression", "FunctionExpression", "FunctionDeclaration",
      "SwitchStatement", "DoWhileStatement", "WhileStatement",
      "ForStatement", "IfStatement",
    ]);
    let maxDepth = 0;
    const nodeTypes = [
      "ArrowFunctionExpression", "FunctionDeclaration", "SwitchStatement",
      "DoWhileStatement", "WhileStatement", "ForStatement", "IfStatement",
    ];
    const visitors = {};
    nodeTypes.forEach(type => {
      visitors[type] = (node, ancestors) => {
        const depth = ancestors.filter(a => incTypes.has(a.type)).length;
        if (depth > maxDepth) maxDepth = depth;
      };
    });
    acornWalk.ancestor(ast, visitors);
    return maxDepth;
  }

  const tokens = (code || "").match(/if\s*\([^)]*\)|\{|\}|[^\s{};]+/g) || [];
  let depth = 0, max = 0;
  for (const t of tokens) {
    if (t === "{") { depth++; if (depth > max) max = depth; }
    else if (t === "}") depth = Math.max(0, depth - 1);
  }
  return max;
}
