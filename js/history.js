const DB_KEY = "js_quality_history";
const DB_MAX = 100;

function dbLoad() {
  try {
    return JSON.parse(localStorage.getItem(DB_KEY) || "[]");
  } catch {
    return [];
  }
}

function dbSave(records) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(records));
  } catch {}
}

function dbAddSession(session) {
  const records = dbLoad();
  records.unshift(session);
  if (records.length > DB_MAX) records.length = DB_MAX;
  dbSave(records);
}

function dbDeleteSession(id) {
  dbSave(dbLoad().filter(s => s.id !== id));
}

function dbClear() {
  localStorage.removeItem(DB_KEY);
}

function showHistoryPopup() {
  const existing = document.getElementById("history-popup");
  if (existing) existing.remove();

  const records = dbLoad();

  const overlay = document.createElement("div");
  overlay.id = "history-popup";
  overlay.className = "memory-overlay";

  const isEmpty = records.length === 0;

  const sessionCards = records.map(session => {
    const date = new Date(session.ts).toLocaleString("uk-UA");
    const best = session.solutions.reduce((a, b) => a.score > b.score ? a : b);

    const solutionRows = session.solutions.map((s, idx) => `
      <tr class="hist-sol-row ${idx === 0 ? "hist-sol-best" : ""}">
        <td class="hist-sol-num">#${s.num}</td>
        <td class="hist-sol-score ${s.score >= 70 ? "score-high" : s.score >= 45 ? "score-mid" : "score-low"}">${s.score}</td>
        <td class="hist-sol-meta">${s.lines} рядків · глибина ${s.depth} · пам'ять ${s.memMax}</td>
        <td class="hist-sol-code-cell">
          <button class="hist-load-btn" data-session="${session.id}" data-sol="${idx}">↓ Завантажити</button>
        </td>
      </tr>
    `).join("");

    return `
      <div class="hist-card" data-id="${session.id}">
        <div class="hist-card-header">
          <span class="hist-date">${date}</span>
          <span class="hist-best-badge">Найкращий: <span class="${best.score >= 70 ? "score-high" : best.score >= 45 ? "score-mid" : "score-low"}">${best.score}</span></span>
          <button class="hist-delete-btn" data-id="${session.id}" title="Видалити">✕</button>
        </div>
        <table class="hist-sol-table">
          <tbody>${solutionRows}</tbody>
        </table>
      </div>
    `;
  }).join("");

  overlay.innerHTML = `
    <div class="memory-dialog hist-dialog">
      <div class="memory-dialog-header">
        <span class="memory-dialog-title">Історія аналізів</span>
        <div style="display:flex;align-items:center;gap:0.6rem;">
          ${!isEmpty ? `<button class="hist-clear-btn" id="hist-clear">Очистити все</button>` : ""}
          <button class="memory-close-btn" id="hist-close">✕</button>
        </div>
      </div>
      <div class="memory-dialog-sub">${isEmpty ? "Ще немає збережених аналізів" : `${records.length} сесій збережено`}</div>
      <div class="memory-table-wrap hist-list">
        ${isEmpty ? `<div class="hist-empty">Натисніть «Аналізувати» — результати збережуться автоматично</div>` : sessionCards}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("hist-close").addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });

  const clearBtn = document.getElementById("hist-clear");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (confirm("Видалити всю історію?")) {
        dbClear();
        overlay.remove();
        showHistoryPopup();
      }
    });
  }

  overlay.querySelectorAll(".hist-delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      dbDeleteSession(btn.dataset.id);
      btn.closest(".hist-card").remove();
      const remaining = overlay.querySelectorAll(".hist-card").length;
      overlay.querySelector(".memory-dialog-sub").textContent =
        remaining === 0 ? "Ще немає збережених аналізів" : `${remaining} сесій збережено`;
      if (remaining === 0) {
        overlay.querySelector(".hist-list").innerHTML = `<div class="hist-empty">Натисніть «Аналізувати» — результати збережуться автоматично</div>`;
        if (clearBtn) clearBtn.remove();
      }
    });
  });

  overlay.querySelectorAll(".hist-load-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const sessionId = btn.dataset.session;
      const solIdx = parseInt(btn.dataset.sol);
      const session = dbLoad().find(s => s.id === sessionId);
      if (!session) return;
      const sol = session.solutions[solIdx];
      loadCodeIntoEditor(sol.code, sol.num);
      overlay.remove();
    });
  });
}

function loadCodeIntoEditor(code, label) {
  const cards = document.querySelectorAll(".editor-card");
  if (cards.length === 1 && cards[0].querySelector("textarea").value.trim() === "") {
    cards[0].querySelector("textarea").value = code;
  } else {
    addEditor();
    const newCard = document.querySelector(".editor-card:last-child");
    newCard.querySelector("textarea").value = code;
  }
}
