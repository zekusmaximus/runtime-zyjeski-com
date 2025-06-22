// Enhanced Onboarding System with Manual Button
class OnboardingSystem {
  constructor() {
    this.currentStep = 0;
    this.isActive = false;
    this.hasShownOnboarding = localStorage.getItem('consciousness-onboarding-complete') === 'true';
    
    this.steps = [
      {
        title: "Welcome to Consciousness Debugging",
        content: "This is an interactive fiction platform where you debug character consciousness as executable code. Mental processes become observable and fixable through technical tools.",
        target: null,
        position: "center"
      },
      {
        title: "Character Selection",
        content: "Choose a character to debug. Each character has unique consciousness patterns, system errors, and emotional processing issues to resolve.",
        target: ".character-card",
        position: "bottom"
      },
      {
        title: "Consciousness Controls",
        content: "This minimized panel gives you direct control over consciousness updates and debugging commands. Click to expand when you need quick access to system controls.",
        target: "#consciousness-controls",
        position: "left"
      },
      {
        title: "Navigation Tools",
        content: "Use the Terminal for command-line debugging, Monitor for real-time system observation, and Debugger for step-by-step consciousness analysis.",
        target: ".nav-links",
        position: "bottom"
      },
      {
        title: "Ready to Debug",
        content: "You're now ready to help characters resolve their consciousness malfunctions. For comprehensive debugging techniques, read the complete manual below, or jump straight into debugging Alexander Kane.",
        target: "[data-character='alexander-kane']",
        position: "top",
        showManualButton: true // This tells us to show the manual button
      }
    ];
    
    this.init();
  }

  init() {
    this.createOnboardingElements();
    
    // Show onboarding if first visit
    if (!this.hasShownOnboarding) {
      setTimeout(() => this.startOnboarding(), 1000);
    }
  }

  createOnboardingElements() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.className = 'onboarding-overlay';
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'onboarding-modal';
    modal.className = 'onboarding-modal';
    
