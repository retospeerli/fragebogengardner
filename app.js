const SCALE = [
  { label:"👍", value:3 },
  { label:"🙂", value:2 },
  { label:"😐", value:1 },
  { label:"🙁", value:0 },
];

const projectBonus = { "1":3, "2":2, "3":1 };

const elQ = document.getElementById("questions");
const elP = document.getElementById("projects");
const elErr = document.getElementById("err");
const btnCalc = document.getElementById("btnCalc");
const resultCard = document.getElementById("resultCard");
const resultHeader = document.getElementById("resultHeader");
const resultDetails = document.getElementById("resultDetails");
const btnPdf = document.getElementById("btnPdf");
const btnReset = document.getElementById("btnReset");

let chart = null;

function groupQuestions() {
  const map = new Map();
  for (const intel of INTELLIGENCES) map.set(intel.key, []);
  for (const q of QUESTIONS) map.get(q.intel).push(q);
  return map;
}

function renderQuestions() {
  const grouped = groupQuestions();
  elQ.innerHTML = "";

  for (const intel of INTELLIGENCES) {
    const block = document.createElement("div");
    block.className = "block";
    block.innerHTML = `<h3>${intel.label}</h3>`;
    const list = grouped.get(intel.key);

    for (const q of list) {
      const row = document.createElement("div");
      row.className = "q";
      row.innerHTML = `<div>${q.text}</div>`;
      const choices = document.createElement("div");
      choices.className = "choices";

      for (const s of SCALE) {
        const id = `${q.id}_${s.value}`;
        const lab = document.createElement("label");
        lab.innerHTML = `
          <input type="radio" name="${q.id}" id="${id}" value="${s.value}">
          <span>${s.label}</span>
        `;
        choices.appendChild(lab);
      }
      row.appendChild(choices);
      block.appendChild(row);
    }
    elQ.appendChild(block);
  }
}

function renderProjects() {
  elP.innerHTML = "";

  for (const pr of PROJECTS) {
    const row = document.createElement("div");
    row.className = "projectRow";

    const left = document.createElement("div");
    left.innerHTML = `
      <div><strong>${pr.name}</strong></div>
      <div class="hint">${pr.tags.join(" · ")}</div>
    `;

    const sel = document.createElement("select");
    sel.dataset.projectId = pr.id;
    sel.innerHTML = `
      <option value="">nicht gewählt</option>
      <option value="1">1. Wahl</option>
      <option value="2">2. Wahl</option>
      <option value="3">3. Wahl</option>
    `;

    row.appendChild(left);
    row.appendChild(sel);
    elP.appendChild(row);
  }
}

function getAnswerValue(qid) {
  const checked = document.querySelector(`input[name="${qid}"]:checked`);
  return checked ? Number(checked.value) : null;
}

function validateAllAnswered() {
  for (const q of QUESTIONS) {
    if (getAnswerValue(q.id) === null) return false;
  }
  return true;
}

function getProjectRankings() {
  const selects = [...elP.querySelectorAll("select")];
  const picked = selects
    .filter(s => s.value)
    .map(s => ({ projectId: s.dataset.projectId, rank: s.value }));

  return picked;
}

function validateExactlyThreeProjects(picks) {
  if (picks.length !== 3) return "Bitte genau 3 Projekte auswählen (1., 2., 3. Wahl).";
  const ranks = picks.map(p => p.rank);
  const set = new Set(ranks);
  if (set.size !== 3 || !set.has("1") || !set.has("2") || !set.has("3"))
    return "Bitte jede Rangzahl genau einmal vergeben (1, 2 und 3).";
  return null;
}

