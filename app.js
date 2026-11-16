/**
 * LivingPixel — Samsung Tizen OS Engineering
 * Interactive Logic & UI Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------------------
  // 0. Internationalization (EN / DE / SK / IT)
  // -------------------------------------------------------------------------
  const I18N = window.LIVINGPIXEL_I18N || {};
  const SUPPORTED_LANGS = ['en', 'de', 'sk', 'it'];
  const LANG_STORAGE_KEY = 'livingpixel_lang';

  function resolveInitialLang() {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = (params.get('lang') || '').toLowerCase();
      if (SUPPORTED_LANGS.includes(urlLang)) return urlLang;

      const saved = (localStorage.getItem(LANG_STORAGE_KEY) || '').toLowerCase();
      if (SUPPORTED_LANGS.includes(saved)) return saved;
    } catch (e) {
      // Fallback when storage is unavailable
    }
    return 'en';
  }

  let currentLang = resolveInitialLang();

  function t(key, vars = {}) {
    const dict = I18N[currentLang] || I18N.en || {};
    const fallback = I18N.en || {};
    let value = dict[key] !== undefined ? dict[key] : (fallback[key] !== undefined ? fallback[key] : key);
    Object.keys(vars).forEach(k => {
      value = String(value).replace(new RegExp(`\\{${k}\\}`, 'g'), vars[k]);
    });
    return value;
  }

  // Forward-declared refresh callbacks hooked after simulator & estimator init
  let refreshDynamicTranslations = null;

  function applyLanguage(lang, persist = true) {
    const targetLang = SUPPORTED_LANGS.includes(lang) ? lang : 'en';
    currentLang = targetLang;

    if (persist) {
      try {
        localStorage.setItem(LANG_STORAGE_KEY, targetLang);
      } catch (e) {
        // Ignore storage quota / privacy mode errors
      }
    }

    document.documentElement.lang = targetLang;

    const dict = I18N[targetLang] || I18N.en || {};
    if (dict.pageTitle) {
      document.title = dict.pageTitle;
    }
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && dict.pageDescription) {
      metaDesc.setAttribute('content', dict.pageDescription);
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) el.textContent = t(key);
    });

    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (key) el.innerHTML = t(key);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) el.setAttribute('placeholder', t(key));
    });

    document.querySelectorAll('#langSwitcher .lang-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-lang') === targetLang;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (typeof refreshDynamicTranslations === 'function') {
      refreshDynamicTranslations();
    }
  }

  document.querySelectorAll('#langSwitcher .lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang') || 'en';
      applyLanguage(lang, true);
    });
  });

  // -------------------------------------------------------------------------
  // 1. Audio Synth for Remote Control Tactile Feedback (Web Audio API)
  // -------------------------------------------------------------------------
  let audioCtx = null;

  function playUiClick(freq = 440, type = 'sine', duration = 0.04) {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  // -------------------------------------------------------------------------
  // 2. Interactive Virtual TV & Remote Control Simulator
  // -------------------------------------------------------------------------
  const simCards = Array.from(document.querySelectorAll('.sim-card'));
  const simBanner = document.getElementById('simBanner');
  const simTitle = document.getElementById('simTitle');
  const simDesc = document.getElementById('simDesc');
  const simBadge = document.getElementById('simBadge');
  const simFocusLabel = document.getElementById('simFocusLabel');
  const simScreen = document.getElementById('simScreen');
  const simClock = document.getElementById('simClock');

  let currentCardIndex = 0;
  let isTvPoweredOn = true;

  // Live TV Clock
  function updateTvClock() {
    if (!simClock) return;
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    simClock.textContent = `${hours}:${minutes} ${ampm}`;
  }
  updateTvClock();
  setInterval(updateTvClock, 10000);

  function focusCard(index, playSound = true, shouldScroll = true) {
    if (!isTvPoweredOn) return;
    if (index < 0) index = 0;
    if (index >= simCards.length) index = simCards.length - 1;

    currentCardIndex = index;

    simCards.forEach((card, idx) => {
      if (idx === currentCardIndex) {
        card.classList.add('active');
        if (shouldScroll) {
          card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }

        const key = card.getAttribute('data-key') || `simC${idx + 1}`;
        const title = t(`${key}Title`);
        const desc = t(`${key}Desc`);
        const badge = t(`${key}Badge`);
        const name = t(`${key}Name`);

        if (simTitle) simTitle.textContent = title;
        if (simDesc) simDesc.textContent = desc;
        if (simBadge) simBadge.textContent = badge;
        if (simFocusLabel) simFocusLabel.textContent = `${t('simCardWord')} ${idx + 1} (${name})`;
      } else {
        card.classList.remove('active');
      }
    });

    if (playSound) playUiClick(580, 'sine', 0.05);
  }

  // Click directly on cards
  simCards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      focusCard(idx);
    });
  });

  // Remote Control Buttons
  const dpadUp = document.getElementById('dpadUp');
  const dpadDown = document.getElementById('dpadDown');
  const dpadLeft = document.getElementById('dpadLeft');
  const dpadRight = document.getElementById('dpadRight');
  const dpadOk = document.getElementById('dpadOk');
  const remoteBack = document.getElementById('remoteBack');
  const remoteHome = document.getElementById('remoteHome');
  const remotePlay = document.getElementById('remotePlay');
  const remotePowerBtn = document.getElementById('remotePowerBtn');

  if (dpadRight) {
    dpadRight.addEventListener('click', () => {
      focusCard((currentCardIndex + 1) % simCards.length);
    });
  }

  if (dpadLeft) {
    dpadLeft.addEventListener('click', () => {
      focusCard((currentCardIndex - 1 + simCards.length) % simCards.length);
    });
  }

  if (dpadUp) {
    dpadUp.addEventListener('click', () => {
      playUiClick(750, 'triangle', 0.06);
      const activeKey = simCards[currentCardIndex]?.getAttribute('data-key') || `simC${currentCardIndex + 1}`;
      showToast(t('toastCategory', { badge: t(`${activeKey}Badge`) }));
    });
  }

  if (dpadDown) {
    dpadDown.addEventListener('click', () => {
      playUiClick(420, 'sine', 0.06);
    });
  }

  if (dpadOk) {
    dpadOk.addEventListener('click', () => {
      if (!isTvPoweredOn) return;
      playUiClick(880, 'sine', 0.09);
      const activeKey = simCards[currentCardIndex]?.getAttribute('data-key') || `simC${currentCardIndex + 1}`;
      const title = t(`${activeKey}Title`);
      showToast(t('toastLaunched', { title }));
    });
  }

  if (remoteBack) {
    remoteBack.addEventListener('click', () => {
      playUiClick(360, 'sine', 0.06);
      focusCard(0, true, true);
      showToast(t('toastReturnKey'));
    });
  }

  if (remoteHome) {
    remoteHome.addEventListener('click', () => {
      playUiClick(650, 'sine', 0.08);
      focusCard(0, true, true);
      showToast(t('toastHomeKey'));
    });
  }

  if (remotePlay) {
    remotePlay.addEventListener('click', () => {
      playUiClick(800, 'sine', 0.08);
      showToast(t('toastPlayKey'));
    });
  }

  if (remotePowerBtn) {
    remotePowerBtn.addEventListener('click', () => {
      isTvPoweredOn = !isTvPoweredOn;
      playUiClick(isTvPoweredOn ? 880 : 220, 'square', 0.1);
      if (simScreen) {
        simScreen.classList.toggle('power-off', !isTvPoweredOn);
      }
      showToast(isTvPoweredOn ? t('toastPowerOn') : t('toastPowerOff'));
    });
  }

  // Keyboard navigation when user is focused anywhere near the simulator
  window.addEventListener('keydown', (e) => {
    // Only capture arrow keys if user is not typing in a form input
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusCard((currentCardIndex + 1) % simCards.length);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusCard((currentCardIndex - 1 + simCards.length) % simCards.length);
    } else if (e.key === 'Enter') {
      if (dpadOk) dpadOk.click();
    } else if (e.key === 'Backspace' || e.key === 'Escape') {
      if (remoteBack) remoteBack.click();
    }
  });

  // -------------------------------------------------------------------------
  // 3. Interactive Project Estimator
  // -------------------------------------------------------------------------
  const appTypeButtons = Array.from(document.querySelectorAll('#appTypeOptions .pill-select'));
  const paceButtons = Array.from(document.querySelectorAll('#paceOptions .pill-select'));
  const featureCheckboxes = Array.from(document.querySelectorAll('.feature-check'));
  const estimatedWeeksEl = document.getElementById('estimatedWeeks');
  const estimatedSprintText = document.getElementById('estimatedSprintText');
  const phase1TimeEl = document.getElementById('phase1Time');
  const phase2TimeEl = document.getElementById('phase2Time');
  const phase3TimeEl = document.getElementById('phase3Time');
  const applyEstimatorBtn = document.getElementById('applyEstimatorBtn');
  const projectScopeSelect = document.getElementById('projectScope');
  const projectNotesText = document.getElementById('projectNotes');

  let baseWeeks = 4;
  let isExpedited = false;

  function calculateEstimate() {
    // Base from selected app type
    const activeAppType = document.querySelector('#appTypeOptions .pill-select.active');
    baseWeeks = parseInt(activeAppType?.getAttribute('data-weeks') || '4', 10);

    // Sum features
    let featureWeeks = 0;
    featureCheckboxes.forEach(cb => {
      if (cb.checked) {
        featureWeeks += parseFloat(cb.getAttribute('data-weeks') || '1');
      }
    });

    let totalWeeks = baseWeeks + featureWeeks;
    if (isExpedited) {
      totalWeeks = Math.max(2, Math.round(totalWeeks * 0.7));
    }

    const minWeeks = Math.max(1, totalWeeks);
    const maxWeeks = minWeeks + 1;

    if (estimatedWeeksEl) {
      estimatedWeeksEl.textContent = `${minWeeks} – ${maxWeeks} ${t('estWeeksUnit')}`;
    }

    // Phases
    const p1 = (minWeeks * 0.25).toFixed(1);
    const p2 = (minWeeks * 0.55).toFixed(1);
    const p3 = (minWeeks * 0.20).toFixed(1);

    if (phase1TimeEl) phase1TimeEl.textContent = `${p1} ${t('estWksUnit')}`;
    if (phase2TimeEl) phase2TimeEl.textContent = `${p2} ${t('estWksUnit')}`;
    if (phase3TimeEl) phase3TimeEl.textContent = `${p3} ${t('estWksUnit')}`;

    if (estimatedSprintText) {
      estimatedSprintText.textContent = isExpedited ? t('estCaptionExp') : t('estCaptionStd');
    }
  }

  appTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      appTypeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      calculateEstimate();
    });
  });

  paceButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      paceButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      isExpedited = btn.getAttribute('data-pace') === 'expedited';
      calculateEstimate();
    });
  });

  featureCheckboxes.forEach(cb => {
    cb.addEventListener('change', calculateEstimate);
  });

  // Apply to Consultation Form
  if (applyEstimatorBtn) {
    applyEstimatorBtn.addEventListener('click', () => {
      const activeAppBtn = document.querySelector('#appTypeOptions .pill-select.active');
      const activeTypeKey = activeAppBtn?.getAttribute('data-type') || 'ott';
      const activeAppType = activeAppBtn?.textContent.trim() || '';
      const selectedFeatures = featureCheckboxes
        .filter(cb => cb.checked)
        .map(cb => cb.parentElement.textContent.trim().replace(/\s*\([^)]*\)\s*$/, '').trim());

      const scopeMap = {
        ott: 'OTT Video Streaming App',
        signage: 'Commercial Digital Signage (SSSP)',
        port: 'Web-to-Tizen TV Migration',
        audit: 'Store Certification & QA Audit'
      };

      // Pre-select scope
      if (projectScopeSelect && scopeMap[activeTypeKey]) {
        projectScopeSelect.value = scopeMap[activeTypeKey];
      }

      // Pre-fill notes
      if (projectNotesText) {
        projectNotesText.value =
          `${t('estPrefillHeader')} ${estimatedWeeksEl?.textContent || ''}\n` +
          `${t('estPrefillType')} ${activeAppType}\n` +
          `${t('estPrefillFeatures')}\n- ${selectedFeatures.join('\n- ')}\n` +
          `${t('estPrefillPace')} ${isExpedited ? t('estPrefillPaceExp') : t('estPrefillPaceStd')}\n\n` +
          `${t('estPrefillExtra')}\n`;
      }

      // Scroll to contact form smoothly
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
      showToast(t('toastScopeApplied'));
    });
  }

  // -------------------------------------------------------------------------
  // 4. Copy Email & Toast Notification
  // -------------------------------------------------------------------------
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  const emailLink = document.getElementById('emailLink');
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  let toastTimeout = null;

  function showToast(message) {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }

  const CONTACT_EMAIL = 'info@livingpixelstudios.com';

  function copyEmail() {
    navigator.clipboard.writeText(CONTACT_EMAIL).then(() => {
      showToast(t('toastCopied', { email: CONTACT_EMAIL }));
    }).catch(() => {
      showToast(t('toastContactFallback', { email: CONTACT_EMAIL }));
    });
  }

  if (copyEmailBtn) copyEmailBtn.addEventListener('click', copyEmail);
  if (emailLink) {
    emailLink.addEventListener('click', (e) => {
      // Allow mailto default, but also give visual confirmation
      showToast(t('toastOpeningMail', { email: CONTACT_EMAIL }));
    });
  }

  // -------------------------------------------------------------------------
  // 5. Contact Form Handler (Direct FormSubmit AJAX Dispatch — No mailto)
  // -------------------------------------------------------------------------
  const FORMSUBMIT_AJAX_URL = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;
  const projectForm = document.getElementById('projectForm');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnLabel = submitBtn?.querySelector('[data-i18n="submitBtn"]');
  const formStatusEl = document.getElementById('formStatus');
  let currentFormStatus = null;

  function setFormStatus(type, message, key = null) {
    if (!formStatusEl) return;
    if (!type) {
      currentFormStatus = null;
      formStatusEl.hidden = true;
      formStatusEl.textContent = '';
      formStatusEl.className = 'form-status';
      return;
    }
    currentFormStatus = { type, key, message };
    formStatusEl.hidden = false;
    formStatusEl.className = `form-status ${type}`;
    formStatusEl.textContent = message;
  }

  if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const honey = document.getElementById('formHoney')?.value || '';
      if (honey.trim()) {
        projectForm.reset();
        return;
      }

      const name = document.getElementById('userName')?.value.trim() || 'Client';
      const email = document.getElementById('userEmail')?.value.trim() || '';
      const scopeSelect = document.getElementById('projectScope');
      const scope = scopeSelect?.value || 'Tizen TV Project';
      const scopeLabel = scopeSelect?.options[scopeSelect.selectedIndex]?.textContent.trim() || scope;
      const notes = document.getElementById('projectNotes')?.value.trim() || '';

      setFormStatus(null, '');
      if (submitBtn) submitBtn.disabled = true;
      if (submitBtnLabel) submitBtnLabel.textContent = t('formSending');
      showToast(t('toastPreparingMail'));

      try {
        const response = await fetch(FORMSUBMIT_AJAX_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            _replyto: email,
            _subject: `LivingPixel Consultation Request: ${scope} (${name})`,
            scope: scopeLabel,
            language: currentLang.toUpperCase(),
            notes,
            _template: 'table',
            _captcha: 'false',
            _honey: ''
          })
        });

        const data = await response.json().catch(() => ({}));
        const isSuccess = response.ok && (data.success === true || data.success === 'true');

        if (isSuccess) {
          projectForm.reset();
          setFormStatus('success', t('formSentStatus', { email: CONTACT_EMAIL }), 'formSentStatus');
          showToast(t('formSentToast', { email: CONTACT_EMAIL }));
        } else {
          const serverMsg = String(data?.message || '').trim();
          const needsActivation = /activat|confirm/i.test(serverMsg);
          const statusKey = needsActivation ? 'formActivationStatus' : (serverMsg ? null : 'formErrorStatus');
          const statusText = statusKey ? t(statusKey, { email: CONTACT_EMAIL }) : serverMsg;
          setFormStatus('error', statusText, statusKey);
          showToast(needsActivation ? statusText : t('formErrorToast'));
        }
      } catch (err) {
        setFormStatus('error', t('formErrorStatus', { email: CONTACT_EMAIL }), 'formErrorStatus');
        showToast(t('formErrorToast'));
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitBtnLabel) submitBtnLabel.textContent = t('submitBtn');
      }
    });
  }

  // -------------------------------------------------------------------------
  // 6. Mobile Menu Navigation
  // -------------------------------------------------------------------------
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '72px';
        navLinks.style.left = '0';
        navLinks.style.right = '0';
        navLinks.style.background = '#0a0e17';
        navLinks.style.padding = '24px';
        navLinks.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
      }
    });

    // Close menu when clicking any nav link on mobile
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 1120) {
          navLinks.style.display = 'none';
        }
      });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1120) {
        navLinks.removeAttribute('style');
      }
    });
  }

  // -------------------------------------------------------------------------
  // 7. Website Redesign Portfolio Filter & CTA
  // -------------------------------------------------------------------------
  const redesignFilterButtons = Array.from(document.querySelectorAll('#redesignFilters .pill-select'));
  const redesignCards = Array.from(document.querySelectorAll('#redesignGrid .redesign-card'));
  const requestRedesignBtn = document.getElementById('requestRedesignBtn');

  redesignFilterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter') || 'all';
      redesignFilterButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      redesignCards.forEach(card => {
        const category = card.getAttribute('data-category');
        const shouldShow = filter === 'all' || category === filter;
        card.classList.toggle('is-hidden', !shouldShow);
      });
    });
  });

  if (requestRedesignBtn) {
    requestRedesignBtn.addEventListener('click', () => {
      if (projectScopeSelect) {
        projectScopeSelect.value = 'Website Redesign & Modernization';
      }
      if (projectNotesText && !projectNotesText.value.trim()) {
        projectNotesText.value = t('redesignPrefill');
      }
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
      showToast(t('toastRedesignSelected'));
    });
  }

  // Initialize dynamic translations (updates simulator, estimator, & form status in current language)
  refreshDynamicTranslations = () => {
    focusCard(currentCardIndex, false, false);
    calculateEstimate();
    if (submitBtn?.disabled && submitBtnLabel) {
      submitBtnLabel.textContent = t('formSending');
    }
    if (currentFormStatus?.key && formStatusEl && !formStatusEl.hidden) {
      formStatusEl.textContent = t(currentFormStatus.key, { email: CONTACT_EMAIL });
    }
  };
  applyLanguage(currentLang, false);

  // -------------------------------------------------------------------------
  // 8. Active Navigation on Scroll
  // -------------------------------------------------------------------------
  const sections = document.querySelectorAll('section[id]');
  const allNavLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', () => {
    let current = '';
    const scrollY = window.pageYOffset;

    sections.forEach(section => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop - 120;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    allNavLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
});
