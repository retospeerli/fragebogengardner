// ===============================
// Single Source of Truth: Achsen-Reihenfolge
// Start 12 Uhr, im Uhrzeigersinn:
// logisch, räumlich, körper, musikalisch, interpersonal, sprachlich, intrapersonal, existenziell, natur
// ===============================
const AXIS_KEYS = [
  "logisch",
  "raeumlich",
  "koerper",
  "musikalisch",
  "inter",
  "sprachlich",
  "intra",
  "exist",
  "natur",
];

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
let __EXPORTING_PDF__ = false;

// ===============================
// Validierung / Mapping
// ===============================
function buildIntelMap() {
  const map = new Map();
  for (const it of INTELLIGENCES) map.set(it.key, it);
  return map;
}

function assertConsistency() {
  const intelMap = buildIntelMap();

  // 1) AXIS_KEYS müssen in INTELLIGENCES existieren
  for (const k of AXIS_KEYS) {
    if (!intelMap.has(k)) {
      throw new Error(`INTELLIGENCES fehlt key="${k}". Achsen-Reihenfolge kann nicht stimmen.`);
    }
  }

  // 2) QUESTIONS intel keys müssen gültig sein
  for (const q of QUESTIONS) {
    if (!intelMap.has(q.intel)) {
      throw new Error(`QUESTIONS: unbekannter intel-key "${q.intel}" bei id="${q.id}".`);
    }
  }

  // 3) PROJECTS intels keys müssen gültig sein
  for (const p of PROJECTS) {
    for (const k of p.intels) {
      if (!intelMap.has(k)) {
        throw new Error(`PROJECTS: unbekannter intel-key "${k}" bei project="${p.id}".`);
      }
    }
  }
}

// ===============================
// Helpers
// ===============================
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

async function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function getAnswerValue(qid) {
  const checked = document.querySelector(`input[name="${qid}"]:checked`);
  return checked ? Number(checked.value) : null;
}

// PDF-safe (ohne Emojis)
function getAnswerLabelSafe(qid) {
  const v = getAnswerValue(qid);
  if (v === 3) return "++";
  if (v === 2) return "+";
  if (v === 1) return "o";
  if (v === 0) return "-";
  return "—";
}

function validateAllAnswered() {
  for (const q of QUESTIONS) {
    if (getAnswerValue(q.id) === null) return false;
  }
  return true;
}

// ===============================
// Render: Fragen in zufälliger Reihenfolge
// ===============================
function renderQuestionsRandom() {
  const randomizedQuestions = shuffleArray(QUESTIONS);
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

// ===============================
// Render: Projekte (1/2/3 Wahl exakt je einmal)
// ===============================
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

    sel.addEventListener("change", () => {
      const chosenRank = sel.value;
      if (!chosenRank) return;

      const all = [...elP.querySelectorAll("select")];
      for (const other of all) {
        if (other === sel) continue;
        if (other.value === chosenRank) other.value = "";
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

// ===============================
// Scoring – garantiert konsistent zur AXIS_KEYS Reihenfolge
// ===============================
function calcScores() {
  const raw = {};
  const max = {};
  const countPerIntel = {};

  for (const k of AXIS_KEYS) {
    raw[k] = 0;
    max[k] = 0;
    countPerIntel[k] = 0;
  }

  // Items
  for (const q of QUESTIONS) {
    const v = getAnswerValue(q.id);
    raw[q.intel] += v;
    countPerIntel[q.intel] += 1;
  }

  // Max items
  for (const k of AXIS_KEYS) {
    max[k] = countPerIntel[k] * 3;
  }

  // Project bonus
  const picks = getProjectRankings();
  for (const p of picks) {
    const pr = PROJECTS.find((x) => x.id === p.projectId);
    const bonus = projectBonus[p.rank] || 0;
    for (const ik of pr.intels) raw[ik] += bonus;
  }

  // max bonus per intelligence: 3+2+1 = 6
  for (const k of AXIS_KEYS) max[k] += 6;

  // Norm 0–100
  const norm = {};
  for (const k of AXIS_KEYS) {
    norm[k] = Math.round((raw[k] / max[k]) * 100);
  }

  return { raw, max, norm, picks };
}

// ===============================
// Radar: Plugin – Aussenlabels (optional Icons) + Innenwerte
// ===============================
function buildRadarPlugin(axisLabels, axisIcons) {
  return {
    id: "outerLabelsAndInnerValues",
    afterDraw(chart) {
      const { ctx } = chart;
      const scale = chart.scales.r;
      if (!scale) return;

      const centerX = scale.xCenter;
      const centerY = scale.yCenter;
      const outerR = scale.drawingArea;

      // Aussen: Labels (+ Icons nur im UI)
      ctx.save();
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
      ctx.fillStyle = "#374151";
      ctx.textBaseline = "middle";

      const labelOffset = 26;
      const iconSize = 14;
      const iconGap = 6;

      for (let i = 0; i < axisLabels.length; i++) {
        const angle = scale.getIndexAngle(i);
        const x = centerX + Math.cos(angle) * (outerR + labelOffset);
        const y = centerY + Math.sin(angle) * (outerR + labelOffset);

        const c = Math.cos(angle);
        const align = c > 0.15 ? "left" : c < -0.15 ? "right" : "center";
        ctx.textAlign = align;

        // Icons: nur im UI; im Export aus
        const drawIcons = !__EXPORTING_PDF__ && axisIcons && axisIcons[i];

        if (drawIcons) {
          let iconX = x;
          if (align === "left") iconX = x - (iconSize + iconGap);
          if (align === "right") iconX = x + iconGap;
          ctx.drawImage(axisIcons[i], iconX, y - iconSize / 2, iconSize, iconSize);
        }

        ctx.fillText(axisLabels[i], x, y);
      }
      ctx.restore();

      // Innen: Werte direkt an den Punkten
      const dataset = chart.data.datasets[0].data;

      ctx.save();
      ctx.font = "bold 12px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
      ctx.fillStyle = "#111827";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < dataset.length; i++) {
        const v = dataset[i];
        const pt = scale.getPointPositionForValue(i, v);

        const text = String(v);
        const metrics = ctx.measureText(text);
        const w = metrics.width + 12;
        const h = 16;
        const rx = pt.x - w / 2;
        const ry = pt.y - h / 2;
        const r = 6;

        // kleine “Pille” hinter Zahl
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.90)";
        ctx.strokeStyle = "rgba(0,0,0,0.08)";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(rx + r, ry);
        ctx.lineTo(rx + w - r, ry);
        ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + r);
        ctx.lineTo(rx + w, ry + h - r);
        ctx.quadraticCurveTo(rx + w, ry + h, rx + w - r, ry + h);
        ctx.lineTo(rx + r, ry + h);
        ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - r);
        ctx.lineTo(rx, ry + r);
        ctx.quadraticCurveTo(rx, ry, rx + r, ry);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "#111827";
        ctx.fillText(text, pt.x, pt.y);
      }
      ctx.restore();
    }
  };
}

