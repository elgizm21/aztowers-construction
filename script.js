// ===== PRICING DATA =====
const pricing = {
  construction: { apartment: 620, house: 740, office: 680, commercial: 710 },
  renovation:   { apartment: 320, house: 390, office: 360, commercial: 410 },
};

const qualityMultiplier  = { standard: 1, premium: 1.22, luxury: 1.48 };
const timelineMultiplier = { regular: 1, fast: 1.16, phased: 1.08 };

const addonRates = {
  design:     { label: "Dizayn layihəsi",   type: "percent", value: 0.08 },
  electrical: { label: "Elektrik işləri",   type: "fixed",   value: 38 },
  plumbing:   { label: "Santexnika paketi", type: "fixed",   value: 44 },
  furniture:  { label: "Built-in mebel",    type: "fixed",   value: 95 },
  smart:      { label: "Smart home",        type: "fixed",   value: 70 },
};

const labels = {
  construction: "yeni tikinti", renovation: "təmir",
  apartment: "mənzil", house: "fərdi ev", office: "ofis", commercial: "kommersiya obyekti",
  standard: "standart", premium: "premium", luxury: "lüks",
  regular: "standart müddət", fast: "sürətləndirilmiş", phased: "mərhələli təhvil",
};

// ===== PRESETS =====
const presets = {
  "family-home": {
    projectType: "construction", propertyType: "house", area: 180,
    quality: "premium", timeline: "regular", addons: ["design", "electrical", "plumbing"],
  },
  "apartment-refresh": {
    projectType: "renovation", propertyType: "apartment", area: 95,
    quality: "premium", timeline: "fast", addons: ["design", "furniture"],
  },
  "office-fitout": {
    projectType: "renovation", propertyType: "office", area: 240,
    quality: "standard", timeline: "phased", addons: ["electrical", "smart"],
  },
  "start": {
    projectType: "renovation", propertyType: "apartment", area: 65,
    quality: "standard", timeline: "regular", addons: [],
  },
  "signature": {
    projectType: "construction", propertyType: "house", area: 280,
    quality: "luxury", timeline: "regular", addons: ["design", "electrical", "plumbing", "furniture", "smart"],
  },
};

// ===== DOM REFERENCES =====
const form                  = document.querySelector("#price-form");
const priceNode             = document.querySelector("#estimatedPrice");
const summaryNode           = document.querySelector("#resultSummary");
const breakdownNode         = document.querySelector("#resultBreakdown");
const recommendedPackageNode= document.querySelector("#recommendedPackage");
const estimatedDurationNode = document.querySelector("#estimatedDuration");
const readinessNode         = document.querySelector("#projectReadiness");
const readinessBarNode      = document.querySelector("#readinessBar");
const areaInput             = document.querySelector("#area");
const areaRange             = document.querySelector("#areaRange");
const areaOutput            = document.querySelector("#areaOutput");
const stepIndicators        = document.querySelectorAll("[data-step-indicator]");
const serviceChips          = document.querySelectorAll("[data-service-filter]");
const serviceCards          = document.querySelectorAll("[data-service-type]");
const presetChips           = document.querySelectorAll("[data-preset]");

// ===== HELPERS =====
function formatCurrency(value) {
  return `₼ ${Math.round(value).toLocaleString("en-US")}`;
}

function createBreakdownItem(label, value) {
  const item = document.createElement("div");
  item.className = "breakdown-item";
  item.innerHTML = `<span>${label}</span><span>${formatCurrency(value)}</span>`;
  return item;
}

function syncArea(source) {
  const safe = Math.min(2000, Math.max(20, Number(source.value) || 20));
  areaInput.value = safe;
  areaRange.value = safe;
  areaOutput.textContent = `${safe} m²`;
}

function updateSelectedCards() {
  document.querySelectorAll(".option-card").forEach((card) => {
    card.classList.toggle("selected", card.querySelector("input").checked);
  });
}

function updatePresetState(activePreset) {
  presetChips.forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.preset === activePreset);
  });
}

function getProjectPackage(total) {
  if (total < 60000)  return "Start";
  if (total < 140000) return "Balance";
  return "Signature";
}

function getTimelineCopy(projectType, timeline, area) {
  const base = projectType === "construction" ? area / 10 : area / 18;
  if (timeline === "fast")   return `${Math.max(6, Math.round(base * 0.85))}-${Math.max(8, Math.round(base * 1.05))} həftə`;
  if (timeline === "phased") return `${Math.max(8, Math.round(base * 0.95))}-${Math.max(10, Math.round(base * 1.2))} həftə`;
  return `${Math.max(7, Math.round(base))}-${Math.max(9, Math.round(base * 1.2))} həftə`;
}

