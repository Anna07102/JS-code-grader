function getDepth(code) {
  const tokens = (code || "").match(/if\s*\([^)]*\)|\{|\}|[^\s{};]+/g) || [];
  let depth = 0, max = 0;
  for (const t of tokens) {
    if (t === "{") { depth++; if (depth > max) max = depth; }
    else if (t === "}") depth = Math.max(0, depth - 1);
  }
  return max;
}
