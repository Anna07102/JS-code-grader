let editorCount = 0;
let originalOrder = [];

function createEditorCard() {
  editorCount++;
  const num = editorCount;

  const card = document.createElement("div");
  card.className = "editor-card";
  card.dataset.num = num;
  card.id = `editor-card-${num}`;

  card.innerHTML = `
    <div class="editor-header">
      <a href="#results-section" class="editor-rating-link">Рейтинг</a>
      <span class="editor-num">Розв'язок #${num}</span>
      <button class="remove-btn" title="Видалити">✕</button>
    </div>
    <div class="editor-body">
      <textarea
        class="code-textarea"
        placeholder="// Вставте JS-код розв'язку #${num} тут..."
        spellcheck="false"
      ></textarea>
    </div>
  `;

  card.querySelector(".remove-btn").addEventListener("click", () => {
    if (document.querySelectorAll(".editor-card").length > 1) {
      card.style.animation = "slideOut 0.2s ease forwards";
      setTimeout(() => card.remove(), 200);
    }
  });

  card.querySelector("textarea").addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.target;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      ta.value = ta.value.slice(0, start) + "    " + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = start + 4;
    }
  });

  return card;
}

function addEditor() {
  const container = document.getElementById("editors-container");
  container.appendChild(createEditorCard());
  originalOrder = Array.from(container.querySelectorAll(".editor-card")).map(c => c.dataset.num);
}

function getScoreClass(score) {
  if (score >= 70) return { text: "score-high", bar: "fill-high" };
  if (score >= 45) return { text: "score-mid",  bar: "fill-mid" };
  return              { text: "score-low",  bar: "fill-low" };
}

function getRankClass(rank) {
  if (rank === 1) return "rank-1";
  if (rank === 2) return "rank-2";
  if (rank === 3) return "rank-3";
  return "rank-other";
}

