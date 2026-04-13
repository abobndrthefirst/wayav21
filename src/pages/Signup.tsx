import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { navigate } from '../App';

const C = { green: '#10BA83', bg: '#12110f', card: '#1c1b18', white: '#fffbff', muted: '#8a8a8a', subtle: '#6e6a63', cream: '#f5f0e6', inputBg: '#1e1d1a', inputBorder: '#32302a' };

type Lang = 'ar' | 'en';

const T = {
  ar: {
    title: 'إنشاء حساب', subtitle: 'سجّل الحين وابدأ شهرك المجاني',
    name: 'الاسم الكامل', namePh: 'مثلاً: سلطان حيدر',
    email: 'الإيميل', emailPh: 'name@example.com',
    password: 'كلمة المرور', passwordPh: '٦ أحرف على الأقل',
    signupBtn: 'أنشئ حسابي', googleBtn: 'التسجيل عبر Google',
    hasAccount: 'عندك حساب؟', login: 'سجّل دخول', or: 'أو',
    back: 'الرئيسية', brand: 'وايا', toggle: 'EN',
    errName: 'ادخل اسمك', errEmail: 'ادخل إيميل صحيح', errPassword: 'كلمة المرور لازم ٦ أحرف على الأقل',
    errGeneric: 'حصل خطأ، حاول مرة ثانية', signing: 'جاري التسجيل...',
    successTitle: 'تم التسجيل!', successMsg: 'تفقد إيميلك وفعّل حسابك عشان تقدر تدخل.', goLogin: 'تسجيل الدخول',
    fonts: { h: "'Almarai', sans-serif", b: "'Cairo', sans-serif" },
  },
  en: {
    title: 'Create Account', subtitle: 'Sign up and start your free month',
    name: 'Full name', namePh: 'e.g. Sultan Haidar',
    email: 'Email', emailPh: 'name@example.com',
    password: 'Password', passwordPh: 'At least 6 characters',
    signupBtn: 'Create My Account', googleBtn: 'Sign up with Google',
    hasAccount: 'Already have an account?', login: 'Log in', or: 'or',
    back: 'Home', brand: 'Waya', toggle: 'عربي',
    errName: 'Enter your name', errEmail: 'Enter a valid email', errPassword: 'Password must be at least 6 characters',
    errGeneric: 'Something went wrong, please try again', signing: 'Creating account...',
    successTitle: 'Account created!', successMsg: 'Check your email and confirm your account to get started.', goLogin: 'Go to login',
    fonts: { h: "'Inter', sans-serif", b: "'Inter', sans-serif" },
  },
};

