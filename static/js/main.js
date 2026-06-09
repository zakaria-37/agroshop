// ═══════════════════════════════════════════════════════════
//  AgroShop — AgroTel Main UI  |  Cinematic Animations v2.0
// ═══════════════════════════════════════════════════════════

/* ── TOAST ────────────────────────────────────────────────── */
let _toastTimer;
function showToast(msg, type = 'success') {
  let toast = document.getElementById('globalToast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'globalToast'; document.body.appendChild(toast); }
  clearTimeout(_toastTimer);
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${msg}`;
  toast.classList.add('show');
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

/* ── MOBILE MENU ──────────────────────────────────────────── */
function toggleMobileMenu() {
  document.getElementById('mobileMenu')?.classList.toggle('open');
  document.getElementById('hamburger')?.classList.toggle('open');
}

/* ── NAVBAR SCROLL ────────────────────────────────────────── */
window.addEventListener('scroll', () => {
  document.getElementById('mainNav')?.classList.toggle('scrolled', window.scrollY > 60);
  const btn = document.getElementById('scrollTop');
  if (btn) btn.classList.toggle('visible', window.scrollY > 300);
}, { passive: true });

/* ── SCROLL TO TOP ────────────────────────────────────────── */
function initScrollTop() {
  const btn = document.createElement('button');
  btn.id = 'scrollTop';
  btn.innerHTML = '<div class="ping"></div><i class="fa fa-chevron-up"></i>';
  btn.title = 'Retour en haut';
  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(btn);
}

/* ── PAGE TRANSITION ──────────────────────────────────────── */
function initPageTransition() {
  const overlay = document.createElement('div');
  overlay.id = 'pageTransition';
  const bar = document.createElement('div');
  bar.className = 'page-transition-bar';
  overlay.appendChild(bar);
  document.body.appendChild(overlay);

  // Animate out on load
  requestAnimationFrame(() => {
    overlay.classList.add('leaving');
    setTimeout(() => overlay.style.display = 'none', 500);
  });

  // Animate in on link click
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript') || link.target === '_blank') return;
    if (link.hostname && link.hostname !== location.hostname) return;
    e.preventDefault();
    overlay.style.display = 'block';
    bar.style.width = '0';
    requestAnimationFrame(() => {
      overlay.classList.remove('leaving');
      overlay.classList.add('entering');
      setTimeout(() => { bar.style.width = '100%'; }, 50);
      setTimeout(() => { window.location.href = href; }, 420);
    });
  });
}

/* ── MATRIX RAIN BACKGROUND ───────────────────────────────── */
function initMatrixRain() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const matrixBg = document.createElement('div');
  matrixBg.className = 'matrix-bg';
  const canvas = document.createElement('canvas');
  matrixBg.appendChild(canvas);
  hero.insertBefore(matrixBg, hero.firstChild);

  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const chars = 'アイウエオカキクケコABCDEF012389█▓▒░⌬⌭⌮⚡ψΩ∞≈';
  const fontSize = 14;
  let columns = Math.floor(canvas.width / fontSize);
  const drops = Array.from({ length: columns }, () => Math.random() * -50);

  function draw() {
    ctx.fillStyle = 'rgba(4,13,7,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2ecc71';
    ctx.font = fontSize + 'px Share Tech Mono, monospace';

    columns = Math.floor(canvas.width / fontSize);
    while (drops.length < columns) drops.push(0);

    for (let i = 0; i < columns; i++) {
      const char = chars[Math.floor(Math.random() * chars.length)];
      ctx.globalAlpha = 0.15 + Math.random() * 0.5;
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    ctx.globalAlpha = 1;
  }
  setInterval(draw, 55);
}

/* ── PARTICLES ────────────────────────────────────────────── */
function createParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    const type = Math.random();
    if (type > 0.7) {
      // Lines
      p.style.cssText = `position:absolute;width:${25+Math.random()*80}px;height:1px;background:linear-gradient(90deg,transparent,rgba(46,204,113,${0.08+Math.random()*0.2}),transparent);left:${Math.random()*100}%;top:${Math.random()*100}%;animation:float ${8+Math.random()*10}s ease-in-out infinite;animation-delay:${Math.random()*6}s;transform:rotate(${Math.random()*360}deg);pointer-events:none;`;
    } else if (type > 0.4) {
      // Dots with glow
      const s = 2 + Math.random() * 5;
      p.style.cssText = `position:absolute;width:${s}px;height:${s}px;background:rgba(46,204,113,${0.08+Math.random()*0.18});border-radius:50%;left:${Math.random()*100}%;top:${Math.random()*100}%;animation:float ${7+Math.random()*9}s ease-in-out infinite;animation-delay:${Math.random()*6}s;box-shadow:0 0 ${4+Math.random()*10}px rgba(46,204,113,0.25);pointer-events:none;`;
    } else {
      // Hexagon-like shapes
      const s = 4 + Math.random() * 8;
      p.style.cssText = `position:absolute;width:${s}px;height:${s}px;border:1px solid rgba(46,204,113,${0.1+Math.random()*0.15});left:${Math.random()*100}%;top:${Math.random()*100}%;animation:float ${9+Math.random()*8}s ease-in-out infinite;animation-delay:${Math.random()*6}s;transform:rotate(${Math.random()*360}deg);pointer-events:none;`;
    }
    container.appendChild(p);
  }
}

/* ── AURORA ELEMENT ───────────────────────────────────────── */
function initAurora() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const aurora = document.createElement('div');
  aurora.className = 'hero-aurora';
  hero.insertBefore(aurora, hero.firstChild);

  // Scan line
  const scanline = document.createElement('div');
  scanline.className = 'hero-scanline';
  hero.appendChild(scanline);
}

/* ── TYPING EFFECT ────────────────────────────────────────── */
function initTypingEffect() {
  const el = document.querySelector('.hero-highlight');
  if (!el) return;
  const text = el.textContent.trim();
  el.textContent = '';
  el.style.borderRight = '2px solid var(--green-neon)';
  el.style.animation = 'underscore-blink 1s step-end infinite';
  let i = 0;
  const type = () => {
    if (i < text.length) {
      el.textContent += text[i++];
      setTimeout(type, 45 + Math.random() * 55);
    } else {
      setTimeout(() => {
        el.style.borderRight = 'none';
        el.style.animation = 'none';
      }, 1000);
    }
  };
  setTimeout(type, 800);
}

/* ── COUNTER ANIMATION ────────────────────────────────────── */
function animateCounters() {
  document.querySelectorAll('.stat strong').forEach(el => {
    const raw = el.textContent;
    const suffix = raw.replace(/[0-9.]/g, '');
    const target = parseFloat(raw);
    if (isNaN(target)) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(15px)';
    el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
      let v = 0, start = null;
      const duration = 1800;
      const animate = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // cubic ease-out
        v = target * ease;
        el.textContent = (Number.isInteger(target) ? Math.floor(v) : v.toFixed(1)) + suffix;
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, 500);
  });
}

/* ── INTERSECTION REVEAL ──────────────────────────────────── */
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = (idx % 6) * 80;
      const type = el.dataset.reveal || 'up';
      setTimeout(() => {
        el.style.opacity    = '1';
        el.style.transform  = 'translateY(0) rotateX(0) scale(1) rotate(0)';
        el.style.filter     = 'blur(0)';
      }, delay);
      obs.unobserve(el);
    });
  }, { threshold: 0.06, rootMargin: '0px 0px -20px 0px' });

  document.querySelectorAll('.product-card, .category-card, .testimonial-card, .feature-item').forEach((el, i) => {
    el.style.opacity    = '0';
    el.style.transform  = i % 3 === 0 ? 'translateY(40px) rotateX(6deg)' : i % 3 === 1 ? 'translateY(30px) scale(0.95)' : 'translateY(35px) rotate(-1deg)';
    el.style.filter     = 'blur(3px)';
    el.style.transition = 'opacity 0.65s ease, transform 0.65s cubic-bezier(0.34,1.2,0.64,1), filter 0.5s ease';
    obs.observe(el);
  });
}

/* ── SECTION HEADER REVEAL ────────────────────────────────── */
function initSectionReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.style.opacity   = '1';
      el.style.transform = 'translateY(0)';
      el.style.filter    = 'blur(0)';
      obs.unobserve(el);
    });
  }, { threshold: 0.2 });
  document.querySelectorAll('.section-header').forEach(el => {
    el.style.cssText += 'opacity:0;transform:translateY(25px);filter:blur(4px);transition:opacity 0.7s ease,transform 0.7s cubic-bezier(0.34,1.2,0.64,1),filter 0.6s ease;';
    obs.observe(el);
  });
}

/* ── LOGO LETTER GLOW WAVE ────────────────────────────────── */
function initLogoGlitch() {
  const logoName = document.querySelector('.logo-name');
  if (!logoName) return;

  // Split each part (AGRO / SHOP) into individual letter spans
  logoName.querySelectorAll('span').forEach(part => {
    const letters = part.textContent.split('');
    part.textContent = '';
    letters.forEach(ch => {
      const span = document.createElement('span');
      span.textContent = ch;
      span.style.cssText =
        'display:inline-block;' +
        'transition:color 0.25s ease,text-shadow 0.25s ease,transform 0.3s cubic-bezier(0.34,1.56,0.64,1);';
      part.appendChild(span);
    });
  });

  const allLetters = logoName.querySelectorAll('span span');

  logoName.addEventListener('mouseenter', () => {
    allLetters.forEach((span, i) => {
      const isAgro = span.closest('.agro') !== null;
      setTimeout(() => {
        span.style.color       = isAgro ? '#00ff88' : '#ffffff';
        span.style.textShadow  = isAgro
          ? '0 0 8px #2ecc71, 0 0 22px rgba(46,204,113,0.8)'
          : '0 0 8px #fff, 0 0 18px rgba(255,255,255,0.5)';
        span.style.transform   = 'translateY(-4px) scale(1.15)';
        setTimeout(() => {
          span.style.color      = '';
          span.style.textShadow = '';
          span.style.transform  = '';
        }, 380);
      }, i * 60);
    });
  });
}

/* ── CURSOR TRAIL ─────────────────────────────────────────── */
function initCursorTrail() {
  if (window.matchMedia('(pointer:coarse)').matches) return;
  const trail = [];
  const COUNT = 10;
  for (let i = 0; i < COUNT; i++) {
    const d = document.createElement('div');
    const size = 4 + i * 0.8;
    d.style.cssText = `position:fixed;pointer-events:none;z-index:9997;width:${size}px;height:${size}px;border-radius:50%;background:rgba(46,204,113,${0.5-i*0.05});transform:translate(-50%,-50%);opacity:0;transition:opacity 0.3s;`;
    document.body.appendChild(d);
    trail.push({ el: d, x: 0, y: 0 });
  }
  let mx = 0, my = 0;
  const xs = Array(COUNT).fill(0), ys = Array(COUNT).fill(0);
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    trail.forEach(t => t.el.style.opacity = '1');
  });
  document.addEventListener('mouseleave', () => trail.forEach(t => t.el.style.opacity = '0'));

  // Magnetic effect for buttons
  document.querySelectorAll('.btn-hero-primary, .btn-hero-secondary, .btn-promo').forEach(btn => {
    btn.classList.add('btn-magnetic');
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width * 100).toFixed(1);
      const py = ((e.clientY - r.top) / r.height * 100).toFixed(1);
      btn.style.setProperty('--mx', px + '%');
      btn.style.setProperty('--my', py + '%');
      const dx = (e.clientX - (r.left + r.width  / 2)) * 0.12;
      const dy = (e.clientY - (r.top  + r.height / 2)) * 0.12;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => btn.style.transform = '');
    btn.addEventListener('click', e => {
      const r = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'btn-ripple';
      const size = Math.max(r.width, r.height) * 2;
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size/2}px;top:${e.clientY - r.top - size/2}px;`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 700);
    });
  });

  const tick = () => {
    xs.unshift(mx); ys.unshift(my);
    if (xs.length > COUNT) { xs.pop(); ys.pop(); }
    trail.forEach((t, i) => {
      t.el.style.left = (xs[Math.min(i, xs.length - 1)] || 0) + 'px';
      t.el.style.top  = (ys[Math.min(i, ys.length - 1)] || 0) + 'px';
    });
    requestAnimationFrame(tick);
  };
  tick();
}

