import { Radiation, Github, Twitter, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-bunker-dark border-t border-slate-800 pt-16 pb-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Radiation className="w-8 h-8 text-nuclear-yellow" />
              <span className="font-black text-2xl tracking-tighter text-nuclear-yellow uppercase italic">
                Nuclear <span className="text-white">Tycoon</span>
              </span>
            </div>
            <p className="text-slate-500 font-mono text-sm">
              Espace communautaire et forum officiel de développement pour Nuclear Tycoon. Suivez les mises à jour, partagez vos stratégies et échangez avec l'équipe de développement.
            </p>
          </div>
        </div>
        
        <div className="h-1 warning-border w-full opacity-10 mb-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-600 font-mono text-[10px] uppercase tracking-widest text-center md:text-left">
          <p>© 2026 Nuclear Tycoon. Tous droits réservés.</p>
          <div className="flex gap-6">
            <p>Non affilié à Roblox Corp.</p>
            <p>Version 0.6.1-STABLE</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
