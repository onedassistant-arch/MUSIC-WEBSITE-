/* 
   Krishnanjali Musical Training Centre — Premium Redesign Scripts
   Includes: Canvas Particles, Web Audio Synthesizer, Schedule Filter, Testimonial Carousel
*/

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initCanvasParticles();
  initWebAudioSynth();
  initThreeDInstrument();
  initScheduleTabs();
  initTestimonialSlider();
  initScrollReveal();
});

/* ── MOBILE MENU ── */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileMenu.classList.toggle('open');
      // Hamburger animation
      const lines = hamburger.querySelectorAll('span');
      if (mobileMenu.classList.contains('open')) {
        lines[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
        lines[1].style.opacity = '0';
        lines[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
      } else {
        lines[0].style.transform = 'none';
        lines[1].style.opacity = '1';
        lines[2].style.transform = 'none';
      }
    });

    // Close on body click
    document.addEventListener('click', (e) => {
      if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        closeMobileMenu();
      }
    });
  }
}

function closeMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu && mobileMenu.classList.contains('open')) {
    mobileMenu.classList.remove('open');
    const lines = hamburger.querySelectorAll('span');
    lines[0].style.transform = 'none';
    lines[1].style.opacity = '1';
    lines[2].style.transform = 'none';
  }
}

/* ── INTERACTIVE CANVAS PARTICLES (Floating Notes) ── */
function initCanvasParticles() {
  const canvas = document.getElementById('canvasParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  const notes = ['♩', '♪', '♫', '♬', '𝄞', '𝄢', '𝄡', '𝄠'];
  const particles = [];
  const particleCount = Math.min(40, Math.floor(width / 35));

  const mouse = { x: null, y: null, radius: 150 };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  class NoteParticle {
    constructor() {
      this.reset();
      this.y = Math.random() * height; // initial random y
    }

    reset() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 100;
      this.char = notes[Math.floor(Math.random() * notes.length)];
      this.size = Math.random() * 18 + 12;
      this.speedY = -(Math.random() * 0.8 + 0.3);
      this.speedX = Math.random() * 0.4 - 0.2;
      this.alpha = Math.random() * 0.35 + 0.15;
      this.angle = Math.random() * Math.PI * 2;
      this.spin = Math.random() * 0.01 - 0.005;
    }

    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      this.angle += this.spin;

      // Mouse magnetism/repulsion
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.hypot(dx, dy);

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          // Softly push away from mouse
          this.x -= (dx / distance) * force * 1.5;
          this.y -= (dy / distance) * force * 1.5;
        }
      }

      // Reset when particle goes off the top screen
      if (this.y < -50 || this.x < -50 || this.x > width + 50) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = `rgba(212, 175, 55, ${this.alpha})`;
      ctx.font = `${this.size}px 'Cinzel', serif`;
      ctx.fillText(this.char, 0, 0);
      ctx.restore();
    }
  }

  // Create initial particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new NoteParticle());
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();
}

