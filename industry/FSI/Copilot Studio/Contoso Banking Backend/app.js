/* ===================================================
   Contoso Bank FAQ — app.js
   =================================================== */

(function () {
  'use strict';

  // ---- Reading progress bar ----
  const progressBar = document.createElement('div');
  progressBar.className = 'reading-progress';
  document.body.prepend(progressBar);

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  }

  // ---- Accordion ----
  function initAccordion() {
    document.querySelectorAll('.faq-question').forEach(btn => {
      // Wrap answer text into inner div for padding animation
      const answerEl = btn.nextElementSibling;
      if (answerEl && answerEl.classList.contains('faq-answer')) {
        // Check if inner div wrapper exists, if not wrap
        if (!answerEl.querySelector('div')) {
          const inner = document.createElement('div');
          inner.innerHTML = answerEl.innerHTML;
          answerEl.innerHTML = '';
          answerEl.appendChild(inner);
        }
      }

      btn.addEventListener('click', function () {
        const item = this.closest('.faq-item');
        const isOpen = item.classList.contains('open');

        // Close all others in same section (optional: comment out for multi-open)
        const section = item.closest('.faq-section');
        if (section) {
          section.querySelectorAll('.faq-item.open').forEach(openItem => {
            if (openItem !== item) {
              openItem.classList.remove('open');
              openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            }
          });
        }

        // Toggle current
        item.classList.toggle('open', !isOpen);
        this.setAttribute('aria-expanded', String(!isOpen));

        // Smooth scroll into view if opening and partially out of viewport
        if (!isOpen) {
          setTimeout(() => {
            const rect = item.getBoundingClientRect();
            if (rect.top < 100) {
              item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }, 50);
        }
      });
    });
  }

  // ---- Search ----
  let searchTimeout = null;

  function normalizeText(str) {
    return str.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function stripHTML(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  function highlightText(container, term) {
    if (!term) return;
    const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walk.nextNode()) nodes.push(walk.currentNode);

    const re = new RegExp('(' + escapeRegex(term) + ')', 'gi');
    nodes.forEach(node => {
      if (!re.test(node.nodeValue)) return;
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let last = 0;
      let m;
      while ((m = re.exec(node.nodeValue)) !== null) {
        frag.appendChild(document.createTextNode(node.nodeValue.slice(last, m.index)));
        const mark = document.createElement('mark');
        mark.textContent = m[0];
        frag.appendChild(mark);
        last = m.index + m[0].length;
      }
      frag.appendChild(document.createTextNode(node.nodeValue.slice(last)));
      node.parentNode.replaceChild(frag, node);
    });
  }

  function removeHighlights(container) {
    container.querySelectorAll('mark').forEach(mark => {
      const parent = mark.parentNode;
      parent.replaceChild(document.createTextNode(mark.textContent), mark);
      parent.normalize();
    });
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function runSearch(term) {
    const sections = document.querySelectorAll('.faq-section');
    const noResults = document.getElementById('noResults');
    const trimmed = term.trim();
    const norm = normalizeText(trimmed);

    // Remove highlights first
    document.querySelectorAll('.faq-item').forEach(item => {
      removeHighlights(item.querySelector('.faq-question'));
      const answer = item.querySelector('.faq-answer');
      if (answer) removeHighlights(answer);
    });

    if (!norm) {
      // Reset everything
      sections.forEach(s => s.classList.remove('hidden'));
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('hidden'));
      noResults.style.display = 'none';
      return;
    }

    let totalVisible = 0;

    sections.forEach(section => {
      const items = section.querySelectorAll('.faq-item');
      let sectionVisible = 0;

      items.forEach(item => {
        const qText = normalizeText(stripHTML(item.querySelector('.faq-question').innerHTML));
        const aEl = item.querySelector('.faq-answer');
        const aText = aEl ? normalizeText(stripHTML(aEl.innerHTML)) : '';

        if (qText.includes(norm) || aText.includes(norm)) {
          item.classList.remove('hidden');
          sectionVisible++;
          totalVisible++;

          // Highlight matches
          highlightText(item.querySelector('.faq-question'), trimmed);
          if (aEl) highlightText(aEl, trimmed);

          // Auto-open if searching
          item.classList.add('open');
          item.querySelector('.faq-question').setAttribute('aria-expanded', 'true');
        } else {
          item.classList.add('hidden');
          item.classList.remove('open');
          item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });

      section.classList.toggle('hidden', sectionVisible === 0);
    });

    noResults.style.display = totalVisible === 0 ? 'block' : 'none';
  }

  function initSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    input.addEventListener('input', function () {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => runSearch(this.value), 220);
    });

    // Keyboard shortcut ⌘K / Ctrl+K
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        input.focus();
        input.select();
      }
      if (e.key === 'Escape' && document.activeElement === input) {
        input.value = '';
        runSearch('');
        input.blur();
      }
    });
  }

  // ---- Category pills ----
  function initPills() {
    const pills = document.querySelectorAll('.pill');
    pills.forEach(pill => {
      pill.addEventListener('click', function () {
        pills.forEach(p => p.classList.remove('active'));
        this.classList.add('active');

        const target = this.dataset.target;
        const section = document.getElementById(target);
        if (section) {
          // Clear search when navigating
          const input = document.getElementById('searchInput');
          if (input && input.value) {
            input.value = '';
            runSearch('');
          }
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ---- Active sidebar link on scroll ----
  function initScrollSpy() {
    const sections = document.querySelectorAll('.faq-section[id]');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const pills = document.querySelectorAll('.pill');

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;

            sidebarLinks.forEach(link => {
              link.classList.toggle('active', link.dataset.section === id);
            });
            pills.forEach(pill => {
              pill.classList.toggle('active', pill.dataset.target === id);
            });
          }
        });
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    );

    sections.forEach(s => observer.observe(s));
  }

  // ---- Mobile hamburger ----
  function initMobileNav() {
    const btn = document.getElementById('hamburgerBtn');
    if (!btn) return;

    // Build mobile nav
    const mobileNav = document.createElement('nav');
    mobileNav.className = 'mobile-nav';
    mobileNav.innerHTML = `
      <a href="#" class="nav-link">Home</a>
      <a href="#" class="nav-link">About</a>
      <a href="#" class="nav-link active">Help Center</a>
      <a href="#" class="nav-link">Contact</a>
      <a href="api-docs.html" class="nav-link">API Docs</a>
      <a href="#" class="btn-nav">Open Account</a>
    `;
    document.querySelector('.site-header').after(mobileNav);

    btn.addEventListener('click', function () {
      const isOpen = mobileNav.classList.toggle('open');
      this.setAttribute('aria-expanded', String(isOpen));
      // Animate hamburger → X
      const spans = this.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'translateY(7px) rotate(45deg)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!btn.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('open');
        const spans = btn.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
  }

  // ---- Sidebar smooth scroll ----
  function initSidebarLinks() {
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const id = this.dataset.section;
        const section = document.getElementById(id);
        if (section) {
          // Clear search
          const input = document.getElementById('searchInput');
          if (input && input.value) {
            input.value = '';
            runSearch('');
          }
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ---- Animate items on first view ----
  function initItemAnimation() {
    const items = document.querySelectorAll('.faq-item');
    if (!('IntersectionObserver' in window)) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    items.forEach((item, i) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(16px)';
      item.style.transition = `opacity 0.4s ease ${(i % 8) * 0.04}s, transform 0.4s ease ${(i % 8) * 0.04}s`;
      obs.observe(item);
    });
  }

  // ---- Tooltip for stat numbers ----
  function initStatTooltips() {
    const tooltips = [
      { el: null, text: '120+ help articles and FAQs' },
    ];
    // Basic hover tooltip can be handled by title attrs if desired
  }

  // ---- Header shadow on scroll ----
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    let ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          if (window.scrollY > 10) {
            header.style.boxShadow = '0 4px 32px rgba(0,0,0,0.5)';
          } else {
            header.style.boxShadow = '';
          }
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ---- Back to top (auto-inject button) ----
  function initBackToTop() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
    btn.style.cssText = `
      position: fixed; bottom: 28px; right: 28px; z-index: 500;
      width: 46px; height: 46px; border-radius: 50%;
      background: var(--accent); border: none; cursor: pointer;
      color: white; display: none; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(99,102,241,0.4);
      transition: opacity 0.3s, background 0.2s, transform 0.2s;
    `;

    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
      btn.style.display = window.scrollY > 400 ? 'flex' : 'none';
    });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'var(--accent-2)';
      btn.style.transform = 'translateY(-3px)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'var(--accent)';
      btn.style.transform = '';
    });
  }

  // ---- Result count badge ----
  function initResultBadge() {
    const input = document.getElementById('searchInput');
    if (!input) return;

    const badge = document.createElement('span');
    badge.style.cssText = `
      position: absolute; right: 70px; top: 50%;
      transform: translateY(-50%);
      background: var(--accent); color: white;
      border-radius: 99px; padding: 2px 9px;
      font-size: 0.75rem; font-weight: 600;
      display: none;
    `;
    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(badge);

    const origRunSearch = runSearch;
    // Override search to also update badge
    window._faqRunSearch = function (term) {
      origRunSearch(term);
      if (!term.trim()) {
        badge.style.display = 'none';
        return;
      }
      const visible = document.querySelectorAll('.faq-item:not(.hidden)').length;
      badge.textContent = visible + ' result' + (visible !== 1 ? 's' : '');
      badge.style.display = visible > 0 ? 'inline-block' : 'none';
    };
  }

  // ---- Theme toggle ----
  function initTheme() {
    const root = document.documentElement;
    const stored = localStorage.getItem('neobank-theme');

    // Apply saved preference, or respect OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'light') root.setAttribute('data-theme', 'light');

    const btn = document.getElementById('themeToggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      const isLight = root.getAttribute('data-theme') === 'light';
      if (isLight) {
        root.removeAttribute('data-theme');
        localStorage.setItem('neobank-theme', 'dark');
        btn.setAttribute('aria-label', 'Switch to light theme');
      } else {
        root.setAttribute('data-theme', 'light');
        localStorage.setItem('neobank-theme', 'light');
        btn.setAttribute('aria-label', 'Switch to dark theme');
      }
    });
  }

  // ---- Init all ----
  function init() {
    initTheme();
    initAccordion();
    initSearch();
    initPills();
    initScrollSpy();
    initMobileNav();
    initSidebarLinks();
    initItemAnimation();
    initHeaderScroll();
    initBackToTop();
    initResultBadge();

    // Re-wire search to use badge version
    const input = document.getElementById('searchInput');
    if (input && window._faqRunSearch) {
      input.addEventListener('input', function () {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => window._faqRunSearch(this.value), 220);
      });
    }

    // Open first item in each section by default (optional UX)
    // document.querySelectorAll('.faq-section').forEach(section => {
    //   const first = section.querySelector('.faq-item');
    //   if (first) { first.classList.add('open'); first.querySelector('.faq-question').setAttribute('aria-expanded','true'); }
    // });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

