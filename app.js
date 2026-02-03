const SCALE = [
  { label: "👍", value: 3 },
  { label: "🙂", value: 2 },
  { label: "😐", value: 1 },
  { label: "🙁", value: 0 },
];

const projectBonus = { "1": 3, "2": 2, "3": 1 };

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
let randomizedQuestions = [];

// ---------- Helpers ----------
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getAnswerValue(qid) {
  const checked = document.querySelector(`input[name="${qid}"]:checked`);
  return checked ? Number(checked.value) : null;
}

function getAnswerLabel(qid) {
  const v = getAnswerValue(qid);
  const found = SCALE.find((s) => s.value === v);
  return found ? found.label : "—";
}

function validateAllAnswered() {
  for (const q of QUESTIONS) {
    if (getAnswerValue(q.id) === null) return false;
  }
  return true;
}

// ---------- Questions: randomized order (NOT grouped) ----------
function renderQuestionsRandom() {
  randomizedQuestions = shuffleArray(QUESTIONS);
  elQ.innerHTML = "";

  for (const q of randomizedQuestions) {
    const row = document.createElement("div");
    row.className = "q";

    const left = document.createElement("div");
    left.textContent = q.text;

    const choices = document.createElement("div");
    choices.className = "choices";

    for (const s of SCALE) {
      const lab = document.createElement("label");
      lab.innerHTML = `
        <input type="radio" name="${q.id}" value="${s.value}">
        <span>${s.label}</span>
      `;
      choices.appendChild(lab);
    }

    row.appendChild(left);
    row.appendChild(choices);
    elQ.appendChild(row);
  }
}

// ---------- Projects: strict unique ranks 1/2/3 ----------
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

    // Live enforcement: if a rank is chosen, remove it from others (by clearing duplicates)
    sel.addEventListener("change", () => {
      const chosenRank = sel.value;
      if (!chosenRank) return;

      const all = [...elP.querySelectorAll("select")];
      for (const other of all) {
        if (other === sel) continue;
        if (other.value === chosenRank) {
          other.value = ""; // clear duplicate rank
        }
      }
      elErr.textContent = "";
    });

    row.appendChild(left);
    row.appendChild(sel);
    elP.appendChild(row);
  }
}

function getProjectRankings() {
  const selects = [...elP.querySelectorAll("select")];
  return selects
    .filter((s) => s.value)
    .map((s) => ({ projectId: s.dataset.projectId, rank: s.value }));
}

function validateExactlyThreeProjects(picks) {
  if (picks.length !== 3) return "Bitte genau 3 Projekte auswählen (1., 2., 3. Wahl).";
  const ranks = picks.map((p) => p.rank);
  const set = new Set(ranks);
  if (set.size !== 3 || !set.has("1") || !set.has("2") || !set.has("3"))
    return "Bitte 1., 2. und 3. Wahl jeweils genau einmal vergeben.";
  return null;
}

// ---------- Scoring ----------
function calcScores() {
  const raw = {};
  const max = {};
  const countPerIntel = {};

  for (const intel of INTELLIGENCES) {
    raw[intel.key] = 0;
    max[intel.key] = 0;
    countPerIntel[intel.key] = 0;
  }

  // Items
  for (const q of QUESTIONS) {
    const v = getAnswerValue(q.id);
    raw[q.intel] += v;
    countPerIntel[q.intel] += 1;
  }

  // Max from items
  for (const intel of INTELLIGENCES) {
    max[intel.key] = countPerIntel[intel.key] * 3;
  }

  // Projects bonus
  const picks = getProjectRankings();
  for (const p of picks) {
    const pr = PROJECTS.find((x) => x.id === p.projectId);
    const bonus = projectBonus[p.rank] || 0;
    for (const ik of pr.intels) raw[ik] += bonus;
  }

  // allow up to +6 bonus per intelligence (3+2+1)
  for (const intel of INTELLIGENCES) max[intel.key] += 6;

  // norm 0–100
  const norm = {};
  for (const intel of INTELLIGENCES) {
    norm[intel.key] = Math.round((raw[intel.key] / max[intel.key]) * 100);
  }

  return { raw, max, norm, picks };
}

