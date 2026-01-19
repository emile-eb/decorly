import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  REVENUECAT_SECRET_KEY: z.string().min(1),
  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),
  ENTITLEMENT_ID: z.string().default('pro'),
  PORT: z.coerce.number().default(4000),
  // Dev-only switch to bypass entitlement checks (for local web testing)
  SKIP_ENTITLEMENTS: z.coerce.boolean().default(false),
  // Optional: use a simplified prompt for interior flow
  // Dev-only: pass through interior input image as output (no generation)
  PASS_THROUGH_INTERIOR: z.coerce.boolean().default(false),
  // Debug: extra logging around OpenAI requests
  DEBUG_OPENAI: z.coerce.boolean().default(false),
  // Optional: force a custom long-form interior prompt when SIMPLE_INTERIOR_PROMPT is false
  INTERIOR_PROMPT_OVERRIDE_TEXT: z.string().optional(),
  // Image model provider selection: 'openai' | 'nanobanana'
  IMAGE_PROVIDER: z.enum(['openai', 'nanobanana', 'google']).default('openai'),
  // Nano Banana provider config
  NB_API_URL: z.string().url().optional(),
  NB_API_KEY: z.string().optional(),
  NB_MODEL: z.string().default('nano-banana-pro')
  ,
  // Google AI Studio (Gemini) - prompt-only image generation
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLE_MODEL: z.string().default('gemini-3-pro-image-preview')
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  const env = envSchema.parse(process.env);
  // Provider-specific validation to avoid requiring unused keys
  const provider = env.IMAGE_PROVIDER as string | undefined;
  if (provider === 'openai' && !env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required when IMAGE_PROVIDER=openai');
  }
  if (provider === 'nanobanana' && (!env.NB_API_URL || !env.NB_API_KEY)) {
    throw new Error('NB_API_URL and NB_API_KEY are required when IMAGE_PROVIDER=nanobanana');
  }
  if (provider === 'google' && !env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY is required when IMAGE_PROVIDER=google');
  }
  return env;
}
