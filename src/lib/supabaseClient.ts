// Compatibility shim — the canonical Nexora client lives in ./supabase.
//
// Every existing `import { supabase, … } from '../lib/supabaseClient'`
// continues to resolve, and — critically — resolves to the SAME singleton
// client. Do not import both modules expecting different clients, and never
// call createClient() again in this app: a second instance would be a second
// auth system with its own storage slot and its own onAuthStateChange fan-out.
//
// This shim also re-exposes the environment diagnostics so a single import
// path can both talk to Supabase and explain why it can't. See
// `getSupabaseEnvDiagnostics` in ./supabase for structured per-variable checks.
export * from './supabase';
export { getSupabaseEnvDiagnostics } from './supabase';
export type { SupabaseEnvDiagnostics } from './supabase';
