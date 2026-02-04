// =========================================================
// SINGLE SOURCE OF TRUTH: Achsen-Reihenfolge (Index 0 = 12 Uhr)
// =========================================================
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

// Farbe pro Intelligenz (Index passt exakt zu AXIS_KEYS)
const AXIS_COLORS = [
  "#2563EB", // logisch
  "#7C3AED", // räumlich
  "#16A34A", // körper
  "#DB2777", // musikalisch
  "#F59E0B", // interpersonal
  "#DC2626", // sprachlich
  "#0EA5E9", // intrapersonal
  "#64748B", // existenziell
  "#059669", // natur
];

function withAlpha(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

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

// ---------------------------------------------------------
// Helpers / Validierung
// ---------------------------------------------------------
function buildIntelMap() {
  const map = new Map();
  for (const it of INTELLIGENCES) map.set(it.key, it);
  return map;
}

function assertConsistency() {
  const intelMap = buildIntelMap();

  for (const k of AXIS_KEYS) {
    if (!intelMap.has(k)) throw new Error(`INTELLIGENCES fehlt key="${k}"`);
  }
  for (const q of QUESTIONS) {
    if (!intelMap.has(q.intel)) throw new Error(`QUESTIONS: unbekannter intel-key "${q.intel}" bei "${q.id}"`);
  }
  for (const p of PROJECTS) {
    for (const k of p.intels) {
      if (!intelMap.has(k)) throw new Error(`PROJECTS: unbekannter intel-key "${k}" bei "${p.id}"`);
    }
  }
}

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

// PDF-safe
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

// ---------------------------------------------------------
// Render: Fragen (randomisiert)
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// Render: Projekte (1/2/3 strikt einzigartig)
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// Scoring (roh + normiert)
// ---------------------------------------------------------
function calcScores() {
  const raw = {};
  const max = {};
  const countPerIntel = {};

  for (const k of AXIS_KEYS) {
    raw[k] = 0;
    max[k] = 0;
    countPerIntel[k] = 0;
  }

  for (const q of QUESTIONS) {
    const v = getAnswerValue(q.id);
    raw[q.intel] += v;
    countPerIntel[q.intel] += 1;
  }

  for (const k of AXIS_KEYS) {
    max[k] = countPerIntel[k] * 3;
  }

  const picks = getProjectRankings();
  for (const p of picks) {
    const pr = PROJECTS.find((x) => x.id === p.projectId);
    const bonus = projectBonus[p.rank] || 0;
    for (const ik of pr.intels) raw[ik] += bonus;
  }

  for (const k of AXIS_KEYS) max[k] += 6; // 3+2+1

  const norm = {};
  for (const k of AXIS_KEYS) {
    norm[k] = Math.round((raw[k] / max[k]) * 100);
  }

  return { raw, max, norm, picks };
}

// ---------------------------------------------------------
// Zentrale Quelle für Labels/Werte (Radar + Liste + PDF)
// ---------------------------------------------------------
async function buildAxisPresentation(scores) {
  const intelMap = buildIntelMap();

  const axisLabels = AXIS_KEYS.map((k) => intelMap.get(k).label);
  const axisValues = AXIS_KEYS.map((k) => scores.norm[k]);
  const axisPairs = AXIS_KEYS.map((k, i) => ({
    key: k,
    label: axisLabels[i],
    value: axisValues[i],
    icon: intelMap.get(k).icon,
  }));

  const axisIcons = await Promise.all(AXIS_KEYS.map((k) => loadImage(intelMap.get(k).icon)));
  return { axisLabels, axisValues, axisPairs, axisIcons };
}

// ---------------------------------------------------------
// Radar Plugin: NUR Labels + Werte (Labels exakt auf echter Achse)
// ---------------------------------------------------------
function buildRadarPlugin(axisLabels, axisIcons) {
  return {
    id: "outerLabelsAndInnerValues",
    afterDraw(chart) {
      const { ctx } = chart;
      const scale = chart.scales.r;
      if (!scale) return;

      // Aussenlabels
      ctx.save();
      ctx.font = "700 14px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
      ctx.textBaseline = "middle";

      const pushOut = 22;
      const iconSize = 16;
      const iconGap = 7;

      for (let i = 0; i < axisLabels.length; i++) {
        const pt = scale.getPointPositionForValue(i, scale.max);

        const dx = pt.x - scale.xCenter;
        const dy = pt.y - scale.yCenter;
        const len = Math.hypot(dx, dy) || 1;

        const x = pt.x + (dx / len) * pushOut;
        const y = pt.y + (dy / len) * pushOut;

        const align = Math.abs(dx / len) < 0.15 ? "center" : (dx > 0 ? "left" : "right");
        ctx.textAlign = align;

        const drawIcons = !__EXPORTING_PDF__ && axisIcons && axisIcons[i];
        if (drawIcons) {
          let iconX = x;
          if (align === "left") iconX = x - (iconSize + iconGap);
          if (align === "right") iconX = x + iconGap;
          ctx.drawImage(axisIcons[i], iconX, y - iconSize / 2, iconSize, iconSize);
        }

        ctx.fillStyle = AXIS_COLORS[i];
        ctx.fillText(axisLabels[i], x, y);
      }
      ctx.restore();

      // Innenwerte
      const dataset = chart.data.datasets[0].data;

      ctx.save();
      ctx.font = "800 12px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < dataset.length; i++) {
        const v = dataset[i];
        const pt = scale.getPointPositionForValue(i, v);

        const text = String(v);
        const metrics = ctx.measureText(text);
        const w = metrics.width + 14;
        const h = 18;
        const rx = pt.x - w / 2;
        const ry = pt.y - h / 2;
        const r = 7;

        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.94)";
        ctx.strokeStyle = withAlpha(AXIS_COLORS[i], 0.65);
        ctx.lineWidth = 1.3;

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

        ctx.fillStyle = AXIS_COLORS[i];
        ctx.fillText(text, pt.x, pt.y);
      }

      ctx.restore();
    }
  };
}

