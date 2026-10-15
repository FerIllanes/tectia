/* =========================================================
   TECTIA — Interacciones
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileMenu();
  initScrollSpy();
  initReveal();
  initProductFilters();
  initDatasheetButtons();
  initQuoteButtons();
  initCalculator();
  initContactForm();

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});

const fmt = (n) => n.toLocaleString('es-CL');

/* ---------- Header con sombra al hacer scroll ---------- */
function initHeaderScroll() {
  const header = document.getElementById('header');
  if (!header) return;
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ---------- Menú móvil ---------- */
function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  if (!toggle || !nav) return;

  const icon = toggle.querySelector('.material-symbols-outlined');

  const setOpen = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    icon.textContent = open ? 'close' : 'menu';
  };
  const isOpen = () => nav.classList.contains('is-open');

  toggle.addEventListener('click', () => setOpen(!isOpen()));
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (isOpen() && !nav.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
  });
}

/* ---------- Resaltar sección activa en el menú ---------- */
function initScrollSpy() {
  const links = document.querySelectorAll('.nav__link');
  const sections = [...links]
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach((link) => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach((section) => observer.observe(section));
}

/* ---------- Aparición suave al hacer scroll ---------- */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  document.documentElement.classList.add('js-reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  items.forEach((el) => observer.observe(el));
}

/* ---------- Filtros del catálogo ---------- */
function initProductFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.product-card');
  const count = document.getElementById('productCount');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', String(active));
      });

      const filter = btn.dataset.filter;
      let shown = 0;
      cards.forEach((card) => {
        const visible = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !visible);
        if (visible) shown += 1;
      });

      if (count) {
        const scope = filter === 'all' ? '' : ` de ${btn.textContent.trim()}`;
        count.textContent = `Mostrando ${shown} ${shown === 1 ? 'producto' : 'productos'}${scope}`;
      }
    });
  });
}

/* ---------- Toast ---------- */
let toastTimer;
function showToast(message, icon = 'download') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.querySelector('.toast__text').textContent = message;
  toast.querySelector('.material-symbols-outlined').textContent = icon;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => { toast.hidden = true; }, 250);
  }, 3500);
}

/* ---------- Botones "Ficha PDF" ---------- */
function initDatasheetButtons() {
  document.querySelectorAll('[data-datasheet]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast(`Preparando ficha técnica ASTM de ${btn.dataset.datasheet}…`);
    });
  });
}

/* ---------- Prellenar consulta desde el catálogo / cotizador ---------- */
function prefillContact(message) {
  const field = document.getElementById('contactMessage');
  if (!field) return;
  field.value = message;
  field.dispatchEvent(new Event('input'));
  document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
  // Enfocar el primer campo vacío para que el usuario siga completando
  const firstEmpty = [...document.querySelectorAll('#generalContactForm .input')].find((el) => !el.value);
  setTimeout(() => (firstEmpty || field).focus({ preventScroll: true }), 400);
}

function initQuoteButtons() {
  document.querySelectorAll('[data-quote]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      prefillContact(`Hola, quiero cotizar ${btn.dataset.quote}. Superficie aproximada: ___ m². Ubicación de la obra: ___.`);
    });
  });
}

/* ---------- Cotizador de materiales ---------- */
// Consumos referenciales tomados de las fichas del catálogo (punto medio del rango).
const CALC_PRODUCTS = {
  polyflex: { name: 'Poliuretano', kgPerCoat: 0.9, coats: 2, warranty: 10 },
  acryltech: { name: 'Acrílico Fibrado', kgPerCoat: 0.75, coats: 2, warranty: 7 },
  thermoshield: { name: 'ThermoShield', kgPerCoat: 0.675, coats: 2, warranty: 10 },
};

// Imprimación (kg/m²) y factor por absorción / rugosidad del sustrato.
const CALC_SUBSTRATES = {
  losa: { primer: 0.3, factor: 1 },
  chapa: { primer: 0.15, factor: 0.9 },
  asfalto: { primer: 0.25, factor: 1.1 },
  balcon: { primer: 0.2, factor: 0.95 },
};

const CALC_WASTE = 1.05;
const BALDE_KG = 20;

