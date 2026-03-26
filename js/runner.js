function measureExecutionTime(code) {
  const wrapped = `
    "use strict";
    ${code}
    if (typeof fib === 'function') for(let i=0; i<1000; i++) fib(20);
    if (typeof reverse === 'function') for(let i=0; i<1000; i++) reverse("hello world");
  `;

  try {
    const fn = new Function(wrapped);
    fn();

    const t0 = performance.now();
    for(let i = 0; i < 100; i++) { fn(); } // Запускаем 100 раз для точности
    const t1 = performance.now();

    return { ms: parseFloat(((t1 - t0) / 100).toFixed(3)), error: null };
  } catch (e) {
    return { ms: null, error: e.message };
  }
}