// ---------------------------------------------------------
// Radar rendern
// ---------------------------------------------------------
async function renderRadar(axisLabels, axisValues, axisIcons) {
  const canvas = document.getElementById("radar");
  if (chart) chart.destroy();

  const plugin = buildRadarPlugin(axisLabels, axisIcons);

  chart = new Chart(canvas, {
    type: "radar",
    data: {
      labels: axisLabels.map(() => ""),
      datasets: [{
        label: "",
        data: axisValues,
        borderWidth: 2.2,
        borderColor: "rgba(37,99,235,0.85)",
        backgroundColor: "rgba(37,99,235,0.12)",
        pointRadius: 3,
        pointBackgroundColor: "rgba(37,99,235,0.85)",
        pointBorderColor: "rgba(37,99,235,0.85)",
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },

      layout: { padding: { top: 72, right: 92, bottom: 72, left: 92 } },

      scales: {
        r: {
          min: 0,
          max: 100,
          startAngle: -90,

          grid: {
            circular: true,
            lineWidth: 1.2,
            color: "rgba(0,0,0,0.08)"
          },

          angleLines: {
            display: true,
            lineWidth: () => 2.6,
            color: (ctx) => withAlpha(AXIS_COLORS[ctx.index], 0.55),
          },

          ticks: {
            stepSize: 20,
            backdropColor: "rgba(255,255,255,0.85)",
            color: "rgba(0,0,0,0.45)",
            font: { size: 11, weight: "600" }
          },

          pointLabels: { display: false }
        }
      },
      plugins: { legend: { display: false } }
    },
    plugins: [plugin]
  });

  chart.update("none");
}

// ---------------------------------------------------------
// Ergebnis anzeigen
// ---------------------------------------------------------
async function showResult(scores) {
  const name = document.getElementById("studentName").value.trim() || "Ohne Name";
  const cls = document.getElementById("studentClass").value.trim() || "—";

  const { axisLabels, axisValues, axisPairs, axisIcons } = await buildAxisPresentation(scores);

  resultHeader.innerHTML = `
    <div><strong>${name}</strong></div>
    <div>Klasse: <strong>${cls}</strong></div>
    <div>Datum: <strong>${todayISO()}</strong></div>
  `;

  await renderRadar(axisLabels, axisValues, axisIcons);

  const picksSorted = scores.picks
    .slice()
    .sort((a, b) => Number(a.rank) - Number(b.rank))
    .map((p) => {
      const pr = PROJECTS.find((x) => x.id === p.projectId);
      return `<li><strong>${p.rank}. Wahl:</strong> ${pr.name}</li>`;
    })
    .join("");

  const valuesList = axisPairs
    .map((x, i) => `<li style="color:${AXIS_COLORS[i]}">${x.label}: <strong>${x.value}</strong></li>`)
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

// =========================================================
// PDF Export – farbig + sortiert + Antwortfarben
// =========================================================
async function exportProfessionalPdf() {
  const name = document.getElementById("studentName").value.trim() || "OhneName";
  const cls = document.getElementById("studentClass").value.trim() || "Klasse";
  const dateStr = todayISO();

  const scores = calcScores();
  const { axisLabels, axisValues, axisPairs } = await buildAxisPresentation(scores);

  // PDF: keine Icons im Radar
  __EXPORTING_PDF__ = true;
  await renderRadar(axisLabels, axisValues, null);
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

  // ---------- helpers ----------
  const toRgb = (hex) => {
    const h = hex.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  };

  const colorForKey = (key) => {
    const idx = AXIS_KEYS.indexOf(key);
    return AXIS_COLORS[Math.max(0, idx)];
  };

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

        const logoW = 46;
        const logoH = logoW * (70 / 390); // 390x70 proportional, nicht quetschen
        pdf.addImage(c.toDataURL("image/png"), "PNG", 10, 8, logoW, logoH);
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

  // ---------- Seite 1 ----------
  await addHeader("Interessenprofil nach Gardner-Intelligenzen");

  // kleinere Schüler*in Box
  pdf.setDrawColor(220);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(10, 32, pageW - 20, 18, 3, 3, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(17, 24, 39);
  pdf.text("Schüler*in", 14, 39);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(55, 65, 81);
  pdf.text(`Name: ${name}`, 14, 46);
  pdf.text(`Klasse: ${cls}`, 80, 46);
  pdf.text(`Datum: ${dateStr}`, 140, 46);

  pdf.setFontSize(9.5);
  pdf.setTextColor(75, 85, 99);
  pdf.text(
    pdf.splitTextToSize(
      "Dieses Interessenprofil basiert auf Antworten zu Aussagen sowie auf drei gewählten Projekten (1.–3. Wahl). " +
        "Es zeigt eine Momentaufnahme deiner Interessen entlang der Gardner-Intelligenzen (Skala 0–100).",
      pageW - 20
    ),
    10,
    56
  );

  // Radar
  const radarCanvas = document.getElementById("radar");
  const radarImg = radarCanvas.toDataURL("image/png");

  pdf.setDrawColor(229, 231, 235);
  pdf.setFillColor(249, 250, 251);
  pdf.roundedRect(10, 64, pageW - 20, 86, 3, 3, "FD");
  pdf.addImage(radarImg, "PNG", 18, 66, pageW - 36, 82);

  // kleinere Projekte Box
  pdf.setDrawColor(229, 231, 235);
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(10, 152, pageW - 20, 30, 3, 3, "FD");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(17, 24, 39);
  pdf.text("Projektwahlen", 14, 160);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(55, 65, 81);
  pdf.text((picksSorted.length ? picksSorted : ["—"]), 14, 167);

  // ÜBERSICHTSTABELLE: sortiert absteigend + farbig pro Zeile
  const sortedAxis = axisPairs
    .slice()
    .sort((a, b) => Number(b.value) - Number(a.value));

  const rowsMeta = sortedAxis.map((x) => ({ key: x.key, label: x.label, value: x.value }));

  pdf.autoTable({
    startY: 186,
    head: [["Auswertung (absteigend)", "Wert (0–100)"]],
    body: rowsMeta.map((r) => [r.label, String(r.value)]),
    theme: "grid",
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 1.6 },
    headStyles: { fillColor: [17, 24, 39], textColor: 255 },
    margin: { left: 10, right: 10 },
    didParseCell: function (data) {
      if (data.section !== "body") return;

      const rowIdx = data.row.index;
      const key = rowsMeta[rowIdx]?.key;
      if (!key) return;

      const rgb = toRgb(colorForKey(key));
      data.cell.styles.textColor = rgb;
      data.cell.styles.fontStyle = "bold";
    },
  });

  // ---------- Anhang ----------
  pdf.addPage();
  await addHeader("Anhang – Antworten nach Bereich");

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(75, 85, 99);
  pdf.text(
    pdf.splitTextToSize(
      "Die Fragen wurden im Fragebogen absichtlich gemischt angezeigt. Für die Auswertung sind sie hier nach Bereichen sortiert.",
      pageW - 20
    ),
    10,
    34
  );

  let cursorY = 42;

  for (const x of axisPairs) {
    const qs = QUESTIONS.filter((q) => q.intel === x.key);
    const body = qs.map((q) => {
      const pts = getAnswerValue(q.id);
      return [q.text, getAnswerLabelSafe(q.id), String(pts)];
    });

    if (cursorY > pageH - 60) {
      pdf.addPage();
      await addHeader("Anhang – Antworten nach Bereich");
      cursorY = 34;
    }

    // Bereichstitel in Radar-Farbe
    const titleRgb = toRgb(colorForKey(x.key));
    pdf.setTextColor(titleRgb[0], titleRgb[1], titleRgb[2]);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);

    try {
      const img = await loadImage(x.icon);
      if (img) {
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d").drawImage(img, 0, 0);
        pdf.addImage(c.toDataURL("image/png"), "PNG", 10, cursorY - 4, 6, 6);
        pdf.text(x.label, 18, cursorY);
      } else {
        pdf.text(x.label, 10, cursorY);
      }
    } catch (_) {
      pdf.text(x.label, 10, cursorY);
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
      didParseCell: function (data) {
        if (data.section !== "body") return;

        const row = data.row.raw; // ["text","++","3"]
        const pts = Number(row?.[2]);

        if (pts === 3) {
          data.cell.styles.textColor = [22, 163, 74]; // grün
          data.cell.styles.fontStyle = "bold";
        } else if (pts === 0) {
          data.cell.styles.textColor = [153, 27, 27]; // dunkelrot
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    cursorY = pdf.lastAutoTable.finalY + 10;

    // Reset auf Standardfarbe
    pdf.setTextColor(17, 24, 39);
  }

  pdf.save(`Denkschule_Interessenprofil_${cls}_${name}.pdf`);

  __EXPORTING_PDF__ = false;

  // UI-Radar wieder mit Icons
  const { axisLabels: uiL, axisValues: uiV, axisIcons: uiI } = await buildAxisPresentation(scores);
  await renderRadar(uiL, uiV, uiI);
}

// ---------------------------------------------------------
// Actions
// ---------------------------------------------------------
btnCalc.addEventListener("click", async () => {
  elErr.textContent = "";
  try { assertConsistency(); } catch (e) {
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
  try { assertConsistency(); } catch (e) {
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

// ---------------------------------------------------------
// Init
// ---------------------------------------------------------
renderQuestionsRandom();
renderProjects();
