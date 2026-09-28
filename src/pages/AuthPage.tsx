import React, { useState } from 'react';
import { useAuth, ADMIN_BOOTSTRAP_EMAILS } from '../firebase/authContext';
import { Logo } from '../components/common/Logo';
import { Mail, Lock, User, Phone, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';

interface AuthPageProps {
  onSuccess: () => void;
  onNavigateHome: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess, onNavigateHome }) => {
  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed-by-user')) {
        setError('La fenêtre de connexion Google a été fermée.');
      } else if (msg.includes('cancelled-popup-request')) {
        setError('Opération annulée.');
      } else {
        setError('Impossible de se connecter avec Google. Veuillez réessayer.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        onSuccess();
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Les mots de passe ne correspondent pas.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères.');
          setLoading(false);
          return;
        }
        await signUp(fullName, phone, email, password);
        onSuccess();
      } else if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Un email de réinitialisation a été envoyé à votre adresse.');
      }
    } catch (err: unknown) {
      console.error('Auth error:', err);
      const msg = err instanceof Error ? err.message : String(err);

      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Email ou mot de passe incorrect. Si vous n\'avez pas encore créé de compte, cliquez sur l\'onglet « S\'inscrire » ci-dessus ou utilisez Google.');
      } else if (msg.includes('email-already-in-use')) {
        setError('Cette adresse email est déjà enregistrée. Cliquez sur « Se connecter » pour vous identifier.');
      } else if (msg.includes('operation-not-allowed')) {
        setError('La connexion Email/Mot de passe n\'est pas encore activée sur le projet Firebase. Veuillez utiliser le bouton « Continuer avec Google » ci-dessus.');
      } else if (msg.includes('weak-password')) {
        setError('Le mot de passe doit contenir au moins 6 caractères.');
      } else if (msg.includes('invalid-email')) {
        setError('Adresse email invalide.');
      } else {
        setError(`Erreur de connexion : ${msg.split('(')[0] || 'Veuillez vérifier vos identifiants ou utiliser Google.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block cursor-pointer" onClick={onNavigateHome}>
            <Logo size="md" showTagline={false} />
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {mode === 'login'
              ? 'Connexion à votre compte'
              : mode === 'register'
              ? 'Créer un compte client'
              : 'Réinitialiser votre mot de passe'}
          </h2>
          <p className="text-xs text-slate-500">
            {mode === 'login'
              ? 'Accédez à vos devis, factures et suivi de commandes'
              : mode === 'register'
              ? 'Rejoignez Quincaillerie LDB pour vos approvisionnements'
              : 'Saisissez votre email pour recevoir les instructions'}
          </p>
        </div>

        {/* 1-Click Google Sign-In Button (Native Firebase Provider) */}
        {mode !== 'forgot' && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-3 border border-slate-300 shadow-2xs hover:shadow-xs transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{googleLoading ? 'Connexion en cours...' : 'Continuer avec Google'}</span>
            </button>

            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                ou avec votre email
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>
          </div>
        )}

        {/* Tab switch between Login & Register */}
        {mode !== 'forgot' && (
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Se connecter
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              S'inscrire
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom complet *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Amadou Coulibaly"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de téléphone *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="+223 92012334"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Adresse email *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="votre.email@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Mot de passe *
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError('');
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 text-xs sm:text-sm text-slate-900 border border-slate-200 focus:border-emerald-600 focus:bg-white focus:outline-hidden"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <span>
              {loading
                ? 'Traitement en cours...'
                : mode === 'login'
                ? 'Se connecter'
                : mode === 'register'
                ? 'Créer mon compte'
                : 'Envoyer le lien'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {mode === 'forgot' && (
          <div className="text-center pt-2">
            <button
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              className="text-xs font-bold text-emerald-800 hover:underline"
            >
              Retour à la page de connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
