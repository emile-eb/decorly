import OpenAI from 'openai';
import type { Env } from './env.js';
import { buildPrompt } from './prompts.js';
import { downloadFromStorage } from './storage.js';
import { createHash } from 'crypto';
import { imageSize as sizeOf } from 'image-size';
import { PNG } from 'pngjs';
import { buildGoogleInteriorPrompt, googleGenerateImage, googleInpaintImage } from './google.js';
// Using a fixed input MIME for simplicity; remove external sniffing

function providerName(env: Env) {
  return env.IMAGE_PROVIDER || 'openai';
}

export function createOpenAI(env: Env) {
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

const INPUT_IMAGE_MIME = 'image/jpeg';

export async function analyzeRoom(env: Env, imageBytes: Uint8Array) {
  // For now, only OpenAI path supports vision analysis; others return empty object
  if (providerName(env) !== 'openai') {
    return {};
  }
  const client = createOpenAI(env);
  // Use a vision-capable model to produce structured JSON plan
  const mime = INPUT_IMAGE_MIME;
  const base64 = Buffer.from(imageBytes).toString('base64');
  if (env.DEBUG_OPENAI) {
    const sha = createHash('sha256').update(imageBytes).digest('hex');
    console.log('[openai] analyzeRoom image', { bytes: imageBytes.length || 0, sha256: sha, mime });
  }
  const prompt = `You are an interior design assistant. Analyze the provided room image and return a strict JSON with keys: layout, existing_style, improvements, shopping_list, color_palette. Keep it concise and valid JSON.`;
  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Return only JSON.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } }
        ] as any
      }
    ],
    temperature: 0.2
  });
  const text = resp.choices[0]?.message?.content ?? '{}';
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function describeMaterial(env: Env, sampleBytes: Uint8Array) {
  const client = createOpenAI(env);
  const matMime = INPUT_IMAGE_MIME;
  const base64 = Buffer.from(sampleBytes).toString('base64');
  const prompt = `You are a materials expert. Briefly describe this flooring/rug material sample in one or two sentences, calling out:
  - base color(s) and undertone
  - pattern or grain
  - sheen (matte, satin, glossy)
  - texture (smooth, coarse, low/high pile)
Keep it concise and purely descriptive.`;
  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Return a concise single-paragraph description.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${matMime};base64,${base64}` } }
        ] as any
      }
    ],
    temperature: 0.2
  });
  return resp.choices[0]?.message?.content?.trim() || '';
}

async function trySharpDims(buf: Uint8Array): Promise<{ width: number; height: number } | null> {
  try {
    // Dynamic import to avoid hard dependency in environments without sharp
    const sharpMod: any = await (Function('return import("sharp")')());
    const img = sharpMod.default ? sharpMod.default(buf) : sharpMod(buf);
    const meta = await img.metadata();
    if (meta?.width && meta?.height) return { width: meta.width, height: meta.height } as any;
    return null;
  } catch {
    return null;
  }
}

async function generateReplace(env: Env, inputImage: Uint8Array, constraints: any): Promise<{ buffer: Buffer; mode: 'edits'; promptPreview: string; promptHash: string }> {
  const userText = (constraints?.prompt || '').trim();
  const finalPrompt = `Replace the inpainted object with ${userText || 'the described new object'}, keep the rest of the image exactly the same. Preserve scene perspective, lighting, shadows, and materials to match the original.`;
  const maskPath = constraints?.maskPath as string | undefined;

  // If a precomputed mask image is present (white=edit, black=keep), use image edits
  if (maskPath) {
    try {
      const { bytes: maskBytes } = await downloadFromStorage(env, 'room_masks', maskPath);
      // If provider is Google, use in-painting via generateContent (image + mask)
      if (providerName(env) === 'google') {
        const baseB64 = Buffer.from(inputImage).toString('base64');
        const maskB64 = Buffer.from(maskBytes).toString('base64');
        const g = await googleInpaintImage(env, finalPrompt, baseB64, maskB64, INPUT_IMAGE_MIME, { jobId: constraints.__jobId });
        if (!g) throw new Error('google inpaint returned no image');
        const promptHash = createHash('sha256').update(finalPrompt).digest('hex');
        const promptPreview = finalPrompt.slice(0, 160);
        return { buffer: Buffer.from(g, 'base64'), mode: 'edits', promptPreview, promptHash };
      }
      // Validate mask and image dimensions using sharp if available, else fallback to image-size
      const inDimsS = await trySharpDims(inputImage);
      const maskDimsS = await trySharpDims(maskBytes);
      const inDims = inDimsS || (sizeOf(inputImage as unknown as Buffer) as any);
      const maskDims = maskDimsS || (sizeOf(maskBytes as unknown as Buffer) as any);
      if ((inDims?.width && maskDims?.width) && (inDims.width !== maskDims.width || inDims.height !== maskDims.height)) {
        throw new Error(`mask/image size mismatch: input=${inDims.width}x${inDims.height} mask=${maskDims.width}x${maskDims.height}`);
      }
      const b64 = await postImageEdit(env, inputImage, finalPrompt, maskBytes, {
        jobId: constraints.__jobId,
        contentType: constraints.__inputContentType,
        promptLength: String(finalPrompt).length,
        model: 'gpt-image-1',
        callType: 'edits'
      });
      if (b64) {
        const promptHash = createHash('sha256').update(finalPrompt).digest('hex');
        const promptPreview = finalPrompt.slice(0, 160);
        return { buffer: Buffer.from(b64, 'base64'), mode: 'edits', promptPreview, promptHash };
      }
    } catch (e: any) {
      console.error('replace edits failed', e?.status, e?.message || e);
      throw e;
    }
  }
  // If no mask was provided, create a full-edit transparent mask of the same size
  const dims = sizeOf(inputImage as unknown as Buffer);
  const w = dims.width || 1024;
  const h = dims.height || 1024;
  const fullEdit = new PNG({ width: w, height: h });
  const maskBuf = PNG.sync.write(fullEdit);
  const b64 = await postImageEdit(env, inputImage, finalPrompt, maskBuf, {
    jobId: constraints.__jobId,
    contentType: constraints.__inputContentType,
    promptLength: String(finalPrompt).length,
    model: 'gpt-image-1',
    callType: 'edits'
  });
  if (!b64) throw new Error('Image edits returned no data');
  const promptHash = createHash('sha256').update(finalPrompt).digest('hex');
  const promptPreview = finalPrompt.slice(0, 160);
  return { buffer: Buffer.from(b64, 'base64'), mode: 'edits', promptPreview, promptHash };
}

export async function generateRedesign(env: Env, analysis: unknown, style: string, constraints?: any): Promise<{ buffer: Buffer; mode: 'edits' | 'generate'; promptPreview: string; promptHash: string }> {
  // Build a richer prompt using domain-specific choices (defaults to interior)
  const flow = (constraints?.flow as string) || constraints?.mode || 'interior';
  if (flow === 'replace' && constraints?.__inputBytes) {
    return generateReplace(env, constraints.__inputBytes as Uint8Array, constraints);
  }
  const domain = (flow === 'floor'
    ? 'floor'
    : flow === 'garden'
    ? 'garden'
    : flow === 'paint'
    ? 'paint'
    : flow === 'exterior'
    ? 'exterior'
    : flow === 'declutter'
    ? 'declutter'
    : 'interior') as 'interior' | 'floor' | 'garden' | 'paint' | 'exterior' | 'declutter';
  let choices = constraints?.choices || {};
  if (domain === 'interior') {
    const roomType = constraints?.room_type || constraints?.roomType;
    const paletteLabel = constraints?.palette;
    const paletteColors = constraints?.palette_colors as string[] | undefined;
    choices = {
      ...choices,
      style, // ensure selected style is included
      roomType,
      // Normalize palette into a consistent shape consumed by the prompt builder
      ...(paletteLabel ? { palette: { label: paletteLabel, colors: paletteColors || [] } } : {}),
      ...(paletteColors ? { palette_colors: paletteColors } : {})
    };
  }
  if (domain === 'floor' && !choices.floorType && constraints?.floorType) {
    choices = { ...choices, floorType: constraints.floorType };
  }
  if (domain === 'garden') {
    // Normalize garden choices from constraints
    const areaType = constraints?.area_type || constraints?.areaType;
    const features = Array.isArray(constraints?.features) ? constraints.features : [];
    choices = { ...choices, areaType, style, features };
  }
  if (domain === 'paint') {
    // Normalize paint color from constraints
    if (constraints?.color && !choices.color) {
      choices = { ...choices, color: constraints.color };
    }
  }
  if (domain === 'exterior') {
    const houseType = constraints?.house_type || constraints?.houseType;
    const palette = constraints?.palette;
    const palette_colors = constraints?.palette_colors;
    choices = { ...choices, houseType, style, palette, palette_colors };
  }
  // If a material sample image path is provided, analyze it and incorporate description (floor only)
  if (domain === 'floor' && constraints?.materialSamplePath && !choices.materialDesc) {
    try {
      const bucket = constraints.materialSampleBucket || 'room_inputs';
      const { bytes } = await downloadFromStorage(env, bucket, constraints.materialSamplePath);
      const desc = await describeMaterial(env, bytes);
      choices = { ...choices, materialDesc: desc };
    } catch {}
  }
  let prompt = await buildPrompt(env, { domain, choices, analysis });
  if (env.DEBUG_OPENAI) {
    console.log('[openai] prompt built', {
      domain,
      override: Boolean(env.INTERIOR_PROMPT_OVERRIDE_TEXT),
      promptPreview: String(prompt).slice(0, 200)
    });
  }
  const desc = `Analysis: ${JSON.stringify(analysis)}.`;
  // Tighten prompting: omit analysis text for interior/declutter to reduce drift
  let finalPrompt = (domain === 'interior' || domain === 'declutter') ? prompt : `${prompt}\n${desc}`;

  const provider = providerName(env);
  if (provider === 'google') {
    // Build a minimal prompt for Google; do not use edits (generateContent only)
    if (domain === 'interior') {
      const styleVal = (choices.style === 'Custom' ? (choices.customStyle || '') : (choices.style || '')).trim();
      const palLabel = (choices.palette?.label as string | undefined) || (choices.palette as string | undefined) || (choices.palette_label as string | undefined);
      const palColors = (choices.palette?.colors as string[] | undefined) || (choices.palette_colors as string[] | undefined);
      const roomType = (choices.roomType as string | undefined) || (choices.room_type as string | undefined);
      finalPrompt = buildGoogleInteriorPrompt({ style: styleVal, roomType, paletteLabel: palLabel, paletteColors: palColors });
    }
  }
  const promptHash = createHash('sha256').update(finalPrompt).digest('hex');
  const promptPreview = finalPrompt.slice(0, 160);
  // Prefer image edits with the original image to better preserve structure
  const inputBytes = constraints?.__inputBytes as Uint8Array | undefined;
  if (inputBytes && provider !== 'google') {
    try {
      const dims = sizeOf(inputBytes as unknown as Buffer);
      const w = dims.width || 1024;
      const h = dims.height || 1024;
      // Fully transparent mask = allow edits everywhere
      const fullEdit = new PNG({ width: w, height: h });
      // pngjs initializes data to 0 (transparent) – which means edit everywhere
      const maskBuf = PNG.sync.write(fullEdit);
      console.log('[worker] openai request', {
        job_id: constraints.__jobId,
        openai_call_type: 'edits',
        model: 'gpt-image-1',
        has_input_image: true,
        input_image_bytes: inputBytes.length || 0,
        input_content_type: constraints.__inputContentType || INPUT_IMAGE_MIME,
        has_mask: true,
        mask_bytes: maskBuf.length || 0,
        prompt_length: finalPrompt.length
      });
      const b64e = await postImageEdit(env, inputBytes, finalPrompt, maskBuf, {
        jobId: constraints.__jobId,
        contentType: constraints.__inputContentType,
        promptLength: finalPrompt.length,
        model: 'gpt-image-1',
        callType: 'edits'
      });
      if (b64e) {
        console.log('[worker] openai response', { job_id: constraints.__jobId, openai_call_type: 'edits', has_b64: true });
        return { buffer: Buffer.from(b64e, 'base64'), mode: 'edits', promptPreview, promptHash };
      }
    } catch (e: any) {
      console.error('interior edits failed', e?.status, e?.message || e);
      throw e;
    }
  }
  // Prompt-only generate (non image-to-image or provider without edits)
  const hasInputForGenerate = Boolean(constraints.__inputBytes) && provider === 'google';
  const note = provider === 'google'
    ? (hasInputForGenerate ? 'google generateContent (image+prompt)' : 'google generateContent (prompt-only)')
    : 'prompt-only mode intentionally used';
  console.log('[worker] openai request', {
    job_id: constraints.__jobId,
    openai_call_type: 'generate',
    model: provider === 'google' ? env.GOOGLE_MODEL : 'gpt-image-1',
    has_input_image: hasInputForGenerate,
    input_image_bytes: hasInputForGenerate ? (constraints.__inputBytes?.length || 0) : 0,
    input_content_type: hasInputForGenerate ? (constraints.__inputContentType || INPUT_IMAGE_MIME) : null,
    has_mask: false,
    mask_bytes: 0,
    prompt_length: finalPrompt.length,
    note
  });
  let g = await imageGenerate(env, finalPrompt, hasInputForGenerate ? { imageBytes: constraints.__inputBytes as Uint8Array, mime: constraints.__inputContentType || INPUT_IMAGE_MIME, jobId: constraints.__jobId } : { jobId: constraints.__jobId });
  if (!g) throw new Error('Image generation failed');
  console.log('[worker] openai response', { job_id: constraints.__jobId, openai_call_type: 'generate', has_b64: Boolean(g) });
  return { buffer: Buffer.from(g, 'base64'), mode: 'generate', promptPreview, promptHash };
}

// Provider-agnostic image edits
async function postImageEdit(env: Env, imageBytes: Uint8Array, prompt: string, maskBytes: Uint8Array, opts?: { jobId?: string; contentType?: string; promptLength?: number; model?: string; callType?: 'edits' }): Promise<string | null> {
  const provider = providerName(env);
  if (provider === 'nanobanana') {
    return postNanoBananaEdit(env, imageBytes, prompt, maskBytes, opts);
  }
  // OpenAI path: Use REST multipart with Blob to ensure a true file upload
  // Use REST multipart with Blob to ensure a true file upload; avoids SDK edge cases in some runtimes
  const url = 'https://api.openai.com/v1/images/edits';
  const form = new FormData();
  form.append('model', 'gpt-image-1');
  form.append('prompt', prompt);
  form.append('size', '1024x1024');
  form.append('input_fidelity', 'high');
  if (typeof File === 'undefined') {
    throw new Error('Runtime missing global File. Requires Node 18+ or a File polyfill.');
  }
  const imgFile = new File([imageBytes as any], 'input.jpg', { type: INPUT_IMAGE_MIME });
  const maskFile = new File([maskBytes as any], 'mask.png', { type: 'image/png' });
  form.append('image', imgFile as any);
  form.append('mask', maskFile as any);
  if (env.DEBUG_OPENAI) {
    const imgSha = createHash('sha256').update(imageBytes).digest('hex');
    const maskSha = createHash('sha256').update(maskBytes).digest('hex');
    console.log('[worker] openai request', {
      job_id: opts?.jobId || null,
      openai_call_type: opts?.callType || 'edits',
      model: opts?.model || 'gpt-image-1',
      has_input_image: true,
      input_image_bytes: imageBytes.length || 0,
      input_content_type: opts?.contentType || INPUT_IMAGE_MIME,
      has_mask: true,
      mask_bytes: maskBytes.length || 0,
      prompt_length: opts?.promptLength ?? String(prompt).length
    });
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form as any
  });
  console.log('[worker] openai response headers', {
    job_id: opts?.jobId || null,
    openai_call_type: opts?.callType || 'edits',
    requestId: res.headers.get('x-request-id') || null,
    status: res.status,
    contentType: res.headers.get('content-type') || null
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`edits http ${res.status}: ${txt}`);
  }
  const json = (await res.json()) as any;
  const b64 = json?.data?.[0]?.b64_json || '';
  console.log('[worker] openai response', { job_id: opts?.jobId || null, openai_call_type: opts?.callType || 'edits', has_b64: Boolean(b64) });
  return (b64 as any) || null;
}

// Provider-agnostic prompt-only generation
async function imageGenerate(env: Env, prompt: string, opts?: { imageBytes?: Uint8Array; mime?: string; jobId?: string }): Promise<string | null> {
  const provider = providerName(env);
  if (provider === 'nanobanana') {
    return nanoBananaGenerate(env, prompt);
  }
  if (provider === 'google') {
    return googleGenerateImage(env, prompt, opts?.imageBytes, opts?.mime, { jobId: opts?.jobId });
  }
  const client = createOpenAI(env);
  const gen = await client.images.generate({ model: 'gpt-image-1', prompt, size: '1024x1024' });
  return gen.data?.[0]?.b64_json || null;
}

// Nano Banana provider implementations (REST shape assumed similar to OpenAI)
async function postNanoBananaEdit(env: Env, imageBytes: Uint8Array, prompt: string, maskBytes: Uint8Array, opts?: { jobId?: string; contentType?: string; promptLength?: number; model?: string; callType?: 'edits' }): Promise<string | null> {
  if (!env.NB_API_URL || !env.NB_API_KEY) throw new Error('NanoBanana provider missing NB_API_URL or NB_API_KEY');
  if (typeof File === 'undefined') throw new Error('Runtime missing global File. Requires Node 18+ or a File polyfill.');
  const form = new FormData();
  form.append('model', env.NB_MODEL || 'nano-banana-pro');
  form.append('prompt', prompt);
  form.append('size', '1024x1024');
  form.append('input_fidelity', 'high');
  const imgFile = new File([imageBytes as any], 'input.jpg', { type: INPUT_IMAGE_MIME });
  const maskFile = new File([maskBytes as any], 'mask.png', { type: 'image/png' });
  form.append('image', imgFile as any);
  form.append('mask', maskFile as any);
  console.log('[worker] provider request', {
    provider: 'nanobanana',
    job_id: opts?.jobId || null,
    call_type: 'edits',
    model: env.NB_MODEL || 'nano-banana-pro',
    has_input_image: true,
    input_image_bytes: imageBytes.length || 0,
    has_mask: true,
    mask_bytes: maskBytes.length || 0,
    prompt_length: opts?.promptLength ?? String(prompt).length
  });
  const res = await fetch(`${env.NB_API_URL}/v1/images/edits`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.NB_API_KEY}` },
    body: form as any
  });
  console.log('[worker] provider response headers', {
    provider: 'nanobanana',
    job_id: opts?.jobId || null,
    call_type: 'edits',
    status: res.status,
    contentType: res.headers.get('content-type') || null
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`nanobanana edits http ${res.status}: ${txt}`);
  }
  const json = (await res.json()) as any;
  const b64 = json?.data?.[0]?.b64_json || null;
  console.log('[worker] provider response', { provider: 'nanobanana', job_id: opts?.jobId || null, call_type: 'edits', has_b64: Boolean(b64) });
  return b64;
}

async function nanoBananaGenerate(env: Env, prompt: string): Promise<string | null> {
  if (!env.NB_API_URL || !env.NB_API_KEY) throw new Error('NanoBanana provider missing NB_API_URL or NB_API_KEY');
  const res = await fetch(`${env.NB_API_URL}/v1/images/generations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.NB_API_KEY}` },
    body: JSON.stringify({ model: env.NB_MODEL || 'nano-banana-pro', prompt, size: '1024x1024' })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`nanobanana generate http ${res.status}: ${txt}`);
  }
  const json = (await res.json()) as any;
  return json?.data?.[0]?.b64_json || null;
}
