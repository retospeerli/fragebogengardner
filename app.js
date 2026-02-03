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
let __EXPORTING_PDF__ = false;

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

function getAnswerLabel(qid) {
  const v = getAnswerValue(qid);
  const found = SCALE.find((s) => s.value === v);
  return found ? found.label : "—";
}

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

// ---------- Questions ----------
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

// ---------- Projects ----------
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

  for (const q of QUESTIONS) {
    const v = getAnswerValue(q.id);
    raw[q.intel] += v;
    countPerIntel[q.intel] += 1;
  }

  for (const intel of INTELLIGENCES) {
    max[intel.key] = countPerIntel[intel.key] * 3;
  }

  const picks = getProjectRankings();
  for (const p of picks) {
    const pr = PROJECTS.find((x) => x.id === p.projectId);
    const bonus = projectBonus[p.rank] || 0;
    for (const ik of pr.intels) raw[ik] += bonus;
  }

  for (const intel of INTELLIGENCES) max[intel.key] += 6;

  const norm = {};
  for (const intel of INTELLIGENCES) {
    norm[intel.key] = Math.round((raw[intel.key] / max[intel.key]) * 100);
  }

  return { raw, max, norm, picks };
}

// ---------- Radar ----------
function buildRadarPlugin(iconImgs) {
  return {
    id: "outerLabelsAndInnerValues",
    afterDraw(chart) {
      const { ctx } = chart;
      const scale = chart.scales.r;
      if (!scale) return;

      const centerX = scale.xCenter;
      const centerY = scale.yCenter;
      const outerR = scale.drawingArea;

      // outside labels
      ctx.save();
      ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
      ctx.fillStyle = "#374151";
      ctx.textBaseline = "middle";

      const labelOffset = 26;

      for (let i = 0; i < INTELLIGENCES.length; i++) {
        const angle = scale.getIndexAngle(i);
        const x = centerX + Math.cos(angle) * (outerR + labelOffset);
        const y = centerY + Math.sin(angle) * (outerR + labelOffset);

        const c = Math.cos(angle);
        const align = c > 0.15 ? "left" : c < -0.15 ? "right" : "center";
        ctx.textAlign = align;
        ctx.fillText(INTELLIGENCES[i].label, x, y);
      }
      ctx.restore();

      // inside values
      const dataset = chart.data.datasets[0].data;

      ctx.save();
      ctx.font = "bold 12px system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
      ctx.fillStyle = "#111827";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < dataset.length; i++) {
        const v = dataset[i];
        const pt = scale.getPointPositionForValue(i, v);
        ctx.fillText(String(v), pt.x, pt.y);
      }
      ctx.restore();
    }
  };
}

async function renderRadar(scores) {
  const data = INTELLIGENCES.map((i) => scores.norm[i.key]);
  const ctx = document.getElementById("radar");
  if (chart) chart.destroy();

  const plugin = buildRadarPlugin();

  chart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: INTELLIGENCES.map(() => ""),
      datasets: [{
        label: "",
        data,
        borderWidth: 2,
        pointRadius: 3,
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
          startAngle: -90,   // <<< KORREKTUR: Start bei 12 Uhr
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

// ---------- Result ----------
async function showResult(scores) {
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

// ---------- Actions ----------
btnCalc.addEventListener("click", async () => {
  elErr.textContent = "";
  if (!validateAllAnswered()) {
    elErr.textContent = "Bitte beantworte alle Aussagen.";
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

// Init
renderQuestionsRandom();
renderProjects();
