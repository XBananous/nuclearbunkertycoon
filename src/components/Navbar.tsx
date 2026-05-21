import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Radiation, Menu, X, User as UserIcon, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  currentView: "forum" | "profile" | "auth" | "rules";
  setCurrentView: (view: "forum" | "profile" | "auth" | "rules") => void;
}

export default function Navbar({ currentView, setCurrentView }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, loading, logout } = useAuth();

  useEffect(() => {
    const handleEvents = () => setIsMobileMenuOpen(false);
    window.addEventListener("resize", handleEvents);
    return () => window.removeEventListener("resize", handleEvents);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative group">
          {/* Glass background with sharp edges */}
          <div className="absolute inset-0 bg-bunker-dark/95 backdrop-blur-3xl border border-white/10 shadow-[0_8px_48px_rgba(0,0,0,0.8)]" />
          
          <div className="relative h-16 flex items-center justify-between px-8">
            {/* Logo */}
            <div 
              onClick={() => setCurrentView("forum")}
              className="flex items-center gap-4 group/logo cursor-pointer"
            >
              <div className="relative w-8 h-8 flex items-center justify-center transition-transform group-hover/logo:scale-110">
                <Radiation className="w-8 h-8 text-nuclear-yellow z-10" />
                <div className="absolute inset-0 bg-nuclear-yellow/20 blur-lg animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-xl tracking-tighter text-white uppercase italic leading-none">
                  NUCLEAR <span className="text-nuclear-yellow">TYCOON</span>
                </span>
                <span className="text-[7px] text-slate-500 font-mono uppercase tracking-[0.4em]">Official Forum Portal</span>
              </div>
            </div>

            {/* Desktop Center Navigation Links */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={() => setCurrentView("forum")}
                className={`px-5 py-2 text-[10px] font-mono font-black uppercase tracking-[0.2em] border transition-all ${
                  currentView === "forum"
                    ? "border-nuclear-yellow text-nuclear-yellow bg-nuclear-yellow/5"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                Forum public
              </button>
              <button
                onClick={() => setCurrentView("rules")}
                className={`px-5 py-2 text-[10px] font-mono font-black uppercase tracking-[0.2em] border transition-all ${
                  currentView === "rules"
                    ? "border-nuclear-yellow text-nuclear-yellow bg-nuclear-yellow/5"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                Règlement
              </button>
              {user && profile && (
                <button
                  onClick={() => setCurrentView("profile")}
                  className={`px-5 py-2 text-[10px] font-mono font-black uppercase tracking-[0.2em] border transition-all ${
                    currentView === "profile"
                      ? "border-nuclear-yellow text-nuclear-yellow bg-nuclear-yellow/5"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  Mon profil
                </button>
              )}
            </div>

            {/* Right side info */}
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex items-center gap-6 border-l border-white/5 pl-6 h-8">
                {loading ? (
                  <div className="w-4 h-4 bg-white/5 animate-pulse rounded-full" />
                ) : user ? (
                  <div className="flex items-center gap-4 group/user">
                    <div 
                      onClick={() => setCurrentView("profile")}
                      className="flex flex-col items-end cursor-pointer"
                    >
                      <span className="text-[9px] text-white font-black uppercase tracking-widest leading-none mb-1 hover:text-nuclear-yellow transition-colors">
                        {profile ? profile.username : "CRÉER UN PSEUDO"}
                      </span>
                      <span className="text-[7px] text-nuclear-yellow font-mono uppercase tracking-[0.2em]">
                        RÔLE: {profile ? profile.rank : "VÉRIFIÉ"}
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        logout();
                        setCurrentView("forum");
                      }}
                      className="w-10 h-10 border border-white/10 bg-white/5 flex items-center justify-center text-slate-500 hover:text-red-500 hover:border-red-500/50 transition-all group/logout"
                      title="Déconnexion"
                    >
                      <LogOut className="w-4 h-4 transition-transform group-hover/logout:scale-110" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setCurrentView("auth")}
                    className={`flex items-center gap-3 group/login ${currentView === "auth" ? "text-nuclear-yellow" : ""}`}
                  >
                    <div className="flex flex-col items-end">
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest leading-none mb-1 group-hover/login:text-white transition-colors">Identification</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-1 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444]" />
                        <span className="text-[10px] text-white font-black uppercase italic tracking-tighter group-hover/login:text-nuclear-yellow transition-colors">Non connecté</span>
                      </div>
                    </div>
                    <div className={`w-10 h-10 border ${
                      currentView === "auth" 
                        ? "border-nuclear-yellow bg-nuclear-yellow text-bunker-dark" 
                        : "border-white/10 bg-nuclear-yellow/5 text-nuclear-yellow group-hover/login:bg-nuclear-yellow group-hover/login:text-bunker-dark"
                    } flex items-center justify-center transition-all`}>
                      <UserIcon className="w-4 h-4" />
                    </div>
                  </button>
                )}
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                className="sm:hidden w-10 h-10 flex items-center justify-center hover:bg-white/5 transition-colors border border-white/10"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 text-nuclear-yellow" /> : <Menu className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/95 z-[110] sm:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-bunker-dark border-l border-nuclear-yellow/10 z-[120] sm:hidden shadow-[0_0_100px_rgba(0,0,0,1)]"
            >
              <div className="p-10 h-full flex flex-col relative w-full">
                {/* Decoration */}
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
                  <Radiation className="w-64 h-64 text-white" />
                </div>

                <div className="flex justify-between items-center mb-16 relative z-10">
                  <div className="flex items-center gap-3">
                    <UserIcon className="w-5 h-5 text-nuclear-yellow" />
                    <span className="text-sm font-black text-white uppercase italic tracking-tighter">Menu de navigation</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="bg-white/5 p-2 border border-white/10 text-white hover:text-nuclear-yellow transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 relative z-10 flex-grow">
                  <button
                    onClick={() => {
                      setCurrentView("forum");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 border transition-all ${
                      currentView === "forum"
                        ? "border-nuclear-yellow/50 bg-nuclear-yellow/10 text-nuclear-yellow font-black"
                        : "border-white/5 bg-white/[0.01] text-slate-400"
                    }`}
                  >
                    <span className="text-xs uppercase font-black italic tracking-widest">Forum public</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView("rules");
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 border transition-all ${
                      currentView === "rules"
                        ? "border-nuclear-yellow/50 bg-nuclear-yellow/10 text-nuclear-yellow font-black"
                        : "border-white/5 bg-white/[0.01] text-slate-400"
                    }`}
                  >
                    <span className="text-xs uppercase font-black italic tracking-widest">Règlement</span>
                  </button>

                  {user && profile && (
                    <button
                      onClick={() => {
                        setCurrentView("profile");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-4 border transition-all ${
                        currentView === "profile"
                          ? "border-nuclear-yellow/50 bg-nuclear-yellow/10 text-nuclear-yellow font-black"
                          : "border-white/5 bg-white/[0.01] text-slate-300"
                      }`}
                    >
                      <span className="text-xs uppercase font-black italic tracking-widest">Mon profil</span>
                    </button>
                  )}

                  <div className="h-px bg-white/5 w-full my-6" />

                  {user ? (
                    <div className="p-6 border border-nuclear-yellow/20 bg-nuclear-yellow/5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 border border-nuclear-yellow bg-nuclear-yellow/10 flex items-center justify-center font-black text-nuclear-yellow italic">
                          {(profile ? profile.username : "??").substring(0, 2).toUpperCase()}
                        </div>
                        <div 
                          className="cursor-pointer"
                          onClick={() => {
                            setCurrentView("profile");
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          <p className="text-sm font-black text-white uppercase italic leading-none mb-1 hover:text-nuclear-yellow transition-colors">
                            {profile ? profile.username : "CRÉER PSEUDO"}
                          </p>
                          <span className="text-[10px] text-nuclear-yellow font-mono uppercase tracking-widest">
                            {profile?.rank || "UTILISATEUR VÉRIFIÉ"}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          logout();
                          setCurrentView("forum");
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full mt-6 flex items-center justify-center gap-3 p-3 border border-red-500/30 text-red-500 text-[10px] font-black uppercase italic hover:bg-red-500/10 transition-all"
                      >
                        <LogOut className="w-4 h-4" /> Se déconnecter
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setCurrentView("auth");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-6 bg-nuclear-yellow text-bunker-dark font-black"
                    >
                      <UserIcon className="w-6 h-6" />
                      <span className="text-sm uppercase tracking-[0.2em] italic">CONNEXION GOOGLE</span>
                    </button>
                  )}
                </div>

                <div className="mt-auto relative z-10">
                  <div className="p-8 border border-white/5 bg-white/[0.01]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-none">Connexion Chiffrée</span>
                    </div>
                    <div className="flex flex-col gap-2">
                       <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="h-full bg-nuclear-yellow" 
                        />
                      </div>
                      <div className="flex justify-between font-mono text-[8px] text-slate-700 uppercase tracking-widest">
                        <span>Flux de données</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
