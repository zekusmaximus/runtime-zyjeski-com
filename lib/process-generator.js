import { debug } from './logger.js';
import { generateExplorationProcess } from './process/templates/exploration.js';
import { generateConflictResponse } from './process/templates/conflict-response.js';
import { generateMemoryReview } from './process/templates/memory-review.js';
import { isProcessValid } from './process/process-logic.js';

const emotionMap = {
  grief: generateMemoryReview,
  curiosity: generateExplorationProcess,
  anger: generateConflictResponse
};

export class ProcessGenerator {
  async initialize() {
    debug('ProcessGenerator initialized');
    return true;
  }

  generateFromEmotionalState(emotion, context = {}) {
    const generator = emotionMap[emotion];
    if (!generator) {
      debug(`No process template for emotion ${emotion}`);
      return null;
    }
    const process = generator(context);
    if (!isProcessValid(process, context)) {
      debug(`Process invalid`, { emotion, context });
      return null;
    }
    debug(`Generated process ${process.name}`);
    return process;
  }
}
