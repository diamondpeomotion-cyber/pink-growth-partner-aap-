// AI copy helpers for the Website Onboarding flow.
//
// The source onboarding app (NEW-TAMPLETE-APP) called its own Express routes
// `/api/generate-bio` and `/api/improve-text`, which proxied Gemini using a
// SERVER-side GEMINI_API_KEY. The Growth Partner PWA is a static Vite/Vercel
// SPA with no Node server, and no model key may ever reach the browser.
//
// So this module keeps the exact same contract:
//   1. try the same-origin endpoint (works unchanged if/when the API routes are
//      deployed alongside the app — nothing here holds a key),
//   2. otherwise fall back to the identical rule-based generator the original
//      server used when GEMINI_API_KEY was absent.
// Result: the onboarding screens behave the same, offline-safe, key-free.

const REQUEST_TIMEOUT_MS = 8000;

/** Same-origin POST with a hard timeout; resolves null on any failure. */
async function postJson<T>(path: string, body: unknown): Promise<T | null> {
  if (typeof fetch !== 'function') return null;
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : undefined;
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller?.signal,
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    // A SPA rewrite returns index.html for unknown /api paths — ignore it.
    if (!contentType.includes('application/json')) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface GenerateBioInput {
  name: string;
  role?: string;
  specialties?: string[] | string;
  salonName?: string;
}

function localBio({ name, role, specialties, salonName }: GenerateBioInput): string {
  const list = Array.isArray(specialties) ? specialties : specialties ? [specialties] : [];
  const specText = list.length > 0 ? ` specializing in ${list.join(', ')}` : '';
  return `${name} is a talented ${role || 'stylist'}${specText} at ${
    salonName || 'our salon'
  }, dedicated to delivering exceptional craftsmanship and personalized client care.`;
}

/** Team-member biography. Never throws — always returns usable copy. */
export async function generateBio(input: GenerateBioInput): Promise<string> {
  if (!input.name?.trim()) return '';
  const remote = await postJson<{ bio?: string }>('/api/generate-bio', input);
  const bio = remote?.bio?.trim();
  return bio && bio.length > 0 ? bio : localBio(input);
}

export interface ImproveTextInput {
  text: string;
  field?: string;
  tone?: string;
  keywords?: string;
  instructions?: string;
}

function localImprove({ text, field, tone, keywords, instructions }: ImproveTextInput): string {
  let suffix: string;
  if (tone === 'luxurious') {
    suffix = ' with absolute luxury, customized treatments, and bespoke artistry.';
  } else if (tone === 'modern') {
    suffix = ' featuring state-of-the-art styling, trendsetting aesthetics, and vibrant energy.';
  } else if (tone === 'warm') {
    suffix = ' where customized hospitality meets incredible talent and warm smiles.';
  } else if (tone === 'minimalist') {
    suffix = ' focusing on organic simplicity, clean styling, and natural, authentic beauty.';
  } else {
    suffix = ' designed to make you look and feel your absolute best.';
  }

  if (keywords) suffix += ` Crafted using premium ${keywords}.`;

  if (instructions && instructions.toLowerCase().includes('spanish')) {
    return '¡Bienvenido! Descubra lo mejor en estilo y cuidado premium para el cabello.';
  }
  if (field === 'heroHeadline') {
    return text.length < 15 ? `${text} — Premium Salon Styling` : text;
  }
  const cleanText = text.replace(/[.!?]+$/, '');
  return `${cleanText}${suffix}`;
}

/** Copy rewrite used by the AI review / publish screens. Never throws. */
export async function improveText(input: ImproveTextInput): Promise<string> {
  if (!input.text?.trim()) return input.text ?? '';
  const remote = await postJson<{ rewritten?: string }>('/api/improve-text', input);
  const rewritten = remote?.rewritten?.trim();
  return rewritten && rewritten.length > 0 ? rewritten : localImprove(input);
}
