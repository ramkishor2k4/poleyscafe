// ==========================================================================
// CONFIGURATION & GLOBAL STATE
// ==========================================================================
const TOTAL_FRAMES = 50;
const images = [];
let loadedCount = 0;

// Render loop variables
let currentFrame = 0;
let targetFrame = 0;
const LERP_FACTOR = 0.08; // Smoothing factor for inert physics scroll

// DOM Elements
const canvas = document.getElementById('animation-canvas');
const ctx = canvas.getContext('2d');
const preloader = document.getElementById('preloader');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const heroSection = document.getElementById('hero-scroll-section');
const introSection = document.getElementById('hero-intro');
const floatingNavbar = document.getElementById('floating-navbar');

// ==========================================================================
// PRELOADING ASSETS
// ==========================================================================
function preloadImages() {
  return new Promise((resolve) => {
    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      const frameNum = String(i).padStart(4, '0');
      img.src = `/frames/frames_${frameNum}.jpg`;

      img.onload = () => {
        loadedCount++;
        const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);

        // Update loader progress UI
        progressBar.style.width = `${pct}%`;
        progressText.textContent = `${pct}%`;

        if (loadedCount === TOTAL_FRAMES) {
          setTimeout(() => {
            preloader.classList.add('fade-out');
            resolve();
          }, 400); // Visual delay for smooth fadeout
        }
      };

      img.onerror = () => {
        console.error(`Failed to load frame ${frameNum}`);
        loadedCount++;
        if (loadedCount === TOTAL_FRAMES) {
          preloader.classList.add('fade-out');
          resolve();
        }
      };

      images.push(img);
    }
  });
}

// ==========================================================================
// CANVAS RENDERING & COVER FIT SCALING
// ==========================================================================
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;

  canvas.style.width = '100%';
  canvas.style.height = '100%';

  ctx.scale(dpr, dpr);
  drawFrame(Math.round(currentFrame));
}

function drawFrame(frameIndex) {
  const img = images[frameIndex];
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const canvasWidth = window.innerWidth;
  const canvasHeight = window.innerHeight;
  const imgWidth = img.naturalWidth;
  const imgHeight = img.naturalHeight;

  // Calculate scaling for cover fit
  const imgRatio = imgWidth / imgHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth, drawHeight, drawX, drawY;

  if (canvasRatio > imgRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgRatio;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  }

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Enable high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

// ==========================================================================
// AMBIENT GOLDEN PARTICLES GENERATOR
// ==========================================================================
function createGoldenParticles() {
  const container = document.getElementById('ambient-particles');
  if (!container) return;

  const particleCount = 30;
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'gold-particle';

    const size = Math.random() * 4 + 2; // 2px to 6px
    const left = Math.random() * 100; // 0% to 100%
    const duration = Math.random() * 12 + 10; // 10s to 22s
    const delay = Math.random() * -22; // negative delay so they start immediately
    const opacity = Math.random() * 0.25 + 0.15;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${left}%`;
    particle.style.animationDuration = `${duration}s`;
    particle.style.animationDelay = `${delay}s`;
    particle.style.opacity = opacity;

    container.appendChild(particle);
  }
}

// ==========================================================================
// INTRO FADE OUT & NAVBAR SCROLL HANDLER
// ==========================================================================
function handleScrollEffects() {
  const scrollY = window.scrollY;
  const fadeLimit = window.innerHeight * 0.8;

  // 1. Fade and blend the intro overlay out
  if (introSection) {
    const opacity = Math.max(0, 1 - (scrollY / fadeLimit));
    introSection.style.opacity = opacity;

    // Toggle visibility to avoid layout/pointer collision when hidden
    if (opacity <= 0) {
      introSection.style.visibility = 'hidden';
      introSection.style.pointerEvents = 'none';
    } else {
      introSection.style.visibility = 'visible';
      // Only allow pointer events on button CTAs inside introSection if it's visible
      introSection.style.pointerEvents = opacity <= 0.05 ? 'none' : 'auto';
    }
  }

  // 2. Darken floating navbar on scroll
  if (floatingNavbar) {
    if (scrollY > 50) {
      floatingNavbar.classList.add('scrolled');
    } else {
      floatingNavbar.classList.remove('scrolled');
    }
  }
}

// ==========================================================================
// TICK LOOP & LERP SMOOTHING
// ==========================================================================
function tick() {
  if (heroSection) {
    const sectionHeight = heroSection.offsetHeight;
    const maxScroll = sectionHeight - window.innerHeight;

    // Map scroll progress (0.0 to 1.0) clamped relative to the hero section scrollable height
    const scrollProgress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;

    // Map progress (0.0 to 1.0) to frame index (0 to 49)
    targetFrame = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(scrollProgress * TOTAL_FRAMES)));
  } else {
    targetFrame = 0;
  }

  // Interpolate current frame position for smooth scroll inertia
  currentFrame += (targetFrame - currentFrame) * LERP_FACTOR;

  // Render frame
  drawFrame(Math.round(currentFrame));

  requestAnimationFrame(tick);
}

// ==========================================================================
// INITIALIZATION
// ==========================================================================
window.addEventListener('resize', resizeCanvas);
window.addEventListener('scroll', handleScrollEffects);

async function init() {
  await preloadImages();
  resizeCanvas();
  createGoldenParticles();
  handleScrollEffects(); // Trigger initially
  requestAnimationFrame(tick);
}

init();