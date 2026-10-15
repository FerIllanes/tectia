/* =========================================================
   TECTIA — Interacciones
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initScrollSpy();
  initProductFilters();
  initDatasheetButtons();
  initCalculator();
  initContactForm();

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});

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

  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
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
      if (active) link.setAttribute('aria-current', 'page');
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

/* ---------- Filtros del catálogo ---------- */
function initProductFilters() {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.product-card');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.toggle('is-active', b === btn));

      const filter = btn.dataset.filter;
      cards.forEach((card) => {
        const visible = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !visible);
      });
    });
  });
}

/* ---------- Botones "Ficha PDF" ---------- */
function initDatasheetButtons() {
  document.querySelectorAll('[data-datasheet]').forEach((btn) => {
    btn.addEventListener('click', () => {
      alert(`Descargando Ficha Técnica ASTM de ${btn.dataset.datasheet}...`);
    });
  });
}

/* ---------- Cotizador de materiales ---------- */
function initCalculator() {
  const form = document.getElementById('calculatorForm');
  const range = document.getElementById('calcMetros');
  if (!form || !range) return;

  const out = {
    metros: document.getElementById('calcMetrosVal'),
    total: document.getElementById('estLitros'),
    baldes: document.getElementById('estBaldes'),
    capas: document.getElementById('estCapas'),
  };

  const RENDIMIENTO = 1.8;   // kg/m²
  const IMPRIMACION = 0.2;   // kg/m²
  const BALDE_KG = 20;

  const update = () => {
    const m = parseInt(range.value, 10);
    const total = Math.round(m * RENDIMIENTO);
    const baldes = Math.ceil(total / BALDE_KG);
    const primer = Math.round(m * IMPRIMACION);
    const pure = total - primer;

    out.metros.textContent = `${m.toLocaleString('es-CL')} m²`;
    out.total.textContent = `${total.toLocaleString('es-CL')} kg`;
    out.baldes.textContent = `(aprox. ${baldes} baldes de ${BALDE_KG} Kg)`;
    out.capas.innerHTML = `1 Mano Imprimación (${primer} kg)<br>+ 2 Manos Poliuretano (${pure} kg)`;
  };

  range.addEventListener('input', update);
  form.addEventListener('submit', (e) => e.preventDefault());
  update();
}

/* ---------- Formulario de contacto ---------- */
function initContactForm() {
  const form = document.getElementById('generalContactForm');
  const feedback = document.getElementById('contactFeedback');
  if (!form || !feedback) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    feedback.hidden = false;
    form.reset();
  });
}
