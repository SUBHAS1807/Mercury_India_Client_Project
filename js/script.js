/**
 * Mercury India Compliance — script.js
 * Vanilla JS: hamburger menu, smooth scroll, active nav,
 * scroll reveal, back-to-top, navbar scroll behaviour.
 */

'use strict';

/* ─── Global Configuration ─── */
const WHATSAPP_NUMBER  = "918604486033";
const WHATSAPP_MESSAGE = "Hello, I would like to know more about your services.";

/* ─── DOM refs ─── */
const hamburger   = document.getElementById('hamburger');
const mobileMenu  = document.getElementById('mobile-menu');
const navbar      = document.getElementById('navbar');
const siteHeader  = document.getElementById('site-header');
const backToTop   = document.getElementById('back-to-top');
const navLinks    = document.querySelectorAll('.nav-link');
const mobileLinks = document.querySelectorAll('.mobile-nav-link');
const allSections = document.querySelectorAll('section[id]');
const revealEls   = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

/* ═══════════════════════════════════════════
   1. HAMBURGER / MOBILE MENU
═══════════════════════════════════════════ */
function toggleMenu(force) {
  const isOpen = force !== undefined ? force : !hamburger.classList.contains('open');

  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));

  if (isOpen) {
    mobileMenu.classList.add('open');
    mobileMenu.removeAttribute('aria-hidden');
    document.body.style.overflow = 'hidden'; // lock body scroll
  } else {
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

hamburger.addEventListener('click', () => toggleMenu());

// Close menu when any mobile link is clicked
mobileLinks.forEach(link => {
  link.addEventListener('click', () => toggleMenu(false));
});

// Close menu on outside click
document.addEventListener('click', e => {
  if (
    mobileMenu.classList.contains('open') &&
    !mobileMenu.contains(e.target) &&
    !hamburger.contains(e.target)
  ) {
    toggleMenu(false);
  }
});

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
    toggleMenu(false);
    hamburger.focus();
  }
});


/* ═══════════════════════════════════════════
   2. SMOOTH SCROLLING (all anchor links)
═══════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();

    // Account for sticky header height
    const headerH = siteHeader.getBoundingClientRect().height;
    const targetY = target.getBoundingClientRect().top + window.scrollY - headerH - 8;

    window.scrollTo({ top: targetY, behavior: 'smooth' });
  });
});


/* ═══════════════════════════════════════════
   3. NAVBAR SCROLL BEHAVIOUR
═══════════════════════════════════════════ */
let lastScrollY = 0;

function handleNavbarScroll() {
  const scrollY = window.scrollY;

  // Add "scrolled" class for shadow
  navbar.classList.toggle('scrolled', scrollY > 60);

  lastScrollY = scrollY;
}

window.addEventListener('scroll', handleNavbarScroll, { passive: true });


/* ═══════════════════════════════════════════
   4. ACTIVE NAV LINK (IntersectionObserver)
═══════════════════════════════════════════ */
function setActiveLink(sectionId) {
  navLinks.forEach(link => {
    const match = link.getAttribute('data-section') === sectionId;
    link.classList.toggle('active', match);
  });
}

const sectionObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActiveLink(entry.target.id);
      }
    });
  },
  {
    rootMargin: '-40% 0px -55% 0px',
    threshold: 0,
  }
);

allSections.forEach(section => sectionObserver.observe(section));


/* ═══════════════════════════════════════════
   5. SCROLL REVEAL ANIMATIONS
═══════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target); // fire once only
      }
    });
  },
  {
    threshold: 0.12,
    rootMargin: '0px 0px -48px 0px',
  }
);

revealEls.forEach(el => revealObserver.observe(el));


/* ═══════════════════════════════════════════
   6. BACK TO TOP BUTTON
═══════════════════════════════════════════ */
function handleBackToTop() {
  backToTop.classList.toggle('visible', window.scrollY > 400);
}

window.addEventListener('scroll', handleBackToTop, { passive: true });

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});


/* ═══════════════════════════════════════════
   7. SERVICE CARD ENTRANCE ANIMATION
      (stagger via CSS delay already set;
       JS just triggers the class on load)
═══════════════════════════════════════════ */
// Already handled by revealObserver above — no extra JS needed.


