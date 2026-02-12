import { CONFIG } from './config';
import { supabase } from './supabase';
import { isPro } from './purchases';

// Quick visibility: confirm which API base URL the app is using on device
// This logs once when the API module is loaded
console.log('[mobile] API_BASE_URL', CONFIG.API_BASE_URL);

async function ensureAuthHeader() {
  // Try to get an existing session; if missing, create an anonymous one
  let { data } = await supabase.auth.getSession();
  let token = data.session?.access_token;
  if (!token) {
    try {
      await supabase.auth.signInAnonymously();
      ({ data } = await supabase.auth.getSession());
      token = data.session?.access_token;
    } catch {}
  }
  if (!token) throw new Error('No auth session');
  return { Authorization: `Bearer ${token}` };
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

async function fetchWithRetry(input: RequestInfo | URL, init: RequestInit = {}, attempts = 3, timeoutMs = 8000) {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs * Math.pow(1.5, i));
    try {
      const res = await fetch(input, { ...init, signal: controller.signal } as any);
      clearTimeout(id);
      if (res.ok) return res;
      // Retry on 502/503/504 (cold start / transient)
      if ([502, 503, 504].includes(res.status) && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 300 * (i + 1)));
        continue;
      }
      // Non-retryable HTTP error
      const text = await res.text();
      const err: any = new Error(text || `Request failed with status ${res.status}`);
      err.statusCode = res.status;
      throw err;
    } catch (e: any) {
      clearTimeout(id);
      lastErr = e?.name === 'AbortError' ? new Error('Network timeout') : e;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 300 * (i + 1)));
        continue;
      }
    }
  }
  throw lastErr || new Error('Request failed');
}

export async function createJob(params: { style: string; constraints?: any; inputImagePath: string }) {
  if (!__DEV__) {
    const entitled = await isPro();
    if (!entitled) {
      const err: any = new Error('Subscription required');
      err.statusCode = 402;
      throw err;
    }
  }
  const headers = await ensureAuthHeader();
  const payload = {
    style: params.style,
    constraints: params.constraints,
    inputImagePath: params.inputImagePath
  } as any;
  console.log('[api] createJob -> POST /v1/jobs', {
    style: payload.style,
    inputImagePath: typeof payload.inputImagePath === 'string',
    constraintKeys: payload.constraints ? Object.keys(payload.constraints) : []
  });
  const url = joinUrl(CONFIG.API_BASE_URL, '/v1/jobs');
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(payload)
  });
  const json = (await res.json()) as { jobId: string };
  console.log('[api] createJob success', json);
  return json;
}

export async function getJob(id: string) {
  const headers = await ensureAuthHeader();
  const url = joinUrl(CONFIG.API_BASE_URL, `/v1/jobs/${id}`);
  const res = await fetchWithRetry(url, { headers }, 2);
  if (!res.ok) {
    const text = await res.text();
    console.error('[api] getJob failed', { id, status: res.status, body: text });
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function listJobs() {
  const headers = await ensureAuthHeader();
  const url = joinUrl(CONFIG.API_BASE_URL, '/v1/jobs');
  const res = await fetchWithRetry(url, { headers }, 2);
  if (!res.ok) {
    const text = await res.text();
    console.error('[api] listJobs failed', { status: res.status, body: text });
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// Optional: warm the API to reduce cold start impact on free tiers
export async function wakeApi() {
  try {
    const url = joinUrl(CONFIG.API_BASE_URL, '/health');
    await fetchWithRetry(url, {}, 1, 4000);
  } catch {
    // ignore warmup errors
  }
}
