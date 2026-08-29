// Compatibility shim — the canonical AI assist module lives in
// src/lib/aiAssist.ts. Every existing `import { generateBio, improveText } from
// '../lib/aiAssist'` continues to resolve to the SAME implementation, which now
// tries the serverless /api routes first, then a direct Gemini call via
// VITE_GEMINI_API_KEY, then a rule-based local fallback. Do not import both
// modules expecting different behaviour.
export * from '../../lib/aiAssist';
export { generateBio, improveText } from '../../lib/aiAssist';
export type { GenerateBioInput, ImproveTextInput } from '../../lib/aiAssist';
