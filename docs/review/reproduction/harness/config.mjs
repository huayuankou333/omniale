import fs from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..');
export const CASES = ['case2_accessibility', 'case3_player'];

export function loadEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^(["'])(.*)\1$/, '$2');
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function caseDir(caseId) {
  if (!CASES.includes(caseId)) throw new Error(`Unknown case: ${caseId}`);
  return path.join(ROOT, caseId);
}

export function recordingPath(caseId) {
  const key = caseId === 'case2_accessibility' ? 'CASE2_RECORDING' : 'CASE3_RECORDING';
  const configured = process.env[key]?.trim();
  return configured ? path.resolve(configured) : path.join(caseDir(caseId), 'inputs', 'recording.mp4');
}
