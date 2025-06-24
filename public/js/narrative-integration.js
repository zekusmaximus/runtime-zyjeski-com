// Narrative Integration System
// Connects story beats with debugging actions

class NarrativeIntegration {
  constructor() {
    this.storyProgress = {
      currentChapter: 'the_experiment',
      scenesCompleted: [],
      charactersEncountered: ['alexander', 'system'],
      memoriesUnlocked: [],
      emotionalJourney: {
        denial: 1.0,
        anger: 0.2,
        bargaining: 0.0,
        depression: 0.0,
        acceptance: 0.0
      }
    };

    this.narrativeTriggers = new Map();
    this.setupTriggers();
  }

  setupTriggers() {
    // Terminal discoveries trigger story moments
    this.narrativeTriggers.set('first_ps_command', {
      condition: (action) => action.type === 'terminal_command' && action.command === 'ps',
      narrative: {
        type: 'system_message',
        content: [
          'SYSTEM: First consciousness scan detected.',
          'WARNING: Multiple critical processes identified.',
          'Dr. Kane, your mental state requires immediate attention.',
          '',
          "A memory surfaces: Dr. Cross's voice, 'Alexander, you can't debug your way out of grief.'"
        ]
      }
    });

    this.narrativeTriggers.set('memory_leak_discovered', {
      condition: (action) => action.type === 'monitor_alert' && action.alert.includes('memory_leak'),
      narrative: {
        type: 'character_moment',
        character: 'alexander',
        content: [
          "The numbers don't lie. 847MB and growing.",
          "Each byte a moment with Leo I can't let go.",
          "The park, the ducks, his laugh before the flash—",
          'No. Focus. This is just data. Just... data.'
        ]
      }
    });

    this.narrativeTriggers.set('emily_thread_starvation', {
      condition: (action) => action.type === 'process_check' && action.process === 'emily_connection.dll' && action.cpu < 5,
      narrative: {
        type: 'memory_injection',
        content: [
          'MEMORY FRAGMENT DETECTED:',
          "Emily (last week): 'You haven't looked at me in months, Alex.'",
          "Emily (yesterday): 'I lost him too.'",
          'Emily (today): [NO_RECENT_MEMORY_FOUND]'
        ],
        effect: {
          process: 'guilt_spike',
          magnitude: 0.3
        }
      }
    });

    this.narrativeTriggers.set('timeline_analysis_started', {
      condition: (action) => action.type === 'terminal_command' && action.command === 'timeline' && action.args[0] === 'analyze',
      narrative: {
        type: 'technical_revelation',
        content: [
          'TEMPORAL ANALYSIS LOG - Personal Note:',
          'The equations were perfect. Every calculation checked twice.',
          "Variable unaccounted for: Leo's curiosity.",
          "He just wanted to see the 'rainbow machine' work.",
          '',
          'Seven timelines detected. In one, I stopped him at the door.',
          'In another, the experiment was scheduled for Thursday.',
          'In this one... in this one, I turned my back for thirteen seconds.'
        ]
      }
    });

    this.narrativeTriggers.set('acceptance_resistance', {
      condition: (action) => action.type === 'intervention' && action.intervention === 'install_acceptance',
      narrative: {
        type: 'internal_conflict',
        content: [
          'defense_mechanism.sys: FOREIGN PROCESS DETECTED',
          "defense_mechanism.sys: Acceptance means giving up.",
          "defense_mechanism.sys: Acceptance means he's really gone.",
          'defense_mechanism.sys: Protect core.exe at all costs.',
          '',
          'hope_thread.dll: [weak signal] ...but what if acceptance means peace?',
          'defense_mechanism.sys: TERMINATING hope_thread.dll',
          'hope_thread.dll: [signal lost]'
        ]
      }
    });

    this.narrativeTriggers.set('quantum_acceptance_achieved', {
      condition: (state) => state.quantumAcceptance === true && state.acceptanceLevel > 0.8,
      narrative: {
        type: 'breakthrough',
        character: 'alexander',
        content: [
          'I understand now.',
          'Leo is gone. Leo exists. Both statements are true.',
          'In infinite timelines, he feeds infinite ducks.',
          'In this one, I carry him in every equation I write.',
          '',
          "The search doesn't end. It transforms.",
          "From 'Where is my son?' to 'How do I honor his curiosity?'",
          'From debugging grief to debugging the future he\'ll never see.',
          '',
          "Emily's hand finds mine in the darkness.",
          'Together, we compile tomorrow from the fragments of yesterday.'
        ],
        achievement: 'Quantum Acceptance'
      }
    });

    // Dynamic narrative responses to player actions
    this.narrativeTriggers.set('aggressive_process_killing', {
      condition: (state) => state.recentActions.filter(a => a.type === 'kill_process').length > 3,
      narrative: {
        type: 'system_warning',
        content: [
          'SYSTEM: Aggressive process termination detected.',
          'WARNING: Forced suppression of emotional processes may cause:',
          '- Unexpected process resurrection',
          '- Memory corruption',
          '- Emotional backpressure cascade',
          '',
          "Recommendation: Try 'nice -n 10' to gently lower process priority."
        ]
      }
    });

    this.narrativeTriggers.set('gentle_debugging', {
      condition: (state) => state.interventionStyle === 'gentle' && state.processesOptimized > 3,
      narrative: {
        type: 'progress_note',
        content: [
          "Dr. Cross's therapy notes appear in memory:",
          "'Patient shows remarkable progress. Instead of eliminating grief,",
          "he's learning to optimize it. The pain remains but no longer",
          "monopolizes all system resources.'",
          '',
          "'Next session: Explore timeline acceptance protocols.'"
        ]
      }
    });
  }