/* ── PROGRESS BAR ─────────────────────────────────────────── */
function initProgressBar() {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;height:3px;width:0%;z-index:99999;background:linear-gradient(90deg,#2ecc71,#00ff88,#00d4ff);transition:width 0.2s ease;box-shadow:0 0 10px rgba(46,204,113,0.8),0 0 4px rgba(0,212,255,0.5);';
  document.body.appendChild(bar);
  let w = 0;
  const grow = setInterval(() => {
    w = Math.min(w + Math.random() * 10, 85);
    bar.style.width = w + '%';
  }, 100);
  window.addEventListener('load', () => {
    clearInterval(grow);
    bar.style.width = '100%';
    setTimeout(() => { bar.style.opacity = '0'; bar.style.transition += ',opacity 0.5s'; }, 300);
    setTimeout(() => bar.remove(), 800);
  });
}

/* ── 3D CARD TILT ─────────────────────────────────────────── */
function initCardTilt() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.classList.add('neon-border-run');
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) scale(1.01)`;
      card.style.boxShadow = `
        ${-x * 20}px ${-y * 20}px 40px rgba(0,0,0,0.3),
        0 0 30px rgba(46,204,113,${0.1 + Math.abs(x + y) * 0.1}),
        inset 0 1px 0 rgba(46,204,113,0.15)
      `;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.boxShadow  = '';
    });
  });
}

/* ── CATEGORY CARD HOVER ──────────────────────────────────── */
function initCategoryCards() {
  document.querySelectorAll('.category-card').forEach(card => {
    // Add scan div
    if (!card.querySelector('.cat-scan')) {
      const scan = document.createElement('div');
      scan.className = 'cat-scan';
      card.appendChild(scan);
    }
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${-y * 5}deg) rotateY(${x * 5}deg)`;
    });
    card.addEventListener('mouseleave', () => card.style.transform = '');
  });
}

