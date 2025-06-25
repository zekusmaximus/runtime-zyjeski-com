import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';
import { debug, error } from '../../logger.js';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export class CompressionHandler {
  async compress(str) {
    try {
      debug('Compressing state');
      const buf = await gzipAsync(str);
      return buf;
    } catch (err) {
      error('Compression failed', { err });
      throw err;
    }
  }

  async decompress(buf) {
    try {
      debug('Decompressing state');
      const result = await gunzipAsync(buf);
      return result.toString();
    } catch (err) {
      error('Decompression failed', { err });
      throw err;
    }
  }
}

export default CompressionHandler;