function showMemoryPopup(memoryData, solutionNum) {
  const existing = document.getElementById("memory-popup");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "memory-popup";
  overlay.className = "memory-overlay";

  const maxCount = memoryData.reduce((m, r) => Math.max(m, r.count), 0);

  const rows = memoryData.map(({ lineNum, lineText, count }) => {
    const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
    const cls = count >= maxCount * 0.8 ? "mem-high" :
        count >= maxCount * 0.5 ? "mem-mid" : "mem-low";
    return `
      <tr class="${count === maxCount ? "mem-peak-row" : ""}">
        <td class="mem-lineno">${lineNum}</td>
        <td class="mem-code"><code>${escapeHtml(lineText)}</code></td>
        <td class="mem-count ${cls}">
          <span class="mem-num">${count}</span>
          <div class="mem-bar-wrap">
            <div class="mem-bar-fill ${cls}" style="width:${pct}%"></div>
          </div>
        </td>
      </tr>`;
  }).join("");

  overlay.innerHTML = `
    <div class="memory-dialog">
      <div class="memory-dialog-header">
        <span class="memory-dialog-title">Навантаження на пам'ять — Розв'язок #${solutionNum}</span>
        <button class="memory-close-btn" id="memory-close">✕</button>
      </div>
      <div class="memory-dialog-sub">Кількість змінних у зоні видимості на кожному рядку</div>
      <div class="memory-table-wrap">
        <table class="memory-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Рядок коду</th>
              <th>Змінних у пам'яті</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("memory-close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  setTimeout(() => {
    const peak = overlay.querySelector(".mem-peak-row");
    if (peak) peak.scrollIntoView({ block: "center" });
  }, 50);
}

function showMetricsPopup() {
  const existing = document.getElementById("metrics-popup");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "metrics-popup";
  overlay.className = "memory-overlay";

  const rows = currentMetrics.map((m, i) => {
    const def = DEFAULT_METRICS[i];
    const isRange = m.direction === "range";
    return `
      <tr data-idx="${i}">
        <td class="mconf-num">${i + 1}</td>
        <td class="mconf-label">${m.label}</td>
        <td class="mconf-dir-cell">
          <div class="mconf-dir-wrap">
            <div class="mconf-top-line">
              <select class="mconf-dir" data-idx="${i}">
                <option value="less"  ${m.direction === "less"  ? "selected" : ""}>краще менше</option>
                <option value="more"  ${m.direction === "more"  ? "selected" : ""}>краще більше</option>
                <option value="range" ${m.direction === "range" ? "selected" : ""}>інтервал</option>
              </select>
              <span class="mconf-range-wrap" style="display:${isRange ? "inline-flex" : "none"}">
                <span class="mconf-range-label">від</span>
                <input class="mconf-range-input" type="number" data-field="min" data-idx="${i}" value="${m.min ?? ""}" placeholder="${def.min ?? ""}">
                <span class="mconf-range-label">до</span>
                <input class="mconf-range-input" type="number" data-field="max" data-idx="${i}" value="${m.max ?? ""}" placeholder="${def.max ?? ""}">
              </span>
            </div>
            <div class="mconf-bottom-line">
              <input class="mconf-weight" type="number" data-idx="${i}" value="${m.weight}" placeholder="${def.weight}" step="0.01" min="0" max="1">
            </div>
          </div>
        </td>
      </tr>`;
  }).join("");

  overlay.innerHTML = `
    <div class="memory-dialog metrics-dialog">
      <div class="memory-dialog-header">
        <span class="memory-dialog-title">Коригування метрик</span>
        <button class="memory-close-btn" id="metrics-close">✕</button>
      </div>
      <div class="memory-dialog-sub">Сіре у полях — значення за замовчуванням</div>
      <div class="memory-table-wrap">
        <table class="memory-table metrics-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Метрика</th>
              <th>Коефіцієнт</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="metrics-footer">
        <button class="metrics-reset-btn" id="metrics-reset">Скинути до початкових</button>
        <button class="metrics-apply-btn" id="metrics-apply">Застосувати</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelectorAll(".mconf-dir").forEach(sel => {
    sel.addEventListener("change", () => {
      const idx = sel.dataset.idx;
      const row = overlay.querySelector(`tr[data-idx="${idx}"]`);
      const rangeWrap = row.querySelector(".mconf-range-wrap");
      rangeWrap.style.display = sel.value === "range" ? "inline-flex" : "none";
    });
  });

  document.getElementById("metrics-close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  document.getElementById("metrics-reset").addEventListener("click", () => {
    currentMetrics = DEFAULT_METRICS.map(m => ({ ...m }));
    overlay.remove();
    showMetricsPopup();
  });

  document.getElementById("metrics-apply").addEventListener("click", () => {
    overlay.querySelectorAll("tr[data-idx]").forEach(row => {
      const i = parseInt(row.dataset.idx);
      const dir = row.querySelector(".mconf-dir").value;
      const weightVal = parseFloat(row.querySelector(".mconf-weight").value);
      const minInput = row.querySelector('[data-field="min"]');
      const maxInput = row.querySelector('[data-field="max"]');
      const minVal = minInput && minInput.value !== "" ? parseFloat(minInput.value) : null;
      const maxVal = maxInput && maxInput.value !== "" ? parseFloat(maxInput.value) : null;

      currentMetrics[i] = {
        ...currentMetrics[i],
        direction: dir,
        weight: isNaN(weightVal) ? currentMetrics[i].weight : weightVal,
        min: minVal,
        max: maxVal,
        scoreFn: buildScoreFn(dir, minVal, maxVal),
      };
    });
    overlay.remove();
  });
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatTime(timing) {
  if (!timing) return "—";
  if (timing.error) return `<span class="time-error" title="${escapeHtml(timing.error)}">помилка</span>`;
  if (timing.ms === null) return "—";
  return `${timing.ms} мс`;
}

function reorderCards(sortedNums) {
  const container = document.getElementById("editors-container");
  sortedNums.forEach(num => {
    const card = document.getElementById(`editor-card-${num}`);
    if (card) container.appendChild(card);
  });
}

