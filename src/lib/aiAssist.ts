// AI copy helpers for the Website Onboarding flow.
//
// Canonical module. The legacy path src/website-onboarding/lib/aiAssist.ts is
// now a thin re-export of this module so every existing importer gets the same
// behaviour (see the supabase.ts / supabaseClient.ts pattern).
//
// Resolution order (never throws — always returns usable copy):
//   1. SERVER-SIDE ROUTE  — POST /api/generate-bio and /api/improve-text.
//      The original source app (NEW-TAMPLETE-APP) proxied Gemini there with a
//      server-side GEMINI_API_KEY. If those serverless routes are deployed
//      alongside this SPA, this path is used and no key ever reaches the client.
//   2. CLIENT-SIDE GEMINI — direct call to the Gemini REST API using
//      VITE_GEMINI_API_KEY. Used when the /api routes are absent (the common
//      case for a static Vite/Vercel deploy). Because this key is bundled into
//      the browser build it MUST be a restricted/throwaway key in production;
//      prefer the serverless route when a real key is required.
//   3. RULE-BASED LOCAL   — identical template generator the original server
//      used when GEMINI_API_KEY was absent. Offline-safe and key-free.
//
// SECURITY NOTE: do not place a production GEMINI_API_KEY in VITE_GEMINI_API_KEY.
// Prefer deploying the /api serverless functions and setting GEMINI_API_KEY there.

export interface GenerateBioInput {
  name: string;
  role?: string;
  specialties?: string[] | string;
  salonName?: string;
}

export interface ImproveTextInput {
  text: string;
  field?: string;
  tone?: string;
  keywords?: string;
  instructions?: string;
}

const REQUEST_TIMEOUT_MS = 8000;
const GEMINI_MODEL = 'gemini-1.5-flash';

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

// ---------------------------------------------------------------------------
// Direct Gemini REST client (Google AI Studio API)
// ---------------------------------------------------------------------------

const geminiApiKey = (): string | null => {
  const key = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env
    ?.VITE_GEMINI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0 ? key.trim() : null;
};

/**
 * Call Gemini generateContent with a plain-text prompt. Resolves the model's
 * text reply, or null on any failure (missing key, network, non-200, empty).
 */
async function callGemini(prompt: string, maxOutputTokens = 300): Promise<string | null> {
  const key = geminiApiKey();
  if (!key) return null;
  if (typeof fetch !== 'function') return null;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : undefined;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens,
        },
      }),
      signal: controller?.signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const trimmed = typeof text === 'string' ? text.trim() : '';
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Rule-based local fallbacks (same output the original server produced when
// GEMINI_API_KEY was absent).
// ---------------------------------------------------------------------------

function localBio({ name, role, specialties, salonName }: GenerateBioInput): string {
  const list = Array.isArray(specialties) ? specialties : specialties ? [specialties] : [];
  const specText = list.length > 0 ? ` specializing in ${list.join(', ')}` : '';
  return `${name} is a talented ${role || 'stylist'}${specText} at ${
    salonName || 'our salon'
  }, dedicated to delivering exceptional craftsmanship and personalized client care.`;
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

const bioPrompt = ({ name, role, specialties, salonName }: GenerateBioInput): string =>
  `Write one short, warm, professional team-member biography of about 2-3 sentences for a beauty/salon business website. ` +
  `Name: ${name || '(unknown)'}.${role ? ` Role: ${role}.` : ''}${
    Array.isArray(specialties) ? ` Specialties: ${specialties.join(', ')}.` : specialties ? ` Specialties: ${specialties}.` : ''
  }${salonName ? ` Salon: ${salonName}.` : ''} Respond with the biography text only, no quotes, no labels.`;

const improvePrompt = ({
  text,
  field,
  tone,
  keywords,
  instructions,
}: ImproveTextInput): string =>
  `Rewrite the following ${field || 'text'} for a beauty/salon website to be more appealing and polished. ` +
  `${
    tone === 'luxurious'
      ? 'Use a luxurious, premium tone.'
      : tone === 'modern'
        ? 'Use a modern, trend-forward tone.'
        : tone === 'warm'
          ? 'Use a warm, welcoming tone.'
          : tone === 'minimalist'
            ? 'Use a clean, minimalist tone.'
            : 'Use a natural, friendly tone.'
  }` +
  `${keywords ? ` Incorporate these keywords: ${keywords}.` : ''}` +
  `${instructions ? ` Additional instruction: ${instructions}.` : ''}` +
  ` Keep it concise and end with a period. Original: "${text}" ` +
  `Respond with the rewritten text only.`;

// ---------------------------------------------------------------------------
// Public API (never throws)
// ---------------------------------------------------------------------------

/** Team-member biography. Never throws — always returns usable copy. */
export async function generateBio(input: GenerateBioInput): Promise<string> {
  if (!input.name?.trim()) return '';
  const remote = await postJson<{ bio?: string }>('/api/generate-bio', input);
  const bio = remote?.bio?.trim();
  if (bio && bio.length > 0) return bio;
  const geminiBio = await callGemini(bioPrompt(input));
  if (geminiBio && geminiBio.length > 0) return geminiBio;
  return localBio(input);
}

/** Copy rewrite used by the AI review / publish screens. Never throws. */
export async function improveText(input: ImproveTextInput): Promise<string> {
  if (!input.text?.trim()) return input.text ?? '';
  const remote = await postJson<{ rewritten?: string }>('/api/improve-text', input);
  const rewritten = remote?.rewritten?.trim();
  if (rewritten && rewritten.length > 0) return rewritten;
  const geminiRewrite = await callGemini(improvePrompt(input));
  if (geminiRewrite && geminiRewrite.length > 0) return geminiRewrite;
  return localImprove(input);
}