/* ── AUTO FADE FLASH ──────────────────────────────────────── */
function autoFadeFlash() {
  document.querySelectorAll('.flash-msg').forEach((msg, i) => {
    setTimeout(() => {
      msg.style.cssText += 'opacity:0;transform:translateX(110px);transition:all 0.45s ease;';
      setTimeout(() => msg.remove(), 450);
    }, 4000 + i * 350);
  });
}

/* ── GLITCH TITLES ────────────────────────────────────────── */
function initGlitchTitles() {
  document.querySelectorAll('.section-title[data-glitch]').forEach(el => {
    el.classList.add('glitch-wrap');
    el.dataset.text = el.textContent;
  });
}

/* ── TYPEWRITER FOR SECTION TITLES ───────────────────────── */
function initSectionTypewriter() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.typed) return;
      el.dataset.typed = '1';
      const original = el.textContent;
      el.textContent = '';
      let i = 0;
      const type = () => {
        if (i < original.length) {
          el.textContent += original[i++];
          setTimeout(type, 35 + Math.random() * 20);
        }
      };
      setTimeout(type, 200);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.section-badge').forEach(el => obs.observe(el));
}

/* ── NEON BORDER RUN ON BUTTONS ───────────────────────────── */
function initNeonButtons() {
  document.querySelectorAll('.btn-add-cart, .btn-outline-sm, .btn-primary-sm').forEach(btn => {
    btn.classList.add('neon-border-run');
  });
}

