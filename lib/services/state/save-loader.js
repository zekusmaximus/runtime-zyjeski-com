import fs from 'fs/promises';
import path from 'path';
import { debug, error } from '../../logger.js';

export class SaveLoader {
  async save(filePath, content) {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      debug(`Saving state to ${filePath}`);
      await fs.writeFile(filePath, content, 'utf8');
    } catch (err) {
      error(`Failed to save state to ${filePath}`, { err });
      throw err;
    }
  }

  async load(filePath) {
    try {
      debug(`Loading state from ${filePath}`);
      return await fs.readFile(filePath, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') throw err; // bubble up for caller
      error(`Failed to load state from ${filePath}`, { err });
      throw err;
    }
  }

  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export default SaveLoader;
