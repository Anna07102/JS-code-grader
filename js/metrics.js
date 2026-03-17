function numOfLines(code) {
  if (!code) return 0;
  return code.split(/\r\n|\r|\n/).length;
}

function numOfVariables(code) {
  const matches = code.match(/\b(let|const|var)\s+[a-zA-Z_$][\w$]*/g);
  return matches ? matches.length : 0;
}

function numOfFunctions(code) {
  const normal = (code.match(/\bfunction\s+[a-zA-Z_$][\w$]*/g) || []).length;
  const arrow  = (code.match(/\b[a-zA-Z_$][\w$]*\s*=\s*\([^)]*\)\s*=>/g) || []).length;
  return normal + arrow;
}

function numOfLoops(code) {
  const matches = code.match(/\b(for|while|do)\b/g);
  return matches ? matches.length : 0;
}

function averageLengthOfNames(code) {
  const names = [];
  (code.match(/\b(let|const|var)\s+([a-zA-Z_$][\w$]*)/g) || [])
    .forEach(v => names.push(v.split(/\s+/)[1]));
  (code.match(/\bfunction\s+([a-zA-Z_$][\w$]*)/g) || [])
    .forEach(f => names.push(f.split(/\s+/)[1]));
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

function clarity(code) {
  const lines   = numOfLines(code);
  const depth   = getDepth(code);
  const loops   = numOfLoops(code);
  const vars    = numOfVariables(code);
  const funcs   = numOfFunctions(code);
  const avgName = averageLengthOfNames(code) || 0;
  const repeats = numOfRepeats(code);

  const scoreLines   = 100 * Math.max(0, 1 - Math.log10(Math.max(lines, 10)) / 2.5);
  const scoreDepth   = 100 * Math.max(0, 1 - depth / 5);
  const scoreLoops   = 100 * Math.max(0, 1 - loops / 8);
  const varsPerLine  = vars / Math.max(lines, 1);
  const scoreVars    = 100 * Math.min(1, Math.max(0.3, varsPerLine * 4));
  const scoreFuncs   = 60 + 40 * Math.min(1, funcs / 5);
  const scoreNames   = 100 * Math.min(1, Math.max(0.4, avgName / 7.5));
  const scoreRepeats = 100 * Math.max(0, 1 - repeats / 40);

  const total =
    scoreLines   * 0.12 +
    scoreDepth   * 0.25 +
    scoreLoops   * 0.14 +
    scoreVars    * 0.09 +
    scoreFuncs   * 0.08 +
    scoreNames   * 0.17 +
    scoreRepeats * 0.15;

  return Math.round(total * 10) / 10;
}

function analyzeCode(rawCode) {
  const code = cut(rawCode);
  return {
    lines:   numOfLines(code),
    depth:   getDepth(code),
    vars:    numOfVariables(code),
    funcs:   numOfFunctions(code),
    loops:   numOfLoops(code),
    avgName: averageLengthOfNames(code),
    repeats: numOfRepeats(code),
    score:   clarity(code),
  };
}