/* ═══════════════════════════════════════════
   8. TESTIMONIAL CARD ENTRANCE
      (Same IntersectionObserver above covers it)
═══════════════════════════════════════════ */


/* ═══════════════════════════════════════════
   9. HERO SECTION — subtle parallax on scroll
═══════════════════════════════════════════ */
const heroImg = document.querySelector('.hero-img');

function heroParallax() {
  if (!heroImg) return;
  const scrolled = window.scrollY;
  if (scrolled < 600) {
    heroImg.style.transform = `translateY(${scrolled * 0.06}px)`;
  }
}

window.addEventListener('scroll', heroParallax, { passive: true });


/* ═══════════════════════════════════════════
   10. ICON STRIP — hover pulse
═══════════════════════════════════════════ */
document.querySelectorAll('.icon-strip-circle').forEach(circle => {
  circle.addEventListener('mouseenter', () => {
    circle.style.transition = 'all .3s cubic-bezier(.4,0,.2,1)';
  });
});


/* ═══════════════════════════════════════════
   12. SEARCHABLE COUNTRY DROPDOWN WIDGET
═══════════════════════════════════════════ */
function initCountryDropdown() {
  const nativeSelect = document.getElementById('country');
  const widget = document.getElementById('custom-country-widget');
  const triggerBtn = document.getElementById('country-trigger-btn');
  const labelSpan = document.getElementById('country-selected-label');
  const dropdownMenu = document.getElementById('country-dropdown-menu');
  const searchInput = document.getElementById('country-search-input');
  const optionsList = document.getElementById('country-options-list');

  if (!nativeSelect || !widget || !triggerBtn || !dropdownMenu || !optionsList) return;

  // Build list items from native select options
  function populateOptions(filterText = '') {
    optionsList.innerHTML = '';
    const query = filterText.toLowerCase().trim();
    let matchesCount = 0;

    Array.from(nativeSelect.options).forEach(opt => {
      if (!opt.value) return; // skip prompt
      const text = opt.text;
      const isMatch = !query || text.toLowerCase().includes(query);

      if (isMatch) {
        matchesCount++;
        const li = document.createElement('li');
        li.className = 'country-option-item';
        li.textContent = text;
        li.setAttribute('role', 'option');
        li.setAttribute('data-value', opt.value);

        if (opt.value === nativeSelect.value) {
          li.classList.add('selected');
          li.setAttribute('aria-selected', 'true');
        }

        li.addEventListener('click', () => {
          selectCountry(opt.value, text);
          closeDropdown();
          triggerBtn.focus();
        });

        optionsList.appendChild(li);
      }
    });

    if (matchesCount === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'country-option-item';
      emptyLi.style.color = '#94a3b8';
      emptyLi.style.cursor = 'default';
      emptyLi.textContent = 'No matching countries found';
      optionsList.appendChild(emptyLi);
    }
  }

  function selectCountry(val, text) {
    nativeSelect.value = val;
    labelSpan.textContent = text;
    triggerBtn.classList.remove('is-invalid');
    const countryError = document.getElementById('country-error');
    if (countryError) {
      countryError.classList.remove('visible');
      countryError.textContent = '';
    }
    // Update selected class
    optionsList.querySelectorAll('.country-option-item').forEach(el => {
      const isSel = el.getAttribute('data-value') === val;
      el.classList.toggle('selected', isSel);
      el.setAttribute('aria-selected', isSel ? 'true' : 'false');
    });
  }

  function openDropdown() {
    dropdownMenu.style.display = 'block';
    widget.classList.add('open');
    triggerBtn.setAttribute('aria-expanded', 'true');
    populateOptions(searchInput.value);
    setTimeout(() => searchInput.focus(), 50);
  }

  function closeDropdown() {
    dropdownMenu.style.display = 'none';
    widget.classList.remove('open');
    triggerBtn.setAttribute('aria-expanded', 'false');
    searchInput.value = '';
  }

  triggerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = widget.classList.contains('open');
    if (isOpen) closeDropdown();
    else openDropdown();
  });

  searchInput.addEventListener('input', () => {
    populateOptions(searchInput.value);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!widget.contains(e.target)) {
      closeDropdown();
    }
  });

  // Keyboard navigation
  triggerBtn.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openDropdown();
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeDropdown();
      triggerBtn.focus();
    }
  });

  // Initial population
  populateOptions();
}

