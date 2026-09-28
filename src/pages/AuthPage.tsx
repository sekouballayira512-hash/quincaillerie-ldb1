import React, { useState } from 'react';
import { useAuth, ADMIN_BOOTSTRAP_EMAILS } from '../firebase/authContext';
import { Logo } from '../components/common/Logo';
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [showNetlifyHelp, setShowNetlifyHelp] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const isNetlifyOrCustom = currentHost && !currentHost.includes('localhost') && !currentHost.includes('127.0.0.1');

  const handleCopy = (text: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleGoogleSignIn = async (forceRedirect: boolean = false) => {
    setError('');
    setUnauthorizedDomain(null);
    setGoogleLoading(true);

    try {
      await signInWithGoogle(forceRedirect);
      onSuccess();
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const errObj = err as { code?: string; message?: string };
      const code = errObj?.code || '';
      const msg = errObj?.message || (err instanceof Error ? err.message : String(err));

      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        const detectedHost = window.location.hostname || 'votre-domaine.netlify.app';
        setUnauthorizedDomain(detectedHost);
        setError(`Le domaine « ${detectedHost} » n'est pas encore autorisé dans Firebase pour la connexion Google OAuth.`);
      } else if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
        setError('La fenêtre Google s\'est fermée avant la sélection du compte. Cliquez de nouveau sur « Continuer avec Google » pour vous connecter.');
      } else if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
        setError('La fenêtre pop-up a été bloquée par votre navigateur. Vous pouvez utiliser la redirection Google ci-dessous.');
      } else if (code === 'auth/cancelled-popup-request' || msg.includes('cancelled-popup-request')) {
        setError('Opération annulée.');
      } else if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
        setError('Le fournisseur Google n\'est pas activé dans le projet Firebase. Rendez-vous dans Firebase > Authentication > Sign-in method et activez Google.');
      } else if (code === 'auth/network-request-failed' || msg.includes('network-request-failed')) {
        setError('Problème de connexion réseau. Veuillez vérifier votre accès à Internet et réessayer.');
      } else {
        setError(`Erreur de connexion Google : ${msg.split('(')[0] || 'Veuillez réessayer ou utiliser la connexion par email.'}`);
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
              onClick={() => handleGoogleSignIn(false)}
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

            {/* In case of popup block on mobile/Netlify, offer full-page redirect button */}
            {error && error.includes('bloquée par votre navigateur') && (
              <button
                type="button"
                onClick={() => handleGoogleSignIn(true)}
                disabled={googleLoading || loading}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Continuer avec redirection Google (Pleine page)</span>
              </button>
            )}

            {/* Specific diagnostic banner when domain is unauthorized in Firebase */}
            {unauthorizedDomain && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs space-y-3 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-900 text-sm">
                      Domaine Netlify à autoriser dans Firebase
                    </p>
                    <p className="text-amber-800 leading-relaxed text-[11px]">
                      Google bloque la connexion car ce domaine n'est pas encore enregistré dans la liste des <strong>Domaines autorisés</strong> de votre projet Firebase.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-amber-200 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700">Nom de domaine à ajouter :</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-amber-100/70 text-amber-950 font-mono font-bold px-2.5 py-1.5 rounded-lg text-xs break-all select-all">
                      {unauthorizedDomain}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(unauthorizedDomain)}
                      className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedDomain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDomain ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] text-amber-900 bg-amber-100/60 p-3 rounded-xl leading-relaxed">
                  <p className="font-bold text-amber-950 mb-1">Procédure (1 minute) :</p>
                  <p>1. Ouvrez votre console Firebase sur le projet <strong className="font-mono">gen-lang-client-0008674053</strong>.</p>
                  <p>2. Allez dans <strong>Authentication</strong> → onglet <strong>Paramètres</strong> → <strong>Domaines autorisés</strong>.</p>
                  <p>3. Cliquez sur <strong>Ajouter un domaine</strong>, collez <code className="font-mono font-bold">{unauthorizedDomain}</code> puis enregistrez.</p>
                  <p className="text-emerald-800 font-semibold pt-1">
                    ✓ Google fonctionnera immédiatement pour tous vos visiteurs dès l'enregistrement.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0008674053/authentication/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ouvrir la Console Firebase</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn(false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    <span>Réessayer la connexion</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick helper for Netlify deployers */}
            {isNetlifyOrCustom && !unauthorizedDomain && (
              <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/60">
                <button
                  type="button"
                  onClick={() => setShowNetlifyHelp(!showNetlifyHelp)}
                  className="w-full px-3 py-2 text-left flex items-center justify-between text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Déployé sur Netlify ? Astuce de configuration</span>
                  </span>
                  {showNetlifyHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showNetlifyHelp && (
                  <div className="p-3 border-t border-slate-200 bg-white space-y-2 text-xs text-slate-600">
                    <p className="text-[11px] leading-relaxed">
                      Pour que « Continuer avec Google » fonctionne sur ce domaine, assurez-vous que <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800">{currentHost}</code> est bien ajouté dans <strong>Firebase Console &gt; Authentication &gt; Paramètres &gt; Domaines autorisés</strong>.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(currentHost)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedDomain ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedDomain ? 'Copié !' : 'Copier le domaine'}</span>
                      </button>
                      <a
                        href="https://console.firebase.google.com/project/gen-lang-client-0008674053/authentication/settings"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 ml-auto"
                      >
                        <span>Console Firebase</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

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
