import { z } from 'zod';
import { createSupabaseAdmin, getUserFromToken } from '../supabase.js';
import { checkRevenueCatEntitlement } from '../revenuecat.js';
import { createSignedUrl } from '../storage.js';
const bodySchema = z.object({
    style: z.string().min(1),
    constraints: z.record(z.any()).optional(),
    inputImagePath: z.string().min(1)
});
export const jobsRoutes = async (app, opts) => {
    const env = opts.env;
    const supabase = createSupabaseAdmin(env);
    app.post('/v1/jobs', async (req, reply) => {
        try {
            const auth = req.headers.authorization;
            const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
            if (!token) {
                req.log.warn({ hasAuth: false }, 'missing bearer token');
                return reply.code(401).send({ error: 'Missing Bearer token' });
            }
            const user = await getUserFromToken(env, token);
            const parsed = bodySchema.safeParse(req.body);
            if (!parsed.success) {
                req.log.warn({ issues: parsed.error.issues?.slice(0, 3) }, 'invalid body');
                return reply.code(400).send({ error: parsed.error.flatten() });
            }
            // Enforce RevenueCat entitlement server-side (allow bypass in dev)
            if (!env.SKIP_ENTITLEMENTS) {
                const rc = await checkRevenueCatEntitlement(env, user.id);
                if (!rc.entitled)
                    return reply.code(402).send({ error: 'Subscription required' });
            }
            const { style, constraints, inputImagePath } = parsed.data;
            const { data, error } = await supabase
                .from('jobs')
                .insert({
                user_id: user.id,
                status: 'queued',
                style,
                constraints: constraints ?? {},
                input_image_path: inputImagePath
            })
                .select('id')
                .single();
            if (error)
                throw error;
            return reply.send({ jobId: data.id });
        }
        catch (e) {
            req.log.error({ err: String(e?.message || e) }, 'create job failed');
            return reply.code(500).send({ error: 'Failed to create job' });
        }
    });
    app.get('/v1/jobs/:id', async (req, reply) => {
        try {
            const auth = req.headers.authorization;
            const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
            if (!token)
                return reply.code(401).send({ error: 'Missing Bearer token' });
            const user = await getUserFromToken(env, token);
            const id = req.params.id;
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', id)
                .eq('user_id', user.id)
                .single();
            if (error || !data)
                return reply.code(404).send({ error: 'Not found' });
            // Attach signed URLs
            const inputSigned = await createSignedUrl(env, 'room_inputs', data.input_image_path, 3600);
            let outputSigned = [];
            if (Array.isArray(data.output_image_paths) && data.output_image_paths.length) {
                try {
                    outputSigned = await Promise.all(data.output_image_paths.map((p) => createSignedUrl(env, 'room_outputs', p, 3600)));
                }
                catch (e) {
                    req.log.error({ id, err: String(e?.message || e) }, 'signed url generation failed');
                }
            }
            req.log.info({ id, status: data.status, hasOutputs: Array.isArray(data.output_image_paths) && data.output_image_paths.length > 0, outputsCount: data.output_image_paths?.length || 0 }, 'jobs.get detail');
            return reply.send({
                ...data,
                inputSignedUrl: inputSigned,
                outputSignedUrls: outputSigned
            });
        }
        catch (e) {
            req.log.error(e);
            return reply.code(500).send({ error: 'Failed to fetch job' });
        }
    });
    app.get('/v1/jobs', async (req, reply) => {
        try {
            const auth = req.headers.authorization;
            const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
            if (!token)
                return reply.code(401).send({ error: 'Missing Bearer token' });
            const user = await getUserFromToken(env, token);
            const { data, error } = await supabase
                .from('jobs')
                .select('id, status, style, created_at, updated_at, input_image_path, output_image_paths')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return reply.send(data);
        }
        catch (e) {
            req.log.error(e);
            return reply.code(500).send({ error: 'Failed to list jobs' });
        }
    });
};
