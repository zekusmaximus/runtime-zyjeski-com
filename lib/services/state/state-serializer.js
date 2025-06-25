import { debug, error } from '../../logger.js';

export class StateSerializer {
  serialize(data) {
    try {
      const json = JSON.stringify(data, null, 2);
      debug('Serialized state');
      return json;
    } catch (err) {
      error('Failed to serialize state', { err });
      throw err;
    }
  }

  deserialize(json) {
    try {
      const data = JSON.parse(json);
      debug('Deserialized state');
      return data;
    } catch (err) {
      error('Failed to deserialize state', { err });
      throw err;
    }
  }
}

export default StateSerializer;
