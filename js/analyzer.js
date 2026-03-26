const DEFAULT_METRICS = [
  {
    key: "lines",
    label: "Рядки",
    direction: "less",
    weight: 0.20,
    min: null, max: 20,
    scoreFn: (v) => 100 * Math.max(0, 1 - v / 40),
  },
  {
    key: "depth",
    label: "Глибина вкладеності",
    direction: "less",
    weight: 0.20,
    min: null, max: null,
    scoreFn: (v) => 100 * Math.max(0, 1 - v / 5),
  },
  {
    key: "loops",
    label: "Цикли",
    direction: "less",
    weight: 0.08,
    min: null, max: null,
    scoreFn: (v) => 100 * Math.max(0, 1 - v / 8),
  },
  {
    key: "vars",
    label: "Змінні",
    direction: "less",
    weight: 0.07,
    min: null, max: null,
    scoreFn: (v) => 100 * Math.max(0, 1 - v / 20),
  },
  {
    key: "funcs",
    label: "Функції",
    direction: "more",
    weight: 0.05,
    min: null, max: null,
    scoreFn: (v) => 60 + 40 * Math.min(1, v / 5),
  },
  {
    key: "avgName",
    label: "Сер. довжина імен",
    direction: "range",
    weight: 0.15,
    min: 4, max: 15,
    scoreFn: (v) => v === 0 ? 0 : v < 4 ? 100 * (v / 4) : v <= 15 ? 100 : 100 * Math.max(0, 1 - (v - 15) / 15),
  },
  {
    key: "repeats",
    label: "Повтори",
    direction: "less",
    weight: 0.10,
    min: null, max: null,
    scoreFn: (v) => 100 * Math.max(0, 1 - v / 40),
  },
  {
    key: "memory",
    label: "Пам'ять (макс.)",
    direction: "less",
    weight: 0.15,
    min: null, max: null,
    scoreFn: (v) => 100 * Math.max(0, 1 - v / 15),
  },
  {
    key: "time",
    label: "Час виконання",
    direction: "less",
    weight: 0.10,
    min: null, max: null,
    scoreFn: (v) => v === null ? 50 : 100 * Math.max(0, 1 - v / 500),
  },
];

let currentMetrics = DEFAULT_METRICS.map(m => ({ ...m }));

function buildScoreFn(direction, min, max) {
  if (direction === "less") {
    const cap = max !== null ? max : 20;
    return (v) => v === null ? 50 : 100 * Math.max(0, 1 - v / cap);
  }
  if (direction === "more") {
    const cap = max !== null ? max : 5;
    return (v) => 60 + 40 * Math.min(1, v / cap);
  }
  if (direction === "range") {
    const lo = min !== null ? min : 4;
    const hi = max !== null ? max : 15;
    return (v) => v === 0 ? 0 : v < lo ? 100 * (v / lo) : v <= hi ? 100 : 100 * Math.max(0, 1 - (v - hi) / hi);
  }
  return () => 100;
}

function clarity(code, memMax, timeMs) {
  const m = currentMetrics;
  const raw = {
    lines:   numOfLines(code),
    depth:   getDepth(code),
    loops:   numOfLoops(code),
    vars:    numOfVariables(code),
    funcs:   numOfFunctions(code),
    avgName: averageLengthOfNames(code) || 0,
    repeats: numOfRepeats(code),
    memory:  memMax ?? 0,
    time:    timeMs,
  };

  let total = 0;
  for (const metric of m) {
    const score = metric.scoreFn(raw[metric.key]);
    total += score * metric.weight;
  }

  return Math.round(total * 10) / 10;
}

function analyzeCode(rawCode) {
  const code = cut(rawCode);
  const memory = workingMemory(code);
  const timing = measureExecutionTime(rawCode);
  const timeMs = timing && timing.ms !== null ? timing.ms : null;
  return {
    lines:   numOfLines(code),
    depth:   getDepth(code),
    vars:    numOfVariables(code),
    funcs:   numOfFunctions(code),
    loops:   numOfLoops(code),
    avgName: averageLengthOfNames(code),
    repeats: numOfRepeats(code),
    score:   clarity(code, memory.max, timeMs),
    memory,
    time:    timing,
  };
}