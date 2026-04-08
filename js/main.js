/* ============================================================
   MILIVA INC — MAIN JS
   Scroll-reveal observer, parallax, ticker, utility helpers.
   Vanilla JS — no dependencies.
   ============================================================ */

(function () {
  'use strict';

  /* ── SCROLL-REVEAL (IntersectionObserver) ──
     Adds .is-visible to any element with .reveal when it
     enters the viewport. Threshold = 15% visible.
  */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    // Skip if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // animate once
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    els.forEach(function (el) { observer.observe(el); });
  }


  /* ── PARALLAX ──
     Translates .parallax-bg elements based on scroll offset.
     Uses requestAnimationFrame for smooth 60fps performance.
     Only active on desktop (>768px) to save mobile battery.
  */
  function initParallax() {
    var sections = document.querySelectorAll('[data-parallax]');
    if (!sections.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var ticking = false;

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          // Only run parallax on wider viewports
          if (window.innerWidth > 768) {
            sections.forEach(function (section) {
              var rect = section.getBoundingClientRect();
              var speed = parseFloat(section.dataset.parallax) || 0.3;
              var bg = section.querySelector('.parallax-bg');
              if (bg && rect.bottom > 0 && rect.top < window.innerHeight) {
                var offset = rect.top * speed;
                bg.style.transform = 'translateY(' + offset + 'px)';
              }
            });
          }
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial position
  }


  /* ── TICKER DUPLICATION ──
     Duplicates .ticker-track children so the infinite scroll
     appears seamless. The CSS animation moves by -50%.
  */
  function initTicker() {
    var track = document.querySelector('.ticker-track');
    if (!track) return;

    // Clone all children and append (doubles the content)
    var items = Array.from(track.children);
    items.forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
  }


  /* ── SMOOTH SCROLL FOR ANCHOR LINKS ──
     (fallback for browsers without CSS scroll-behavior)
  */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }


  /* ── INIT ── */
  function init() {
    initReveal();
    initParallax();
    initTicker();
    initSmoothAnchors();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
