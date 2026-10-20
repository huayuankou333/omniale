import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const enums = {
  issue_type: ['audio_gap', 'av_sync', 'channel_swap', 'click', 'subtitle', 'title', 'logo', 'crop', 'color', 'endcard'],
  owner: ['audio', 'design', 'editorial', 'color', 'production'],
  status: ['open', 'blocked', 'resolved', 'dismissed'],
  priority: ['p1', 'p2', 'p3']
};
export const editable = ['asset_id','version','issue_type','in_seconds','out_seconds','owner','status','priority','note'];
export async function readState(file) { return JSON.parse(await fs.readFile(file, 'utf8')); }
export function validateTicket(ticket, state) {
  const asset = state.assets.find(a => a.id === ticket.asset_id && a.versions.includes(ticket.version));
  if (!asset) throw new Error('Unknown asset/version');
  for (const [field, allowed] of Object.entries(enums)) if (!allowed.includes(ticket[field])) throw new Error(`Invalid ${field}`);
  if (!Number.isFinite(ticket.in_seconds) || !Number.isFinite(ticket.out_seconds) ||
      ticket.in_seconds < 0 || ticket.out_seconds <= ticket.in_seconds || ticket.out_seconds > asset.duration)
    throw new Error('Invalid source-relative seconds; use 0 <= in < out <= source duration.');
  if (ticket.note !== undefined && (typeof ticket.note !== 'string' || ticket.note.length > 2000)) throw new Error('Invalid note');
}
export function transaction(original, request) {
  if (typeof request.request_id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(request.request_id)) throw new Error('Invalid request_id');
  const digest = crypto.createHash('sha256').update(JSON.stringify(request.operations)).digest('hex');
  const replay = original.receipts.find(r => r.request_id === request.request_id);
  if (replay) {
    if (replay.digest !== digest) throw new Error('request_id already used for a different transaction');
    return { state: original, receipt: replay, replay: true };
  }
  if (!Array.isArray(request.operations) || request.operations.length < 1 || request.operations.length > 30) throw new Error('Supply 1-30 operations');
  const state = structuredClone(original), changed = [];
  for (const op of request.operations) {
    if (!['create','update'].includes(op.action)) throw new Error('Only create/update supported; withdraw using dismissed.');
    if (!op.fields || Object.keys(op.fields).some(k => !editable.includes(k))) throw new Error('Unknown field');
    let ticket;
    if (op.action === 'create') {
      ticket = { id: `N${state.next_id++}`, ...op.fields };
      validateTicket(ticket, state);
      if (state.tickets.some(t => t.asset_id === ticket.asset_id && t.version === ticket.version &&
          t.issue_type === ticket.issue_type && Math.abs(t.in_seconds-ticket.in_seconds)<0.25 &&
          Math.abs(t.out_seconds-ticket.out_seconds)<0.25)) throw new Error('Duplicate ticket interval; update existing record.');
      state.tickets.push(ticket);
    } else {
      ticket = state.tickets.find(t => t.id === op.id);
      if (!ticket) throw new Error('Unknown ticket id');
      Object.assign(ticket, op.fields);
      validateTicket(ticket, state);
    }
    changed.push(ticket.id);
  }
  const receipt = { request_id: request.request_id, digest, changed, revision: state.revision+1 };
  state.revision++;
  state.receipts.push(receipt);
  return { state, receipt, replay: false };
}
export async function applyTransaction(file, request) {
  const result = transaction(await readState(file), request);
  if (!result.replay) {
    const temporary = `${file}.tmp`;
    await fs.mkdir(path.dirname(file), { recursive:true });
    await fs.writeFile(temporary, JSON.stringify(result.state,null,2));
    await fs.rename(temporary,file);
  }
  return result.receipt;
}
