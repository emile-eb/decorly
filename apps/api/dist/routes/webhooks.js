// For MVP we log webhook and return 200
export const webhooksRoutes = async (app) => {
    app.post('/v1/webhooks/revenuecat', async (req, reply) => {
        // TODO: verify signature if available. For now, log minimal info.
        req.log.info({ body: req.body }, 'RevenueCat webhook received');
        return reply.code(200).send({ ok: true });
    });
};
