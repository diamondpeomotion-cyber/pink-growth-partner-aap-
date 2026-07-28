
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, AlertCircle, Mail, CheckCircle2, X } from 'lucide-react';

export default function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [passwordStrength, setPasswordStrength] = useState({ minLength: false, hasNumber: false, hasUpper: false });
  const [message, setMessage] = useState<{ type: 'error' | 'warning' | 'info'; text: string } | null>(null);

  // Forgot password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [resetError, setResetError] = useState('');

  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const validateUsername = (val: string) => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const isMobile = /^\d{10}$/.test(val);
    return (!isEmail && !isMobile) ? 'Please enter a valid 10-digit mobile number or email.' : '';
  };

  const checkPasswordStrength = (val: string) => {
    setPasswordStrength({
      minLength: val.length >= 6,
      hasNumber: /\d/.test(val),
      hasUpper: /[A-Z]/.test(val),
    });
    return (val.length < 6 || !/\d/.test(val) || !/[A-Z]/.test(val)) ? 'Password does not meet complexity requirements.' : '';
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const usernameError = validateUsername(username);
    const passwordError = checkPasswordStrength(password);
    
    if (usernameError || passwordError) {
      setErrors({ username: usernameError, password: passwordError });
      return;
    }
    
    // Proceed with login without credential check
    if (rememberMe) {
      localStorage.setItem('rememberedUsername', username);
    } else {
      localStorage.removeItem('rememberedUsername');
    }
    onLoginSuccess();
  };

  const handleOpenForgot = () => {
    setResetEmail(username || '');
    setResetError('');
    setResetStatus('idle');
    setIsForgotOpen(true);
  };

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Please enter your registered email address or mobile number.');
      return;
    }
    setResetError('');
    setResetStatus('sending');

    setTimeout(() => {
      setResetStatus('sent');
    }, 1200);
  };

  return (
    <div className="bg-white rounded-[18px] p-6 w-full shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e4e2e1] relative">
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${message.type === 'error' ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#fde7f3] text-[#b90064]'}`}>
          <AlertCircle size={18} />
          <span className="text-sm">{message.text}</span>
        </div>
      )}
      <form className="space-y-4" onSubmit={handleLogin}>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#5a3f47]">Mobile Number or Email</label>
          <div className={`flex items-center bg-[#f0edec] rounded-[14px] h-[56px] px-4 border ${errors.username ? 'border-[#93000a]' : 'border-transparent'} focus-within:border-[#b90064] focus-within:shadow-[0_0_0_4px_rgba(185,0,100,0.1)] transition-all`}>
            <User className="text-[#5a3f47] mr-2" size={20} />
            <input 
              className="bg-transparent border-none outline-none w-full text-base text-[#1b1c1b] placeholder:text-[#5a3f47]/50" 
              placeholder="Enter details" 
              type="text" 
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors(prev => ({ ...prev, username: validateUsername(e.target.value) }));
              }}
            />
          </div>
          {errors.username && <p className="text-xs text-[#93000a] mt-1">{errors.username}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-[#5a3f47]">Password</label>
          <div className={`flex items-center bg-[#f0edec] rounded-[14px] h-[56px] px-4 border ${errors.password ? 'border-[#93000a]' : 'border-transparent'} focus-within:border-[#b90064] focus-within:shadow-[0_0_0_4px_rgba(185,0,100,0.1)] transition-all`}>
            <Lock className="text-[#5a3f47] mr-2" size={20} />
            <input 
              className="bg-transparent border-none outline-none w-full text-base text-[#1b1c1b] placeholder:text-[#5a3f47]/50" 
              placeholder="Enter password" 
              type={showPassword ? 'text' : 'password'} 
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors(prev => ({ ...prev, password: checkPasswordStrength(e.target.value) }));
              }}
            />
            <button className="ml-2 text-[#b90064] cursor-pointer" type="button" onClick={() => setShowPassword(!showPassword)}>
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
        <button className="w-full h-[56px] bg-[#e6007e] text-white font-medium text-sm rounded-[16px] transition-transform active:scale-95 hover:opacity-90 cursor-pointer" type="submit">
          Login
        </button>
      </form>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-2xl border border-gray-100 relative text-left animate-in fade-in zoom-in-95 duration-200">
            <button 
              type="button"
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
                <h3 className="text-lg font-bold text-gray-900">Reset Link Sent!</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We have sent a password reset link to <strong className="text-gray-900">{resetEmail}</strong>. Please check your email inbox and spam folder.
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
                  Enter your registered email address or 10-digit mobile number, and we will send you a link to reset your password.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-600 ml-1">Email or Mobile Number</label>
                  <div className="flex items-center bg-[#f0edec] rounded-xl h-12 px-3.5 border border-transparent focus-within:border-[#b90064] transition-all">
                    <User className="text-gray-500 mr-2 shrink-0" size={18} />
                    <input 
                      type="text"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. rajesh@example.com or 9832145678"
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
                  {resetStatus === 'sending' ? (
                    <span>Sending Reset Link...</span>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