function initCalculator() {
  const form = document.getElementById('calculatorForm');
  const range = document.getElementById('calcMetros');
  const num = document.getElementById('calcMetrosNum');
  const product = document.getElementById('calcProduct');
  const substrate = document.getElementById('calcSustrato');
  if (!form || !range || !num) return;

  const out = {
    total: document.getElementById('estLitros'),
    baldes: document.getElementById('estBaldes'),
    capas: document.getElementById('estCapas'),
    garantia: document.getElementById('estGarantia'),
  };

  const min = Number(range.min);
  const max = Number(range.max);
  let last = {};

  const paintTrack = () => {
    const pct = ((range.value - min) / (max - min)) * 100;
    range.style.setProperty('--fill', `${pct}%`);
  };

  const update = () => {
    const m = Math.min(max, Math.max(min, Number(num.value) || min));
    const p = CALC_PRODUCTS[product.value] || CALC_PRODUCTS.polyflex;
    const s = CALC_SUBSTRATES[substrate.value] || CALC_SUBSTRATES.losa;

    const primer = Math.round(m * s.primer * CALC_WASTE);
    const membrane = Math.round(m * p.kgPerCoat * p.coats * s.factor * CALC_WASTE);
    const total = primer + membrane;
    const baldes = Math.ceil(membrane / BALDE_KG);

    out.total.textContent = `${fmt(total)} kg`;
    out.baldes.textContent = `(≈ ${baldes} baldes de ${BALDE_KG} kg + imprimación)`;
    out.capas.innerHTML = `1 mano Imprimación (${fmt(primer)} kg)<br>+ ${p.coats} manos ${p.name} (${fmt(membrane)} kg)`;
    out.garantia.textContent = `${p.warranty} Años de Garantía`;

    last = {
      m,
      total,
      baldes,
      product: product.options[product.selectedIndex].text,
      substrate: substrate.options[substrate.selectedIndex].text,
    };
  };

  range.addEventListener('input', () => {
    num.value = range.value;
    paintTrack();
    update();
  });
  num.addEventListener('input', () => {
    if (num.value === '') return;
    range.value = num.value;
    paintTrack();
    update();
  });
  num.addEventListener('blur', () => {
    const clamped = Math.min(max, Math.max(min, Number(num.value) || min));
    num.value = clamped;
    range.value = clamped;
    paintTrack();
    update();
  });
  product.addEventListener('change', update);
  substrate.addEventListener('change', update);
  form.addEventListener('submit', (e) => e.preventDefault());

  document.getElementById('calcToContact')?.addEventListener('click', () => {
    prefillContact(
      `Hola, quiero cotizar ${last.product} para ${fmt(last.m)} m² sobre ${last.substrate}. ` +
      `El cotizador online estimó ${fmt(last.total)} kg en total (≈ ${last.baldes} baldes). Ubicación de la obra: ___.`
    );
  });

  paintTrack();
  update();
}

/* ---------- Formulario de contacto ---------- */
const CONTACT_ERRORS = {
  valueMissing: 'Este campo es obligatorio.',
  typeMismatch: 'Ingresa un correo válido, por ejemplo nombre@empresa.com.',
  patternMismatch: 'Ingresa un teléfono válido (mínimo 8 dígitos).',
};

function initContactForm() {
  const form = document.getElementById('generalContactForm');
  const feedback = document.getElementById('contactFeedback');
  const submit = document.getElementById('contactSubmit');
  if (!form || !feedback) return;

  const phone = document.getElementById('contactPhone');
  if (phone) phone.pattern = '\\+?[\\d\\s\\-\\(\\)]{8,}';

  const fields = [...form.querySelectorAll('.input')];

  const errorFor = (input) => {
    let el = input.parentElement.querySelector('.field__error');
    if (!el) {
      el = document.createElement('p');
      el.className = 'field__error';
      el.id = `${input.id}-error`;
      input.parentElement.appendChild(el);
    }
    return el;
  };

  const validate = (input) => {
    const v = input.validity;
    const key = Object.keys(CONTACT_ERRORS).find((k) => v[k]);
    const msg = key ? CONTACT_ERRORS[key] : '';
    const el = errorFor(input);
    el.textContent = msg;
    input.classList.toggle('is-invalid', !!msg);
    if (msg) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', el.id);
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
    return !msg;
  };

  fields.forEach((input) => {
    input.addEventListener('blur', () => { if (input.value) validate(input); });
    input.addEventListener('input', () => { if (input.classList.contains('is-invalid')) validate(input); });
    input.addEventListener('change', () => { if (input.classList.contains('is-invalid')) validate(input); });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const invalid = fields.filter((input) => !validate(input));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }

    const icon = submit.querySelector('.material-symbols-outlined');
    submit.disabled = true;
    submit.classList.add('is-loading');
    icon.textContent = 'progress_activity';
    feedback.hidden = true;

    // Simulación de envío (sin backend todavía)
    setTimeout(() => {
      submit.disabled = false;
      submit.classList.remove('is-loading');
      icon.textContent = 'send';
      form.reset();
      feedback.hidden = false;
      feedback.focus();
    }, 900);
  });
}