  checkNarrativeTriggers(action, state) {
    const triggered = [];

    for (const [triggerId, trigger] of this.narrativeTriggers) {
      if (trigger.condition(action, state)) {
        triggered.push({
          id: triggerId,
          narrative: trigger.narrative,
          timestamp: Date.now()
        });

        // Mark as seen to prevent repetition
        if (!this.storyProgress.scenesCompleted.includes(triggerId)) {
          this.storyProgress.scenesCompleted.push(triggerId);
        }
      }
    }

    return triggered;
  }

  displayNarrative(narrative) {
    switch (narrative.type) {
      case 'system_message':
        this.showSystemMessage(narrative.content);
        break;
      case 'character_moment':
        this.showCharacterMoment(narrative.character, narrative.content);
        break;
      case 'memory_injection':
        this.showMemoryInjection(narrative.content, narrative.effect);
        break;
      case 'technical_revelation':
        this.showTechnicalRevelation(narrative.content);
        break;
      case 'internal_conflict':
        this.showInternalConflict(narrative.content);
        break;
      case 'breakthrough':
        this.showBreakthrough(narrative.character, narrative.content, narrative.achievement);
        break;
    }
  }

  showSystemMessage(content) {
    const modal = this.createNarrativeModal('system');
    content.forEach(line => {
      const p = document.createElement('p');
      p.className = 'narrative-line system-message';
      p.textContent = line;
      modal.appendChild(p);
    });
    this.displayModal(modal);
  }

  showCharacterMoment(character, content) {
    const modal = this.createNarrativeModal('character');

    const header = document.createElement('h3');
    header.className = 'character-name';
    header.textContent = character.toUpperCase();
    modal.appendChild(header);

    content.forEach(line => {
      const p = document.createElement('p');
      p.className = 'narrative-line character-thought';
      p.textContent = line;
      modal.appendChild(p);
    });

    this.displayModal(modal);
  }

  showMemoryInjection(content, effect) {
    const modal = this.createNarrativeModal('memory');

    content.forEach(line => {
      const p = document.createElement('p');
      p.className = line.startsWith('MEMORY') ? 'memory-header' : 'memory-content';
      p.textContent = line;
      modal.appendChild(p);
    });

    if (effect) {
      // Apply the effect to the consciousness
      this.applyMemoryEffect(effect);
    }

    this.displayModal(modal);
  }

  showTechnicalRevelation(content) {
    const modal = this.createNarrativeModal('technical');
    content.forEach(line => {
      const p = document.createElement('p');
      p.className = 'narrative-line technical-content';
      p.textContent = line;
      modal.appendChild(p);
    });
    this.displayModal(modal);
  }

  showInternalConflict(content) {
    const modal = this.createNarrativeModal('conflict');
    content.forEach(line => {
      const p = document.createElement('p');
      p.className = 'narrative-line system-message';
      p.textContent = line;
      modal.appendChild(p);
    });
    this.displayModal(modal);
  }

  showBreakthrough(character, content, achievement) {
    const modal = this.createNarrativeModal('breakthrough');
    if (character) {
      const header = document.createElement('h3');
      header.className = 'character-name';
      header.textContent = character.toUpperCase();
      modal.appendChild(header);
    }
    content.forEach(line => {
      const p = document.createElement('p');
      p.className = 'narrative-line character-thought';
      p.textContent = line;
      modal.appendChild(p);
    });
    if (achievement) {
      const badge = document.createElement('p');
      badge.className = 'narrative-line system-message';
      badge.textContent = `Achievement Unlocked: ${achievement}`;
      modal.appendChild(badge);
    }
    this.displayModal(modal);
  }

  applyMemoryEffect(effect) {
    console.log('Applying memory effect', effect);
  }


