import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldAlert, 
  Lock, 
  BookOpen, 
  HeartHandshake, 
  ArrowLeft, 
  ClipboardCheck, 
  ChevronDown,
  Activity,
  AlertTriangle,
  Scale
} from "lucide-react";

interface RulesProps {
  onNavigateBack: () => void;
}

export default function Rules({ onNavigateBack }: RulesProps) {
  const [agreed, setAgreed] = useState(false);
  const [activeChapter, setActiveChapter] = useState<number | null>(0);
  const [stampAnimated, setStampAnimated] = useState(false);

  useEffect(() => {
    const isAgreed = localStorage.getItem("rules_agreed") === "true" || localStorage.getItem("bunker_rules_agreed") === "true";
    if (isAgreed) {
      setAgreed(true);
    }
  }, []);

  const handleAgreeToggle = () => {
    const newState = !agreed;
    setAgreed(newState);
    localStorage.setItem("rules_agreed", newState ? "true" : "false");
    localStorage.setItem("bunker_rules_agreed", newState ? "true" : "false");
    if (newState) {
      setStampAnimated(true);
      setTimeout(() => setStampAnimated(false), 1000);
    }
  };

  const chapters = [
    {
      title: "1. Confidentialité et Anonymat des Communications",
      icon: Lock,
      subtitle: "Garantie de protection de la vie privée",
      content: "Pour préserver un cadre de discussion de haut niveau et protéger votre confidentialité, votre identité Google n'est jamais exposée aux autres membres du forum. Le choix d'un pseudonyme unique lors de votre première connexion est obligatoire. Tout partage de données personnelles sensibles (noms de famille réels, coordonnées privées, adresses physiques, numéros de téléphone) est interdit pour préserver votre sécurité."
    },
    {
      title: "2. Code de Conduite et Respect Mutuel",
      icon: HeartHandshake,
      subtitle: "Règles de civilité au sein de la communauté",
      content: "Le respect mutuel est de rigueur. Les insultes, provocations, spams, menaces ou comportements discriminatoires (racisme, sexisme, transphobie, etc.) ne seront tolérés sous aucun prétexte. Nous favorisons un climat d'entraide et d'échange courtois. Si un désaccord surgit, veuillez argumenter calmement ou utiliser le bouton de signalement pour alerter notre équipe."
    },
    {
      title: "3. Organisation et Catégorisation des Sujets",
      icon: BookOpen,
      subtitle: "Sujets structurés et lisibles",
      content: "Chaque nouveau post doit être placé dans la catégorie correspondante : 'Mises à Jour' pour l'actualité officielle, 'Discussions' pour les débats généraux, 'Suggestions' pour les idées d'amélioration de la communauté, et 'Bugs & Support' pour signaler les anomalies. Veillez à attribuer des titres clairs pour faciliter la recherche."
    },
    {
      title: "4. Rôles globaux, Modération et Système de Signalement",
      icon: Scale,
      subtitle: "Modération juste et équitable pour tous",
      content: "L'équipe de modération et d'administration dispose d'outils avancés pour épingler les annonces importantes ou masquer les messages frauduleux. Les membres ont la responsabilité de signaler les comportements déviants grâce au système de signalement. Les abus ou faux signalements répétés feront l'objet d'un avertissement."
    },
    {
      title: "5. Transactions et Échanges au sein du jeu",
      icon: ShieldAlert,
      subtitle: "Cadre sécurisé et transparence obligatoire",
      content: "Toute proposition de transaction ou d'échanges relatifs au jeu doit se faire de manière transparente et sécurisée. Les escroqueries, arnaques ou contournements du système d'échange officiel du jeu mèneront à un bannissement définitif de l'accès au forum."
    }
  ];

  return (
    <div className="pt-32 pb-20 px-6 bg-bunker-dark min-h-screen relative overflow-hidden">
      {/* Decorative background grid and nodes */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(251,191,36,0.05),rgba(0,0,0,0))]" />
      <div className="absolute top-10 right-10 opacity-5 select-none pointer-events-none">
        <Activity className="w-96 h-96 text-nuclear-yellow animate-pulse" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Navigation back and header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <button 
              onClick={onNavigateBack}
              className="text-slate-500 hover:text-white mb-6 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest italic transition-all group"
              id="back-to-forum-rules"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retourner au forum
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-px bg-nuclear-yellow" />
              <span className="text-nuclear-yellow font-mono text-[10px] uppercase tracking-[0.4em] font-black">PROTOCOLES D'ACCÈS</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
              RÈGLEMENT <span className="text-nuclear-yellow">DU FORUM</span>
            </h1>
            <p className="text-slate-400 font-mono text-xs mt-3 uppercase tracking-wider">
              Charte officielle de sécurité, d'anonymat et de modération du forum.
            </p>
          </div>
          
          {/* Agreement Badge Status */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              STATUT DIRECTIVE :
            </span>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${agreed ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse"}`} />
              <span className={`text-[10px] font-mono font-black uppercase tracking-widest ${agreed ? "text-green-500" : "text-red-500"}`}>
                {agreed ? "CONFORME & SIGNÉ" : "NON SIGNÉ"}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Handbook Chapters with Accordion style */}
        <div className="space-y-6 mb-12">
          {chapters.map((chapter, idx) => {
            const IconComponent = chapter.icon;
            const isOpen = activeChapter === idx;

            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bunker-panel border transition-all duration-300 overflow-hidden ${
                  isOpen 
                    ? "border-nuclear-yellow/40 bg-zinc-900/60 shadow-[0_4px_30px_rgba(251,191,36,0.03)]" 
                    : "border-white/5 bg-white/[0.01] hover:border-white/10 hover:bg-white/[0.02]"
                }`}
              >
                <div 
                  onClick={() => setActiveChapter(isOpen ? null : idx)}
                  className="p-6 md:p-8 cursor-pointer flex justify-between items-center gap-4 select-none"
                  id={`chapter-trigger-${idx}`}
                >
                  <div className="flex gap-4 items-center">
                    <div className={`w-12 h-12 flex items-center justify-center shrink-0 border transition-all ${
                      isOpen ? "border-nuclear-yellow bg-nuclear-yellow/10 text-nuclear-yellow" : "border-white/10 bg-white/5 text-slate-500"
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`text-base md:text-lg font-black uppercase italic tracking-tight transition-colors ${
                        isOpen ? "text-nuclear-yellow" : "text-white"
                      }`}>
                        {chapter.title}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                        {chapter.subtitle}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-slate-500"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </motion.div>
                </div>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="p-6 md:p-8 pt-0 border-t border-white/5 font-mono text-slate-350 text-xs md:text-sm leading-relaxed whitespace-pre-line max-w-none text-slate-300 pl-6 md:pl-24 border-l-2 border-nuclear-yellow/40">
                        {chapter.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Safe Stamp Declaration Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bunker-panel border border-slate-800 bg-slate-950/40 p-8 md:p-10 relative overflow-hidden backdrop-blur-xl"
        >
          {/* Decorative stamp shadow effect */}
          <AnimatePresence>
            {stampAnimated && (
              <motion.div 
                initial={{ scale: 2, opacity: 0, rotate: 15 }}
                animate={{ scale: 1, opacity: 0.15, rotate: -10 }}
                exit={{ opacity: 0, transition: { duration: 1 } }}
                className="absolute inset-y-0 right-12 flex items-center justify-center pointer-events-none text-nuclear-yellow font-black border-4 border-dashed border-nuclear-yellow rounded p-6"
              >
                <div className="text-center font-black uppercase text-xl italic leading-none tracking-widest select-none">
                  APPROUVÉ<br />CONFORME
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
            <div className="space-y-3 text-center md:text-left max-w-xl">
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <ClipboardCheck className="w-5 h-5 text-nuclear-yellow" />
                <h4 className="text-white font-black uppercase text-base italic tracking-tight">Engagement de conformité</h4>
              </div>
              <p className="text-[11px] text-slate-400 font-mono leading-relaxed uppercase">
                En certifiant avoir lu et validé ce règlement, vous vous engagez à respecter la charte de notre forum pour assurer des discussions constructives et sécurisées.
              </p>
            </div>

            <div className="shrink-0">
              <button 
                onClick={handleAgreeToggle}
                className={`flex items-center gap-3 px-8 py-4 border font-black uppercase italic text-sm transition-all shadow-md select-none rounded cursor-pointer ${
                  agreed 
                    ? "bg-green-500/10 border-green-500/50 text-green-500 hover:bg-green-500/20" 
                    : "bg-nuclear-yellow hover:bg-white text-bunker-dark border-nuclear-yellow"
                }`}
                id="sign-rules-btn"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${agreed ? "border-green-500 bg-green-500/20" : "border-bunker-dark"}`}>
                  {agreed && <div className="w-2 h-2 bg-green-500 rounded-sm" />}
                </div>
                <span>{agreed ? "DIRECTIVES VALIDÉES" : "SIGNER RÈGLEMENT"}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Back Button Footer block */}
        <div className="text-center mt-12">
          <button 
            onClick={onNavigateBack}
            className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
          >
            ← Retourner vers le forum principal
          </button>
        </div>

      </div>
    </div>
  );
}
