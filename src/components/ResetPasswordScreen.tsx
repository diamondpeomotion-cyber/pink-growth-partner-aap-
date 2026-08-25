import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type ResetView = 'checking' | 'form' | 'submitting' | 'success' | 'invalid';

interface ResetPasswordScreenProps {
  /** True while App.tsx is still resolving whether a recovery session exists. */
  verifying: boolean;
  /** Set when the recovery link was already known-bad (error params in URL). */
  initialError: string | null;
  /** Called after a successful update — parent wipes the recovery session and returns to login. */
  onCompleted: () => void;
  /** User bails out of the recovery flow (invalid link → back to login to request a new one). */
  onExit: () => void;
}

/**
 * Reset-password surface driven by a REAL Supabase recovery session.
 * Nothing renders the password form unless Supabase Auth accepted the
 * recovery token (PASSWORD_RECOVERY) — an invalid/expired/revoked/missing
 * link can never be used to set a password. Passwords live only in
 * transient component state; Supabase Auth is the sole store.
 */
export default function ResetPasswordScreen({
  verifying,
  initialError,
  onCompleted,
  onExit,
}: ResetPasswordScreenProps) {
  const [view, setView] = useState<ResetView>(initialError ? 'invalid' : 'checking');
  const [errorText, setErrorText] = useState<string>(
    initialError ?? 'This reset link is invalid, expired or was already used.',
  );
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldError, setFieldError] = useState('');
  // Mount time captured in a lazy initializer (impure call only in the
  // initializer, never during render) — used to expire 'checking' screens.
  const [mountedAt] = useState(() => Date.now());

  // Recovery session watch: Supabase fires PASSWORD_RECOVERY when the link's
  // tokens are accepted. If the event was consumed before this screen
  // mounted, getSession() still returns the recovery session — both paths
  // unlock the form. Anything else (dead/reused link) expires into 'invalid'.
  useEffect(() => {
    if (initialError || !supabase) return;
    let settled = false;
    // Unlock the form ONLY after the recovery session is validated against
    // the server. Hash-accepted tokens that were silently revoked (link
    // already used, session killed) fail getUser() with 401/403 → invalid.
    const markInvalid = (msg: string) => {
      if (settled) return;
      settled = true;
      setErrorText(msg);
      setView('invalid');
    };
    const settleWithServerCheck = () => {
      if (settled) return;
      supabase!.auth
        .getUser()
        .then(({ data, error }) => {
          if (settled) return;
          if (data?.user && !error) {
            settled = true;
            setView('form');
            return;
          }
          const status = (error as { status?: number } | null)?.status;
          if (status === 400 || status === 401 || status === 403) {
            markInvalid('This reset link is invalid, expired or was already used. Request a fresh one.');
          }
          // transient/network error → stay in 'checking'; fail-over timer decides
        })
        .catch(() => {});
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // PASSWORD_RECOVERY = legacy direct-hash consumption;
      // SIGNED_IN = the recovery session established via auth.setSession()
      // (PKCE client — see lib/supabase.ts). Either way, while this screen
      // owns the UI the arriving session IS the recovery session.
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session && !settled) {
        settleWithServerCheck();
      }
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session && !settled) settleWithServerCheck();
      })
      .catch(() => {});
    const failTimer = window.setTimeout(() => {
      markInvalid('This reset link is invalid, expired or was already used. Request a fresh one.');
    }, 8000);
    return () => {
      window.clearTimeout(failTimer);
      sub.subscription.unsubscribe();
    };
  }, [initialError]);

  // App-level verification finished and still no recovery session → invalid.
  // The state transition is deferred by a microtask so the effect never sets
  // state synchronously (react-hooks v7 set-state-in-effect); behaviour is
  // unchanged.
  useEffect(() => {
    if (!verifying && view === 'checking' && Date.now() - mountedAt > 1500) {
      queueMicrotask(() => {
        setErrorText('This reset link is invalid, expired or was already used. Request a fresh one.');
        setView('invalid');
      });
    }
  }, [verifying, view, mountedAt]);

  const score = (val: string) => ({
    minLength: val.length >= 6,
    hasNumber: /\d/.test(val),
    hasUpper: /[A-Z]/.test(val),
  });
  const s = score(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!s.minLength || !s.hasNumber || !s.hasUpper) {
      setFieldError('Password must be 6+ characters with a number and an uppercase letter.');
      return;
    }
    if (password !== confirm) {
      setFieldError('Passwords do not match.');
      return;
    }
    setFieldError('');
    setView('submitting');
    // Supabase Auth owns the password. The recovery session issued by the
    // emailed link is what authorizes this update call.
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setView('form');
      const msg = error.message || '';
      setFieldError(
        /same as the old/i.test(msg) || /different from the old/i.test(msg)
          ? 'New password must be different from your current password.'
          : `Could not update password: ${msg}`,
      );
      return;
    }
    // Password is NEVER kept in state beyond this submit, never persisted.
    setPassword('');
    setConfirm('');
    setView('success');
  };

  const inputWrap =
    'flex items-center bg-[#f0edec] rounded-[14px] h-[56px] px-4 border border-transparent focus-within:border-[#b90064] focus-within:shadow-[0_0_0_4px_rgba(185,0,100,0.1)] transition-all w-full';
  const inputCls =
    'bg-transparent border-none outline-none w-full text-base text-[#1b1c1b] placeholder:text-[#5a3f47]/50';

  return (
    <div className="min-h-screen bg-[#fcf9f8] flex items-center justify-center p-6">
      <div className="bg-white rounded-[18px] p-6 w-full max-w-md shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e4e2e1]">
        {view === 'checking' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-9 h-9 rounded-full border-2 border-pink-200 border-t-primary animate-spin" />
            <p className="text-xs font-semibold text-gray-400">Verifying your reset link…</p>
          </div>
        )}

        {view === 'invalid' && (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 bg-red-50 text-[#93000a] rounded-full flex items-center justify-center mx-auto border border-red-100">
              <ShieldAlert size={30} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Reset link not valid</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{errorText}</p>
            <button
              type="button"
              onClick={onExit}
              className="w-full h-12 bg-[#b90064] text-white font-bold text-sm rounded-xl hover:bg-[#b90064]/90 transition-colors cursor-pointer"
            >
              Back to Login — request a new link
            </button>
          </div>
        )}

        {view === 'success' && (
          <div className="text-center space-y-4 py-2">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 size={30} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Password updated!</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your new password is active immediately. The old password and this reset link no longer
              work — sign in with your new password.
            </p>
            <button
              type="button"
              onClick={onCompleted}
              className="w-full h-12 bg-[#b90064] text-white font-bold text-sm rounded-xl hover:bg-[#b90064]/90 transition-colors cursor-pointer"
            >
              Continue to Login
            </button>
          </div>
        )}

        {(view === 'form' || view === 'submitting') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={onExit}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Set a new password</h2>
              <p className="text-xs text-gray-500 mt-1">
                Reset link verified by Supabase Auth. Choose a strong password you have not used here
                before.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 ml-1">New Password</label>
              <div className={inputWrap}>
                <Lock className="text-gray-400 mr-2 shrink-0" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="text-[11px] text-gray-400 space-y-0.5 ml-1 pt-1">
                <p className={s.minLength ? 'text-emerald-600' : ''}>• Min 6 characters</p>
                <p className={s.hasNumber ? 'text-emerald-600' : ''}>• At least one number</p>
                <p className={s.hasUpper ? 'text-emerald-600' : ''}>• At least one uppercase letter</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-600 ml-1">Confirm New Password</label>
              <div className={inputWrap}>
                <Lock className="text-gray-400 mr-2 shrink-0" size={18} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer shrink-0"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {fieldError && (
              <p className="text-xs text-[#93000a] font-medium flex items-center gap-1.5">
                <AlertCircle size={14} /> {fieldError}
              </p>
            )}

            <button
              type="submit"
              disabled={view === 'submitting'}
              className="w-full h-12 bg-[#b90064] text-white font-bold text-sm rounded-xl hover:bg-[#b90064]/90 transition-all cursor-pointer disabled:opacity-60"
            >
              {view === 'submitting' ? 'Updating Password…' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
