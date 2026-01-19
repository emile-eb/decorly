// Minimal prompt builder for Google image generation (no analysis, no ChatGPT phrasing)
export function buildGoogleInteriorPrompt(input) {
    const lines = [];
    const style = input.style?.trim();
    if (!style)
        throw new Error('Missing style for Google interior prompt');
    if (input.roomType)
        lines.push(`Room type: ${input.roomType}.`);
    lines.push(`Restyle this room into a ${style} interior.`);
    lines.push('Preserve the exact architecture, wall positions, windows/doors, camera angle, and layout.');
    lines.push('Keep major furniture in the same positions and approximate sizes.');
    if (input.paletteLabel)
        lines.push(`Use this color palette: ${input.paletteLabel}.`);
    if (input.paletteColors?.length)
        lines.push(`Palette colors: ${input.paletteColors.join(', ')}.`);
    lines.push('Photorealistic, coherent lighting, high detail.');
    return lines.join('\n');
}
// Use Google AI Studio (Gemini) generateContent to produce an image (base64 inline)
export async function googleGenerateImage(env, prompt, imageBytes, mime = 'image/jpeg', opts) {
    if (!env.GOOGLE_API_KEY)
        throw new Error('GOOGLE_API_KEY not set');
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: env.GOOGLE_MODEL || 'gemini-3-pro-image-preview' });
    // Build contents with inlineData (base64) and prompt text, and request IMAGE response
    const parts = [];
    if (imageBytes && imageBytes.length > 0) {
        const b64 = Buffer.from(imageBytes).toString('base64');
        parts.push({ inlineData: { data: b64, mimeType: mime } });
    }
    parts.push({ text: prompt });
    if (env.DEBUG_OPENAI) {
        console.log('[worker] google request', {
            job_id: opts?.jobId || null,
            model: env.GOOGLE_MODEL || 'gemini-3-pro-image-preview',
            has_input_image: Boolean(imageBytes && imageBytes.length),
            input_image_bytes: imageBytes?.length || 0,
            prompt_length: prompt.length
        });
    }
    const result = await model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseModalities: ['IMAGE'] }
    });
    // Expect inline image data in parts; pick first inlineData if present
    const outParts = result?.response?.candidates?.[0]?.content?.parts || [];
    if (env.DEBUG_OPENAI) {
        const candCount = result?.response?.candidates?.length ?? 0;
        console.log('[worker] google response meta', { job_id: opts?.jobId || null, candidates: candCount, parts: outParts.length });
    }
    for (const p of outParts) {
        const inline = p?.inlineData || p?.inline_data;
        const mt = inline?.mimeType || inline?.mime_type;
        if (inline && typeof inline.data === 'string' && mt?.startsWith('image/')) {
            if (env.DEBUG_OPENAI) {
                console.log('[worker] google response', {
                    job_id: opts?.jobId || null,
                    has_inline_image: true,
                    mime: mt,
                    b64_len: inline.data.length
                });
            }
            return inline.data; // base64
        }
    }
    if (env.DEBUG_OPENAI) {
        let text = null;
        try {
            text = result?.response?.text?.() ?? null;
        }
        catch { }
        console.log('[worker] google response', { job_id: opts?.jobId || null, has_inline_image: false, text_preview: text ? String(text).slice(0, 160) : null });
    }
    // Some SDK versions use `result.response.text()` for text; no image found means null
    return null;
}
// Google in-painting (replace flow): pass base image + mask + instruction, expect IMAGE back
export async function googleInpaintImage(env, prompt, baseImageB64, maskImageB64, baseMime = 'image/jpeg', opts) {
    if (!env.GOOGLE_API_KEY)
        throw new Error('GOOGLE_API_KEY not set');
    const model = env.GOOGLE_MODEL || 'gemini-3-pro-image-preview';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GOOGLE_API_KEY}`;
    const payload = {
        contents: [
            {
                role: 'user',
                parts: [
                    { inlineData: { mimeType: baseMime, data: baseImageB64 } },
                    { inlineData: { mimeType: 'image/png', data: maskImageB64 } },
                    { text: prompt }
                ]
            }
        ],
        generationConfig: { responseModalities: ['IMAGE'] }
    };
    if (env.DEBUG_OPENAI) {
        console.log('[worker] google inpaint request', {
            job_id: opts?.jobId || null,
            model,
            base_bytes: baseImageB64?.length || 0,
            mask_bytes: maskImageB64?.length || 0,
            prompt_length: prompt.length
        });
    }
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (env.DEBUG_OPENAI) {
        console.log('[worker] google inpaint response headers', {
            job_id: opts?.jobId || null,
            status: res.status,
            contentType: res.headers.get('content-type') || null
        });
    }
    if (!res.ok) {
        const txt = await res.text();
        throw new Error(`google inpaint http ${res.status}: ${txt}`);
    }
    const json = (await res.json());
    const parts = json?.candidates?.[0]?.content?.parts || json?.response?.candidates?.[0]?.content?.parts || [];
    for (const p of parts) {
        const inline = p?.inlineData || p?.inline_data;
        const mt = inline?.mimeType || inline?.mime_type;
        if (inline && typeof inline.data === 'string' && mt?.startsWith('image/')) {
            if (env.DEBUG_OPENAI) {
                console.log('[worker] google inpaint response', { job_id: opts?.jobId || null, has_inline_image: true, mime: mt, b64_len: inline.data.length });
            }
            return inline.data;
        }
    }
    if (env.DEBUG_OPENAI) {
        console.log('[worker] google inpaint response', { job_id: opts?.jobId || null, has_inline_image: false });
    }
    return null;
}
