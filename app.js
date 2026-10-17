/**
 * LivingPixel — Samsung Tizen OS Engineering
 * Interactive Logic & UI Controller
 */

document.addEventListener('DOMContentLoaded', () => {
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

  function focusCard(index, playSound = true) {
    if (!isTvPoweredOn) return;
    if (index < 0) index = 0;
    if (index >= simCards.length) index = simCards.length - 1;

    currentCardIndex = index;

    simCards.forEach((card, idx) => {
      if (idx === currentCardIndex) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

        const title = card.getAttribute('data-title') || 'Featured App';
        const desc = card.getAttribute('data-desc') || '';
        const badge = card.getAttribute('data-badge') || 'FEATURED';
        const name = card.querySelector('.sim-card-name')?.textContent || '';

        if (simTitle) simTitle.textContent = title;
        if (simDesc) simDesc.textContent = desc;
        if (simBadge) simBadge.textContent = badge;
        if (simFocusLabel) simFocusLabel.textContent = `Card ${idx + 1} (${name})`;
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
      showToast(`Selected Category: ${simCards[currentCardIndex].getAttribute('data-badge')}`);
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
      const activeCard = simCards[currentCardIndex];
      const title = activeCard ? activeCard.getAttribute('data-title') : 'Tizen App';
      showToast(`▶ Launched "${title}" via Tizen AVPlay engine!`);
    });
  }

  if (remoteBack) {
    remoteBack.addEventListener('click', () => {
      playUiClick(360, 'sine', 0.06);
      focusCard(0);
      showToast('Return Key: Reset focus to Primary Rail');
    });
  }

  if (remoteHome) {
    remoteHome.addEventListener('click', () => {
      playUiClick(650, 'sine', 0.08);
      focusCard(0);
      showToast('Smart Hub Home Invoked');
    });
  }

  if (remotePlay) {
    remotePlay.addEventListener('click', () => {
      playUiClick(800, 'sine', 0.08);
      showToast('▶ AVPlay Hardware Play/Pause toggled');
    });
  }

  if (remotePowerBtn) {
    remotePowerBtn.addEventListener('click', () => {
      isTvPoweredOn = !isTvPoweredOn;
      playUiClick(isTvPoweredOn ? 880 : 220, 'square', 0.1);
      if (simScreen) {
        simScreen.classList.toggle('power-off', !isTvPoweredOn);
      }
      showToast(isTvPoweredOn ? 'Samsung Smart TV Powered ON' : 'Samsung Smart TV in Low-Power Standby');
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
      estimatedWeeksEl.textContent = `${minWeeks} – ${maxWeeks} Weeks`;
    }

    // Phases
    const p1 = (minWeeks * 0.25).toFixed(1);
    const p2 = (minWeeks * 0.55).toFixed(1);
    const p3 = (minWeeks * 0.20).toFixed(1);

    if (phase1TimeEl) phase1TimeEl.textContent = `${p1} Wks`;
    if (phase2TimeEl) phase2TimeEl.textContent = `${p2} Wks`;
    if (phase3TimeEl) phase3TimeEl.textContent = `${p3} Wks`;

    if (estimatedSprintText) {
      estimatedSprintText.textContent = isExpedited
        ? '⚡ Expedited delivery track: Dedicated priority engineering sprints.'
        : 'Comprehensive turnkey architecture, testing, and certification readiness.';
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

  calculateEstimate();

  // Apply to Consultation Form
  if (applyEstimatorBtn) {
    applyEstimatorBtn.addEventListener('click', () => {
      const activeAppType = document.querySelector('#appTypeOptions .pill-select.active')?.textContent.trim() || '';
      const selectedFeatures = featureCheckboxes
        .filter(cb => cb.checked)
        .map(cb => cb.parentElement.textContent.trim().split('(')[0].trim());

      // Pre-select scope
      if (projectScopeSelect) {
        if (activeAppType.includes('OTT')) projectScopeSelect.value = 'OTT Video Streaming App';
        else if (activeAppType.includes('Signage')) projectScopeSelect.value = 'Commercial Digital Signage (SSSP)';
        else if (activeAppType.includes('Migration')) projectScopeSelect.value = 'Web-to-Tizen TV Migration';
        else if (activeAppType.includes('Audit')) projectScopeSelect.value = 'Store Certification & QA Audit';
      }

      // Pre-fill notes
      if (projectNotesText) {
        projectNotesText.value = `Estimated Timeline: ${estimatedWeeksEl?.textContent || ''}\nProject Type: ${activeAppType}\nSelected Capabilities:\n- ${selectedFeatures.join('\n- ')}\nPace: ${isExpedited ? 'Expedited Delivery' : 'Standard Sprints'}\n\nAdditional Requirements:\n`;
      }

      // Scroll to contact form smoothly
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
      showToast('Scope applied to consultation request form!');
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

  function copyEmail() {
    const email = 'lubos.kostros@cadline.co.uk';
    navigator.clipboard.writeText(email).then(() => {
      showToast(`Copied ${email} to clipboard!`);
    }).catch(() => {
      showToast(`Contact: ${email}`);
    });
  }

  if (copyEmailBtn) copyEmailBtn.addEventListener('click', copyEmail);
  if (emailLink) {
    emailLink.addEventListener('click', (e) => {
      // Allow mailto default, but also give visual confirmation
      showToast('Opening email client for lubos.kostros@cadline.co.uk...');
    });
  }

  // -------------------------------------------------------------------------
  // 5. Contact Form Handler (Direct Mailto Link Dispatch)
  // -------------------------------------------------------------------------
  const projectForm = document.getElementById('projectForm');
  if (projectForm) {
    projectForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('userName')?.value.trim() || 'Client';
      const email = document.getElementById('userEmail')?.value.trim() || '';
      const scope = document.getElementById('projectScope')?.value || 'Tizen TV Project';
      const notes = document.getElementById('projectNotes')?.value.trim() || '';

      const subject = encodeURIComponent(`LivingPixel Consultation Request: ${scope} (${name})`);
      const body = encodeURIComponent(
        `Hello Lubos,\n\nI would like to discuss a bespoke Samsung Tizen OS project with LivingPixel.\n\n` +
        `Name/Company: ${name}\n` +
        `Email: ${email}\n` +
        `Scope: ${scope}\n\n` +
        `Project Details & Scope Notes:\n${notes}\n\n` +
        `Sent via LivingPixel GitHub Landing Page.`
      );

      showToast('Preparing your consultation email to Lubos...');

      // Trigger mailto
      window.location.href = `mailto:lubos.kostros@cadline.co.uk?subject=${subject}&body=${body}`;
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
        if (window.innerWidth <= 768) {
          navLinks.style.display = 'none';
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // 7. Active Navigation on Scroll
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
