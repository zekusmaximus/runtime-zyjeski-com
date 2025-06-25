import fs from 'fs/promises';
import path from 'path';

export class FragmentLoader {
  constructor() {
    this.fragments = new Map(); // storyId:type -> fragments[]
    this.fragmentIndex = new Map(); // fragmentId -> fragment
  }

  async loadStoryFragments(storyId) {
    const storyPath = path.join(process.cwd(), 'data', 'stories', storyId, 'narrative-fragments');
    const fragmentTypes = ['process-triggers', 'memory-dumps', 'debug-logs', 'resolutions'];

    for (const type of fragmentTypes) {
      const fragments = await this.loadFragmentType(storyPath, type);
      const key = `${storyId}:${type}`;
      this.fragments.set(key, fragments);
      fragments.forEach(f => this.fragmentIndex.set(f.id, f));
    }

    return { storyId, fragmentCount: this.fragmentIndex.size };
  }

  async loadFragmentType(basePath, type) {
    const fragmentDir = path.join(basePath, type);
    const fragments = [];
    try {
      const files = await fs.readdir(fragmentDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(fragmentDir, file);
          const data = await fs.readFile(filePath, 'utf8');
          const fragment = JSON.parse(data);
          fragment.type = fragment.type || type.replace('-', '_').slice(0, -1);
          fragment.source = `${type}/${file}`;
          fragments.push(fragment);
        }
      }
    } catch (err) {
      console.warn(`Failed to load fragments from ${type}:`, err.message);
    }
    return fragments;
  }

  getFragments(key) {
    return this.fragments.get(key) || [];
  }

  getFragmentById(id) {
    return this.fragmentIndex.get(id);
  }

  async getAvailableStories() {
    const storiesPath = path.join(process.cwd(), 'data', 'stories');
    const stories = [];
    try {
      const dirs = await fs.readdir(storiesPath);
      for (const dir of dirs) {
        const config = path.join(storiesPath, dir, 'story-config.json');
        try {
          await fs.access(config);
          stories.push(dir);
        } catch {
          // ignore
        }
      }
    } catch (error) {
      console.error('Failed to list stories:', error);
    }
    return stories;
  }
}
