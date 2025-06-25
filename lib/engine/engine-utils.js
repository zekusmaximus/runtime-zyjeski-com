import path from 'path';

export function resolveDataPath(...segments) {
  return path.join(process.cwd(), 'data', ...segments);
}