function updateJourney(projectType, quality, selectedAddons) {
  const active = selectedAddons.length > 0 || quality !== "standard" ? 3 : 2;
  stepIndicators.forEach((step, i) => step.classList.toggle("active", i + 1 <= active));
}

// ===== PRICE ANIMATION =====
let prevPriceValue = 0;
let priceAnimFrame = null;

function animatePrice(newValue) {
  const startValue = prevPriceValue;
  const startTime  = performance.now();
  const duration   = 520;
  const diff       = Math.abs(newValue - startValue);

  if (priceAnimFrame) cancelAnimationFrame(priceAnimFrame);

  // Flash on significant change
  if (diff > startValue * 0.04 && startValue > 0) {
    priceNode.classList.remove("is-flashing");
    void priceNode.offsetWidth;
    priceNode.classList.add("is-flashing");
  }

  function step(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 4);
    const current  = Math.round(startValue + (newValue - startValue) * eased);
    priceNode.textContent = formatCurrency(current);
    if (progress < 1) {
      priceAnimFrame = requestAnimationFrame(step);
    } else {
      prevPriceValue = newValue;
      priceNode.textContent = formatCurrency(newValue);
    }
  }
  priceAnimFrame = requestAnimationFrame(step);
}

// ===== DONUT CHART =====
const CIRC = 2 * Math.PI * 45; // ~282.74

function updateDonut(base, quality, timeline, addons) {
  const total = base + quality + timeline + addons;
  if (total <= 0) return;

  const segs = [
    { id: "segBase",     value: base },
    { id: "segQuality",  value: quality },
    { id: "segTimeline", value: timeline },
    { id: "segAddons",   value: addons },
  ];

  let accumulated = 0;
  segs.forEach(({ id, value }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const len = (value / total) * CIRC;
    el.style.strokeDasharray  = `${len} ${CIRC}`;
    el.style.strokeDashoffset = `${-accumulated}`;
    accumulated += len;
  });
}

// ===== MAIN CALCULATION =====
function calculateEstimate() {
  const data         = new FormData(form);
  const projectType  = data.get("projectType");
  const propertyType = data.get("propertyType");
  const quality      = data.get("quality");
  const timeline     = data.get("timeline");
  const area         = Math.max(20, Number(data.get("area")) || 0);
  const selectedAddons = data.getAll("addons");

  const baseRate     = pricing[projectType][propertyType];
  const baseCost     = area * baseRate;
  const qualityCost  = baseCost * (qualityMultiplier[quality] - 1);
  const timelineCost = (baseCost + qualityCost) * (timelineMultiplier[timeline] - 1);

  const addonItems = selectedAddons.map((key) => {
    const addon = addonRates[key];
    const cost  = addon.type === "percent"
      ? (baseCost + qualityCost + timelineCost) * addon.value
      : area * addon.value;
    return { label: addon.label, cost };
  });

  const addonsTotal = addonItems.reduce((s, a) => s + a.cost, 0);
  const total       = baseCost + qualityCost + timelineCost + addonsTotal;
  const pkg         = getProjectPackage(total);
  const readiness   = Math.min(96, 45 + selectedAddons.length * 8 + (quality !== "standard" ? 10 : 0));

  // Animate price
  animatePrice(total);

  // Update float CTA
  const floatPrice = document.getElementById("floatPrice");
  if (floatPrice) floatPrice.textContent = formatCurrency(total);

  summaryNode.textContent = `${area} m² ${labels[propertyType]} üçün ${labels[quality]} materiallı ${labels[projectType]} — ${labels[timeline]}.`;
  recommendedPackageNode.textContent = pkg;
  estimatedDurationNode.textContent  = getTimelineCopy(projectType, timeline, area);
  readinessNode.textContent = selectedAddons.length > 0 ? "Detallı smeta hazırdır" : "İlkin smeta hazırdır";
  readinessBarNode.style.width = `${readiness}%`;

  // Breakdown
  breakdownNode.innerHTML = "";
  breakdownNode.appendChild(createBreakdownItem("Baza işlər", baseCost));
  if (qualityCost > 0)  breakdownNode.appendChild(createBreakdownItem("Material fərqi", qualityCost));
  if (timelineCost > 0) breakdownNode.appendChild(createBreakdownItem("İcra sürəti əlavəsi", timelineCost));
  addonItems.forEach(({ label, cost }) => breakdownNode.appendChild(createBreakdownItem(label, cost)));
  if (addonItems.length === 0) breakdownNode.appendChild(createBreakdownItem("Əlavə xidmət seçilməyib", 0));

  // Donut + journey + cards
  updateDonut(baseCost, qualityCost, timelineCost, addonsTotal);
  updateJourney(projectType, quality, selectedAddons);
  updateSelectedCards();
}