/* ── INTERACTIVE WEB AUDIO SYNTHESIZER ── */
function initWebAudioSynth() {
  const keyboard = document.querySelector('.keyboard-container');
  if (!keyboard) return;

  const visualizer = document.getElementById('synthVisualizer');
  const vCtx = visualizer.getContext('2d');

  // Set visualizer dimensions
  visualizer.width = visualizer.offsetWidth;
  visualizer.height = visualizer.offsetHeight;
  window.addEventListener('resize', () => {
    visualizer.width = visualizer.offsetWidth;
    visualizer.height = visualizer.offsetHeight;
  });

  // Audio Context State
  let audioCtx = null;
  let activeSynthType = 'flute'; // default synthesized instrument model

  // Note Swaras frequencies (Carnatic C4-C5 equivalent scale)
  const swaraFrequencies = {
    'sa': 261.63,  // C4
    'ri': 293.66,  // D4
    'ga': 329.63,  // E4
    'ma': 349.23,  // F4
    'pa': 392.00,  // G4
    'da': 440.00,  // A4
    'ni': 493.88,  // B4
    'sa-high': 523.25 // C5
  };

  // Ripples & Waveform animation lists
  const ripples = [];

  // Instrument Selection
  const instBtns = document.querySelectorAll('.instrument-btn');
  instBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      instBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeSynthType = btn.dataset.inst;
    });
  });

  // Initialize Web Audio Context on first interaction
  function getAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  // Synthesize pleasant acoustic sounds
  function playNote(freq) {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Main nodes
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Apply distinct instrument model settings
    if (activeSynthType === 'flute') {
      // Clean, rich wind sound
      osc.type = 'triangle';
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 2.5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.35);

      // ADSR Envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.35, now + 0.08); // soft attack
      gainNode.gain.exponentialRampToValueAtTime(0.18, now + 0.25); // decay
      gainNode.gain.setValueAtTime(0.18, now + 0.6); // sustain
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2); // long release

      // Subtle Wind Vibrato (LFO on oscillator frequency)
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.value = 6; // LFO speed
      vibratoGain.gain.value = 5; // LFO depth (vibrato intensity)

      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      vibrato.start(now);
      vibrato.stop(now + 1.2);
    } else {
      // Tanpura / Harmonium rich traditional double-reed string resonance
      osc.type = 'sawtooth';

      // Traditional resonance filter (low pass to damp raw saw buzz)
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 1.8, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.1, now + 0.4);

      // A second sub-harmonic oscillator for a thick acoustic buzz
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.value = freq / 2; // Octave lower base resonance

      subOsc.connect(subGain);
      subGain.connect(gainNode);

      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(0.18, now + 0.05);
      subGain.gain.exponentialRampToValueAtTime(0.05, now + 0.35);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      subOsc.start(now);
      subOsc.stop(now + 1.0);

      // ADSR Envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.4, now + 0.04); // faster attack
      gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.3); // decay
      gainNode.gain.setValueAtTime(0.2, now + 0.5); // sustain
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.0); // release
    }

    osc.frequency.setValueAtTime(freq, now);
    osc.start(now);
    osc.stop(now + 1.2);

    // Push ripple for visualization
    ripples.push({
      x: visualizer.width / 2 + (Math.random() * 100 - 50),
      y: visualizer.height / 2,
      r: 10,
      opacity: 1,
      color: activeSynthType === 'flute' ? '#D4AF37' : '#7E1220'
    });
  }

  // Bind keyboard buttons
  const keys = keyboard.querySelectorAll('.synth-key');
  keys.forEach(key => {
    key.addEventListener('click', () => {
      const note = key.dataset.note;
      const freq = swaraFrequencies[note];

      // Visual feedback
      key.classList.add('playing');
      setTimeout(() => key.classList.remove('playing'), 150);

      if (freq) playNote(freq);
    });
  });

  // Render Visualizer Wave ripples
  function renderVisuals() {
    vCtx.clearRect(0, 0, visualizer.width, visualizer.height);

    // Draw background grid lines
    vCtx.strokeStyle = 'rgba(212, 175, 55, 0.08)';
    vCtx.lineWidth = 1;
    for (let i = 0; i < visualizer.width; i += 40) {
      vCtx.beginPath();
      vCtx.moveTo(i, 0);
      vCtx.lineTo(i, visualizer.height);
      vCtx.stroke();
    }

    // Process waves/ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      vCtx.beginPath();
      vCtx.strokeStyle = rp.color;
      // Fade stroke
      vCtx.globalAlpha = rp.opacity;
      vCtx.lineWidth = 3;
      vCtx.ellipse(visualizer.width / 2, visualizer.height / 2, rp.r, rp.r * 0.4, 0, 0, Math.PI * 2);
      vCtx.stroke();

      // Update values
      rp.r += 3.5;
      rp.opacity -= 0.022;

      // Clean up dead waves
      if (rp.opacity <= 0) {
        ripples.splice(i, 1);
      }
    }

    // Draw a center glowing sine wave oscillation if notes are active, otherwise a calm golden line
    vCtx.globalAlpha = 1;
    vCtx.beginPath();
    vCtx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
    vCtx.lineWidth = 2.5;

    const waveCount = ripples.length;
    const centerY = visualizer.height / 2;

    for (let x = 0; x < visualizer.width; x++) {
      let y = centerY;
      if (waveCount > 0) {
        // Synthesize virtual wave rendering based on ripples
        ripples.forEach(rp => {
          const dist = Math.abs(x - visualizer.width / 2);
          const damping = Math.max(0, (300 - dist) / 300);
          y += Math.sin(x * 0.035 + Date.now() * 0.005) * (rp.r * 0.09) * damping * rp.opacity;
        });
      } else {
        // Calm idle vibration
        y += Math.sin(x * 0.015 + Date.now() * 0.002) * 1.5;
      }
      if (x === 0) vCtx.moveTo(x, y);
      else vCtx.lineTo(x, y);
    }
    vCtx.stroke();

    requestAnimationFrame(renderVisuals);
  }

  renderVisuals();
}

/* ── DYNAMIC SCHEDULE FILTER TAB SYSTEM ── */
function initScheduleTabs() {
  const tabBtns = document.querySelectorAll('.schedule-tab-btn');
  const tabPanels = document.querySelectorAll('.schedule-tab-panel');

  if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from buttons
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Toggle active panel
        const targetId = btn.dataset.target;
        tabPanels.forEach(panel => {
          if (panel.id === targetId) {
            panel.classList.add('active');
          } else {
            panel.classList.remove('active');
          }
        });
      });
    });
  }
}

/* ── DYNAMIC AUTOMATIC TESTIMONIALS SLIDER CAROUSEL ── */
function initTestimonialSlider() {
  const testimonials = document.querySelectorAll('#testimonials .testi-card');
  const dotsContainer = document.querySelector('#testimonials .slider-dots');
  const prevBtn = document.querySelector('#testimonials .slider-btn.prev');
  const nextBtn = document.querySelector('#testimonials .slider-btn.next');

  if (testimonials.length === 0) return;

  let currentIndex = 0;
  let slideInterval = null;
  const slideDuration = 6000; // 6s per slide

  // Render Dot Indicators
  dotsContainer.innerHTML = '';
  testimonials.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.classList.add('slider-dot');
    if (idx === 0) dot.classList.add('active');
    dot.addEventListener('click', () => showSlide(idx));
    dotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll('#testimonials .slider-dot');

  function showSlide(index) {
    // Reset classes
    testimonials.forEach((t, idx) => {
      t.classList.remove('active', 'prev');
      dots[idx].classList.remove('active');
      if (idx === currentIndex) {
        t.classList.add('prev');
      }
    });

    currentIndex = (index + testimonials.length) % testimonials.length;

    testimonials[currentIndex].classList.add('active');
    dots[currentIndex].classList.add('active');

    // Restart autoplay
    startAutoplay();
  }

  function nextSlide() {
    showSlide(currentIndex + 1);
  }

  function prevSlide() {
    showSlide(currentIndex - 1);
  }

  if (nextBtn) nextBtn.addEventListener('click', nextSlide);
  if (prevBtn) prevBtn.addEventListener('click', prevSlide);

  function startAutoplay() {
    clearInterval(slideInterval);
    slideInterval = setInterval(nextSlide, slideDuration);
  }

  // Start Autoplay initially
  startAutoplay();

  // Pause on hover
  const sliderWrapper = document.querySelector('.testimonials-slider-wrapper');
  if (sliderWrapper) {
    sliderWrapper.addEventListener('mouseenter', () => clearInterval(slideInterval));
    sliderWrapper.addEventListener('mouseleave', startAutoplay);
  }
}