/* ═══════════════════════════════════════════
   13. CONTACT FORM — PURE FRONTEND VALIDATION & THANK YOU
═══════════════════════════════════════════ */
function initEnquiryForm() {
  const form         = document.getElementById('contactForm');
  const thankYou     = document.getElementById('thankyou-panel');
  const backBtn      = document.getElementById('back-to-form-btn');
  const formHeader   = document.querySelector('#enquiry-card .form-header');
  if (!form) return;

  const firstNameInput = document.getElementById('firstName');
  const lastNameInput  = document.getElementById('lastName');
  const emailInput     = document.getElementById('email');
  const countrySelect  = document.getElementById('country');
  const countryTrigger = document.getElementById('country-trigger-btn');
  const messageInput   = document.getElementById('message');
  const submitBtn      = document.getElementById('contact-submit-btn');
  const errorAlert     = document.getElementById('form-error-alert');
  const errorText      = document.getElementById('form-error-text');
  const charCount      = document.getElementById('char-count');

  // ── Character counter ──────────────────────────────
  if (messageInput && charCount) {
    messageInput.addEventListener('input', function () {
      var len = messageInput.value.length;
      charCount.textContent = len + ' / 5000';
      charCount.style.color = len > 4800 ? '#ef4444' : '#94a3b8';
    });
  }

  // ── Email regex ────────────────────────────────────
  var emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

  // ── Helpers ────────────────────────────────────────
  function setFieldError(inputEl, errorElId, msg) {
    var errorEl = document.getElementById(errorElId);
    if (inputEl) {
      inputEl.classList.add('is-invalid');
      inputEl.classList.remove('is-valid');
      inputEl.setAttribute('aria-invalid', 'true');
    }
    if (errorEl) { errorEl.textContent = msg; errorEl.classList.add('visible'); }
  }

  function clearFieldError(inputEl, errorElId) {
    var errorEl = document.getElementById(errorElId);
    if (inputEl) {
      inputEl.classList.remove('is-invalid');
      inputEl.classList.add('is-valid');
      inputEl.setAttribute('aria-invalid', 'false');
    }
    if (errorEl) { errorEl.textContent = ''; errorEl.classList.remove('visible'); }
  }

  // ── Validators ─────────────────────────────────────
  function validateFirstName() {
    var val = (firstNameInput.value || '').trim();
    if (!val) { setFieldError(firstNameInput, 'firstName-error', 'First name is required.'); return false; }
    clearFieldError(firstNameInput, 'firstName-error'); return true;
  }
  function validateLastName() {
    var val = (lastNameInput.value || '').trim();
    if (!val) { setFieldError(lastNameInput, 'lastName-error', 'Last name is required.'); return false; }
    clearFieldError(lastNameInput, 'lastName-error'); return true;
  }
  function validateEmail() {
    var val = (emailInput.value || '').trim();
    if (!val) { setFieldError(emailInput, 'email-error', 'Email address is required.'); return false; }
    if (!emailRegex.test(val)) { setFieldError(emailInput, 'email-error', 'Please enter a valid email address.'); return false; }
    clearFieldError(emailInput, 'email-error'); return true;
  }
  function validateCountry() {
    var val = (countrySelect.value || '').trim();
    if (!val) { setFieldError(countryTrigger || countrySelect, 'country-error', 'Please select your country.'); return false; }
    clearFieldError(countryTrigger || countrySelect, 'country-error'); return true;
  }
  function validateMessage() {
    var val = (messageInput.value || '').trim();
    if (!val) { setFieldError(messageInput, 'message-error', 'Message is required.'); return false; }
    clearFieldError(messageInput, 'message-error'); return true;
  }

  // ── Live blur / input listeners ────────────────────
  firstNameInput.addEventListener('blur',  validateFirstName);
  firstNameInput.addEventListener('input', function () { if (firstNameInput.classList.contains('is-invalid')) validateFirstName(); });

  lastNameInput.addEventListener('blur',  validateLastName);
  lastNameInput.addEventListener('input', function () { if (lastNameInput.classList.contains('is-invalid')) validateLastName(); });

  emailInput.addEventListener('blur',  validateEmail);
  emailInput.addEventListener('input', function () { if (emailInput.classList.contains('is-invalid')) validateEmail(); });

  messageInput.addEventListener('blur',  validateMessage);
  messageInput.addEventListener('input', function () { if (messageInput.classList.contains('is-invalid')) validateMessage(); });

  countrySelect.addEventListener('change', validateCountry);

  // ── Submit handler ─────────────────────────────────
  form.addEventListener('submit', function (event) {
    event.preventDefault();   // Always prevent page reload / navigation

    if (errorAlert) errorAlert.style.display = 'none';

    var v1 = validateFirstName();
    var v2 = validateLastName();
    var v3 = validateEmail();
    var v4 = validateCountry();
    var v5 = validateMessage();

    if (!v1 || !v2 || !v3 || !v4 || !v5) {
      if (errorAlert) {
        if (errorText) errorText.textContent = 'Please complete all required fields correctly.';
        errorAlert.style.display = 'flex';
      }
      if (!v1) firstNameInput.focus();
      else if (!v2) lastNameInput.focus();
      else if (!v3) emailInput.focus();
      else if (!v4 && countryTrigger) countryTrigger.focus();
      else if (!v5) messageInput.focus();
      return;
    }

    // ── Validation passed: show thank-you, hide form ─
    form.style.display = 'none';
    if (errorAlert) errorAlert.style.display = 'none';
    if (formHeader) formHeader.style.display = 'none';

    if (thankYou) {
      thankYou.style.display = 'flex';
      // Scroll the card into comfortable view
      thankYou.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    form.reset();
    if (charCount) charCount.textContent = '0 / 5000';

    // Clear all validation styles
    [firstNameInput, lastNameInput, emailInput, messageInput, countryTrigger, countrySelect].forEach(function (el) {
      if (el) { el.classList.remove('is-valid', 'is-invalid'); el.removeAttribute('aria-invalid'); }
    });
    // Reset country widget label
    var labelSpan = document.getElementById('country-selected-label');
    if (labelSpan) labelSpan.textContent = 'India';
    if (countrySelect) countrySelect.value = 'India';
  });

  // ── Back to Form button ────────────────────────────
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      if (thankYou) thankYou.style.display = 'none';
      if (formHeader) formHeader.style.display = '';
      form.style.display = '';

      // Return scroll position to the form card
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Reset submit button label
      if (submitBtn) {
        var btnText = submitBtn.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Submit';
        submitBtn.disabled = false;
        submitBtn.style.pointerEvents = '';
      }
    });
  }
}