function applyPreset(presetKey) {
  const preset = presets[presetKey];
  if (!preset) return;

  form.querySelectorAll('input[name="projectType"]').forEach((i) => { i.checked = i.value === preset.projectType; });
  form.querySelectorAll('input[name="quality"]').forEach((i) => { i.checked = i.value === preset.quality; });
  document.querySelector("#propertyType").value = preset.propertyType;
  document.querySelector("#timeline").value      = preset.timeline;
  areaInput.value = preset.area;
  syncArea(areaInput);
  form.querySelectorAll('input[name="addons"]').forEach((i) => { i.checked = preset.addons.includes(i.value); });

  updatePresetState(presetKey);
  calculateEstimate();
}

function handleServiceFilter(event) {
  const filter = event.currentTarget.dataset.serviceFilter;
  serviceChips.forEach((c) => c.classList.toggle("active", c === event.currentTarget));
  serviceCards.forEach((card) => {
    const matches = filter === "all" || card.dataset.serviceType === filter;
    card.classList.toggle("is-hidden", !matches);
  });
}

// ===== EVENT LISTENERS (calculator) =====
areaInput.addEventListener("input", () => { syncArea(areaInput); calculateEstimate(); });
areaRange.addEventListener("input", () => { syncArea(areaRange); calculateEstimate(); });
form.addEventListener("input", calculateEstimate);
serviceChips.forEach((c) => c.addEventListener("click", handleServiceFilter));
presetChips.forEach((c) => c.addEventListener("click", () => applyPreset(c.dataset.preset)));

// ===== PACKAGE PRESET BUTTONS =====
document.querySelectorAll("[data-apply-preset]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const key = btn.dataset.applyPreset;
    if (presets[key]) {
      applyPreset(key);
      // Update preset chips if matching
      updatePresetState(key);
    }
  });
});

// ===== TOAST =====
function showToast(message) {
  const toast     = document.getElementById("toast");
  const toastText = document.getElementById("toastText");
  if (!toast || !toastText) return;
  toastText.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("visible"), 3500);
}

// ===== LEAD DELIVERY =====
const COMPANY_WHATSAPP_NUMBER = "994505552211";

function getSelectedAddonsCopy(data) {
  const selected = data.getAll("addons");
  if (!selected.length) return "Seçilməyib";
  return selected.map((key) => addonRates[key]?.label || key).join(", ");
}

function collectLeadPayload() {
  const estimateData = new FormData(form);
  const contactNote = document.getElementById("cNote").value.trim();

  return {
    name: document.getElementById("cName").value.trim(),
    phone: document.getElementById("cPhone").value.trim(),
    note: contactNote || "Qeyd yoxdur",
    estimate: {
      price: priceNode.textContent.trim(),
      summary: summaryNode.textContent.trim(),
      package: recommendedPackageNode.textContent.trim(),
      duration: estimatedDurationNode.textContent.trim(),
      projectType: labels[estimateData.get("projectType")],
      propertyType: labels[estimateData.get("propertyType")],
      quality: labels[estimateData.get("quality")],
      timeline: labels[estimateData.get("timeline")],
      area: `${estimateData.get("area")} m²`,
      addons: getSelectedAddonsCopy(estimateData),
    },
    source: window.location.href,
    createdAt: new Date().toISOString(),
  };
}

function buildLeadMessage(payload) {
  return [
    "Yeni AZTOWERS müraciəti",
    "",
    `Ad: ${payload.name}`,
    `Telefon: ${payload.phone}`,
    `Qeyd: ${payload.note}`,
    "",
    "Smeta:",
    `Qiymət: ${payload.estimate.price}`,
    `Layihə: ${payload.estimate.summary}`,
    `Paket: ${payload.estimate.package}`,
    `Müddət: ${payload.estimate.duration}`,
    `Tip: ${payload.estimate.projectType}`,
    `Obyekt: ${payload.estimate.propertyType}`,
    `Keyfiyyət: ${payload.estimate.quality}`,
    `İcra: ${payload.estimate.timeline}`,
    `Sahə: ${payload.estimate.area}`,
    `Əlavələr: ${payload.estimate.addons}`,
  ].join("\n");
}