async function renderRadar(scores) {
  const intelMap = buildIntelMap();

  // Achsenlabels und Daten in EXAKT derselben Reihenfolge:
  const axisLabels = AXIS_KEYS.map((k) => intelMap.get(k).label);
  const data = AXIS_KEYS.map((k) => scores.norm[k]);

  // Icons (nur UI)
  const axisIcons = await Promise.all(AXIS_KEYS.map((k) => loadImage(intelMap.get(k).icon)));

  const ctx = document.getElementById("radar");
  if (chart) chart.destroy();

  const plugin = buildRadarPlugin(axisLabels, axisIcons);

  chart = new Chart(ctx, {
    type: "radar",
    data: {
      // Labels leer lassen → wir zeichnen sie selbst perfekt kontrolliert
      labels: axisLabels.map(() => ""),
      datasets: [{
        label: "",
        data,
        borderWidth: 2,
        pointRadius: 3,
        pointStyle: "circle",
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      layout: { padding: { top: 18, right: 56, bottom: 18, left: 56 } },
      scales: {
        r: {
          min: 0,
          max: 100,
          startAngle: -90, // Index 0 bei 12 Uhr (saubere Definition, keine Mogelei)
          ticks: { stepSize: 20 },
          pointLabels: { display: false }
        }
      },
      plugins: { legend: { display: false } }
    },
    plugins: [plugin]
  });

  chart.update("none");
}

// ===============================
// Ergebnis anzeigen – Liste exakt in Spider-Reihenfolge
// ===============================
async function showResult(scores) {
  const intelMap = buildIntelMap();
  const name = document.getElementById("studentName").value.trim() || "Ohne Name";
  const cls = document.getElementById("studentClass").value.trim() || "—";

  resultHeader.innerHTML = `
    <div><strong>${name}</strong></div>
    <div>Klasse: <strong>${cls}</strong></div>
    <div>Datum: <strong>${todayISO()}</strong></div>
  `;

  await renderRadar(scores);

  const picksSorted = scores.picks
    .slice()
    .sort((a, b) => Number(a.rank) - Number(b.rank))
    .map((p) => {
      const pr = PROJECTS.find((x) => x.id === p.projectId);
      return `<li><strong>${p.rank}. Wahl:</strong> ${pr.name}</li>`;
    })
    .join("");

  const valuesList = AXIS_KEYS
    .map((k) => `<li>${intelMap.get(k).label}: <strong>${scores.norm[k]}</strong></li>`)
    .join("");

  resultDetails.innerHTML = `
    <h3>Projektwahlen</h3>
    <ol>${picksSorted}</ol>
    <h3>Werte (normiert)</h3>
    <ul>${valuesList}</ul>
  `;

  resultCard.hidden = false;
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ===============================
// PDF Export – wieder vollständig funktional
// ===============================
async function exportProfessionalPdf() {
  const intelMap = buildIntelMap();

  const name = document.getElementById("studentName").value.trim() || "OhneName";
  const cls = document.getElementById("studentClass").value.trim() || "Klasse";
  const dateStr = todayISO();

  const scores = calcScores();

  // Exportmodus: keine Icons ins Spider (stabil & sauber)
  __EXPORTING_PDF__ = true;
  await renderRadar(scores);
  await new Promise((r) => requestAnimationFrame(() => r()));

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

    try {
      const logoImg = await loadImage("assets/logo.png");
      if (logoImg) {
        const c = document.createElement("canvas");
        c.width = logoImg.width;
        c.height = logoImg.height;
        c.getContext("2d").drawImage(logoImg, 0, 0);
        const logoData = c.toDataURL("image/png");

        const logoW = 46;
        const logoH = logoW * (70 / 390); // 390x70 proportional
        pdf.addImage(logoData, "PNG", 10, 8, logoW, logoH);
      }
    } catch (_) {}

    pdf.setTextColor(17, 24, 39);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("Die Denkschule", 60, 14);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(55, 65, 81);
    pdf.text(pageTitle, 60, 20);
  }

  // Cover
  await addHeader("Interessenprofil nach Gardner-Intelligenzen");

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
  pdf.text(`Klasse: ${cls}`, 80, 47);
  pdf.text(`Datum: ${dateStr}`, 140, 47);

  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99);
  const expl =
    "Dieses Interessenprofil basiert auf Antworten zu Aussagen sowie auf drei gewählten Projekten (1.–3. Wahl). " +
    "Es zeigt eine Momentaufnahme deiner Interessen entlang der Gardner-Intelligenzen (Skala 0–100).";
  pdf.text(pdf.splitTextToSize(expl, pageW - 20), 10, 66);

  // Spider
  const radarCanvas = document.getElementById("radar");
  const radarImg = radarCanvas.toDataURL("image/png");

  pdf.setDrawColor(229, 231, 235);
  pdf.setFillColor(249, 250, 251);
  pdf.roundedRect(10, 74, pageW - 20, 96, 3, 3, "FD");
  pdf.addImage(radarImg, "PNG", 18, 78, pageW - 36, 88);

  // Projekte
  pdf.setDrawColor(229, 231, 235);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(10, 174, pageW - 20, 40, 3, 3, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(17, 24, 39);
  pdf.text("Projektwahlen", 14, 182);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(55, 65, 81);
  pdf.text((picksSorted.length ? picksSorted : ["—"]), 14, 190);

  // Werte-Tabelle exakt in Spider-Reihenfolge (AXIS_KEYS)
  const rows = AXIS_KEYS.map((k) => [intelMap.get(k).label, `${scores.norm[k]}`]);
  pdf.autoTable({
    startY: 218,
    head: [["Gardner-Bereich (Reihenfolge wie Spider-Web)", "Wert (0–100)"]],
    body: rows,
    theme: "grid",
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [17, 24, 39], textColor: 255 },
    margin: { left: 10, right: 10 },
  });

  // Anhang
  pdf.addPage();
  await addHeader("Anhang – Antworten nach Bereich");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99);
  const appInfo =
    "Die Fragen wurden im Fragebogen absichtlich gemischt angezeigt. Für die Auswertung sind sie hier nach Bereichen sortiert.";
  pdf.text(pdf.splitTextToSize(appInfo, pageW - 20), 10, 34);

  let cursorY = 42;

  for (const k of AXIS_KEYS) {
    const intel = intelMap.get(k);
    const qs = QUESTIONS.filter((q) => q.intel === k);
    const body = qs.map((q) => [q.text, getAnswerLabelSafe(q.id), String(getAnswerValue(q.id))]);

    if (cursorY > pageH - 60) {
      pdf.addPage();
      await addHeader("Anhang – Antworten nach Bereich");
      cursorY = 34;
    }

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

  pdf.save(`Denkschule_Interessenprofil_${cls}_${name}.pdf`);

  // UI-Modus zurück
  __EXPORTING_PDF__ = false;
  await renderRadar(scores);
}

// ===============================
// Actions
// ===============================
btnCalc.addEventListener("click", async () => {
  elErr.textContent = "";

  try {
    assertConsistency();
  } catch (e) {
    elErr.textContent = `Konfigurationsfehler: ${e.message}`;
    return;
  }

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

  try {
    assertConsistency();
  } catch (e) {
    elErr.textContent = `Konfigurationsfehler: ${e.message}`;
    return;
  }

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

  // sicherstellen, dass Chart frisch ist
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

  renderQuestionsRandom();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ===============================
// Init
// ===============================
renderQuestionsRandom();
renderProjects();