/* ── DYNAMIC PREMIUM SCROLL REVEAL TRIGGERS ── */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length === 0) return;

  const observerOptions = {
    root: null,
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        // Add sequential reveal delays for gorgeous staggered loads
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, idx * 60);
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);

  reveals.forEach(r => observer.observe(r));

  // Back to top floating button trigger
  const backTop = document.getElementById('backTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backTop.classList.add('visible');
    } else {
      backTop.classList.remove('visible');
    }

    // Add sticky navbar shadow dynamic styling
    const nav = document.querySelector('nav');
    if (window.scrollY > 40) {
      nav.style.boxShadow = '0 6px 30px rgba(0, 0, 0, 0.4)';
    } else {
      nav.style.boxShadow = 'none';
    }
  });
}

/* ── FORM HANDLING & ENQUIRY METHODS ── */
function submitForm() {
  const name = document.getElementById('cName').value.trim();
  const phone = document.getElementById('cPhone').value.trim();
  const email = document.getElementById('cEmail').value.trim();
  const course = document.getElementById('cCourse').value;
  const message = document.getElementById('cMsg').value.trim();

  if (!name || !phone || !course) {
    alert('Kindly provide your Name, Mobile Number, and Course of Interest. 🎵');
    return;
  }

  const successText = document.getElementById('formSuccess');
  successText.innerHTML = "🕊️ Formatting details and launching WhatsApp...";
  successText.style.display = 'block';

  // Construct structured WhatsApp message
  const msg = `Hello! I would like to enquire about *${course}* at Krishnanjali Musical Training Centre.\n\n` +
    `*Name:* ${name}\n` +
    `*Mobile:* ${phone}\n` +
    `*Email:* ${email || 'Not provided'}\n` +
    `*Message:* ${message || 'Looking for weekend batch details.'}`;

  setTimeout(() => {
    window.open('https://wa.me/919443742695?text=' + encodeURIComponent(msg), '_blank');
    successText.innerHTML = "✅ WhatsApp launched. Thank you! We look forward to welcome you.";
    // Reset form fields
    document.getElementById('cName').value = '';
    document.getElementById('cPhone').value = '';
    document.getElementById('cEmail').value = '';
    document.getElementById('cCourse').value = '';
    document.getElementById('cMsg').value = '';
    setTimeout(() => successText.style.display = 'none', 6000);
  }, 1200);
}

/* ── MODAL UTILITY METHODS ── */
function openEnquiry(courseName) {
  const modal = document.getElementById('enquiryModal');
  const titleSpan = document.getElementById('modalCourse');
  if (modal && titleSpan) {
    titleSpan.textContent = courseName;
    modal.style.display = 'flex';
    // Small delay to trigger smooth transition scaling
    setTimeout(() => modal.classList.add('open'), 10);
    closeMobileMenu();
  }
}

function closeModal() {
  const modal = document.getElementById('enquiryModal');
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => modal.style.display = 'none', 400);
  }
}

function submitModal() {
  const name = document.getElementById('mName').value.trim();
  const phone = document.getElementById('mPhone').value.trim();
  const course = document.getElementById('modalCourse').textContent;

  if (!name || !phone) {
    alert('Please enter your name and mobile number.');
    return;
  }

  const msg = `Hello! I'd like to enquire about the *${course}* weekend course at Krishnanjali Musical Training Centre.\n\n` +
    `*Name:* ${name}\n` +
    `*Mobile:* ${phone}`;

  window.open('https://wa.me/919443742695?text=' + encodeURIComponent(msg), '_blank');

  // Reset
  document.getElementById('mName').value = '';
  document.getElementById('mPhone').value = '';
  closeModal();
}

// Close modal when clicking dark backdrop
document.addEventListener('click', (e) => {
  const modal = document.getElementById('enquiryModal');
  if (e.target === modal) closeModal();
});

