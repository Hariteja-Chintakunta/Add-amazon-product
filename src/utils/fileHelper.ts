import * as fs from 'fs';
import * as path from 'path';

/**
 * Writes data as pretty-printed JSON, creating parent folders as needed.
 * Returns the file path that was written.
 */
export function saveJson(filePath: string, data: unknown): string {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  return filePath;
}