function calcScores() {
  const raw = {};
  const max = {};
  for (const intel of INTELLIGENCES) {
    raw[intel.key] = 0;
    max[intel.key] = 0;
  }

  // Items
  const countPerIntel = {};
  for (const q of QUESTIONS) {
    const v = getAnswerValue(q.id);
    raw[q.intel] += v;
    countPerIntel[q.intel] = (countPerIntel[q.intel] || 0) + 1;
  }

  for (const intel of INTELLIGENCES) {
    max[intel.key] = (countPerIntel[intel.key] || 0) * 3;
  }

  // Projekte (Bonus)
  const picks = getProjectRankings();
  for (const p of picks) {
    const pr = PROJECTS.find(x => x.id === p.projectId);
    const bonus = projectBonus[p.rank] || 0;
    for (const ik of pr.intels) raw[ik] += bonus;
  }

  // Max für Bonus anpassen (damit Normierung nicht unfair ist):
  // jedes Projekt kann je intel Bonus geben. Wir nehmen worst-case: ein Kind wählt 3 Projekte, die alle dieselbe Intel enthalten.
  // Das Maximum pro Intel erhöhen wir um (3+2+1)=6 als absolute Obergrenze.
  for (const intel of INTELLIGENCES) {
    max[intel.key] += 6;
  }

  // Normiert 0–100
  const norm = {};
  for (const intel of INTELLIGENCES) {
    norm[intel.key] = Math.round((raw[intel.key] / max[intel.key]) * 100);
  }

  return { raw, max, norm, picks };
}

function showResult(scores) {
  const name = document.getElementById("studentName").value.trim() || "Ohne Name";
  const cls = document.getElementById("studentClass").value.trim() || "—";

  resultHeader.innerHTML = `
    <div><strong>${name}</strong></div>
    <div>Klasse: <strong>${cls}</strong></div>
  `;

  const labels = INTELLIGENCES.map(i => i.label);
  const data = INTELLIGENCES.map(i => scores.norm[i.key]);

  const ctx = document.getElementById("radar");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [{
        label: "Profil (0–100)",
        data,
        borderWidth: 2,
        pointRadius: 3,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20 }
        }
      },
      plugins: {
        legend: { display: true }
      }
    }
  });

  // Details
  const picksSorted = scores.picks
    .sort((a,b) => Number(a.rank) - Number(b.rank))
    .map(p => {
      const pr = PROJECTS.find(x => x.id === p.projectId);
      return `<li><strong>${p.rank}. Wahl:</strong> ${pr.name}</li>`;
    }).join("");

  resultDetails.innerHTML = `
    <h3>Projektwahlen</h3>
    <ol>${picksSorted}</ol>
    <h3>Werte (normiert)</h3>
    <ul>
      ${INTELLIGENCES.map(i => `<li>${i.label}: <strong>${scores.norm[i.key]}</strong></li>`).join("")}
    </ul>
  `;

  resultCard.hidden = false;
  resultCard.scrollIntoView({ behavior:"smooth", block:"start" });
}

btnCalc.addEventListener("click", () => {
  elErr.textContent = "";

  if (!validateAllAnswered()) {
    elErr.textContent = "Bitte beantworte alle Aussagen (jede Zeile ankreuzen).";
    return;
  }

  const picks = getProjectRankings();
  const msg = validateExactlyThreeProjects(picks);
  if (msg) {
    elErr.textContent = msg;
    return;
  }

  const scores = calcScores();
  showResult(scores);
});

btnPdf.addEventListener("click", async () => {
  // Exportiere die Result-Card als PDF (Chart + Auswahl + Name)
  const node = document.getElementById("resultCard");
  const canvas = await html2canvas(node, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // Bild skalieren
  const imgW = pageW - 20;
  const imgH = (canvas.height / canvas.width) * imgW;

  let y = 10;
  pdf.addImage(imgData, "PNG", 10, y, imgW, imgH);

  // falls zu hoch: zweite Seite
  if (imgH > pageH - 20) {
    pdf.addPage();
    const ratio = (pageH - 20) / imgH;
    pdf.addImage(imgData, "PNG", 10, 10, imgW * ratio, imgH * ratio);
  }

  const name = document.getElementById("studentName").value.trim() || "OhneName";
  const cls = document.getElementById("studentClass").value.trim() || "Klasse";
  pdf.save(`Gardner-Profil_${cls}_${name}.pdf`);
});

btnReset.addEventListener("click", () => {
  document.getElementById("studentName").value = "";
  document.getElementById("studentClass").value = "";
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  elP.querySelectorAll("select").forEach(s => s.value = "");
  elErr.textContent = "";
  resultCard.hidden = true;
  if (chart) chart.destroy();
  chart = null;
  window.scrollTo({ top: 0, behavior: "smooth" });
});

renderQuestions();
renderProjects();
