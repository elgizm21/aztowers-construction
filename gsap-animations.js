// AZTOWERS — GSAP + ScrollTrigger Animasiyalar
(function () {
  'use strict';
  if (typeof gsap === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  // ── 1. Navbar: yuxarıdan aşağı süzülmə (y: -80 → 0) ──────────────
  gsap.from('.site-header', {
    y: -80,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
    clearProps: 'transform,opacity'
  });

  // ── 2. Hero: sətir-sətir staggered animasiya ──────────────────────
  const heroEls = [
    '.hero-copy .eyebrow',
    '.hero-copy .hero-badge',
    '.hero-copy h1',
    '.hero-copy .hero-text',
    '.hero-copy .hero-actions',
    '.hero-copy .trust-strip',
    '.hero-copy .hero-metrics'
  ].map(sel => document.querySelector(sel)).filter(Boolean);

  if (heroEls.length) {
    gsap.from(heroEls, {
      opacity: 0,
      y: 36,
      duration: 0.78,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.15,
      clearProps: 'transform,opacity'
    });
  }

  // Hero sağ tərəf — kart + floating cards
  gsap.from('.hero-card.primary-surface', {
    opacity: 0,
    y: 30,
    duration: 0.9,
    ease: 'power3.out',
    delay: 0.3,
    clearProps: 'transform,opacity'
  });

  gsap.from('.floating-card', {
    opacity: 0,
    scale: 0.88,
    y: 26,
    duration: 0.85,
    stagger: 0.13,
    ease: 'back.out(1.3)',
    delay: 0.55,
    clearProps: 'transform,opacity'
  });

  gsap.from('.hero-mini-grid .mini-card', {
    opacity: 0,
    y: 22,
    duration: 0.72,
    stagger: 0.1,
    ease: 'power3.out',
    delay: 0.75,
    clearProps: 'transform,opacity'
  });

  // ── 3. Scroll reveal — data-reveal elementlər ─────────────────────
  // Eyni görünüş sahəsindəki elementlər bir batch kimi animasiya olur
  ScrollTrigger.batch('[data-reveal]', {
    onEnter: batch => {
      gsap.from(batch, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        stagger: 0.13,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      });
    },
    start: 'top 85%',
    once: true
  });

  // ── 4. Kart hover: scale + border rəng dəyişməsi ──────────────────
  document.querySelectorAll('.info-card, .package-card, .feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      gsap.to(card, {
        scale: 1.03,
        duration: 0.26,
        ease: 'power2.out',
        overwrite: 'auto'
      });
      card.classList.add('card-hovered');
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, {
        scale: 1,
        duration: 0.32,
        ease: 'power2.inOut',
        overwrite: 'auto'
      });
      card.classList.remove('card-hovered');
    });
  });

  // ── 5. Naviqasiya keçidi: overlay animasiyası ─────────────────────
  // (animations.js tərəfindən yaradılmış overlay-i istifadə edirik)
  const overlay = document.querySelector('.page-transition-overlay');
  if (overlay) {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', function (e) {
        const id = this.getAttribute('href').slice(1);
        if (!id || id === 'top') return;
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        overlay.classList.add('slide-in');
        overlay.classList.remove('slide-out');
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'instant' });
          overlay.classList.add('slide-out');
          overlay.classList.remove('slide-in');
          setTimeout(() => overlay.classList.remove('slide-out'), 600);
        }, 450);
      });
    });
  }

  // ── 6. Aktiv nav link indicator ───────────────────────────────────
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections  = Array.from(document.querySelectorAll('section[id]'));

  function updateActiveNav() {
    const sy = window.scrollY + 110;
    let current = '';
    sections.forEach(s => { if (sy >= s.offsetTop) current = s.id; });
    navLinks.forEach(a => {
      a.classList.toggle('nav-active', a.getAttribute('href').slice(1) === current);
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

})();