/* ── 3D INTERACTIVE INSTRUMENTS WEBGL & SYNTHESIS MODULE ── */
function initThreeDInstrument() {
  const canvas = document.getElementById('threeDCanvas');
  if (!canvas) return;

  const container = canvas.parentElement;
  const loading = document.getElementById('threeDLoading');
  const activeSwaraBadge = document.getElementById('activeSwaraBadge');
  const resonanceSlider = document.getElementById('resonanceSlider');
  const resonanceValue = document.getElementById('resonanceValue');

  // Verify Three.js is loaded
  if (typeof THREE === 'undefined') {
    console.error("Three.js is not loaded! Cannot initialize 3D Studio.");
    if (loading) loading.innerHTML = "<span>WebGL Error: Three.js failed to load.</span>";
    return;
  }

  // Set up elements
  const toggleVeena = document.getElementById('toggleVeena');
  const toggleFlute = document.getElementById('toggleFlute');
  const detailsVeena = document.getElementById('detailsVeena');
  const detailsFlute = document.getElementById('detailsFlute');

  // String positions (defined at parent scope so both builder and render loops can access)
  const stringZPositions = [-0.09, -0.03, 0.03, 0.09];

  // Audio resonance setting
  let resonanceFeedback = 0.6; // default 60%
  if (resonanceSlider && resonanceValue) {
    resonanceSlider.addEventListener('input', (e) => {
      resonanceFeedback = parseFloat(e.target.value) / 100;
      resonanceValue.textContent = e.target.value + '%';
    });
  }

  // --- AUDIO SYNTHESIS ENGINE ---
  let audioCtx = null;
  function getLocalAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  const swaraFrequencies = {
    'sa': 261.63,  // C4
    'ri': 293.66,  // D4
    'ga': 329.63,  // E4
    'ma': 349.23,  // F4
    'pa': 392.00,  // G4
    'da': 440.00,  // A4
    'ni': 493.88,  // B4
    'sa-high': 523.25 // C5
  };

  const swaraNames = {
    'sa': 'SA (Shadjama)',
    'ri': 'RI (Rishabha)',
    'ga': 'GA (Gandhara)',
    'ma': 'MA (Madhyama)',
    'pa': 'PA (Panchama)',
    'da': 'DA (Dhaivata)',
    'ni': 'NI (Nishada)',
    'sa-high': "SA' (Tara Shadjama)"
  };

  function play3DSound(note, instrumentType) {
    const ctx = getLocalAudioContext();
    const now = ctx.currentTime;
    const freq = swaraFrequencies[note];
    if (!freq) return;

    // Display active note in UI
    if (activeSwaraBadge) {
      activeSwaraBadge.textContent = swaraNames[note] || note.toUpperCase();
      activeSwaraBadge.style.color = '#D4AF37';
      activeSwaraBadge.style.textShadow = '0 0 10px rgba(212,175,55,0.8)';
      // Reset text shadow and color after a small delay
      setTimeout(() => {
        activeSwaraBadge.style.textShadow = 'none';
      }, 500);
    }

    const mainGain = ctx.createGain();
    mainGain.connect(ctx.destination);

    // Apply resonance envelope decay length
    const decayDuration = 0.5 + resonanceFeedback * 2.5; // Up to 3.0s decay

    if (instrumentType === 'veena') {
      // PLUCKED RESONATING STRING SYNTH
      // Sharp attack, dual oscillators, wood filter decay
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const subOsc = ctx.createOscillator();
      
      const pluckGain = ctx.createGain();
      const subGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Connections
      osc1.connect(filter);
      osc2.connect(filter);
      subOsc.connect(subGain);
      
      filter.connect(pluckGain);
      subGain.connect(pluckGain);
      pluckGain.connect(mainGain);

      // Setup oscs
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, now);
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 1.005, now); // slight detune

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(freq / 2, now); // octave below base

      // Filter: simulate wood resonance
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 2.5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 0.9, now + decayDuration * 0.4);

      // Pluck Envelope
      pluckGain.gain.setValueAtTime(0, now);
      pluckGain.gain.linearRampToValueAtTime(0.55, now + 0.006); // ultra-fast attack
      pluckGain.gain.exponentialRampToValueAtTime(0.18, now + 0.15); // string pluck decay
      pluckGain.gain.exponentialRampToValueAtTime(0.001, now + decayDuration); // release

      // Sub-harmonic Envelope
      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + decayDuration * 0.6);

      // Start & Stop
      osc1.start(now);
      osc2.start(now);
      subOsc.start(now);
      
      osc1.stop(now + decayDuration);
      osc2.stop(now + decayDuration);
      subOsc.stop(now + decayDuration);

    } else {
      // WIND FLUTE VOICE WITH NATURAL VIBRATO
      // Soft attack, triangle voice, air puff noise, pitch LFO
      const osc = ctx.createOscillator();
      const sineHarmonic = ctx.createOscillator();
      const windGain = ctx.createGain();
      
      osc.connect(windGain);
      sineHarmonic.connect(windGain);
      windGain.connect(mainGain);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      sineHarmonic.type = 'sine';
      sineHarmonic.frequency.setValueAtTime(freq * 2, now); // double frequency harmonic

      // Vibrato (LFO on main oscillator)
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      vibrato.frequency.value = 5.8; // speed
      vibratoGain.gain.value = 4.5; // depth
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);
      
      vibrato.start(now);
      vibrato.stop(now + decayDuration);

      // Envelopes
      windGain.gain.setValueAtTime(0, now);
      windGain.gain.linearRampToValueAtTime(0.45, now + 0.08); // slow blow attack
      windGain.gain.setValueAtTime(0.45, now + 0.2); // sustain
      windGain.gain.exponentialRampToValueAtTime(0.2, now + 0.45); // decay
      windGain.gain.exponentialRampToValueAtTime(0.001, now + decayDuration * 0.85); // release

      osc.start(now);
      sineHarmonic.start(now);
      osc.stop(now + decayDuration);
      sineHarmonic.stop(now + decayDuration);
    }
  }

  // --- THREE.JS GRAPHICS SCENE ---
  let width = container.offsetWidth || 600;
  let height = container.offsetHeight || 480;

  const scene = new THREE.Scene();
  
  // Camera
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 2.5, 6.5);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Orbit Controls
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2.5;
  controls.maxDistance = 10;
  controls.maxPolarAngle = Math.PI / 2 + 0.1; // lock below table angle
  controls.enablePan = false; // focus centered

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambientLight);

  const warmKeyLight = new THREE.DirectionalLight(0xfff5d6, 1.2);
  warmKeyLight.position.set(5, 8, 5);
  warmKeyLight.castShadow = true;
  warmKeyLight.shadow.mapSize.width = 1024;
  warmKeyLight.shadow.mapSize.height = 1024;
  scene.add(warmKeyLight);

  const velvetFillLight = new THREE.PointLight(0x7e1220, 1.0, 15);
  velvetFillLight.position.set(-6, 3, -4);
  scene.add(velvetFillLight);

  const goldSpotLight = new THREE.SpotLight(0xd4af37, 1.5, 12, Math.PI / 6, 0.5, 1);
  goldSpotLight.position.set(0, 6, 0);
  goldSpotLight.target.position.set(0, 0, 0);
  scene.add(goldSpotLight);

  // Interactive target mesh arrays
  let interactiveObjects = [];
  const particles = [];

  // Groups
  const veenaGroup = new THREE.Group();
  const fluteGroup = new THREE.Group();
  scene.add(veenaGroup);
  scene.add(fluteGroup);

  // Default selection
  let currentInstrument = 'veena';
  fluteGroup.visible = false;

  // --- MATERIAL SYSTEM ---
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d050d, // Dark wood mahogany
    roughness: 0.28,
    metalness: 0.12
  });

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // Gold finish
    roughness: 0.12,
    metalness: 0.9,
    emissive: 0xd4af37,
    emissiveIntensity: 0.05
  });

  const darkMetalMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a0f11, // Frets baseline metal
    roughness: 0.4,
    metalness: 0.8
  });

  const stringMaterial = new THREE.MeshStandardMaterial({
    color: 0xfdf5d6,
    emissive: 0xd4af37,
    emissiveIntensity: 0.18,
    roughness: 0.05,
    metalness: 0.95
  });

  // --- MODEL GENERATION ---

  // 1. Saraswati Veena Procedural Model
  function buildVeena() {
    // Kudam (Main Gourd Resonator at left)
    const kudamGeom = new THREE.SphereGeometry(1.05, 32, 32);
    const kudamMesh = new THREE.Mesh(kudamGeom, woodMaterial);
    kudamMesh.scale.set(1.1, 0.92, 0.92);
    kudamMesh.position.set(-2.0, 0, 0);
    kudamMesh.castShadow = true;
    kudamMesh.receiveShadow = true;
    veenaGroup.add(kudamMesh);

    // Decorative Gold Rim on kudam
    const rimGeom = new THREE.TorusGeometry(0.55, 0.05, 12, 48);
    const rimMesh = new THREE.Mesh(rimGeom, goldMaterial);
    rimMesh.position.set(-1.0, 0, 0);
    rimMesh.rotation.y = Math.PI / 2;
    rimMesh.castShadow = true;
    veenaGroup.add(rimMesh);

    // Suraikkai (Secondary Smaller Gourd near right)
    const smallGourdGeom = new THREE.SphereGeometry(0.48, 24, 24);
    const smallGourdMesh = new THREE.Mesh(smallGourdGeom, woodMaterial);
    smallGourdMesh.position.set(1.4, -0.3, 0);
    smallGourdMesh.castShadow = true;
    veenaGroup.add(smallGourdMesh);

    // Connector stand for Suraikkai
    const standGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.25, 12);
    const standMesh = new THREE.Mesh(standGeom, goldMaterial);
    standMesh.position.set(1.4, -0.05, 0);
    veenaGroup.add(standMesh);

    // Dandi (Long Neck)
    const dandiGeom = new THREE.CylinderGeometry(0.18, 0.14, 4.3, 24);
    const dandiMesh = new THREE.Mesh(dandiGeom, woodMaterial);
    dandiMesh.rotation.z = Math.PI / 2;
    dandiMesh.position.set(0.15, 0.05, 0);
    dandiMesh.castShadow = true;
    dandiMesh.receiveShadow = true;
    veenaGroup.add(dandiMesh);

    // Yali Head Carving (Dragon Head at top-right end)
    const yaliBaseGeom = new THREE.CylinderGeometry(0.13, 0.13, 0.4, 16);
    const yaliBase = new THREE.Mesh(yaliBaseGeom, woodMaterial);
    yaliBase.rotation.z = Math.PI / 2;
    yaliBase.position.set(2.35, 0.05, 0);
    veenaGroup.add(yaliBase);

    const yaliCurveGeom = new THREE.TorusGeometry(0.24, 0.09, 12, 32, Math.PI);
    const yaliCurve = new THREE.Mesh(yaliCurveGeom, woodMaterial);
    yaliCurve.position.set(2.45, 0.25, 0);
    yaliCurve.rotation.z = -Math.PI / 4;
    yaliCurve.castShadow = true;
    veenaGroup.add(yaliCurve);

    const yaliTipGeom = new THREE.SphereGeometry(0.09, 12, 12);
    const yaliTip = new THREE.Mesh(yaliTipGeom, goldMaterial);
    yaliTip.position.set(2.3, 0.44, 0);
    veenaGroup.add(yaliTip);

    // Frets (Horizontal brass lines on Dandi) - Clicking frets plays SA to SA-HIGH
    const notes = ['sa', 'ri', 'ga', 'ma', 'pa', 'da', 'ni', 'sa-high'];
    const fretPositionsX = [-1.1, -0.65, -0.2, 0.25, 0.7, 1.1, 1.5, 1.9];
    
    fretPositionsX.forEach((xPos, idx) => {
      // Fret Base
      const fretBase = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.32), darkMetalMaterial);
      fretBase.position.set(xPos, 0.22, 0);
      veenaGroup.add(fretBase);

      // Gold Fret Wire (Interactive)
      const wireMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.32, 8), goldMaterial);
      wireMesh.rotation.x = Math.PI / 2;
      wireMesh.position.set(xPos, 0.24, 0);
      wireMesh.castShadow = true;
      veenaGroup.add(wireMesh);

      // Store in interactive objects array
      wireMesh.userData = {
        type: 'fret',
        note: notes[idx],
        index: idx,
        originalEmissive: 0xd4af37,
        meshType: 'veena'
      };
      interactiveObjects.push(wireMesh);
    });

    // 4 Main Strings running along Dandi
    const stringDroneNotes = ['sa', 'pa', 'sa-high', 'pa']; // open string sound map
    
    stringZPositions.forEach((zPos, idx) => {
      // Main visible string (tube structure for raycasting robustness)
      const stringGeom = new THREE.CylinderGeometry(0.01, 0.01, 3.8, 8);
      const stringMesh = new THREE.Mesh(stringGeom, stringMaterial);
      stringMesh.rotation.z = Math.PI / 2;
      // Slightly raised above frets
      stringMesh.position.set(0.3, 0.27, zPos);
      veenaGroup.add(stringMesh);

      // Store in interactive list
      stringMesh.userData = {
        type: 'string',
        note: stringDroneNotes[idx],
        index: idx,
        originalY: 0.27,
        originalEmissive: 0xd4af37,
        vibrating: false,
        vibTime: 0,
        meshType: 'veena'
      };
      interactiveObjects.push(stringMesh);
    });

    // Elegant Tuning Pegs (cylinders on top near right side)
    const pegPositionsX = [1.8, 1.95, 2.1, 2.25];
    pegPositionsX.forEach((xPeg, idx) => {
      const pegPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.28, 8), darkMetalMaterial);
      pegPole.position.set(xPeg, 0.15, 0.14 * (idx % 2 === 0 ? 1 : -1));
      pegPole.rotation.x = Math.PI / 2;
      veenaGroup.add(pegPole);

      const pegCap = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), goldMaterial);
      pegCap.position.set(xPeg, 0.15, 0.25 * (idx % 2 === 0 ? 1 : -1));
      veenaGroup.add(pegCap);
    });

    // Rotate and adjust Veena placement so it sits elegantly in viewport
    veenaGroup.rotation.x = 0.18;
    veenaGroup.rotation.y = -0.32;
    veenaGroup.rotation.z = 0.05;
    veenaGroup.position.set(0.2, 0, 0);
  }

  // 2. Divine Golden Flute Procedural Model
  function buildFlute() {
    // Main Flute Tube body (5.2 units long)
    const tubeGeom = new THREE.CylinderGeometry(0.12, 0.12, 5.2, 32);
    const tubeMesh = new THREE.Mesh(tubeGeom, goldMaterial);
    tubeMesh.rotation.z = Math.PI / 2;
    tubeMesh.castShadow = true;
    tubeMesh.receiveShadow = true;
    fluteGroup.add(tubeMesh);

    // Decorative Crimson Thread bands wrapped around flute
    const bandPositions = [-2.4, -2.1, -1.8, 1.8, 2.1, 2.4];
    bandPositions.forEach(xPos => {
      const bandGeom = new THREE.TorusGeometry(0.125, 0.016, 12, 48);
      const bandMaterial = new THREE.MeshStandardMaterial({
        color: 0x7e1220, // Red silk thread wrapping
        roughness: 0.6
      });
      const bandMesh = new THREE.Mesh(bandGeom, bandMaterial);
      bandMesh.position.set(xPos, 0, 0);
      bandMesh.rotation.y = Math.PI / 2;
      bandMesh.castShadow = true;
      fluteGroup.add(bandMesh);
    });

    // 8 Finger Holes (Clicking plays SA to SA-HIGH)
    const notes = ['sa', 'ri', 'ga', 'ma', 'pa', 'da', 'ni', 'sa-high'];
    const holePositionsX = [-1.3, -0.9, -0.5, -0.1, 0.3, 0.7, 1.1, 1.5];
    
    holePositionsX.forEach((xPos, idx) => {
      // Outer brass highlight ring
      const ringGeom = new THREE.TorusGeometry(0.045, 0.01, 8, 24);
      const ringMesh = new THREE.Mesh(ringGeom, goldMaterial);
      ringMesh.position.set(xPos, 0.12, 0);
      ringMesh.rotation.x = Math.PI / 2;
      fluteGroup.add(ringMesh);

      // Dark hole interior (Interactive raycast target)
      const holeGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16);
      const holeMesh = new THREE.Mesh(holeGeom, new THREE.MeshStandardMaterial({
        color: 0x050203,
        roughness: 0.9,
        emissive: 0xd4af37,
        emissiveIntensity: 0.0 // starts fully dark
      }));
      holeMesh.position.set(xPos, 0.12, 0);
      fluteGroup.add(holeMesh);

      // Store in interactive array
      holeMesh.userData = {
        type: 'hole',
        note: notes[idx],
        index: idx,
        originalEmissive: 0x000000,
        pulsing: false,
        pulseTime: 0,
        meshType: 'flute'
      };
      interactiveObjects.push(holeMesh);
    });

    // Blow mouthpiece opening hole at left side
    const mouthGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16);
    const mouthMesh = new THREE.Mesh(mouthGeom, darkMetalMaterial);
    mouthMesh.position.set(-2.0, 0.12, 0);
    fluteGroup.add(mouthMesh);

    // Decorative Hanging Silk Tassels at the right tip (x = 2.5)
    const tasselGroup = new THREE.Group();
    tasselGroup.position.set(2.5, 0, 0);
    
    // Gold tassel cap
    const capMesh = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.09, 12), goldMaterial);
    capMesh.rotation.z = -Math.PI / 2;
    tasselGroup.add(capMesh);

    // Silk thread cord hanging downwards
    const cordGeom = new THREE.CylinderGeometry(0.006, 0.006, 0.8, 8);
    const cordMaterial = new THREE.MeshStandardMaterial({ color: 0x7e1220, roughness: 0.8 });
    const cordMesh = new THREE.Mesh(cordGeom, cordMaterial);
    cordMesh.position.set(0, -0.4, 0);
    tasselGroup.add(cordMesh);

    // Large silk tassel brush
    const brushGeom = new THREE.ConeGeometry(0.07, 0.35, 16);
    const brushMesh = new THREE.Mesh(brushGeom, cordMaterial);
    brushMesh.position.set(0, -0.9, 0);
    brushMesh.rotation.x = Math.PI; // pointing down
    tasselGroup.add(brushMesh);

    fluteGroup.add(tasselGroup);

    // Rotate flute elegantly
    fluteGroup.rotation.x = 0.4;
    fluteGroup.rotation.y = -0.45;
    fluteGroup.rotation.z = 0.02;
    fluteGroup.position.set(0, 0.1, 0);
  }

  // Build both
  buildVeena();
  buildFlute();

  // Hide loading overlay once models are fully generated
  if (loading) {
    loading.style.opacity = '0';
    setTimeout(() => loading.style.display = 'none', 500);
  }

  // --- FLOATING 3D PARTICLE NOTES SYSTEM ---
  const particleMaterialTemplate = new THREE.MeshBasicMaterial({
    color: 0xf3e5ab,
    transparent: true,
    opacity: 1.0,
    blending: THREE.AdditiveBlending
  });

  function spawnParticle(pos) {
    const choice = Math.random();
    let pMesh;
    
    if (choice < 0.4) {
      // Floating Sphere
      pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.035 + Math.random() * 0.04, 8, 8), particleMaterialTemplate.clone());
    } else {
      // Floating Torus (ring of sound)
      pMesh = new THREE.Mesh(new THREE.TorusGeometry(0.04 + Math.random() * 0.05, 0.015, 8, 16), particleMaterialTemplate.clone());
    }

    pMesh.position.copy(pos);
    scene.add(pMesh);

    particles.push({
      mesh: pMesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.04,
        0.045 + Math.random() * 0.05, // upward drift
        (Math.random() - 0.5) * 0.04
      ),
      life: 1.0,
      decay: 0.015 + Math.random() * 0.015,
      spin: new THREE.Vector3(
        Math.random() * 0.04 - 0.02,
        Math.random() * 0.04 - 0.02,
        Math.random() * 0.04 - 0.02
      )
    });
  }

  // --- RAYCASTING & INTERACTION ---
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let hoveredObject = null;

  function onMouseMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects);

    const activeIntersects = intersects.filter(intersect => {
      return intersect.object.userData.meshType === currentInstrument;
    });

    if (activeIntersects.length > 0) {
      const obj = activeIntersects[0].object;
      
      if (hoveredObject !== obj) {
        resetHover();
        
        hoveredObject = obj;
        document.body.style.cursor = 'pointer';
        
        // Emissive highlights
        if (obj.userData.type === 'string') {
          obj.material.emissiveIntensity = 0.5;
        } else if (obj.userData.type === 'fret') {
          obj.material.emissiveIntensity = 0.35;
          obj.material.emissive.setHex(0xf3e5ab);
        } else if (obj.userData.type === 'hole') {
          obj.material.emissiveIntensity = 0.65;
        }
      }
    } else {
      resetHover();
    }
  }

  function resetHover() {
    if (hoveredObject) {
      if (hoveredObject.userData.type === 'string') {
        hoveredObject.material.emissiveIntensity = 0.18;
      } else if (hoveredObject.userData.type === 'fret') {
        hoveredObject.material.emissiveIntensity = 0.05;
        hoveredObject.material.emissive.setHex(0xd4af37);
      } else if (hoveredObject.userData.type === 'hole') {
        hoveredObject.material.emissiveIntensity = 0.0;
      }
      hoveredObject = null;
      document.body.style.cursor = 'default';
    }
  }

  function onClick(event) {
    if (!hoveredObject) return;

    const data = hoveredObject.userData;
    
    // Play sound immediately!
    play3DSound(data.note, currentInstrument);

    // Visual Trigger
    if (data.type === 'string') {
      data.vibrating = true;
      data.vibTime = 0;
    } else if (data.type === 'hole') {
      data.pulsing = true;
      data.pulseTime = 0;
    } else if (data.type === 'fret') {
      const oldIntensity = hoveredObject.material.emissiveIntensity;
      hoveredObject.material.emissiveIntensity = 1.0;
      hoveredObject.material.emissive.setHex(0xffffff);
      setTimeout(() => {
        if (hoveredObject) {
          hoveredObject.material.emissiveIntensity = oldIntensity;
          hoveredObject.material.emissive.setHex(0xd4af37);
        }
      }, 200);
    }

    // Floating note particle burst
    const intersectPoint = hoveredObject.position.clone();
    intersectPoint.y += 0.15;
    
    for (let i = 0; i < 6; i++) {
      setTimeout(() => spawnParticle(intersectPoint), i * 35);
    }
  }

  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onClick);

  // Touch Support for Mobile
  canvas.addEventListener('touchstart', (event) => {
    if(event.touches.length > 0) {
      const touch = event.touches[0];
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveObjects);
      const activeIntersects = intersects.filter(intersect => intersect.object.userData.meshType === currentInstrument);

      if (activeIntersects.length > 0) {
        hoveredObject = activeIntersects[0].object;
        onClick(event);
      }
    }
  }, { passive: true });

  // --- TOGGLE INSTRUMENTS ---
  function switchInstrument(target) {
    if (target === currentInstrument) return;
    currentInstrument = target;
    resetHover();

    if (currentInstrument === 'veena') {
      toggleVeena.classList.add('active');
      toggleFlute.classList.remove('active');
      detailsVeena.classList.add('active');
      detailsFlute.classList.remove('active');
      
      fluteGroup.visible = false;
      veenaGroup.visible = true;
      veenaGroup.scale.set(0.01, 0.01, 0.01);
      
      let sc = 0.01;
      const scaleIn = () => {
        sc += 0.08 * (1.0 - sc);
        veenaGroup.scale.setScalar(sc);
        if (sc < 0.99) requestAnimationFrame(scaleIn);
        else veenaGroup.scale.setScalar(1);
      };
      scaleIn();

    } else {
      toggleFlute.classList.add('active');
      toggleVeena.classList.remove('active');
      detailsFlute.classList.add('active');
      detailsVeena.classList.remove('active');
      
      veenaGroup.visible = false;
      fluteGroup.visible = true;
      fluteGroup.scale.set(0.01, 0.01, 0.01);
      
      let sc = 0.01;
      const scaleIn = () => {
        sc += 0.08 * (1.0 - sc);
        fluteGroup.scale.setScalar(sc);
        if (sc < 0.99) requestAnimationFrame(scaleIn);
        else fluteGroup.scale.setScalar(1);
      };
      scaleIn();
    }
  }

  if (toggleVeena && toggleFlute) {
    toggleVeena.addEventListener('click', () => switchInstrument('veena'));
    toggleFlute.addEventListener('click', () => switchInstrument('flute'));
  }

  // --- RESIZE LISTENER ---
  window.addEventListener('resize', () => {
    width = container.offsetWidth;
    height = container.offsetHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
  });

  // --- MAIN ANIMATION/RENDER LOOP ---
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // 1. String Vibration
    interactiveObjects.forEach(obj => {
      const data = obj.userData;
      if (data.type === 'string' && data.vibrating) {
        data.vibTime += delta * 20;
        const amplitude = 0.095 * Math.exp(-data.vibTime * 0.14);
        
        if (amplitude > 0.001) {
          obj.position.z = stringZPositions[data.index] + Math.sin(data.vibTime) * amplitude;
        } else {
          data.vibrating = false;
          obj.position.z = stringZPositions[data.index];
        }
      }

      // 2. Hole Pulse
      if (data.type === 'hole' && data.pulsing) {
        data.pulseTime += delta * 15;
        const scale = 1.0 + 0.35 * Math.sin(data.pulseTime) * Math.exp(-data.pulseTime * 0.25);
        
        if (scale > 1.002 || scale < 0.998) {
          obj.scale.set(scale, scale, scale);
        } else {
          data.pulsing = false;
          obj.scale.setScalar(1);
        }
      }
    });

    // 3. Process sound particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.mesh.position.add(p.velocity);
      p.mesh.rotation.x += p.spin.x;
      p.mesh.rotation.y += p.spin.y;
      p.mesh.rotation.z += p.spin.z;
      
      p.life -= p.decay;
      
      if (p.life > 0) {
        p.mesh.material.opacity = p.life;
        p.mesh.scale.setScalar(p.life);
      } else {
        scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        particles.splice(i, 1);
      }
    }

    // 4. Idle model floating movement
    if (veenaGroup.visible) {
      veenaGroup.position.y = Math.sin(elapsedTime * 0.8) * 0.04;
      veenaGroup.rotation.y = -0.32 + Math.cos(elapsedTime * 0.4) * 0.015;
    }
    if (fluteGroup.visible) {
      fluteGroup.position.y = 0.1 + Math.sin(elapsedTime * 0.9) * 0.035;
      fluteGroup.rotation.y = -0.45 + Math.cos(elapsedTime * 0.55) * 0.02;
    }

    controls.update();
    renderer.render(scene, camera);
  }

  // Start Render Loop
  animate();
}

