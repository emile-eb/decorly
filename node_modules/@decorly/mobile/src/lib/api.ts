import { CONFIG } from './config';
import { supabase } from './supabase';

// In-memory demo store
const demoJobs = new Map<string, any>();
function demoCreate(inputLocalUri?: string) {
  const id = crypto.randomUUID();
  const job = {
    id,
    status: 'queued',
    style: 'modern',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    inputSignedUrl: inputLocalUri || 'https://picsum.photos/seed/input/800/600',
    outputSignedUrls: [] as string[],
    analysis: null
  };
  demoJobs.set(id, job);
  setTimeout(() => {
    const after = `https://picsum.photos/seed/${id}/1024/1024`;
    const j = demoJobs.get(id);
    if (!j) return;
    j.status = 'complete';
    j.updated_at = new Date().toISOString();
    j.outputSignedUrls = [after];
    demoJobs.set(id, j);
  }, 2000);
  return { jobId: id };
}

async function authHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('No auth session');
  return { Authorization: `Bearer ${token}` };
}

export async function createJob(params: { style: string; constraints?: any; inputImagePath: string }) {
  if (CONFIG.DEMO_MODE) {
    // Attach inputLocalUri if provided via hacked property
    const anyParams = params as any;
    return demoCreate(anyParams.__demoLocalUri);
  }
  const headers = await authHeader();
  const res = await fetch(`${CONFIG.API_BASE_URL}/v1/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ jobId: string }>;
}

export async function getJob(id: string) {
  if (CONFIG.DEMO_MODE) {
    const j = demoJobs.get(id);
    if (!j) throw new Error('Not found');
    return j;
  }
  const headers = await authHeader();
  const res = await fetch(`${CONFIG.API_BASE_URL}/v1/jobs/${id}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function listJobs() {
  if (CONFIG.DEMO_MODE) {
    return Array.from(demoJobs.values()).sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }
  const headers = await authHeader();
  const res = await fetch(`${CONFIG.API_BASE_URL}/v1/jobs`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
