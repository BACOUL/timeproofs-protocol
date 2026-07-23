import { createServer } from 'node:http';
import { URL } from 'node:url';
import { RelayServiceError, RelayStoreError } from './service.mjs';

const MAX_BODY_BYTES = 1024 * 1024;

function sendJson(response, statusCode, value) {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store'
  });
  response.end(body);
}

async function readBody(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > MAX_BODY_BYTES) throw new RelayServiceError('BODY_TOO_LARGE', 'Request body exceeds 1 MiB.', 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function actionRoute(pathname) {
  const match = /^\/v1\/actions\/([^/]+)(?:\/(bundle|packet|revisions))?$/u.exec(pathname);
  if (!match) return null;
  return { actionId: decodeURIComponent(match[1]), resource: match[2] ?? 'current' };
}

export function createRelayHttpServer({ service }) {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'GET' && url.pathname === '/healthz') {
        return sendJson(response, 200, { status: 'ok', service: 'timeproofs-relay', version: '0.1.0-alpha.0' });
      }
      if (request.method === 'GET' && url.pathname === '/v1/issuer') {
        return sendJson(response, 200, service.issuer);
      }
      if (request.method === 'POST' && url.pathname === '/v1/actions') {
        const raw = await readBody(request);
        let body;
        try { body = JSON.parse(raw.toString('utf8')); }
        catch { throw new RelayServiceError('JSON_INVALID', 'Request body must be valid JSON.', 400); }
        const result = await service.createAction(body);
        return sendJson(response, 201, { metadata: result.metadata, current: result.current, packet: result.packet });
      }
      if (request.method === 'POST' && url.pathname === '/v1/webhooks/stripe') {
        const raw = await readBody(request);
        const result = await service.ingestStripeWebhook({
          rawBody: raw,
          signatureHeader: request.headers['stripe-signature']
        });
        return sendJson(response, result.duplicate ? 200 : 202, {
          duplicate: result.duplicate === true,
          metadata: result.metadata,
          current: result.current,
          packet: result.packet ?? null
        });
      }
      const route = actionRoute(url.pathname);
      if (request.method === 'GET' && route) {
        if (route.resource === 'packet') return sendJson(response, 200, await service.getPacket(route.actionId));
        if (route.resource === 'revisions') return sendJson(response, 200, { action_id: route.actionId, revisions: await service.listRevisions(route.actionId) });
        const action = await service.getAction(route.actionId);
        if (route.resource === 'bundle') return sendJson(response, 200, action.bundle);
        return sendJson(response, 200, { metadata: action.metadata, current: action.current });
      }
      sendJson(response, 404, { error: { code: 'ROUTE_NOT_FOUND', message: 'Route not found.' } });
    } catch (error) {
      const known = error instanceof RelayServiceError || error instanceof RelayStoreError;
      const statusCode = error.statusCode ?? (error.code === 'ACTION_NOT_FOUND' ? 404 : error.code === 'ACTION_ALREADY_EXISTS' ? 409 : 400);
      sendJson(response, known ? statusCode : 500, {
        error: {
          code: known ? error.code : 'INTERNAL_ERROR',
          message: known ? error.message : 'Unexpected Relay error.'
        }
      });
    }
  });
}