/* ── COUNTER WHEN IN VIEW ─────────────────────────────────── */
function initCountersOnView() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        obs.disconnect();
      }
    });
  }, { threshold: 0.3 });
  const statsEl = document.querySelector('.hero-stats');
  if (statsEl) obs.observe(statsEl);
}

/* ── PARALLAX HERO ────────────────────────────────────────── */
function initParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y > window.innerHeight) return;
    const particles = document.getElementById('heroParticles');
    const heroContent = hero.querySelector('.hero-content');
    const heroImage = hero.querySelector('.hero-image');
    if (particles)    particles.style.transform = `translateY(${y * 0.25}px)`;
    if (heroContent)  heroContent.style.transform = `translateY(${y * 0.12}px)`;
    if (heroImage)    heroImage.style.transform   = `translateY(${y * 0.08}px)`;
  }, { passive: true });
}

/* ── HOVER SOUND VISUAL FEEDBACK ─────────────────────────── */
function initHoverFeedback() {
  document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const flash = document.createElement('div');
      flash.style.cssText = 'position:absolute;inset:0;background:rgba(46,204,113,0.04);border-radius:inherit;pointer-events:none;z-index:0;animation:fadeIn 0.2s ease both;';
      card.style.position = 'relative';
      card.appendChild(flash);
      setTimeout(() => flash.remove(), 300);
    });
  });
}

