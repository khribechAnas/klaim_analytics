const CLASS_CODES = ["P1", "U1", "U2", "U3", "U4"];
const CLASS_COLORS = {
  P1: "#2f855a",
  U1: "#3182ce",
  U2: "#dd6b20",
  U3: "#c53030",
  U4: "#7f1d1d"
};

const state = {
  page: 1,
  limit: 50,
  selectedClasses: new Set(),
  searchTerm: "",
  lastResponse: null
};

const el = {
  kpiGrid: document.getElementById("kpiGrid"),
  barChart: document.getElementById("barChart"),
  claimsBody: document.getElementById("claimsBody"),
  resultInfo: document.getElementById("resultInfo"),
  pageInfo: document.getElementById("pageInfo"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  limitSelect: document.getElementById("limitSelect"),
  searchInput: document.getElementById("searchInput"),
  classificationChips: document.getElementById("classificationChips"),
  riskArc: document.getElementById("riskArc"),
  riskRate: document.getElementById("riskRate"),
  lastUpdated: document.getElementById("lastUpdated"),
  detailDialog: document.getElementById("detailDialog"),
  detailContent: document.getElementById("detailContent")
};

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value || 0));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function buildQuery() {
  const params = new URLSearchParams({
    page: String(state.page),
    limit: String(state.limit)
  });

  if (state.selectedClasses.size > 0) {
    params.set("classification", Array.from(state.selectedClasses).join(","));
  }

  return `/api/claims/classified?${params.toString()}`;
}

function getVisibleClaims() {
  const claims = state.lastResponse?.claims || [];
  if (!state.searchTerm.trim()) return claims;

  const term = state.searchTerm.trim().toLowerCase();
  return claims.filter((claim) => {
    return [claim.claimId, claim.payerId, claim.owner, claim.insurer]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });
}

function renderChips() {
  el.classificationChips.innerHTML = "";
  CLASS_CODES.forEach((code) => {
    const chip = document.createElement("button");
    chip.className = `chip ${state.selectedClasses.has(code) ? "active" : ""}`;
    chip.textContent = code;
    chip.style.borderColor = state.selectedClasses.has(code) ? CLASS_COLORS[code] : "";
    chip.addEventListener("click", () => {
      if (state.selectedClasses.has(code)) {
        state.selectedClasses.delete(code);
      } else {
        state.selectedClasses.add(code);
      }
      state.page = 1;
      renderChips();
      fetchClaims();
    });
    el.classificationChips.appendChild(chip);
  });
}

