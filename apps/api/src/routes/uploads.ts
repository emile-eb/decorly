import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import type { Env } from '../env.js';
import { getUserFromToken } from '../supabase.js';
import { uploadBuffer } from '../storage.js';

const bodySchema = z.object({
  // Either full data URL or raw base64 + mime
  dataUrl: z.string().optional(),
  base64: z.string().optional(),
  mime: z.string().default('image/jpeg'),
  ext: z.string().default('jpg')
});

export const uploadsRoutes: FastifyPluginAsync<{ env: Env }> = async (app: FastifyInstance, opts) => {
  const env = opts.env;

  app.post('/v1/uploads', async (req, reply) => {
    try {
      const auth = req.headers.authorization;
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
      if (!token) {
        return reply.code(401).send({ error: 'Missing Bearer token' });
      }
      const user = await getUserFromToken(env, token);

      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: parsed.error.flatten() });
      }
      const { dataUrl, base64, mime, ext } = parsed.data;

      let b64 = base64;
      if (!b64 && dataUrl) {
        const idx = dataUrl.indexOf(',');
        if (idx >= 0) {
          b64 = dataUrl.slice(idx + 1);
        }
      }
      if (!b64) {
        return reply.code(400).send({ error: 'No image payload' });
      }
      const buf = Buffer.from(b64, 'base64');
      if (!buf || buf.length < 1000) {
        return reply.code(400).send({ error: 'Image too small' });
      }

      const filename = `${crypto.randomUUID()}.${(ext || 'jpg').replace(/[^a-z0-9]/gi, '')}`;
      const path = `${user.id}/${filename}`;
      await uploadBuffer(env, 'room_inputs', path, buf, mime || 'image/jpeg');

      return reply.send({ path });
    } catch (e: any) {
      req.log.error({ err: String(e?.message || e) }, 'upload failed');
      return reply.code(500).send({ error: 'Upload failed' });
    }
  });
};

