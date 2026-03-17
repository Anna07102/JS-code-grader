let editorCount = 0;

function createEditorCard() {
  editorCount++;
  const num = editorCount;

  const card = document.createElement("div");
  card.className = "editor-card";
  card.dataset.id = num;
  card.id = `editor-${num}`;

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
  document.getElementById("editors-container").appendChild(createEditorCard());
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

function analyze() {
  const cards = document.querySelectorAll(".editor-card");
  const results = [];

  cards.forEach((card, idx) => {
    const code = card.querySelector("textarea").value.trim();
    if (!code) return;
    const m = analyzeCode(code);
    results.push({ solutionNum: idx + 1, id: card.dataset.id, ...m });
  });

  if (results.length === 0) {
    alert("Введіть хоча б один розв'язок для аналізу.");
    return;
  }

  results.sort((a, b) => b.score - a.score);

  const tbody = document.getElementById("results-body");
  tbody.innerHTML = "";

  results.forEach((r, rankIdx) => {
    const rank = rankIdx + 1;
    const cls  = getScoreClass(r.score);
    const tr   = document.createElement("tr");

    tr.innerHTML = `
      <td><a class="rank-badge ${getRankClass(rank)}" href="#editor-${r.solutionNum}" title="Перейти до розв'язку">${r.solutionNum}</a></td>      <td>${r.lines}</td>
      <td>${r.depth}</td>
      <td>${r.vars}</td>
      <td>${r.funcs}</td>
      <td>${r.loops}</td>
      <td>${r.avgName}</td>
      <td>${r.repeats}</td>
      <td>
        <div class="score-bar-wrap">
          <span class="score-cell ${cls.text}">${r.score}</span>
          <div class="score-bar">
            <div class="score-bar-fill ${cls.bar}" style="width: ${r.score}%"></div>
          </div>
        </div>
      </td>
    `;
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

  const themeBtn = document.getElementById("theme-toggle");
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("light");
    themeBtn.textContent = document.body.classList.contains("light") ? "🌙" : "☀️";
  });
});