function openWhatsAppLead(payload) {
  const message = encodeURIComponent(buildLeadMessage(payload));
  window.open(`https://wa.me/${COMPANY_WHATSAPP_NUMBER}?text=${message}`, "_blank", "noopener,noreferrer");
}

async function sendLeadToBot(payload) {
  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Bot endpoint cavab vermədi.");
  }
  return result;
}

// ===== CONTACT FORM =====
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name  = document.getElementById("cName").value.trim();
    const phone = document.getElementById("cPhone").value.trim();
    if (!name || !phone) {
      showToast("Zəhmət olmasa ad və telefon nömrəsini doldurun.");
      return;
    }

    const payload = collectLeadPayload();
    const btn = document.getElementById("contactSubmitBtn");
    openWhatsAppLead(payload);
    btn.textContent  = "Göndərilir...";
    btn.disabled = true;

    try {
      const result = await sendLeadToBot(payload);
      btn.textContent  = "Göndərildi ✓";
      btn.style.background  = "linear-gradient(135deg,#34c878,#2a9e5f)";
      btn.style.boxShadow   = "0 16px 34px rgba(52,200,120,0.28)";
      showToast(result.telegramConfigured
        ? "Müraciət WhatsApp və Telegram botuna göndərildi."
        : "WhatsApp açıldı, müraciət lokal saxlandı. Telegram üçün .env ayarı lazımdır.");
      setTimeout(() => {
        contactForm.reset();
        btn.textContent   = "Müraciət göndər";
        btn.style.background  = "";
        btn.style.boxShadow   = "";
        btn.disabled = false;
      }, 3200);
    } catch (error) {
      btn.textContent = "Müraciət göndər";
      btn.disabled = false;
      showToast("WhatsApp açıldı, amma bot üçün server/env ayarı lazımdır.");
      console.error(error);
    }
  });
}

// ===== SCROLL PROGRESS + FLOAT CTA =====
const scrollBarEl = document.getElementById("scrollBar");
const floatCta    = document.getElementById("floatCta");
const heroSection = document.querySelector(".hero");
const calculatorSection = document.querySelector(".calculator-section");
let calculatorInView = false;

window.addEventListener("scroll", () => {
  const scrolled   = window.scrollY;
  const maxScroll  = document.documentElement.scrollHeight - window.innerHeight;
  if (scrollBarEl) scrollBarEl.style.width = maxScroll > 0 ? (scrolled / maxScroll * 100) + "%" : "0%";
  if (floatCta && heroSection) {
    const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
    floatCta.classList.toggle("visible", scrolled > heroBottom - 80 && !calculatorInView);
  }
}, { passive: true });

if (calculatorSection && floatCta) {
  const calculatorObserver = new IntersectionObserver((entries) => {
    const [entry] = entries;
    calculatorInView = entry.isIntersecting;
    if (calculatorInView) {
      floatCta.classList.remove("visible");
    }
  }, { threshold: 0.2 });

  calculatorObserver.observe(calculatorSection);
}

// ===== REVEAL ANIMATIONS =====
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) {
      target.classList.add("is-revealed");
      revealObserver.unobserve(target);
    }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -36px 0px" });

document.querySelectorAll(".reveal-item").forEach((el) => revealObserver.observe(el));

// ===== SECTION MOTION (video-inspired) =====
const motionTargets = [
  [".hero-copy", "from-left motion-panel"],
  [".hero-panel", "from-right motion-panel"],
  [".calculator-copy", "from-left"],
  [".calculator-card", "from-right motion-panel"],
  [".package-card", "motion-panel"],
  [".feature-card", "motion-panel"],
  [".steps article", ""],
  [".faq-list details", "motion-panel"],
  [".contact-box", "from-right motion-panel"],
];

motionTargets.forEach(([selector, classes]) => {
  document.querySelectorAll(selector).forEach((el) => {
    el.classList.add("scroll-animate");
    if (classes) classes.split(" ").filter(Boolean).forEach((name) => el.classList.add(name));
  });
});

const clipRevealSelectors = [
  ".hero-copy .eyebrow",
  ".hero-copy h1",
  ".calculator-copy .eyebrow",
  ".calculator-copy h2",
  ".section-head .eyebrow",
  ".section-head h2",
  ".contact-info-col .eyebrow",
  ".contact-info-col h2",
  ".contact-form-title",
];

clipRevealSelectors.forEach((selector) => {
  document.querySelectorAll(selector).forEach((el, index) => {
    el.classList.add("scroll-animate", "clip-reveal");
    el.style.setProperty("--delay", `${index * 40}ms`);
  });
});

