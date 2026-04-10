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
     Honors the sticky header height so target sections never
     end up hidden underneath it. Falls back gracefully on
     browsers without CSS scroll-behavior.
  */
  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var hash = this.getAttribute('href');
        if (!hash || hash === '#') return;
        var target = document.querySelector(hash);
        if (!target) return;
        e.preventDefault();
        var header = document.querySelector('.site-header');
        var headerOffset = header ? header.offsetHeight : 0;
        var top = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: top, behavior: 'smooth' });
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

    // Scroll a specific slide into view
    function scrollToSlide(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      currentIndex = index;
      slides[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      currentEl.textContent = index + 1;
    }

    // Detect which slide is most visible after user scrolls
    var scrollTimer;
    track.addEventListener('scroll', function () {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var trackLeft = track.scrollLeft;
        var closest = 0;
        var closestDist = Infinity;
        for (var i = 0; i < slides.length; i++) {
          var dist = Math.abs(slides[i].offsetLeft - trackLeft);
          if (dist < closestDist) {
            closestDist = dist;
            closest = i;
          }
        }
        currentIndex = closest;
        currentEl.textContent = closest + 1;
      }, 80);
    }, { passive: true });

    prevBtn.addEventListener('click', function () { scrollToSlide(currentIndex - 1); });
    nextBtn.addEventListener('click', function () { scrollToSlide(currentIndex + 1); });

    // Keyboard navigation
    carousel.setAttribute('tabindex', '0');
    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { scrollToSlide(currentIndex - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { scrollToSlide(currentIndex + 1); e.preventDefault(); }
    });

    // ── Per-slide image gallery (dot nav) ──
    slides.forEach(function (slide) {
      var imagesAttr = slide.getAttribute('data-images');
      if (!imagesAttr) return;
      var images = imagesAttr.split(',');
      if (images.length <= 1) return;

      var imgEl = slide.querySelector('.load-slide__img-wrap img');
      var dots = Array.from(slide.querySelectorAll('.load-slide__dot'));

      dots.forEach(function (dot, i) {
        dot.addEventListener('click', function (e) {
          e.stopPropagation();
          imgEl.style.opacity = '0';
          setTimeout(function () {
            imgEl.src = images[i];
            imgEl.style.opacity = '1';
          }, 150);
          dots.forEach(function (d) { d.classList.remove('is-active'); });
          dot.classList.add('is-active');
        });
      });
    });

    // Initial counter
    currentEl.textContent = '1';
  }


  /* ── "THIS IS HOW WE ROLL" — scroll-linked horizontal text ──
     Each .roll__row moves horizontally as the user scrolls.
     Rows with data-roll-dir="1" move right, "-1" moves left.
     Uses lerp for buttery-smooth motion + translate3d for GPU.
  */
  function initRollScroll() {
    var section = document.querySelector('.roll');
    if (!section) return;

    var rows = section.querySelectorAll('.roll__row');
    if (!rows.length) return;

    // State per row
    var state = [];
    for (var i = 0; i < rows.length; i++) {
      var dir = parseInt(rows[i].getAttribute('data-roll-dir'), 10) || 1;
      state.push({
        el: rows[i],
        dir: dir,
        currentX: 0,
        targetX: 0
      });
    }

    var lerpFactor = 0.1;
    var isRunning = false;
    var baseSpeed = 800; // px of horizontal travel over full scroll

    function updateTargets() {
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight;
      var sectionH = section.offsetHeight;

      // progress: 0 when section bottom enters viewport, 1 when section top leaves
      var totalTravel = sectionH + vh;
      var scrolled = vh - rect.top;
      var progress = Math.max(0, Math.min(1, scrolled / totalTravel));

      // Center progress around 0.5 so movement goes both directions from center
      var centered = (progress - 0.5) * 2; // -1 to 1

      for (var i = 0; i < state.length; i++) {
        // Offset each row slightly for visual variety
        var rowOffset = (i - 1) * 0.15;
        state[i].targetX = (centered + rowOffset) * baseSpeed * state[i].dir;
      }
    }

    function tick() {
      var stillMoving = false;

      for (var i = 0; i < state.length; i++) {
        var s = state[i];
        var diff = s.targetX - s.currentX;

        if (Math.abs(diff) < 0.3) {
          s.currentX = s.targetX;
        } else {
          s.currentX += diff * lerpFactor;
          stillMoving = true;
        }

        s.el.style.transform = 'translate3d(' + s.currentX + 'px, 0, 0)';
      }

      if (stillMoving) {
        requestAnimationFrame(tick);
      } else {
        isRunning = false;
      }
    }

    function startLoop() {
      if (!isRunning) {
        isRunning = true;
        requestAnimationFrame(tick);
      }
    }

    function onScroll() {
      updateTargets();
      startLoop();
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Set initial position immediately
    updateTargets();
    for (var i = 0; i < state.length; i++) {
      state[i].currentX = state[i].targetX;
      state[i].el.style.transform = 'translate3d(' + state[i].currentX + 'px, 0, 0)';
    }
  }


  /* ── BEFORE / AFTER SLIDER ──
     Interactive comparison slider: drag or touch to reveal
     before/after images. Uses pointer events for unified
     mouse + touch handling.
  */
  function initBeforeAfter() {
    var sliders = document.querySelectorAll('.ba-slider');
    if (!sliders.length) return;

    sliders.forEach(function (slider) {
      var beforeWrap = slider.querySelector('.ba-slider__before');
      var handle = slider.querySelector('.ba-slider__handle');
      if (!beforeWrap || !handle) return;

      var isDragging = false;
      var position = 50; // percentage

      function setPosition(pct) {
        pct = Math.max(2, Math.min(98, pct));
        position = pct;
        beforeWrap.style.width = pct + '%';
        handle.style.left = pct + '%';
        // Set CSS custom property for before image width
        slider.style.setProperty('--ba-slider-width', slider.offsetWidth + 'px');
      }

      function getPercentage(e) {
        var rect = slider.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        return ((clientX - rect.left) / rect.width) * 100;
      }

      // Pointer down
      slider.addEventListener('mousedown', function (e) {
        e.preventDefault();
        isDragging = true;
        slider.classList.add('is-dragging');
        setPosition(getPercentage(e));
      });

      slider.addEventListener('touchstart', function (e) {
        isDragging = true;
        slider.classList.add('is-dragging');
        setPosition(getPercentage(e));
      }, { passive: true });

      // Pointer move (on document for smooth dragging outside element)
      document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        e.preventDefault();
        setPosition(getPercentage(e));
      });

      document.addEventListener('touchmove', function (e) {
        if (!isDragging) return;
        setPosition(getPercentage(e));
      }, { passive: true });

      // Pointer up
      function stopDrag() {
        if (isDragging) {
          isDragging = false;
          slider.classList.remove('is-dragging');
        }
      }

      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);

      // Set initial position and image width
      setPosition(50);

      // Update image width on resize
      window.addEventListener('resize', function () {
        slider.style.setProperty('--ba-slider-width', slider.offsetWidth + 'px');
      });
    });
  }


  /* ── INIT ── */
  function init() {
    initReveal();
    initParallax();
    initSmoothAnchors();
    initLoadsCarousel();
    initRollScroll();
    initBeforeAfter();
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