    modal.innerHTML = `
      <div class="onboarding-content">
        <div class="onboarding-header">
          <h2 id="onboarding-title">Welcome</h2>
          <button id="onboarding-close" class="onboarding-close" title="Skip tutorial">×</button>
        </div>
        <div class="onboarding-body">
          <p id="onboarding-text">Loading...</p>
          <div id="onboarding-manual-section" style="display: none; margin-top: 20px; text-align: center;">
            <button id="onboarding-manual-btn" class="onboarding-manual-btn">📖 Read the Complete Manual</button>
          </div>
        </div>
        <div class="onboarding-footer">
          <div class="onboarding-progress">
            <div class="progress-dots" id="progress-dots"></div>
          </div>
          <div class="onboarding-actions">
            <button id="onboarding-prev" class="onboarding-btn secondary" disabled>Previous</button>
            <button id="onboarding-next" class="onboarding-btn primary">Next</button>
            <button id="onboarding-finish" class="onboarding-btn primary" style="display: none;">Start Debugging</button>
          </div>
        </div>
      </div>
      <div class="onboarding-arrow" id="onboarding-arrow"></div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    this.addStyles();
    this.bindEvents();
  }

  addStyles() {
    if (document.getElementById('onboarding-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'onboarding-styles';
    styles.textContent = `
      /* Onboarding Overlay - Light overlay so content remains visible */
      .onboarding-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(1px);
        z-index: 50000;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }
      
      .onboarding-overlay.active {
        pointer-events: auto;
      }
      
      .onboarding-modal {
        pointer-events: auto;
      }

      .onboarding-overlay.active {
        display: flex;
        opacity: 1;
      }

      .onboarding-modal {
        position: absolute;
        background: #1a1a1a;
        border: 2px solid #00aaff;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 170, 255, 0.3);
        max-width: 420px;
        min-width: 320px;
        font-family: 'Segoe UI', system-ui, sans-serif;
        transform: scale(0.9);
        transition: all 0.3s ease;
      }

      .onboarding-overlay.active .onboarding-modal {
        transform: scale(1);
      }

      .onboarding-content {
        padding: 0;
        color: #ffffff;
      }

      .onboarding-header {
        background: linear-gradient(135deg, #00aaff, #0077cc);
        padding: 1.5rem;
        border-radius: 10px 10px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        position: relative;
      }

      .onboarding-header h2 {
        margin: 0;
        color: #ffffff;
        font-size: 1.4rem;
        font-weight: 600;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      }

      .onboarding-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: #ffffff;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .onboarding-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }

      .onboarding-body {
        padding: 2rem;
        line-height: 1.6;
      }

      .onboarding-body p {
        margin: 0;
        font-size: 1rem;
        color: #e0e0e0;
      }

      /* Manual Button Styling */
      .onboarding-manual-btn {
        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-family: 'Courier New', 'Monaco', monospace;
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        min-width: 200px;
      }

      .onboarding-manual-btn::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }

      .onboarding-manual-btn:hover::before {
        left: 100%;
      }

      .onboarding-manual-btn:hover {
        background: linear-gradient(135deg, #2a5298 0%, #1e3c72 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      }

      .onboarding-manual-btn:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      .onboarding-footer {
        padding: 1.5rem;
        border-top: 1px solid #333;
        background: #141414;
        border-radius: 0 0 10px 10px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .progress-dots {
        display: flex;
        gap: 8px;
      }

      .progress-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #333;
        transition: all 0.3s ease;
      }

      .progress-dot.active {
        background: #00aaff;
        transform: scale(1.2);
      }

      .progress-dot.completed {
        background: #00ff88;
      }

      .onboarding-actions {
        display: flex;
        gap: 12px;
      }

      .onboarding-btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        font-size: 0.9rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 80px;
      }

      .onboarding-btn.primary {
        background: #00aaff;
        color: #ffffff;
      }

      .onboarding-btn.primary:hover:not(:disabled) {
        background: #0099ee;
        transform: translateY(-1px);
      }

      .onboarding-btn.secondary {
        background: #444;
        color: #ffffff;
        border: 1px solid #666;
      }

      .onboarding-btn.secondary:hover:not(:disabled) {
        background: #555;
      }

      .onboarding-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Arrow pointer */
      .onboarding-arrow {
        position: absolute;
        width: 0;
        height: 0;
        pointer-events: none;
      }

      .onboarding-arrow.top {
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-bottom: 10px solid #00aaff;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
      }

      .onboarding-arrow.bottom {
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 10px solid #00aaff;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
      }

      .onboarding-arrow.left {
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
        border-right: 10px solid #00aaff;
        left: -10px;
        top: 50%;
        transform: translateY(-50%);
      }

      .onboarding-arrow.right {
        border-top: 10px solid transparent;
        border-bottom: 10px solid transparent;
        border-left: 10px solid #00aaff;
        right: -10px;
        top: 50%;
        transform: translateY(-50%);
      }

      /* Target highlighting */
      .onboarding-highlight {
        position: relative;
        z-index: 49999;
      }

      .onboarding-highlight::before {
        content: '';
        position: absolute;
        top: -8px;
        left: -8px;
        right: -8px;
        bottom: -8px;
        border: 3px solid #00aaff;
        border-radius: 12px;
        box-shadow: 0 0 30px rgba(0, 170, 255, 0.8), inset 0 0 0 2px rgba(0, 170, 255, 0.2);
        animation: onboardingPulse 2s infinite;
        pointer-events: none;
        background: rgba(0, 170, 255, 0.05);
      }

      @keyframes onboardingPulse {
        0%, 100% { 
          opacity: 0.8; 
          transform: scale(1);
          box-shadow: 0 0 30px rgba(0, 170, 255, 0.8), inset 0 0 0 2px rgba(0, 170, 255, 0.2);
        }
        50% { 
          opacity: 1; 
          transform: scale(1.02);
          box-shadow: 0 0 40px rgba(0, 170, 255, 1), inset 0 0 0 2px rgba(0, 170, 255, 0.3);
        }
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .onboarding-modal {
          max-width: 90vw;
          min-width: 280px;
          margin: 20px;
        }

        .onboarding-header {
          padding: 1rem;
        }

        .onboarding-header h2 {
          font-size: 1.2rem;
        }

        .onboarding-body {
          padding: 1.5rem;
        }

        .onboarding-footer {
          padding: 1rem;
          flex-direction: column;
          gap: 1rem;
        }

        .onboarding-actions {
          width: 100%;
          justify-content: space-between;
        }

        .onboarding-btn {
          flex: 1;
          min-width: 0;
        }

        .onboarding-manual-btn {
          min-width: auto;
          padding: 10px 16px;
          font-size: 12px;
        }
      }

      /* Center positioning for modal steps */
      .onboarding-modal.center {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0.9);
      }

      .onboarding-overlay.active .onboarding-modal.center {
        transform: translate(-50%, -50%) scale(1);
      }
    `;

    document.head.appendChild(styles);
  }

  bindEvents() {
    const closeBtn = document.getElementById('onboarding-close');
    const nextBtn = document.getElementById('onboarding-next');
    const prevBtn = document.getElementById('onboarding-prev');
    const finishBtn = document.getElementById('onboarding-finish');
    const overlay = document.getElementById('onboarding-overlay');
    const manualBtn = document.getElementById('onboarding-manual-btn');

    closeBtn.addEventListener('click', () => this.skipOnboarding());
    nextBtn.addEventListener('click', () => this.nextStep());
    prevBtn.addEventListener('click', () => this.prevStep());
    finishBtn.addEventListener('click', () => this.finishOnboarding());
    manualBtn.addEventListener('click', () => this.openManual());

    // Close on overlay click (but not modal click)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.skipOnboarding();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isActive) return;

      switch (e.key) {
        case 'Escape':
          this.skipOnboarding();
          break;
        case 'ArrowRight':
        case 'Enter':
          if (!nextBtn.disabled) this.nextStep();
          else if (finishBtn.style.display !== 'none') this.finishOnboarding();
          break;
        case 'ArrowLeft':
          if (!prevBtn.disabled) this.prevStep();
          break;
      }
    });
  }

  openManual() {
    // Create manual overlay
    const overlay = document.createElement('div');
    overlay.className = 'manual-overlay';
    overlay.style.display = 'block';
    overlay.style.zIndex = '60000'; // Higher than onboarding
    
    // Create manual iframe
    const iframe = document.createElement('iframe');
    iframe.className = 'manual-iframe';
    iframe.src = '/manual.html';
    
    // Handle iframe load errors
    iframe.onerror = () => {
      console.error('Failed to load manual.html');
      alert('Could not load the manual. Please make sure manual.html is in the public folder.');
    };
    
    overlay.appendChild(iframe);
    document.body.appendChild(overlay);
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeManual(overlay);
      }
    });
    
    // Close on escape key
    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        this.closeManual(overlay);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Make close function available globally
    window.closeManual = () => {
      this.closeManual(overlay);
      document.removeEventListener('keydown', escapeHandler);
    };
  }

  closeManual(overlay) {
    if (overlay && overlay.parentNode) {
      overlay.remove();
    }
  }

  startOnboarding() {
    this.isActive = true;
    this.currentStep = 0;
    const overlay = document.getElementById('onboarding-overlay');
    overlay.classList.add('active');
    this.showStep(0);
    this.createProgressDots();
  }

  showStep(stepIndex) {
    const step = this.steps[stepIndex];
    if (!step) return;

    // Clear previous highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });

    // Update content
    document.getElementById('onboarding-title').textContent = step.title;
    document.getElementById('onboarding-text').textContent = step.content;

    // Show/hide manual button based on step
    const manualSection = document.getElementById('onboarding-manual-section');
    if (step.showManualButton) {
      manualSection.style.display = 'block';
    } else {
      manualSection.style.display = 'none';
    }

    // Update progress
    this.updateProgress();

    // Position modal and show arrow
    this.positionModal(step);

    // Highlight target if specified
    if (step.target) {
      const target = document.querySelector(step.target);
      if (target) {
        target.classList.add('onboarding-highlight');
        // Scroll target into view if needed
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    // Update button states
    const prevBtn = document.getElementById('onboarding-prev');
    const nextBtn = document.getElementById('onboarding-next');
    const finishBtn = document.getElementById('onboarding-finish');

    prevBtn.disabled = stepIndex === 0;

    if (stepIndex === this.steps.length - 1) {
      nextBtn.style.display = 'none';
      finishBtn.style.display = 'inline-block';
    } else {
      nextBtn.style.display = 'inline-block';
      finishBtn.style.display = 'none';
    }
  }

  positionModal(step) {
    const modal = document.getElementById('onboarding-modal');
    const arrow = document.getElementById('onboarding-arrow');
    
    // Reset classes and positioning
    modal.className = 'onboarding-modal';
    modal.style.top = '';
    modal.style.left = '';
    arrow.className = 'onboarding-arrow';

    if (!step.target || step.position === 'center') {
      modal.classList.add('center');
      arrow.style.display = 'none';
      return;
    }

    const target = document.querySelector(step.target);
    if (!target) {
      modal.classList.add('center');
      arrow.style.display = 'none';
      return;
    }

    // Wait for modal to render with reset positioning to get accurate dimensions
    setTimeout(() => {
      const targetRect = target.getBoundingClientRect();
      const modalRect = modal.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 20;

      let top, left, arrowClass;

      // Calculate ideal position
      switch (step.position) {
        case 'top':
          top = targetRect.top - modalRect.height - 20;
          left = targetRect.left + (targetRect.width - modalRect.width) / 2;
          arrowClass = 'bottom';
          break;

        case 'bottom':
          top = targetRect.bottom + 20;
          left = targetRect.left + (targetRect.width - modalRect.width) / 2;
          arrowClass = 'top';
          break;

        case 'left':
          top = targetRect.top + (targetRect.height - modalRect.height) / 2;
          left = targetRect.left - modalRect.width - 20;
          arrowClass = 'right';
          break;

        case 'right':
          top = targetRect.top + (targetRect.height - modalRect.height) / 2;
          left = targetRect.right + 20;
          arrowClass = 'left';
          break;

        default:
          modal.classList.add('center');
          arrow.style.display = 'none';
          return;
      }

      // Smart repositioning for viewport boundaries
      let finalArrowClass = arrowClass;
      
      // Check if modal fits in intended position
      if (top < margin) {
        // Not enough space above, try below
        if (step.position === 'top') {
          const bottomPos = targetRect.bottom + 20;
          if (bottomPos + modalRect.height <= viewportHeight - margin) {
            top = bottomPos;
            finalArrowClass = 'top';
          } else {
            // Neither above nor below works, place at top of viewport
            top = margin;
            finalArrowClass = 'none';
          }
        } else {
          top = margin;
          if (step.position !== 'left' && step.position !== 'right') {
            finalArrowClass = 'none';
          }
        }
      }

      if (top + modalRect.height > viewportHeight - margin) {
        // Not enough space below, try above
        if (step.position === 'bottom') {
          const topPos = targetRect.top - modalRect.height - 20;
          if (topPos >= margin) {
            top = topPos;
            finalArrowClass = 'bottom';
          } else {
            // Neither above nor below works, place at bottom of viewport
            top = viewportHeight - modalRect.height - margin;
            finalArrowClass = 'none';
          }
        } else {
          top = viewportHeight - modalRect.height - margin;
          if (step.position !== 'left' && step.position !== 'right') {
            finalArrowClass = 'none';
          }
        }
      }

      // Adjust horizontal position
      if (left < margin) {
        left = margin;
      } else if (left + modalRect.width > viewportWidth - margin) {
        left = viewportWidth - modalRect.width - margin;
      }

      // Apply final positioning
      modal.style.top = `${Math.max(margin, top)}px`;
      modal.style.left = `${Math.max(margin, left)}px`;
      
      // Set arrow
      if (finalArrowClass === 'none') {
        arrow.style.display = 'none';
      } else {
        arrow.style.display = 'block';
        arrow.className = `onboarding-arrow ${finalArrowClass}`;
      }
    }, 10);
  }

  createProgressDots() {
    const container = document.getElementById('progress-dots');
    container.innerHTML = '';

    for (let i = 0; i < this.steps.length; i++) {
      const dot = document.createElement('div');
      dot.className = 'progress-dot';
      container.appendChild(dot);
    }
  }

  updateProgress() {
    const dots = document.querySelectorAll('.progress-dot');
    dots.forEach((dot, index) => {
      dot.classList.remove('active', 'completed');
      if (index < this.currentStep) {
        dot.classList.add('completed');
      } else if (index === this.currentStep) {
        dot.classList.add('active');
      }
    });
  }

  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.showStep(this.currentStep);
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep(this.currentStep);
    }
  }

  skipOnboarding() {
    this.closeOnboarding();
    localStorage.setItem('consciousness-onboarding-complete', 'true');
  }

  finishOnboarding() {
    this.closeOnboarding();
    localStorage.setItem('consciousness-onboarding-complete', 'true');
    
    // Auto-select Alexander Kane if available
    const alexCard = document.querySelector('[data-character="alexander-kane"]');
    if (alexCard) {
      alexCard.click();
    }
  }

  closeOnboarding() {
    this.isActive = false;
    const overlay = document.getElementById('onboarding-overlay');
    overlay.classList.remove('active');
    
    // Clear highlights
    document.querySelectorAll('.onboarding-highlight').forEach(el => {
      el.classList.remove('onboarding-highlight');
    });
  }

  // Public method to restart onboarding
  restart() {
    localStorage.removeItem('consciousness-onboarding-complete');
    this.hasShownOnboarding = false;
    this.startOnboarding();
  }
}

// Initialize onboarding system
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.onboardingSystem = new OnboardingSystem();
  });
} else {
  window.onboardingSystem = new OnboardingSystem();
}