export default function Signup() {
  const { user } = useAuth();
  const [lang, setLang] = useState<Lang>(() => { try { return (localStorage.getItem('waya-lang') as Lang) || 'ar'; } catch { return 'ar'; } });
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const t = T[lang];
  const isAR = lang === 'ar';

  useEffect(() => { if (user) navigate('/dashboard'); }, [user]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setError(t.errName); return; }
    if (!email.trim() || !email.includes('@')) { setError(t.errEmail); return; }
    if (password.length < 6) { setError(t.errPassword); return; }
    setLoading(true); setError('');
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: fullName.trim() }, emailRedirectTo: window.location.origin + '/login' },
    });
    if (err) { setError(err.message || t.errGeneric); setLoading(false); }
    else { setSuccess(true); setLoading(false); }
  }

  async function handleGoogle() {
    setError('');
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/dashboard' } });
  }

  if (success) {
    return (
      <div dir={isAR ? 'rtl' : 'ltr'} className="min-h-screen flex items-center justify-center px-5" style={{ background: C.bg, fontFamily: t.fonts.b }}>
        <div className="w-full max-w-[420px] rounded-2xl p-10 border text-center" style={{ background: C.card, borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: C.white, fontFamily: t.fonts.h }}>{t.successTitle}</h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: C.muted, fontFamily: t.fonts.b }}>{t.successMsg}</p>
          <button onClick={() => navigate('/login')} className="px-8 py-3 rounded-xl font-semibold text-base cursor-pointer" style={{ background: 'rgba(16,186,131,0.55)', color: C.white, fontFamily: t.fonts.b }}>{t.goLogin}</button>
        </div>
      </div>
    );
  }

  return (
    <div dir={isAR ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col items-center justify-center px-5 py-12" style={{ background: C.bg, fontFamily: t.fonts.b }}>

      {/* Top bar */}
      <div className="fixed top-0 inset-x-0 flex justify-between items-center px-6 py-4 z-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80" style={{ color: C.muted, fontFamily: t.fonts.b }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2" strokeLinecap="round"><path d={isAR ? 'M9 18l6-6-6-6' : 'M15 18l-6-6 6-6'}/></svg>
          {t.back}
        </button>
        <button onClick={() => setLang(isAR ? 'en' : 'ar')} className="text-xs font-semibold px-2 py-1 rounded-md border transition-colors hover:border-[rgba(16,186,131,0.3)]" style={{ color: C.muted, borderColor: 'rgba(255,255,255,0.1)', fontFamily: "'Inter', sans-serif" }}>{t.toggle}</button>
      </div>

      {/* Card */}
      <div className="w-full max-w-[420px] rounded-2xl p-8 sm:p-10 border" style={{ background: C.card, borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>

        {/* Brand */}
        <div className="text-center mb-7">
          <span className="inline-block px-4 py-1.5 rounded-lg text-xl font-extrabold" style={{ background: 'rgba(16,186,131,0.15)', color: C.green, fontFamily: "'Inter', sans-serif" }}>{t.brand}</span>
        </div>

        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: C.white, fontFamily: t.fonts.h }}>{t.title}</h1>
        <p className="text-sm text-center mb-7 leading-relaxed" style={{ color: C.muted, fontFamily: t.fonts.b }}>{t.subtitle}</p>

        {/* Google */}
        <button onClick={handleGoogle} className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl border transition-all hover:border-[rgba(16,186,131,0.3)] hover:shadow-[0_0_16px_rgba(16,186,131,0.1)] mb-5 cursor-pointer" style={{ background: C.inputBg, borderColor: C.inputBorder }}>
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="font-semibold text-[15px]" style={{ color: C.white, fontFamily: t.fonts.b }}>{t.googleBtn}</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <span className="text-xs font-medium" style={{ color: C.subtle }}>{t.or}</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: C.cream, fontFamily: t.fonts.b }}>{t.name}</label>
            <input type="text" value={fullName} onChange={e => { setFullName(e.target.value); setError(''); }}
              placeholder={t.namePh}
              className="w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-colors focus:border-[rgba(16,186,131,0.4)]"
              style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.white, fontFamily: t.fonts.b }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: C.cream, fontFamily: t.fonts.b }}>{t.email}</label>
            <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder={t.emailPh} dir="ltr"
              className="w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-colors focus:border-[rgba(16,186,131,0.4)]"
              style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.white, fontFamily: t.fonts.b }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: C.cream, fontFamily: t.fonts.b }}>{t.password}</label>
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder={t.passwordPh} dir="ltr"
              className="w-full px-4 py-3 rounded-xl text-[15px] outline-none transition-colors focus:border-[rgba(16,186,131,0.4)]"
              style={{ background: C.inputBg, border: `1px solid ${C.inputBorder}`, color: C.white, fontFamily: t.fonts.b }} />
          </div>

          {error && <p className="text-sm text-center" style={{ color: '#f04545' }}>{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full px-6 py-3.5 rounded-xl font-semibold text-base transition-all mt-1 cursor-pointer"
            style={{ background: loading ? 'rgba(16,186,131,0.3)' : 'rgba(16,186,131,0.55)', color: C.white, fontFamily: t.fonts.b }}>
            {loading ? t.signing : t.signupBtn}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{ color: C.muted, fontFamily: t.fonts.b }}>
          {t.hasAccount}{' '}
          <button onClick={() => navigate('/login')} className="font-bold underline transition-colors hover:opacity-80 cursor-pointer" style={{ color: C.green, background: 'none', border: 'none', fontFamily: t.fonts.b }}>{t.login}</button>
        </p>
      </div>
    </div>
  );
}
