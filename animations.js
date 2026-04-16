

// ===== AZTOWERS ANIMATIONS (əlavə edildi) =====
(function initAnimations() {

  // --- CSS stilləri ---
  const style = document.createElement('style');
  style.id = 'az-animations';
  style.textContent = `
    .page-transition-overlay {
      position: fixed; inset: 0; z-index: 9999; pointer-events: none;
      background: linear-gradient(135deg, #35383d 0%, #2f3237 100%);
      clip-path: inset(0 0 100% 0);
      transition: clip-path 0.55s cubic-bezier(0.76, 0, 0.24, 1);
    }
    .page-transition-overlay.slide-in { clip-path: inset(0 0 0% 0); }
    .page-transition-overlay.slide-out {
      clip-path: inset(100% 0 0% 0);
      transition: clip-path 0.45s cubic-bezier(0.76, 0, 0.24, 1) 0.1s;
    }
    .nav-links a { position: relative; overflow: hidden; }
    .nav-links a::after {
      content: ''; position: absolute; bottom: 4px; left: 50%;
      transform: translateX(-50%) scaleX(0); width: 16px; height: 2px;
      border-radius: 2px; background: var(--accent);
      transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .nav-links a.nav-active::after, .nav-links a:hover::after {
      transform: translateX(-50%) scaleX(1);
    }
    .sa-item {
      --sa-delay: 0ms; opacity: 0;
      transform: translateY(40px) scale(0.97); filter: blur(4px);
      transition:
        opacity   0.7s cubic-bezier(0.22,1,0.36,1) var(--sa-delay),
        transform 0.8s cubic-bezier(0.22,1,0.36,1) var(--sa-delay),
        filter    0.7s cubic-bezier(0.22,1,0.36,1) var(--sa-delay);
    }
    .sa-item.sa-left  { transform: translateX(-50px) translateY(20px) scale(0.97); }
    .sa-item.sa-right { transform: translateX(50px) translateY(20px) scale(0.97); }
    .sa-item.sa-visible { opacity: 1; transform: none; filter: blur(0); }
    .sa-clip {
      --sa-delay: 0ms; opacity: 1;
      clip-path: inset(0 100% 0 0 round 4px); transform: translateY(12px);
      transition:
        clip-path 0.85s cubic-bezier(0.22,1,0.36,1) var(--sa-delay),
        transform 0.85s cubic-bezier(0.22,1,0.36,1) var(--sa-delay);
    }
    .sa-clip.sa-visible { clip-path: inset(0 0% 0 0 round 4px); transform: translateY(0); }
    .sa-panel { position: relative; overflow: hidden; }
    .sa-panel::after {
      content: ''; position: absolute; inset: -20%; pointer-events: none; opacity: 0;
      background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
      transform: translateX(-130%) skewX(-18deg);
    }
    .sa-panel.sa-visible::after { animation: sa-sheen 1.2s cubic-bezier(0.22,1,0.36,1) both; }
    @keyframes sa-sheen {
      0%   { opacity: 0; transform: translateX(-130%) skewX(-18deg); }
      20%  { opacity: 0.18; }
      100% { opacity: 0; transform: translateX(130%) skewX(-18deg); }
    }
    @media (prefers-reduced-motion: reduce) {
      .sa-item, .sa-clip { transition: opacity 200ms ease !important; transform: none !important; filter: none !important; }
      .sa-panel::after { animation: none !important; }
    }
  `;
  document.head.appendChild(style);

  // --- Keçid overlay ---
  const overlay = document.createElement('div');
  overlay.className = 'page-transition-overlay';
  document.body.appendChild(overlay);

  // --- Animasiya classları tətbiq et ---
  const mainBlocks = [
    ['.hero-copy',        ['sa-item','sa-left','sa-panel'],  0],
    ['.hero-panel',       ['sa-item','sa-right','sa-panel'], 100],
    ['.calculator-copy',  ['sa-item','sa-left'],             0],
    ['.calculator-card',  ['sa-item','sa-right','sa-panel'], 80],
    ['.contact-info-col', ['sa-item','sa-left','sa-panel'],  0],
    ['.contact-form',     ['sa-item','sa-right','sa-panel'], 100],
  ];
  mainBlocks.forEach(([sel, cls, delay]) => {
    document.querySelectorAll(sel).forEach(el => {
      el.classList.add(...cls);
      el.style.setProperty('--sa-delay', delay + 'ms');
    });
  });

  const staggerGroups = [
    ['.info-card',           ['sa-item'],              80],
    ['.package-card',        ['sa-item','sa-panel'],  100],
    ['.feature-card',        ['sa-item','sa-panel'],   90],
    ['.steps article',       ['sa-item','sa-left'],   100],
    ['.faq-list details',    ['sa-item','sa-panel'],   80],
    ['.hero-metrics li',     ['sa-item','sa-left'],    90],
    ['.timeline > div',      ['sa-item','sa-right'],  100],
    ['.mini-card',           ['sa-item','sa-right'],  100],
    ['.contact-cards > div', ['sa-item','sa-left'],    80],
    ['.contact-form .field', ['sa-item','sa-right'],   80],
    ['.journey-step',        ['sa-item','sa-left'],    90],
  ];
  staggerGroups.forEach(([sel, cls, step]) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add(...cls);
      el.style.setProperty('--sa-delay', (i * step) + 'ms');
    });
  });

  const clipSelectors = [
    '.hero-copy h1', '.hero-copy .eyebrow',
    '.section-head h2', '.section-head .eyebrow',
    '.calculator-copy h2', '.calculator-copy .eyebrow',
    '.contact-info-col h2', '.contact-info-col .eyebrow',
    '.contact-form-title',
  ];
  clipSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('sa-clip');
      el.style.setProperty('--sa-delay', (i * 60) + 'ms');
    });
  });

  // --- IntersectionObserver ---
  const saObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('sa-visible');
        saObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.sa-item, .sa-clip').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
      el.classList.add('sa-visible');
    } else {
      saObserver.observe(el);
    }
  });

  // --- Naviqasiya link keçid animasiyası ---
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href').slice(1);
      if (!targetId || targetId === 'top') return;
      const target = document.getElementById(targetId);
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

  // --- Aktiv nav link göstəricisi ---
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
  const sections  = Array.from(document.querySelectorAll('section[id]'));
  function updateActiveNav() {
    const sy = window.scrollY + 100;
    let current = '';
    sections.forEach(s => { if (sy >= s.offsetTop) current = s.id; });
    navLinks.forEach(a => {
      a.classList.toggle('nav-active', a.getAttribute('href').slice(1) === current);
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

})();