import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import cors from '@fastify/cors';
import { config } from 'dotenv';
import { loadEnv } from './env.js';
import { jobsRoutes } from './routes/jobs.js';
import { webhooksRoutes } from './routes/webhooks.js';

// Allow local .env to override OS env during dev to simplify toggling
config({ override: true });
const env = loadEnv();

const app = Fastify({
  logger: true
});

await app.register(cors, { origin: true });
await app.register(sensible);

await app.register(jobsRoutes, { env });
await app.register(webhooksRoutes, { env });

const port = env.PORT;
app.listen({ port, host: '0.0.0.0' }).then(() => {
  app.log.info(`API listening on http://localhost:${port}`);
});
