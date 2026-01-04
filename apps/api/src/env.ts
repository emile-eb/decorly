import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  REVENUECAT_SECRET_KEY: z.string().min(1),
  REVENUECAT_WEBHOOK_SECRET: z.string().optional(),
  ENTITLEMENT_ID: z.string().default('pro'),
  PORT: z.coerce.number().default(4000)
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(): Env {
  return envSchema.parse(process.env);
}

