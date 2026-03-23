'use client';

import { useState, useActionState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { login, signup } from '@/app/auth/actions';
import { brandConfig } from '@app/shared';
import { FloatingWidgets } from '@/components/auth/FloatingWidgets';
import { LucideCommand, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Separate states for login and signup to use modern React action state
  const [loginState, loginAction, isLoginPending] = useActionState(async (prevState: any, formData: FormData) => {
    const result = await login(formData);
    return result?.error ? { error: result.error } : prevState;
  }, { error: '' });

  const [signupState, signupAction, isSignupPending] = useActionState(async (prevState: any, formData: FormData) => {
    const result = await signup(formData);
    return result?.error ? { error: result.error } : prevState;
  }, { error: '' });

  const activeState = isLogin ? loginState : signupState;
  const isPending = isLogin ? isLoginPending : isSignupPending;
  const formAction = isLogin ? loginAction : signupAction;

  // Reduce floating widget brightness when hovering form or focusing inputs
  const shouldDimWidgets = isHoveringCard || isInputFocused;

  return (
    <div className="relative w-full h-[100dvh] flex items-center justify-center">
      <FloatingWidgets isDimmed={shouldDimWidgets} />

      <motion.div
        className="relative z-20 w-full max-w-[420px] px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        onHoverStart={() => setIsHoveringCard(true)}
        onHoverEnd={() => setIsHoveringCard(false)}
      >
        <motion.div
          className="relative overflow-hidden rounded-[24px]"
          // Card hover interactions via Framer Motion
          whileHover={{ 
            y: -5,
            scale: 1.01,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px 2px rgba(99, 102, 241, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Subtle top glow line */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          
          <div className="p-8 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex flex-col items-center justify-center mb-6">
                <motion.div 
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-inner border border-white/20 mb-3"
                  whileHover={{ rotate: 10, scale: 1.05 }}
                >
                  <LucideCommand size={28} className="text-white" />
                </motion.div>
                <h1 className="text-lg font-semibold tracking-wide text-white/90">
                  {brandConfig.appName}
                </h1>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
                {isLogin ? 'Welcome back' : 'Start your journey'}
              </h2>
              {!isLogin && (
                <p className="text-sm text-white/60">
                  Join {brandConfig.appName} and build your legacy.
                </p>
              )}
            </div>

            {/* Form */}
            <form action={formAction} className="space-y-4">
              <AnimatePresence mode="popLayout" initial={false}>
                {!isLogin && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                        <User className="h-4 w-4 text-white/40 group-focus-within:text-indigo-400 transition-colors" />
                      </div>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required={!isLogin}
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                        className="block w-full rounded-xl border-0 py-3 pl-10 bg-black/20 text-white shadow-inner ring-1 ring-inset ring-white/10 placeholder:text-white/40 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all hover:bg-black/30"
                        placeholder="Full Name"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Mail className="h-4 w-4 text-white/40 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  className="block w-full rounded-xl border-0 py-3 pl-10 bg-black/20 text-white shadow-inner ring-1 ring-inset ring-white/10 placeholder:text-white/40 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all hover:bg-black/30"
                  placeholder="Email address"
                />
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Lock className="h-4 w-4 text-white/40 group-focus-within:text-indigo-400 transition-colors" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  className="block w-full rounded-xl border-0 py-3 pl-10 bg-black/20 text-white shadow-inner ring-1 ring-inset ring-white/10 placeholder:text-white/40 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 transition-all hover:bg-black/30"
                  placeholder="Password"
                />
              </div>

              {activeState?.error && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium"
                >
                  {activeState.error}
                </motion.div>
              )}

              <div className="pt-2">
                <motion.button
                  type="submit"
                  disabled={isPending}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg hover:from-indigo-400 hover:to-purple-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              </div>
            </form>

            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                {isLogin ? (
                  <>New to {brandConfig.appName}? <span className="text-indigo-400">Sign up</span></>
                ) : (
                  <>Already have an account? <span className="text-indigo-400">Sign in</span></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
