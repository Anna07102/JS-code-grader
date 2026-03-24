function measureExecutionTime(code) {
  const wrapped = `
    "use strict";
    ${code}
  `;

  let ms = null;
  let error = null;

  try {
    const fn = new Function(wrapped);
    const t0 = performance.now();
    fn();
    const t1 = performance.now();
    ms = parseFloat((t1 - t0).toFixed(3));
  } catch (e) {
    error = e.message;
  }

  return { ms, error };
}
