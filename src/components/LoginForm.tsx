import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  User,
  Lock,
  AlertCircle,
  Mail,
  CheckCircle2,
  X,
  Phone,
  MapPin,
  UserPlus,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { createNumericRef } from '../utils/id';
import { supabase, supabaseConfigError } from '../lib/supabaseClient';
import { isGrowthPartnerRole } from '../lib/gpRepository';

type AuthMode = 'login' | 'signup';

const PARTNER_PROFILE_KEY = 'nexora_partner_profile';
const REGISTERED_PARTNERS_KEY = 'nexora_registered_partners';

interface SignupErrors {
  fullName?: string;
  mobile?: string;
  email?: string;
  city?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidMobile = (v: string) => /^\d{10}$/.test(v.trim());

/** Builds a partner code like NX-JA-4821 from the partner's city. */
function buildAgentCode(city: string): string {
  const letters = (city.replace(/[^a-zA-Z]/g, '').slice(0, 2) || 'IN').toUpperCase();
  return `NX-${letters}-${createNumericRef(4)}`;
}

export default function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);

  // ---------------- Login state ----------------
  // Read the remembered username during lazy initialisation so the input is
  // already populated on the very first paint (no empty-then-filled flash).
  const [username, setUsername] = useState(() => {
    try {
      return localStorage.getItem('rememberedUsername') || '';
    } catch {
      return '';
    }
  });
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return Boolean(localStorage.getItem('rememberedUsername'));
    } catch {
      return false;
    }
  });
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [passwordStrength, setPasswordStrength] = useState({ minLength: false, hasNumber: false, hasUpper: false });
  const [message, setMessage] = useState<{ type: 'error' | 'warning' | 'info' | 'success'; text: string } | null>(null);

  // ---------------- Sign up state ----------------
  const [suName, setSuName] = useState('');
  const [suMobile, setSuMobile] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suCity, setSuCity] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suTerms, setSuTerms] = useState(false);
  const [suErrors, setSuErrors] = useState<SignupErrors>({});
  const [suSubmitting, setSuSubmitting] = useState(false);
  const [suStrength, setSuStrength] = useState({ minLength: false, hasNumber: false, hasUpper: false });

  // ---------------- Forgot password state ----------------
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resetError, setResetError] = useState('');

  const validateUsername = (val: string) => {
    return (!isValidEmail(val) && !isValidMobile(val))
      ? 'Please enter a valid 10-digit mobile number or email.'
      : '';
  };

  const scorePassword = (val: string) => ({
    minLength: val.length >= 6,
    hasNumber: /\d/.test(val),
    hasUpper: /[A-Z]/.test(val),
  });

  const checkPasswordStrength = (val: string) => {
    const s = scorePassword(val);
    setPasswordStrength(s);
    return (!s.minLength || !s.hasNumber || !s.hasUpper)
      ? 'Password does not meet complexity requirements.'
      : '';
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setMessage(null);
    setShowPassword(false);
    setErrors({ username: '', password: '' });
    setSuErrors({});
  };

  const [authBusy, setAuthBusy] = useState(false);

  // ---------------- Login submit ----------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authBusy) return;

    const usernameError = validateUsername(username);
    if (usernameError || !password) {
      setErrors({
        username: usernameError,
        password: !password ? 'Please enter your password.' : '',
      });
      return;
    }

    if (!supabase) {
      setErrors({ username: supabaseConfigError || 'Supabase is not configured.', password: '' });
      return;
    }

    if (!isValidEmail(username)) {
      setErrors({
        username: 'Please sign in with the email address you registered with.',
        password: '',
      });
      return;
    }

    setAuthBusy(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username.trim().toLowerCase(),
        password,
      });
      if (error) {
        setErrors({ username: '', password: 'Invalid email or password. Please try again.' });
        return;
      }
      const userId = data.user?.id;
      if (!userId) {
        setErrors({ username: '', password: 'Sign-in failed. Please try again.' });
        return;
      }

      // Permanent-role guard: only Growth Partners may enter this app.
      const roleCheck = await isGrowthPartnerRole(supabase, userId);
      if (!roleCheck.allowed) {
        await supabase.auth.signOut({ scope: 'global' }).catch(() => {});
        await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
        setErrors({
          username: '',
          password: roleCheck.foundRole
            ? `This account is registered as "${roleCheck.foundRole}" and cannot access the Growth Partner app.`
            : 'This account does not have a Growth Partner role assigned yet.',
        });
        return;
      }

      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }
      onLoginSuccess();
    } catch (err) {
      console.warn('Sign-in failed:', err);
      setErrors({ username: '', password: 'Sign-in failed. Check your connection and try again.' });
    } finally {
      setAuthBusy(false);
    }
  };

  // ---------------- Sign up submit ----------------
  const validateSignup = (): SignupErrors => {
    const next: SignupErrors = {};

    if (!suName.trim()) next.fullName = 'Please enter your full name.';
    else if (suName.trim().length < 3) next.fullName = 'Name must be at least 3 characters.';

    if (!suMobile.trim()) next.mobile = 'Please enter your mobile number.';
    else if (!isValidMobile(suMobile)) next.mobile = 'Enter a valid 10-digit mobile number.';

    if (!suEmail.trim()) next.email = 'Please enter your email address.';
    else if (!isValidEmail(suEmail)) next.email = 'Enter a valid email address.';

    if (!suCity.trim()) next.city = 'Please enter your city.';

    const s = scorePassword(suPassword);
    if (!suPassword) next.password = 'Please create a password.';
    else if (!s.minLength || !s.hasNumber || !s.hasUpper) {
      next.password = 'Password must meet all requirements below.';
    }

    if (!suConfirm) next.confirmPassword = 'Please confirm your password.';
    else if (suConfirm !== suPassword) next.confirmPassword = 'Passwords do not match.';

    if (!suTerms) next.terms = 'Please accept the Partner Terms to continue.';

    return next;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateSignup();
    setSuErrors(found);
    if (Object.keys(found).length > 0) return;

    const mobile = suMobile.trim();
    const email = suEmail.trim().toLowerCase();

    setSuSubmitting(true);

    const name = suName.trim().replace(/\s+/g, ' ');
    const city = suCity.trim();

    try {
      if (!supabase) {
        setSuErrors({ email: supabaseConfigError || 'Supabase is not configured.' });
        setSuSubmitting(false);
        return;
      }
      // Real account in the shared Nexora project. The Growth Partner role is
      // assigned by Nexora ops (permanent roles are locked server-side) — the
      // frontend must NEVER claim a role in signup metadata.
      const { data, error } = await supabase.auth.signUp({
        email,
        password: suPassword,
        options: {
          data: {
            full_name: name,
            mobile,
            city,
            partner_code: buildAgentCode(city),
          },
        },
      });
      if (error) {
        setSuErrors({
          email: error.message.includes('already registered')
            ? 'This email is already registered. Please sign in instead.'
            : `Sign-up failed: ${error.message}`,
        });
        setSuSubmitting(false);
        return;
      }

      localStorage.setItem('rememberedUsername', email);

      if (!data.session) {
        // Email confirmation required before first sign-in.
        setMessage({
          type: 'success',
          text: 'Account created! Check your email to confirm your address, then sign in.',
        });
        setSuSubmitting(false);
        switchMode('login');
        return;
      }

      // Signup success ≠ application access. A fresh account is always a
      // plain customer until Nexora ops assigns the permanent Growth Partner
      // role, so run the same authorization gate as login before entering.
      const signupUserId = data.user?.id;
      if (signupUserId) {
        const roleCheck = await isGrowthPartnerRole(supabase, signupUserId);
        if (!roleCheck.allowed) {
          await supabase.auth.signOut({ scope: 'global' }).catch(() => {});
          await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
          setSuSubmitting(false);
          switchMode('login');
          setMessage({
            type: 'success',
            text:
              'Account created! Your Growth Partner role is assigned by Nexora ops after verification. ' +
              'You can sign in to this app once your role is activated — until then the Customer app works with this account.',
          });
          return;
        }
      }

      setSuSubmitting(false);
      onLoginSuccess();
    } catch (err) {
      console.warn('Sign-up failed:', err);
      setSuErrors({ email: 'Sign-up failed. Check your connection and try again.' });
      setSuSubmitting(false);
    }
  };

  const handleOpenForgot = () => {
    setResetEmail(username || '');
    setResetError('');
    setResetStatus('idle');
    setIsForgotOpen(true);
  };

  const handleSendResetLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = resetEmail.trim().toLowerCase();
    if (!target) {
      setResetError('Please enter your registered email address.');
      return;
    }
    if (!isValidEmail(target)) {
      setResetError('Password reset works with your registered email address (not mobile).');
      return;
    }
    if (!supabase) {
      setResetError(supabaseConfigError || 'Supabase is not configured.');
      return;
    }
    setResetError('');
    setResetStatus('sending');
    // Real Supabase Auth recovery. The API deliberately answers identically
    // for registered and unregistered emails (anti-enumeration), so the UI
    // always shows the same neutral confirmation.
    const { error } = await supabase.auth.resetPasswordForEmail(target, {
      redirectTo: `${window.location.origin}/`,
    });
    if (error) {
      setResetStatus('idle');
      setResetError(`Could not send the reset link: ${error.message}`);
      return;
    }
    setResetStatus('sent');
  };

  const fieldWrap = (hasError?: string) =>
    `flex items-center bg-[#f0edec] rounded-[14px] h-[56px] px-4 border ${
      hasError ? 'border-[#93000a]' : 'border-transparent'
    } focus-within:border-[#b90064] focus-within:shadow-[0_0_0_4px_rgba(185,0,100,0.1)] transition-all`;

  const inputCls =
    'bg-transparent border-none outline-none w-full text-base text-[#1b1c1b] placeholder:text-[#5a3f47]/50';

  return (
    <div className="bg-white rounded-[18px] p-6 w-full shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e4e2e1] relative">
      {/* Mode switcher */}
      <div
        className="flex items-center gap-1 p-1 bg-[#f0edec] rounded-[14px] mb-5"
        role="tablist"
        aria-label="Choose login or sign up"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'login'}
          onClick={() => switchMode('login')}
          className={`flex-1 h-11 rounded-[11px] text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mode === 'login'
              ? 'bg-white text-[#b90064] shadow-sm'
              : 'text-[#5a3f47] hover:text-[#b90064]'
          }`}
        >
          <LogIn size={16} />
          Login
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          onClick={() => switchMode('signup')}
          className={`flex-1 h-11 rounded-[11px] text-sm font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            mode === 'signup'
              ? 'bg-white text-[#b90064] shadow-sm'
              : 'text-[#5a3f47] hover:text-[#b90064]'
          }`}
        >
          <UserPlus size={16} />
          Sign Up
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'error'
              ? 'bg-[#ffdad6] text-[#93000a]'
              : message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : 'bg-[#fde7f3] text-[#b90064]'
          }`}
        >
          <AlertCircle size={18} />
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* ------------------------------- LOGIN ------------------------------- */}
      {mode === 'login' && (
        <form className="space-y-4" onSubmit={handleLogin} noValidate>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#5a3f47]">Mobile Number or Email</label>
            <div className={fieldWrap(errors.username)}>
              <User className="text-[#5a3f47] mr-2" size={20} />
              <input
                className={inputCls}
                placeholder="Enter details"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrors((prev) => ({ ...prev, username: validateUsername(e.target.value) }));
                }}
              />
            </div>
            {errors.username && <p className="text-xs text-[#93000a] mt-1">{errors.username}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#5a3f47]">Password</label>
            <div className={fieldWrap(errors.password)}>
              <Lock className="text-[#5a3f47] mr-2" size={20} />
              <input
                className={inputCls}
                placeholder="Enter password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: checkPasswordStrength(e.target.value) }));
                }}
              />
              <button
                className="ml-2 text-[#b90064] cursor-pointer"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-[#93000a] mt-1">{errors.password}</p>}
            <div className="text-xs space-y-1 mt-2">
              <p className={passwordStrength.minLength ? 'text-[#2E7D32]' : 'text-[#8e6f77]'}>• Min 6 characters</p>
              <p className={passwordStrength.hasNumber ? 'text-[#2E7D32]' : 'text-[#8e6f77]'}>• At least one number</p>
              <p className={passwordStrength.hasUpper ? 'text-[#2E7D32]' : 'text-[#8e6f77]'}>• At least one uppercase letter</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                className="h-5 w-5 text-[#b90064] border-[#8e6f77] rounded-full"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="text-sm text-[#5a3f47]">Remember Me</span>
            </label>
            <button
              type="button"
              onClick={handleOpenForgot}
              className="text-sm font-medium text-[#b90064] hover:underline cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>

          <button
            className="w-full h-[56px] bg-[#e6007e] text-white font-medium text-sm rounded-[16px] transition-transform active:scale-95 hover:opacity-90 cursor-pointer"
            type="submit"
          >
            Login
          </button>

          <p className="text-center text-sm text-[#5a3f47] pt-1">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="font-semibold text-[#b90064] hover:underline cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        </form>
      )}

      {/* ------------------------------- SIGN UP ------------------------------ */}
      {mode === 'signup' && (
        // noValidate: the browser's native bubble for type="email"/"tel" aborts
        // submit before handleSignup runs, which hid every other field error and
        // only surfaced one problem at a time.
        <form className="space-y-4" onSubmit={handleSignup} noValidate>
          <div className="flex items-start gap-2.5 p-3 bg-[#FDE7F3] rounded-xl border border-[#e2bdc7]">
            <ShieldCheck className="text-[#b90064] shrink-0 mt-0.5" size={18} />
            <p className="text-[11px] leading-relaxed text-[#5a3f47]">
              Register as a <strong className="text-[#b90064]">Nexora Growth Partner</strong> to onboard shops,
              track QR earnings and claim milestone rewards.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#5a3f47]">Full Name *</label>
            <div className={fieldWrap(suErrors.fullName)}>
              <User className="text-[#5a3f47] mr-2" size={20} />
              <input
                className={inputCls}
                placeholder="e.g. Rahul Verma"
                type="text"
                autoComplete="name"
                value={suName}
                onChange={(e) => {
                  setSuName(e.target.value);
                  if (suErrors.fullName) setSuErrors((p) => ({ ...p, fullName: undefined }));
                }}
              />
            </div>
            {suErrors.fullName && <p className="text-xs text-[#93000a] mt-1">{suErrors.fullName}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#5a3f47]">Mobile Number *</label>
            <div className={fieldWrap(suErrors.mobile)}>
              <Phone className="text-[#5a3f47] mr-2" size={20} />
              <span className="text-base text-[#5a3f47] mr-1.5 select-none">+91</span>
              <input
                className={inputCls}
                placeholder="9876543210"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel-national"
                value={suMobile}
                onChange={(e) => {
                  setSuMobile(e.target.value.replace(/\D/g, '').slice(0, 10));
                  if (suErrors.mobile) setSuErrors((p) => ({ ...p, mobile: undefined }));
                }}
              />
            </div>
            {suErrors.mobile && <p className="text-xs text-[#93000a] mt-1">{suErrors.mobile}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#5a3f47]">Email Address *</label>
            <div className={fieldWrap(suErrors.email)}>
              <Mail className="text-[#5a3f47] mr-2" size={20} />
              <input
                className={inputCls}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                value={suEmail}
                onChange={(e) => {
                  setSuEmail(e.target.value);
                  if (suErrors.email) setSuErrors((p) => ({ ...p, email: undefined }));
                }}
              />
            </div>
            {suErrors.email && <p className="text-xs text-[#93000a] mt-1">{suErrors.email}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#5a3f47]">City *</label>
            <div className={fieldWrap(suErrors.city)}>
              <MapPin className="text-[#5a3f47] mr-2" size={20} />
              <input
                className={inputCls}
                placeholder="e.g. Jaipur, Rajasthan"
                type="text"
                autoComplete="address-level2"
                value={suCity}
                onChange={(e) => {
                  setSuCity(e.target.value);
                  if (suErrors.city) setSuErrors((p) => ({ ...p, city: undefined }));
                }}
              />
            </div>
            {suErrors.city && <p className="text-xs text-[#93000a] mt-1">{suErrors.city}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#5a3f47]">Create Password *</label>
            <div className={fieldWrap(suErrors.password)}>
              <Lock className="text-[#5a3f47] mr-2" size={20} />
              <input
                className={inputCls}
                placeholder="Create a strong password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={suPassword}
                onChange={(e) => {
                  setSuPassword(e.target.value);
                  setSuStrength(scorePassword(e.target.value));
                  if (suErrors.password) setSuErrors((p) => ({ ...p, password: undefined }));
                }}
              />
              <button
                className="ml-2 text-[#b90064] cursor-pointer"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {suErrors.password && <p className="text-xs text-[#93000a] mt-1">{suErrors.password}</p>}
            <div className="text-xs space-y-1 mt-2">
              <p className={suStrength.minLength ? 'text-[#2E7D32]' : 'text-[#8e6f77]'}>• Min 6 characters</p>
              <p className={suStrength.hasNumber ? 'text-[#2E7D32]' : 'text-[#8e6f77]'}>• At least one number</p>
              <p className={suStrength.hasUpper ? 'text-[#2E7D32]' : 'text-[#8e6f77]'}>• At least one uppercase letter</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#5a3f47]">Confirm Password *</label>
            <div className={fieldWrap(suErrors.confirmPassword)}>
              <Lock className="text-[#5a3f47] mr-2" size={20} />
              <input
                className={inputCls}
                placeholder="Re-enter your password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={suConfirm}
                onChange={(e) => {
                  setSuConfirm(e.target.value);
                  if (suErrors.confirmPassword) setSuErrors((p) => ({ ...p, confirmPassword: undefined }));
                }}
              />
              {suConfirm.length > 0 && suConfirm === suPassword && (
                <CheckCircle2 className="ml-2 text-[#2E7D32] shrink-0" size={20} />
              )}
            </div>
            {suErrors.confirmPassword && (
              <p className="text-xs text-[#93000a] mt-1">{suErrors.confirmPassword}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="flex items-start space-x-2 cursor-pointer">
              <input
                className="h-4 w-4 mt-0.5 accent-[#b90064] shrink-0"
                type="checkbox"
                checked={suTerms}
                onChange={(e) => {
                  setSuTerms(e.target.checked);
                  if (suErrors.terms) setSuErrors((p) => ({ ...p, terms: undefined }));
                }}
              />
              <span className="text-xs text-[#5a3f47] leading-relaxed">
                I agree to the <span className="text-[#b90064] font-semibold">Partner Terms</span> and{' '}
                <span className="text-[#b90064] font-semibold">Privacy Policy</span>, and confirm the details
                above are correct.
              </span>
            </label>
            {suErrors.terms && <p className="text-xs text-[#93000a] mt-1">{suErrors.terms}</p>}
          </div>

          <button
            className="w-full h-[56px] bg-[#e6007e] text-white font-medium text-sm rounded-[16px] transition-transform active:scale-95 hover:opacity-90 cursor-pointer disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
            type="submit"
            disabled={suSubmitting}
          >
            {suSubmitting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                <span>Creating your account…</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Partner Account</span>
              </>
            )}
          </button>

          <p className="text-center text-sm text-[#5a3f47] pt-1">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="font-semibold text-[#b90064] hover:underline cursor-pointer"
            >
              Login
            </button>
          </p>
        </form>
      )}

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl border border-gray-100 relative text-left animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setIsForgotOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {resetStatus === 'sent' ? (
              <div className="text-center py-3 space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Check Your Email</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  If <strong className="text-gray-900">{resetEmail}</strong> is registered with Nexora,
                  a password reset link has been sent to it. Please check your inbox and spam folder —
                  the link works only once and expires soon.
                </p>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="w-full h-12 bg-[#b90064] text-white font-bold text-sm rounded-xl hover:bg-[#b90064]/90 transition-colors cursor-pointer"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendResetLink} className="space-y-4">
                <div className="flex items-center gap-2.5 text-[#b90064] mb-1">
                  <div className="p-2 bg-[#FDE7F3] rounded-xl">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Forgot Password</h3>
                    <p className="text-xs text-gray-500">Reset your login credentials</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  Enter your registered email address and Supabase will send you a secure, one-time
                  link to reset your password.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 ml-1">Registered Email</label>
                  <div className="flex items-center bg-[#f0edec] rounded-xl h-12 px-3.5 border border-transparent focus-within:border-[#b90064] transition-all">
                    <Mail className="text-gray-500 mr-2 shrink-0" size={18} />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. rajesh@example.com"
                      className="bg-transparent border-none outline-none w-full text-xs text-gray-900 placeholder:text-gray-400 font-medium"
                    />
                  </div>
                  {resetError && <p className="text-[11px] text-[#93000a] mt-1 font-medium">{resetError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={resetStatus === 'sending'}
                  className="w-full h-12 bg-[#b90064] text-white font-bold text-sm rounded-xl hover:bg-[#b90064]/90 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {resetStatus === 'sending' ? <span>Sending Reset Link...</span> : <span>Send Reset Link</span>}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