function renderKpis() {
  const data = state.lastResponse;
  const summary = data?.globalSummary || {};

  const totalNet = CLASS_CODES.reduce((acc, code) => {
    return acc + Number(summary?.[code]?.totalNetAmount || 0);
  }, 0);

  const cards = [
    { name: "Total Claims", value: formatNumber(data?.totalClaims || 0), hint: "Filtered result set" },
    { name: "Total Net", value: formatCurrency(totalNet), hint: "Across current filter" },
    ...CLASS_CODES.map((code) => ({
      name: `${code} Claims`,
      value: formatNumber(summary?.[code]?.count || 0),
      hint: formatCurrency(summary?.[code]?.totalNetAmount || 0)
    }))
  ];

  el.kpiGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="card kpi">
          <p class="name">${card.name}</p>
          <p class="value">${card.value}</p>
          <p class="hint">${card.hint}</p>
        </article>
      `
    )
    .join("");
}

function renderBars() {
  const summary = state.lastResponse?.globalSummary || {};
  const maxCount = Math.max(1, ...CLASS_CODES.map((code) => Number(summary?.[code]?.count || 0)));

  el.barChart.innerHTML = CLASS_CODES.map((code) => {
    const count = Number(summary?.[code]?.count || 0);
    const width = Math.round((count / maxCount) * 100);
    return `
      <div class="bar-row">
        <strong>${code}</strong>
        <div class="bar-track">
          <div class="bar-fill" style="width:${width}%; background:${CLASS_COLORS[code]};"></div>
        </div>
        <span class="mono">${formatNumber(count)}</span>
      </div>
    `;
  }).join("");

  const total = CLASS_CODES.reduce((acc, code) => acc + Number(summary?.[code]?.count || 0), 0);
  const riskCount = Number(summary?.U3?.count || 0) + Number(summary?.U4?.count || 0);
  const pct = total === 0 ? 0 : (riskCount / total) * 100;
  const circumference = 100;

  el.riskArc.style.strokeDasharray = `${pct} ${Math.max(circumference - pct, 0)}`;
  el.riskRate.textContent = `${pct.toFixed(1)}%`;
}

function rowForClaim(claim) {
  const code = claim?.classification?.code || "-";
  return `
    <tr>
      <td>${claim.claimId || "-"}</td>
      <td><span class="badge ${code}">${code}</span></td>
      <td>${claim.status || "-"}</td>
      <td>${claim?.classification?.daysOverdue ?? "-"}</td>
      <td>${formatCurrency(claim.netAmount)}</td>
      <td>${claim.owner || "-"}</td>
      <td>${claim.insurer || "-"}</td>
      <td>${formatDate(claim.encounterDate)}</td>
      <td><button class="btn ghost js-detail" data-claim='${encodeURIComponent(JSON.stringify(claim))}'>View</button></td>
    </tr>
  `;
}

function wireDetailButtons() {
  document.querySelectorAll(".js-detail").forEach((btn) => {
    btn.addEventListener("click", () => {
      const raw = btn.getAttribute("data-claim");
      if (!raw) return;
      const claim = JSON.parse(decodeURIComponent(raw));
      el.detailContent.textContent = JSON.stringify(claim, null, 2);
      el.detailDialog.showModal();
    });
  });
}

function renderTable() {
  const claims = getVisibleClaims();
  el.claimsBody.innerHTML = claims.map(rowForClaim).join("") || `<tr><td colspan="9">No claims found.</td></tr>`;
  wireDetailButtons();

  const totalClaims = Number(state.lastResponse?.totalClaims || 0);
  const page = Number(state.lastResponse?.page || 1);
  const totalPages = Number(state.lastResponse?.totalPages || 1);
  el.resultInfo.textContent = `${claims.length} rows shown (page contains ${state.lastResponse?.claimsCount || 0})`;
  el.pageInfo.textContent = `Page ${page} / ${Math.max(totalPages, 1)} • Total ${formatNumber(totalClaims)}`;
  el.prevBtn.disabled = page <= 1;
  el.nextBtn.disabled = page >= totalPages;
}

async function fetchClaims() {
  try {
    el.refreshBtn.disabled = true;
    const res = await fetch(buildQuery());
    if (!res.ok) {
      throw new Error(`Request failed (${res.status})`);
    }
    state.lastResponse = await res.json();
    renderKpis();
    renderBars();
    renderTable();
    el.lastUpdated.textContent = `Updated ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    el.claimsBody.innerHTML = `<tr><td colspan="9">${error instanceof Error ? error.message : "Failed to load data"}</td></tr>`;
  } finally {
    el.refreshBtn.disabled = false;
  }
}

function setupEvents() {
  el.refreshBtn.addEventListener("click", fetchClaims);
  el.limitSelect.addEventListener("change", () => {
    state.limit = Number(el.limitSelect.value || 50);
    state.page = 1;
    fetchClaims();
  });
  el.searchInput.addEventListener("input", () => {
    state.searchTerm = el.searchInput.value;
    renderTable();
  });
  el.prevBtn.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    fetchClaims();
  });
  el.nextBtn.addEventListener("click", () => {
    const lastPage = Number(state.lastResponse?.totalPages || state.page);
    state.page = Math.min(lastPage, state.page + 1);
    fetchClaims();
  });
}

setupEvents();
renderChips();
fetchClaims();
