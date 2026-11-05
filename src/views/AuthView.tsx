import React, { useState } from 'react';
import { Lock, Mail, User as UserIcon, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, signOut } from 'firebase/auth';

interface AuthViewProps {
  onLoginSuccess: (email: string, name?: string) => Promise<void>;
}

export function AuthView({ onLoginSuccess }: AuthViewProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isForgotPassword) {
        await sendPasswordResetEmail(auth, email.trim());
        setRecoverySent(true);
        return;
      }
      if (isRegister) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await sendEmailVerification(credential.user);
        await signOut(auth);
        setIsRegister(false);
        setError('Conta criada. Confira seu e-mail, confirme a conta e faça login.');
        return;
      }
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      if (!credential.user.emailVerified) {
        await sendEmailVerification(credential.user);
        await signOut(auth);
        throw new Error('Confirme seu e-mail antes de entrar. Enviamos um link de verificação.');
      }
      await onLoginSuccess(credential.user.email || email.trim());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível entrar.';
      setError(message.includes('auth/invalid-credential') ? 'E-mail ou senha incorretos.' : message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 ring-1 ring-white/10">
            Y
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Yan Financeiro</h1>
          <p className="text-xs text-slate-400">
            Controle financeiro pessoal e profissional para videomakers
          </p>
        </div>

        {error && <p role="alert" className="text-sm text-amber-300 bg-amber-950/50 rounded-lg p-3">{error}</p>}
        {isForgotPassword ? (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white text-center">Recuperação de Senha</h2>
            {recoverySent ? (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs text-center space-y-2">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <p>Enviamos as instruções de recuperação para <strong>{email}</strong>.</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setRecoverySent(false);
                  }}
                  className="mt-2 text-white font-bold underline"
                >
                  Voltar ao Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Seu E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white text-sm outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl transition"
                >
                  Enviar Link de Recuperação
                </button>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="w-full text-center text-xs text-slate-400 hover:text-white"
                >
                  Cancelar e voltar
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome ou marca"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white text-sm outline-none transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                E-mail
              </label>
              <input
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white text-sm outline-none transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  Senha
                </label>
                {!isRegister && (
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 rounded-2xl p-3 text-white text-sm outline-none transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/25 transition-all duration-200 active:scale-[0.99] text-sm mt-2"
            >
              {busy ? 'Aguarde...' : isRegister ? 'Criar Minha Conta' : 'Acessar Yan Financeiro'}
            </button>

            {/* Toggle Login / Register */}
            <div className="text-center pt-2 text-xs text-slate-400">
              {isRegister ? (
                <span>
                  Já possui uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(false)}
                    className="text-emerald-400 font-bold hover:underline"
                  >
                    Fazer Login
                  </button>
                </span>
              ) : (
                <span>
                  Não tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => setIsRegister(true)}
                    className="text-emerald-400 font-bold hover:underline"
                  >
                    Cadastre-se grátis
                  </button>
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