/* ── SKELETON LOADER SIMULATION ───────────────────────────── */
function initSkeletonLoader() {
  // Show skeleton briefly for product cards that load from AJAX
  // This is a visual enhancement hook - actual skeleton shown if .skeleton class added
}

/* ── DATA STREAM IN TOPBAR ────────────────────────────────── */
function initDataStream() {
  const topbar = document.querySelector('.topbar .container');
  if (!topbar) return;
  const ticker = document.createElement('span');
  ticker.style.cssText = 'margin-left:auto;font-family:var(--font-mono);font-size:0.7rem;color:var(--green-neon);letter-spacing:1px;animation:neonFlicker 4s infinite;';

  const messages = [
    '● AGROTEL CONNECTED',
    '⚡ CAPTEURS ACTIFS: 24/24',
    '📡 SIGNAL: 98%',
    '🌱 MÉTÉO: OPTIMAL',
    '✓ SYSTÈME OPÉRATIONNEL'
  ];
  let msgIndex = 0;
  ticker.textContent = messages[0];
  // Remove existing last span
  const existing = topbar.querySelector('span:last-child');

  const cycle = () => {
    msgIndex = (msgIndex + 1) % messages.length;
    ticker.style.opacity = '0';
    ticker.style.transform = 'translateY(-8px)';
    ticker.style.transition = 'opacity 0.3s, transform 0.3s';
    setTimeout(() => {
      ticker.textContent = messages[msgIndex];
      ticker.style.opacity = '1';
      ticker.style.transform = 'translateY(0)';
    }, 350);
  };
  setInterval(cycle, 4000);
  if (existing && existing !== ticker) {
    existing.replaceWith(ticker);
  }
}

/* ── FEATURE ICONS STAGGER ────────────────────────────────── */
function initFeatureStagger() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const items = entry.target.querySelectorAll('.feature-item');
      items.forEach((item, i) => {
        setTimeout(() => {
          item.style.opacity = '1';
          item.style.transform = 'translateY(0)';
        }, i * 120);
      });
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.2 });

  const featuresBar = document.querySelector('.features-bar');
  if (featuresBar) {
    featuresBar.querySelectorAll('.feature-item').forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      item.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.2,0.64,1)';
    });
    obs.observe(featuresBar);
  }
}

/* ── KEYBOARD NAV ACCESSIBILITY ───────────────────────────── */
function initKeyboardNav() {
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('mobileMenu')?.classList.remove('open');
      document.getElementById('hamburger')?.classList.remove('open');
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   INIT — DOMContentLoaded
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initProgressBar();
  initPageTransition();
  initScrollTop();
  initAurora();
  initMatrixRain();
  createParticles();
  initTypingEffect();
  initCountersOnView();
  initReveal();
  initSectionReveal();
  initLogoGlitch();
  initCursorTrail();
  initGlitchTitles();
  initSectionTypewriter();
  initNeonButtons();
  initFeatureStagger();
  initParallax();
  initDataStream();
  initKeyboardNav();
  autoFadeFlash();

  setTimeout(() => {
    initCardTilt();
    initCategoryCards();
    initHoverFeedback();
  }, 300);
});