/* ═══════════════════════════════════════════
   14. WHATSAPP FLOATING BUTTON
═══════════════════════════════════════════ */
function initWhatsAppButton() {
  const whatsappBtn = document.getElementById('whatsapp-btn');
  if (!whatsappBtn) return;

  const cleanNum = WHATSAPP_NUMBER.replace(/[^\d]/g, '');
  const encodedMsg = encodeURIComponent(WHATSAPP_MESSAGE);
  whatsappBtn.href = `https://wa.me/${cleanNum}?text=${encodedMsg}`;
}

/* ═══════════════════════════════════════════
   11. INIT on DOMContentLoaded
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Trigger navbar scroll state immediately
  handleNavbarScroll();
  handleBackToTop();

  // Initialize interactive components
  initCountryDropdown();
  initEnquiryForm();
  initWhatsAppButton();

  // Add no-js fallback class removal
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  console.log('%cMercury India Compliance — Ready ✔', 'color:#0a7272;font-weight:bold;font-size:14px;');
});

function sendMail() {

    let params = {
        first_name: document.getElementById("firstName").value,
        last_name: document.getElementById("lastName").value,
        email: document.getElementById("email").value,
        country: document.getElementById("country").value,
        message: document.getElementById("message").value
    };

    return emailjs.send(
        "service_usbs0h4",
        "template_65t3kgc",
        params
    );
}