  createNarrativeModal(type) {
    const modal = document.createElement('div');
    modal.className = `narrative-modal ${type}-modal`;
    modal.id = 'narrative-modal';

    // Add CSS for narrative modals if not exists
    if (!document.getElementById('narrative-styles')) {
      const style = document.createElement('style');
      style.id = 'narrative-styles';
      style.textContent = `
        .narrative-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(30, 30, 30, 0.95);
          border: 1px solid #444;
          border-radius: 8px;
          padding: 2rem;
          max-width: 600px;
          max-height: 80vh;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
          animation: narrativeFadeIn 0.5s ease-out;
        }
        @keyframes narrativeFadeIn {
          from { opacity: 0; transform: translate(-50%, -45%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
        .narrative-modal p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
        .system-message { color: #4EC9B0; font-family: 'Fira Code', monospace; }
        .character-thought { color: #C586C0; font-style: italic; }
        .memory-header { color: #CE9178; font-weight: bold; }
        .memory-content { color: #9CDCFE; padding-left: 1rem; }
        .technical-content { color: #569CD6; font-family: 'Fira Code', monospace; }
        .narrative-modal .close-button {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: #666;
          font-size: 1.5rem;
          cursor: pointer;
          transition: color 0.2s;
        }
        .narrative-modal .close-button:hover {
          color: #fff;
        }
        .narrative-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          z-index: 999;
          animation: overlayFadeIn 0.3s ease-out;
        }
        @keyframes overlayFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-button';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => this.closeModal();
    modal.appendChild(closeBtn);

    return modal;
  }

  displayModal(modal) {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'narrative-overlay';
    overlay.onclick = () => this.closeModal();

    // Add to page
    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    // Auto-close after 10 seconds unless user is reading
    let autoCloseTimer = setTimeout(() => this.closeModal(), 10000);

    modal.addEventListener('mouseenter', () => clearTimeout(autoCloseTimer));
    modal.addEventListener('mouseleave', () => {
      autoCloseTimer = setTimeout(() => this.closeModal(), 5000);
    });
  }

  closeModal() {
    const modal = document.getElementById('narrative-modal');
    const overlay = document.querySelector('.narrative-overlay');

    if (modal) modal.remove();
    if (overlay) overlay.remove();
  }

  updateEmotionalJourney(action, outcome) {
    const journey = this.storyProgress.emotionalJourney;

    // Map actions to emotional progress
    if (action.type === 'memory_release' && outcome === 'success') {
      journey.denial = Math.max(0, journey.denial - 0.1);
      journey.acceptance = Math.min(1, journey.acceptance + 0.05);
    }

    if (action.type === 'process_kill' && action.target.includes('grief')) {
      journey.anger = Math.min(1, journey.anger + 0.1);
      journey.denial = Math.min(1, journey.denial + 0.05);
    }

    if (action.type === 'timeline_analysis') {
      journey.bargaining = Math.min(1, journey.bargaining + 0.15);
    }

    if (action.type === 'relationship_repair' && outcome === 'progress') {
      journey.depression = Math.max(0, journey.depression - 0.1);
      journey.acceptance = Math.min(1, journey.acceptance + 0.1);
    }
  }

  getStoryProgress() {
    const totalScenes = 25; // Adjust based on your content
    const completed = this.storyProgress.scenesCompleted.length;
    const emotionalProgress = Object.values(this.storyProgress.emotionalJourney)
      .reduce((sum, val) => sum + val, 0) / 5;

    return {
      percentage: (completed / totalScenes) * 100,
      chapter: this.storyProgress.currentChapter,
      emotionalStage: this.getCurrentEmotionalStage(),
      emotionalProgress: emotionalProgress,
      memoriesUnlocked: this.storyProgress.memoriesUnlocked.length,
      nextMilestone: this.getNextMilestone()
    };
  }

  getCurrentEmotionalStage() {
    const journey = this.storyProgress.emotionalJourney;
    let highest = 'denial';
    let highestValue = 0;

    for (const [stage, value] of Object.entries(journey)) {
      if (value > highestValue) {
        highest = stage;
        highestValue = value;
      }
    }

    return highest;
  }

  getNextMilestone() {
    const progress = this.storyProgress;

    if (progress.emotionalJourney.acceptance > 0.7) {
      return 'Achieve quantum acceptance';
    } else if (progress.emotionalJourney.bargaining > 0.5) {
      return 'Navigate the timeline cascade';
    } else if (progress.memoriesUnlocked.length < 5) {
      return 'Unlock more memory fragments';
    } else {
      return 'Continue debugging consciousness';
    }
  }
}

// Initialize global instance
window.narrativeIntegration = new NarrativeIntegration();

export default window.narrativeIntegration;