// ---------- Radar with icon point styles (best-effort) ----------
async function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

async function showResult(scores) {
  const name = document.getElementById("studentName").value.trim() || "Ohne Name";
  const cls = document.getElementById("studentClass").value.trim() || "—";

  resultHeader.innerHTML = `
    <div><strong>${name}</strong></div>
    <div>Klasse: <strong>${cls}</strong></div>
    <div>Datum: <strong>${todayISO()}</strong></div>
  `;

  const labels = INTELLIGENCES.map((i) => i.label);
  const data = INTELLIGENCES.map((i) => scores.norm[i.key]);

  const iconImgs = await Promise.all(INTELLIGENCES.map((i) => loadImage(i.icon)));
  const hasAllIcons = iconImgs.every(Boolean);

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
        pointRadius: hasAllIcons ? 7 : 3,
        pointStyle: hasAllIcons ? iconImgs : "circle",
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: { min: 0, max: 100, ticks: { stepSize: 20 } },
      },
      plugins: { legend: { display: true } },
    },
  });

  const picksSorted = scores.picks
    .slice()
    .sort((a, b) => Number(a.rank) - Number(b.rank))
    .map((p) => {
      const pr = PROJECTS.find((x) => x.id === p.projectId);
      return `<li><strong>${p.rank}. Wahl:</strong> ${pr.name}</li>`;
    })
    .join("");

  resultDetails.innerHTML = `
    <h3>Projektwahlen</h3>
    <ol>${picksSorted}</ol>
    <h3>Werte (normiert)</h3>
    <ul>
      ${INTELLIGENCES.map((i) => `<li>${i.label}: <strong>${scores.norm[i.key]}</strong></li>`).join("")}
    </ul>
  `;

  resultCard.hidden = false;
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---------- Professional PDF (cover + appendix) ----------
async function exportProfessionalPdf() {
  const name = document.getElementById("studentName").value.trim() || "OhneName";
  const cls = document.getElementById("studentClass").value.trim() || "Klasse";
  const dateStr = todayISO();

  const scores = calcScores();

  const picksSorted = scores.picks
    .slice()
    .sort((a, b) => Number(a.rank) - Number(b.rank))
    .map((p) => {
      const pr = PROJECTS.find((x) => x.id === p.projectId);
      return `${p.rank}. Wahl: ${pr.name}`;
    });

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  async function addHeader(pageTitle) {
    pdf.setFillColor(245, 247, 250);
    pdf.rect(0, 0, pageW, 26, "F");

    // Logo
    try {
      const logoImg = await loadImage("assets/logo.png");
      if (logoImg) {
        const c = document.createElement("canvas");
        c.width = logoImg.width;
        c.height = logoImg.height;
        c.getContext("2d").drawImage(logoImg, 0, 0);
        const logoData = c.toDataURL("image/png");
        pdf.addImage(logoData, "PNG", 10, 6, 14, 14);
      }
    } catch (_) {}

    pdf.setTextColor(17, 24, 39);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Die Denkschule", 28, 14);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(55, 65, 81);
    pdf.text(pageTitle, 28, 20);
  }

  // COVER
  await addHeader("Intelligenzprofil – Momentaufnahme");

  // Student box
  pdf.setDrawColor(220);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(10, 32, pageW - 20, 26, 3, 3, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(17, 24, 39);
  pdf.text("Schüler*in", 14, 40);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(55, 65, 81);
  pdf.text(`Name: ${name}`, 14, 47);
  pdf.text(`Klasse: ${cls}`, 70, 47);
  pdf.text(`Datum: ${dateStr}`, 130, 47);

  // Explanation
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99);
  const expl = "Dieses Profil basiert auf Antworten zu Interessen-Aussagen sowie auf drei gewählten Projekten (1.–3. Wahl). Es zeigt bevorzugte Denk- und Lernzugänge als Momentaufnahme (0–100).";
  pdf.text(pdf.splitTextToSize(expl, pageW - 20), 10, 66);

  // Radar from canvas
  const radarCanvas = document.getElementById("radar");
  const radarImg = radarCanvas.toDataURL("image/png");

  pdf.setDrawColor(229, 231, 235);
  pdf.setFillColor(249, 250, 251);
  pdf.roundedRect(10, 74, pageW - 20, 92, 3, 3, "FD");
  pdf.addImage(radarImg, "PNG", 15, 78, pageW - 30, 84);

  // Project choices
  pdf.setDrawColor(229, 231, 235);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(10, 170, pageW - 20, 40, 3, 3, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(17, 24, 39);
  pdf.text("Projektwahlen", 14, 178);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(55, 65, 81);
  pdf.text((picksSorted.length ? picksSorted : ["—"]), 14, 186);

  // Norm table (in the desired radar order = INTELLIGENCES order)
  const rows = INTELLIGENCES.map((i) => [i.label, `${scores.norm[i.key]}`]);
  pdf.autoTable({
    startY: 214,
    head: [["Intelligenz (Reihenfolge wie Spider-Web)", "Wert (0–100)"]],
    body: rows,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [17, 24, 39], textColor: 255 },
    margin: { left: 10, right: 10 },
  });

  // APPENDIX
  pdf.addPage();
  await addHeader("Anhang – Antworten nach Bereich");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99);
  const appInfo = "Die Fragen wurden im Fragebogen absichtlich gemischt angezeigt. Für die Auswertung sind sie hier nach Bereichen sortiert.";
  pdf.text(pdf.splitTextToSize(appInfo, pageW - 20), 10, 34);

  let cursorY = 42;

  for (const intel of INTELLIGENCES) {
    const qs = QUESTIONS.filter((q) => q.intel === intel.key);
    const body = qs.map((q) => [q.text, getAnswerLabel(q.id), String(getAnswerValue(q.id))]);

    if (cursorY > pageH - 60) {
      pdf.addPage();
      await addHeader("Anhang – Antworten nach Bereich");
      cursorY = 34;
    }

    // Section title + icon
    pdf.setTextColor(17, 24, 39);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);

    try {
      const img = await loadImage(intel.icon);
      if (img) {
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d").drawImage(img, 0, 0);
        pdf.addImage(c.toDataURL("image/png"), "PNG", 10, cursorY - 4, 6, 6);
        pdf.text(intel.label, 18, cursorY);
      } else {
        pdf.text(intel.label, 10, cursorY);
      }
    } catch (_) {
      pdf.text(intel.label, 10, cursorY);
    }

    cursorY += 4;

    pdf.autoTable({
      startY: cursorY,
      head: [["Aussage", "Antwort", "Punkte"]],
      body,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 2, valign: "top" },
      headStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39] },
      columnStyles: {
        0: { cellWidth: pageW - 20 - 18 - 14 },
        1: { cellWidth: 18, halign: "center" },
        2: { cellWidth: 14, halign: "center" },
      },
      margin: { left: 10, right: 10 },
    });

    cursorY = pdf.lastAutoTable.finalY + 10;
  }

  pdf.save(`Denkschule_GardnerProfil_${cls}_${name}.pdf`);
}

// ---------- Actions ----------
btnCalc.addEventListener("click", async () => {
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
  await showResult(scores);
});

btnPdf.addEventListener("click", async () => {
  elErr.textContent = "";

  if (!validateAllAnswered()) {
    elErr.textContent = "Für das PDF bitte zuerst alle Aussagen beantworten.";
    return;
  }

  const picks = getProjectRankings();
  const msg = validateExactlyThreeProjects(picks);
  if (msg) {
    elErr.textContent = msg;
    return;
  }

  // ensure chart exists
  const scores = calcScores();
  await showResult(scores);
  await exportProfessionalPdf();
});

btnReset.addEventListener("click", () => {
  document.getElementById("studentName").value = "";
  document.getElementById("studentClass").value = "";
  document.querySelectorAll('input[type="radio"]').forEach((r) => (r.checked = false));
  elP.querySelectorAll("select").forEach((s) => (s.value = ""));
  elErr.textContent = "";
  resultCard.hidden = true;
  if (chart) chart.destroy();
  chart = null;

  // New random order after reset
  renderQuestionsRandom();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// Init
renderQuestionsRandom();
renderProjects();
