import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User as UserIcon, 
  AlertTriangle, 
  ChevronRight,
  Radiation,
  Loader2,
  ShieldCheck
 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AuthProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function Auth({ onSuccess, onCancel }: AuthProps) {
  const { user, profile, loginWithGoogle, createProfile, logout } = useAuth();
  const [mode, setMode] = useState<"login" | "pseudo_setup">(
    (user && !profile) ? "pseudo_setup" : "login"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chosenPseudo, setChosenPseudo] = useState("");

  useEffect(() => {
    if (user && !profile) {
      setMode("pseudo_setup");
    } else {
      setMode("login");
    }
  }, [user, profile]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const hasProfile = await loginWithGoogle();
      if (hasProfile) {
        onSuccess();
      } else {
        setMode("pseudo_setup");
      }
    } catch (err: any) {
      console.error("Erreur Auth Google Details:", err);
      
      const errorCode = err.code || "";
      const errorMessage = err.message || "";
      
      if (errorCode === "auth/cancelled-popup-request" || errorMessage.includes("cancelled-popup-request")) {
        setError("La requête d'identification Google a été interrompue. Veuillez cliquer à nouveau pour réessayer.");
      } else if (errorCode === "auth/popup-closed-by-user" || errorMessage.includes("popup-closed-by-user")) {
        setError("La fenêtre sécurisée Google a été fermée avant la fin de l'authentification. Veuillez réessayer.");
      } else if (errorCode === "auth/popup-blocked" || errorMessage.includes("popup-blocked")) {
        setError("La fenêtre d'authentification a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-ups pour accéder au forum.");
      } else {
        setError("Une erreur est survenue lors de l'identification Google. Code : " + (errorCode || "UNKNOWN"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePseudoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createProfile(chosenPseudo);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Impossible de configurer ce pseudo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 bg-bunker-dark min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md relative"
      >
        <div className="bunker-panel border border-slate-700/80 bg-slate-900/40 p-10 md:p-12 shadow-[0_24px_100px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl">
          {/* Subtle line decoration to echo forum styling */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-nuclear-yellow/30 via-nuclear-yellow to-nuclear-yellow/30" />
          
          <div className="relative z-10 text-center mb-10">
            <div className="flex justify-center mb-6">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="relative"
              >
                <div className="w-16 h-16 rounded-lg border border-nuclear-yellow/30 bg-nuclear-yellow/5 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-nuclear-yellow" />
                </div>
                <div className="absolute inset-0 bg-nuclear-yellow/10 blur-xl rounded-full" />
              </motion.div>
            </div>
            
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
              {mode === "login" ? "Connexion" : "Créer un profil"}
            </h2>
            <p className="text-slate-400 font-mono text-[10px] mt-2 uppercase tracking-[0.25em]">
              {mode === "login" ? "Accès sécurisé via compte Google" : "Veuillez choisir votre pseudonyme unique"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {mode === "pseudo_setup" ? (
              <motion.form 
                key="pseudo_setup"
                onSubmit={handlePseudoSubmit} 
                className="space-y-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="space-y-3">
                  <label className="block text-[9px] font-black text-white uppercase tracking-widest">
                    Pseudonyme Unique
                  </label>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                    Pour garantir un anonymat complet, votre identité Google n'est pas révélée aux autres utilisateurs. Choisissez un pseudonyme unique.
                  </p>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                      type="text"
                      required
                      value={chosenPseudo}
                      onChange={(e) => setChosenPseudo(e.target.value)}
                      placeholder="EX: ALEX_MARCH"
                      className="w-full bg-slate-950/60 border border-slate-800/80 rounded px-4 py-3.5 pl-12 text-white font-bold outline-none focus:border-nuclear-yellow focus:ring-1 focus:ring-nuclear-yellow/50 transition-all italic text-sm placeholder:text-slate-700 uppercase"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-950/20 border border-red-900/50 flex items-start gap-3 rounded"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-400 font-medium uppercase leading-relaxed">{error}</p>
                  </motion.div>
                )}

                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-nuclear-yellow hover:bg-white text-slate-950 py-4 font-black uppercase italic rounded transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Créer mon profil
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>

                <motion.button
                  whileHover={{ bg: "rgba(239, 68, 68, 0.05)" }}
                  type="button"
                  onClick={async () => {
                    await logout();
                    setMode("login");
                  }}
                  className="w-full border border-slate-800 bg-slate-950/20 text-slate-400 hover:text-red-500 rounded py-3.5 font-bold uppercase italic transition-all text-xs"
                >
                  Annuler et se déconnecter
                </motion.button>
              </motion.form>
            ) : (
              <motion.div 
                key="google_setup"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                <div className="text-center p-6 border border-slate-800/80 bg-slate-950/40 rounded">
                  <p className="text-slate-300 font-sans text-xs leading-relaxed">
                    Un compte Google est requis pour participer aux discussions et publier sur le forum. Votre session reste chiffrée.
                  </p>
                </div>

                <div className="pt-2">
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-white hover:bg-neutral-100 text-black py-4 font-black uppercase italic rounded shadow-lg transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50 border border-neutral-300"
                  >
                    <svg className="w-5 h-5 mr-1 text-slate-800 font-black fill-current" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.6 1.7l2.4-2.4C16.9 1.5 14.7.7 12.24.7c-5.7 0-10.3 4.6-10.3 10.3s4.6 10.3 10.3 10.3c5.9 0 9.8-4.1 9.8-10 0-.6-.1-1.3-.2-1.8H12.24z"/>
                    </svg>
                    {loading ? "AUTHENTIFICATION EN COURS..." : "SE CONNECTER AVEC GOOGLE"}
                  </motion.button>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-950/20 border border-red-900/50 flex items-start gap-3 rounded"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-red-400 font-medium uppercase leading-relaxed">{error}</p>
                  </motion.div>
                )}

                <div className="pt-4 border-t border-slate-800/60 text-center">
                  <button
                    onClick={onCancel}
                    className="text-[10px] font-mono text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                  >
                    ← Retourner au forum public
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
