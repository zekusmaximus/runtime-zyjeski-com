export class NarrativeResponder {
  constructor() {
    this.queue = [];
  }

  queueEvents(events) {
    if (Array.isArray(events)) this.queue.push(...events);
    else this.queue.push(events);
  }

  flush() {
    const out = this.queue.slice();
    this.queue.length = 0;
    return out;
  }
}
