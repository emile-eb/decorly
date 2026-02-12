import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import { config } from 'dotenv';
import { loadEnv } from './env.js';
import { jobsRoutes } from './routes/jobs.js';
import { webhooksRoutes } from './routes/webhooks.js';
import { uploadsRoutes } from './routes/uploads.js';
// Allow local .env to override OS env during dev to simplify toggling
config({ override: process.env.NODE_ENV !== 'production' });
const env = loadEnv();
const app = Fastify({
    logger: true
});
await app.register(cors, { origin: true });
await app.register(sensible);
// Minimal request/response logging for debugging
app.addHook('onRequest', async (req) => {
    req.log.info({ method: req.method, url: req.url, hasAuth: Boolean(req.headers.authorization) }, 'incoming');
});
app.addHook('onResponse', async (req, reply) => {
    req.log.info({ method: req.method, url: req.url, statusCode: reply.statusCode }, 'completed');
});
await app.register(jobsRoutes, { env });
await app.register(webhooksRoutes, { env });
await app.register(uploadsRoutes, { env });
// Simple health endpoints for quick checks/warmups
app.get('/', async (_req, reply) => reply.code(200).send({ ok: true }));
app.get('/health', async (_req, reply) => reply.code(200).send({ ok: true }));
const port = Number(process.env.PORT) || env.PORT;
app.listen({ port, host: '0.0.0.0' }).then(() => {
    app.log.info(`API listening on http://localhost:${port}`);
});
