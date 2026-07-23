import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export class RelayStoreError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'RelayStoreError';
    this.code = code;
  }
}

function actionKey(actionId) {
  return createHash('sha256').update(actionId, 'utf8').digest('hex');
}

function validateActionId(actionId) {
  if (typeof actionId !== 'string' || actionId.length < 1 || actionId.length > 240) {
    throw new RelayStoreError('ACTION_ID_INVALID', 'action_id must be a non-empty string of at most 240 characters.');
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function writeJsonAtomic(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, path);
}

export class RelayStore {
  constructor({ directory }) {
    this.directory = directory;
    this.actionsDirectory = join(directory, 'actions');
    this.stripeIndexPath = join(directory, 'indexes', 'stripe-refunds.json');
    this.locks = new Map();
  }

  async init() {
    await mkdir(this.actionsDirectory, { recursive: true });
    await mkdir(dirname(this.stripeIndexPath), { recursive: true });
    try {
      await readFile(this.stripeIndexPath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await writeJsonAtomic(this.stripeIndexPath, {});
    }
  }

  paths(actionId) {
    validateActionId(actionId);
    const root = join(this.actionsDirectory, actionKey(actionId));
    return {
      root,
      metadata: join(root, 'metadata.json'),
      current: join(root, 'current.json'),
      revisions: join(root, 'revisions')
    };
  }

  async withLock(actionId, callback) {
    const previous = this.locks.get(actionId) ?? Promise.resolve();
    let release;
    const current = new Promise((resolve) => { release = resolve; });
    const queued = previous.then(() => current);
    this.locks.set(actionId, queued);
    await previous;
    try {
      return await callback();
    } finally {
      release();
      if (this.locks.get(actionId) === queued) this.locks.delete(actionId);
    }
  }

  async exists(actionId) {
    try {
      await readFile(this.paths(actionId).metadata, 'utf8');
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') return false;
      throw error;
    }
  }

  async createAction({ actionId, bundle, current, ruleset, correlations = {} }) {
    return this.withLock(actionId, async () => {
      if (await this.exists(actionId)) throw new RelayStoreError('ACTION_ALREADY_EXISTS', `Action ${actionId} already exists.`);
      const paths = this.paths(actionId);
      const metadata = {
        action_id: actionId,
        ruleset,
        revision: 1,
        correlations,
        seen_upstream_event_ids: [],
        created_at: bundle.payload.created_at,
        updated_at: bundle.payload.created_at
      };
      await mkdir(paths.revisions, { recursive: true });
      await writeJsonAtomic(join(paths.revisions, '000001.bundle.json'), bundle);
      await writeJsonAtomic(paths.current, current);
      await writeJsonAtomic(paths.metadata, metadata);
      if (correlations.stripe_refund_id) await this.registerStripeRefund(correlations.stripe_refund_id, actionId);
      return { metadata, bundle, current };
    });
  }

  async registerStripeRefund(refundId, actionId) {
    if (typeof refundId !== 'string' || refundId.length === 0) throw new RelayStoreError('STRIPE_REFUND_ID_INVALID', 'Stripe refund id is required.');
    return this.withLock('__stripe_refund_index__', async () => {
      const index = await readJson(this.stripeIndexPath);
      if (index[refundId] && index[refundId] !== actionId) {
        throw new RelayStoreError('STRIPE_REFUND_ALREADY_LINKED', `Stripe refund ${refundId} is already linked to another action.`);
      }
      index[refundId] = actionId;
      await writeJsonAtomic(this.stripeIndexPath, index);
    });
  }

  async findByStripeRefundId(refundId) {
    const index = await readJson(this.stripeIndexPath);
    return index[refundId] ?? null;
  }

  async getAction(actionId) {
    const paths = this.paths(actionId);
    try {
      const metadata = await readJson(paths.metadata);
      const bundle = await readJson(join(paths.revisions, `${String(metadata.revision).padStart(6, '0')}.bundle.json`));
      const current = await readJson(paths.current);
      return { metadata, bundle, current };
    } catch (error) {
      if (error.code === 'ENOENT') throw new RelayStoreError('ACTION_NOT_FOUND', `Action ${actionId} was not found.`);
      throw error;
    }
  }

  async appendRevision({ actionId, bundle, current, upstreamEventId = null }) {
    return this.withLock(actionId, async () => {
      const existing = await this.getAction(actionId);
      if (upstreamEventId && existing.metadata.seen_upstream_event_ids.includes(upstreamEventId)) {
        return { ...existing, duplicate: true };
      }
      const revision = existing.metadata.revision + 1;
      const metadata = {
        ...existing.metadata,
        revision,
        updated_at: bundle.payload.created_at,
        seen_upstream_event_ids: upstreamEventId
          ? [...existing.metadata.seen_upstream_event_ids, upstreamEventId]
          : existing.metadata.seen_upstream_event_ids
      };
      const paths = this.paths(actionId);
      await writeJsonAtomic(join(paths.revisions, `${String(revision).padStart(6, '0')}.bundle.json`), bundle);
      await writeJsonAtomic(paths.current, current);
      await writeJsonAtomic(paths.metadata, metadata);
      return { metadata, bundle, current, duplicate: false };
    });
  }

  async listRevisions(actionId) {
    const paths = this.paths(actionId);
    await this.getAction(actionId);
    const names = (await readdir(paths.revisions)).filter((name) => /^\d{6}\.bundle\.json$/u.test(name)).sort();
    const result = [];
    for (const name of names) {
      const bundle = await readJson(join(paths.revisions, name));
      result.push({
        revision: Number(name.slice(0, 6)),
        bundle_id: bundle.payload.bundle_id,
        created_at: bundle.payload.created_at,
        predecessor_bundle_digests: bundle.payload.predecessor_bundle_digests
      });
    }
    return result;
  }
}
