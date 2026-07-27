
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';

export default function LoginForm({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [passwordStrength, setPasswordStrength] = useState({ minLength: false, hasNumber: false, hasUpper: false });
  const [message, setMessage] = useState<{ type: 'error' | 'warning' | 'info'; text: string } | null>(null);

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

  return (
    <div className="bg-white rounded-[18px] p-6 w-full shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-[#e4e2e1]">
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
            <button className="ml-2 text-[#b90064]" type="button" onClick={() => setShowPassword(!showPassword)}>
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
          <button className="text-sm font-medium text-[#b90064] hover:underline" type="button">Forgot Password?</button>
        </div>
        <button className="w-full h-[56px] bg-[#e6007e] text-white font-medium text-sm rounded-[16px] transition-transform active:scale-95 hover:opacity-90" type="submit">
          Login
        </button>
      </form>
    </div>
  );
}