function resetOrder() {
  const container = document.getElementById("editors-container");
  originalOrder.forEach(num => {
    const card = document.getElementById(`editor-card-${num}`);
    if (card) container.appendChild(card);
  });
  const resetBtn = document.getElementById("reset-order-btn");
  if (resetBtn) resetBtn.style.display = "none";
}

function analyze() {
  const cards = document.querySelectorAll(".editor-card");
  const results = [];

  originalOrder = Array.from(cards).map(c => c.dataset.num);

  cards.forEach((card) => {
    const code = card.querySelector("textarea").value.trim();
    if (!code) return;
    const solutionNum = parseInt(card.dataset.num, 10);
    const m = analyzeCode(code);
    results.push({ solutionNum, code, ...m });
  });

  if (results.length === 0) {
    alert("Введіть хоча б один розв'язок для аналізу.");
    return;
  }

  results.sort((a, b) => b.score - a.score);

  const session = {
    id: Date.now().toString(),
    ts: Date.now(),
    solutions: results.map((r, idx) => ({
      num: r.solutionNum,
      rank: idx + 1,
      code: r.code,
      score: r.score,
      lines: r.lines,
      depth: r.depth,
      vars: r.vars,
      funcs: r.funcs,
      loops: r.loops,
      avgName: r.avgName,
      repeats: r.repeats,
      memMax: r.memory ? r.memory.max : 0,
      timeMs: r.time ? r.time.ms : null,
    })),
  };
  dbAddSession(session);

  reorderCards(results.map(r => r.solutionNum));

  const resetBtn = document.getElementById("reset-order-btn");
  if (resetBtn) resetBtn.style.display = "inline-flex";

  const tbody = document.getElementById("results-body");
  tbody.innerHTML = "";

  results.forEach((r, rankIdx) => {
    const rank = rankIdx + 1;
    const cls  = getScoreClass(r.score);
    const tr   = document.createElement("tr");

    const memMax = r.memory ? r.memory.max : "—";

    tr.innerHTML = `
      <td><a class="rank-badge ${getRankClass(rank)}" href="#editor-card-${r.solutionNum}" title="Перейти до розв'язку">${r.solutionNum}</a></td>
      <td>${r.lines}</td>
      <td>${r.depth}</td>
      <td>${r.vars}</td>
      <td>${r.funcs}</td>
      <td>${r.loops}</td>
      <td>${r.avgName}</td>
      <td>${r.repeats}</td>
      <td class="mem-cell" data-solution="${r.solutionNum}" title="Натисніть для деталей">
        <span class="mem-badge">${memMax} <span class="mem-icon">⊞</span></span>
      </td>
      <td class="time-cell">${formatTime(r.time)}</td>
      <td>
        <div class="score-bar-wrap">
          <span class="score-cell ${cls.text}">${r.score}</span>
          <div class="score-bar">
            <div class="score-bar-fill ${cls.bar}" style="width: ${r.score}%"></div>
          </div>
        </div>
      </td>
    `;

    const memCell = tr.querySelector(".mem-cell");
    if (r.memory && r.memory.perLine) {
      memCell.addEventListener("click", () => {
        showMemoryPopup(r.memory.perLine, r.solutionNum);
      });
    }

    tbody.appendChild(tr);
  });

  document.getElementById("results-section")
      .scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("DOMContentLoaded", () => {
  const style = document.createElement("style");
  style.textContent = `@keyframes slideOut { to { opacity:0; transform:translateY(-8px); } }`;
  document.head.appendChild(style);

  addEditor();

  document.getElementById("add-btn").addEventListener("click", addEditor);
  document.getElementById("analyze-btn").addEventListener("click", analyze);
  document.getElementById("metrics-btn").addEventListener("click", showMetricsPopup);

  const resetOrderBtn = document.getElementById("reset-order-btn");
  if (resetOrderBtn) resetOrderBtn.addEventListener("click", resetOrder);

  const historyBtn = document.getElementById("history-btn");
  if (historyBtn) historyBtn.addEventListener("click", showHistoryPopup);

  const themeBtn = document.getElementById("theme-toggle");
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeBtn.textContent = document.body.classList.contains("light") ? "🌙" : "☀️";
  });
});