const staggerGroups = [
  [".hero-metrics li", "from-left", 90],
  [".timeline > div", "from-right", 100],
  [".floating-gallery .floating-card", "from-right", 120],
  [".hero-mini-grid .mini-card", "from-right", 100],
  [".service-switch .chip", "", 60],
  [".journey-step", "from-left", 90],
  [".form-section", "from-right", 110],
  [".insight-row > div", "", 90],
  [".contact-cards > div", "from-left", 90],
  [".contact-form .field", "from-right", 85],
  [".contact-form .button", "from-right", 140],
];

staggerGroups.forEach(([selector, direction, step]) => {
  document.querySelectorAll(selector).forEach((el, index) => {
    el.classList.add("scroll-animate");
    if (direction) el.classList.add(direction);
    el.style.setProperty("--delay", `${index * step}ms`);
  });
});

const motionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      motionObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.04, rootMargin: "0px 0px -40px 0px" });

document.querySelectorAll(".scroll-animate").forEach((el) => motionObserver.observe(el));

document.querySelectorAll(".scroll-animate").forEach((el) => {
  const rect = el.getBoundingClientRect();
  if (rect.top < window.innerHeight * 0.95) {
    el.classList.add("is-visible");
    motionObserver.unobserve(el);
  }
});

// ===== ANIMATED COUNTERS =====
function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const suffix   = el.dataset.suffix || "";
  const duration = 1400;
  const start    = performance.now();

  (function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  })(start);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) {
      animateCounter(target);
      counterObserver.unobserve(target);
    }
  });
}, { threshold: 0.6 });

document.querySelectorAll("[data-target]").forEach((el) => counterObserver.observe(el));

// ===== QUICK CALC WIDGET =====
let qcType = "renovation";
const qcRates = { renovation: 320, construction: 620 };

function updateQuickCalc() {
  const area     = parseInt(document.getElementById("qcArea").value, 10);
  const estimate = area * qcRates[qcType];
  document.getElementById("qcAreaLabel").textContent = area + " m²";
  document.getElementById("qcPrice").textContent     = formatCurrency(estimate);
}

document.querySelectorAll(".qc-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".qc-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    qcType = btn.dataset.qcType;
    updateQuickCalc();
  });
});

const qcAreaEl = document.getElementById("qcArea");
if (qcAreaEl) {
  qcAreaEl.addEventListener("input", updateQuickCalc);
  updateQuickCalc();
}

// ===== PARALLAX =====
const parallaxItems = [
  { el: document.querySelector(".hero-blob"), speed: 0.08 },
  { el: document.querySelector(".hero-panel"), speed: 0.035 },
  { el: document.querySelector(".calculator-card"), speed: 0.03 },
];

let parallaxTicking = false;

function updateParallax() {
  const scrollY = window.scrollY;
  parallaxItems.forEach(({ el, speed }) => {
    if (!el) return;
    const offset = Math.max(-18, Math.min(28, scrollY * speed));
    el.style.setProperty("--parallax-y", `${offset}px`);
  });
  parallaxTicking = false;
}

window.addEventListener("scroll", () => {
  if (!parallaxTicking) {
    requestAnimationFrame(updateParallax);
    parallaxTicking = true;
  }
}, { passive: true });

// ===== FLOATING GALLERY MOTION =====
const floatingGallery = document.querySelector(".floating-gallery");
if (floatingGallery) {
  const floatingCards = [...floatingGallery.querySelectorAll(".floating-card")];

  floatingGallery.addEventListener("pointermove", (event) => {
    const rect = floatingGallery.getBoundingClientRect();
    const relX = (event.clientX - rect.left) / rect.width - 0.5;
    const relY = (event.clientY - rect.top) / rect.height - 0.5;

    floatingCards.forEach((card, index) => {
      const depth = index + 1;
      card.style.setProperty("--hover-x", `${relX * depth * 10}px`);
      card.style.setProperty("--hover-y", `${relY * depth * 8}px`);
      card.style.setProperty("--hover-r", `${relX * depth * 1.8}deg`);
    });
  });

  floatingGallery.addEventListener("pointerleave", () => {
    floatingCards.forEach((card) => {
      card.style.setProperty("--hover-x", "0px");
      card.style.setProperty("--hover-y", "0px");
      card.style.setProperty("--hover-r", "0deg");
    });
  });
}

// ===== INIT =====
syncArea(areaInput);
applyPreset("family-home");
updateParallax();
