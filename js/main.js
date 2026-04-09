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


  /* ── LOADS CAROUSEL ──
     Horizontal carousel with:
     - Prev/next navigation buttons
     - Per-slide image gallery (dot navigation)
     - Touch/swipe support (pointer events)
     - Counter display
  */
  function initLoadsCarousel() {
    var carousel = document.querySelector('.loads-carousel');
    if (!carousel) return;

    var track = carousel.querySelector('.loads-carousel__track');
    var slides = Array.from(track.querySelectorAll('.load-slide'));
    var prevBtn = carousel.querySelector('.loads-carousel__btn--prev');
    var nextBtn = carousel.querySelector('.loads-carousel__btn--next');
    var currentEl = carousel.querySelector('.loads-carousel__current');
    var totalEl = carousel.querySelector('.loads-carousel__total');
    var currentIndex = 0;

    totalEl.textContent = slides.length;

    function getSlideWidth() {
      if (!slides.length) return 0;
      return slides[0].getBoundingClientRect().width;
    }

    function goTo(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      currentIndex = index;
      var offset = -index * getSlideWidth();
      track.style.transform = 'translateX(' + offset + 'px)';
      currentEl.textContent = index + 1;
    }

    prevBtn.addEventListener('click', function () { goTo(currentIndex - 1); });
    nextBtn.addEventListener('click', function () { goTo(currentIndex + 1); });

    // Keyboard navigation
    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { goTo(currentIndex - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { goTo(currentIndex + 1); e.preventDefault(); }
    });

    // Recalculate on resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { goTo(currentIndex); }, 100);
    });

    // ── Touch/swipe support ──
    var startX = 0;
    var currentX = 0;
    var isDragging = false;

    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      isDragging = true;
      startX = e.clientX;
      currentX = startX;
      track.classList.add('is-dragging');
      track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointermove', function (e) {
      if (!isDragging) return;
      currentX = e.clientX;
      var diff = currentX - startX;
      var base = -currentIndex * getSlideWidth();
      track.style.transform = 'translateX(' + (base + diff) + 'px)';
    });

    track.addEventListener('pointerup', function (e) {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove('is-dragging');
      var diff = currentX - startX;
      var threshold = getSlideWidth() * 0.2;
      if (diff < -threshold) { goTo(currentIndex + 1); }
      else if (diff > threshold) { goTo(currentIndex - 1); }
      else { goTo(currentIndex); }
    });

    track.addEventListener('pointercancel', function () {
      isDragging = false;
      track.classList.remove('is-dragging');
      goTo(currentIndex);
    });

    // Prevent image drag interference
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    // ── Per-slide image gallery (dot nav) ──
    slides.forEach(function (slide) {
      var imagesAttr = slide.getAttribute('data-images');
      if (!imagesAttr) return;
      var images = imagesAttr.split(',');
      if (images.length <= 1) return;

      var imgEl = slide.querySelector('.load-slide__img-wrap img');
      var dots = Array.from(slide.querySelectorAll('.load-slide__dot'));
      var imgIndex = 0;

      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          imgIndex = i;
          imgEl.style.opacity = '0';
          setTimeout(function () {
            imgEl.src = images[imgIndex];
            imgEl.style.opacity = '1';
          }, 150);
          dots.forEach(function (d) { d.classList.remove('is-active'); });
          dot.classList.add('is-active');
        });
      });
    });

    // Initial position
    goTo(0);
  }


  /* ── INIT ── */
  function init() {
    initReveal();
    initParallax();
    initTicker();
    initSmoothAnchors();
    initLoadsCarousel();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
