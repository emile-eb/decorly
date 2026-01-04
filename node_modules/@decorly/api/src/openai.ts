import OpenAI from 'openai';
import type { Env } from './env';

export function createOpenAI(env: Env) {
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

export async function analyzeRoom(env: Env, imageBytes: Uint8Array) {
  const client = createOpenAI(env);
  // Use a vision-capable model to produce structured JSON plan
  const base64 = Buffer.from(imageBytes).toString('base64');
  const prompt = `You are an interior design assistant. Analyze the provided room image and return a strict JSON with keys: layout, existing_style, improvements, shopping_list, color_palette. Keep it concise and valid JSON.`;
  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Return only JSON.' },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'input_image', image_url: `data:image/jpeg;base64,${base64}` }
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

export async function generateRedesign(env: Env, analysis: unknown, style: string, constraints?: unknown) {
  const client = createOpenAI(env);
  const prompt = `Generate an edited room image applying the style: ${style}. Consider analysis and constraints to produce a photorealistic redesign of the room.`;
  const desc = `Analysis: ${JSON.stringify(analysis)}. Constraints: ${JSON.stringify(constraints ?? {})}`;
  const image = await client.images.generate({
    model: 'gpt-image-1',
    prompt: `${prompt}\n${desc}`,
    size: '1024x1024'
  });
  const b64 = image.data[0]?.b64_json;
  if (!b64) throw new Error('Image generation failed');
  return Buffer.from(b64, 'base64');
}

