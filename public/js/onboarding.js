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
          <div id="onboarding-manual-section" class="onboarding-manual-section hidden">
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
            <button id="onboarding-finish" class="onboarding-btn primary hidden">Start Debugging</button>
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
    // Styles are now loaded from external CSS file: /css/onboarding.css
    // This method is kept for compatibility but does nothing
    console.log('Onboarding styles loaded from external CSS file');
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
          else if (!finishBtn.classList.contains('hidden')) this.finishOnboarding();
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

      // Apply final positioning using CSS custom properties
      modal.style.setProperty('--modal-top', `${Math.max(margin, top)}px`);
      modal.style.setProperty('--modal-left', `${Math.max(margin, left)}px`);

      // Set arrow
      if (finalArrowClass === 'none') {
        arrow.classList.add('hidden');
      } else {
        arrow.classList.remove('hidden');
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