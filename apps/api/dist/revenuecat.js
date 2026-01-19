export async function checkRevenueCatEntitlement(env, appUserId) {
    // Minimal entitlement check against RevenueCat subscribers API
    // Docs: https://www.revenuecat.com/docs/api-v1#tag/Subscribers/operation/get_subscribers_subscriber_id
    const url = `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`;
    const res = await fetch(url, {
        headers: {
            Authorization: `Bearer ${env.REVENUECAT_SECRET_KEY}`,
            Accept: 'application/json'
        }
    });
    if (!res.ok) {
        return { entitled: false };
    }
    const json = (await res.json());
    const entitlements = json?.subscriber?.entitlements ?? {};
    const entitlement = entitlements[env.ENTITLEMENT_ID];
    const active = Boolean(entitlement?.expires_date === null || new Date(entitlement?.expires_date) > new Date());
    return { entitled: active, raw: json };
}
