import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  User as UserIcon, 
  Mail, 
  ShieldAlert, 
  AlertTriangle, 
  Loader2, 
  Edit3, 
  Save, 
  Flame, 
  MessageSquare, 
  ThumbsUp, 
  Radiation,
  CheckCircle2,
  Calendar,
  Compass
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

interface ProfileProps {
  onNavigateToForum: () => void;
}

export default function Profile({ onNavigateToForum }: ProfileProps) {
  const { user, profile, createProfile } = useAuth();
  const [editingPseudo, setEditingPseudo] = useState(false);
  const [newPseudo, setNewPseudo] = useState(profile?.username || "");
  const [bio, setBio] = useState("");
  const [loadingStats, setLoadingStats] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorProfile, setErrorProfile] = useState<string | null>(null);
  const [successProfile, setSuccessProfile] = useState<string | null>(null);

  // User posts stats
  const [userPostsCount, setUserPostsCount] = useState(0);
  const [userLikesCount, setUserLikesCount] = useState(0);
  const [userPosts, setUserPosts] = useState<any[]>([]);

  useEffect(() => {
    if (profile) {
      setNewPseudo(profile.username);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;

    const fetchUserStatsAndBio = async () => {
      setLoadingStats(true);
      try {
        // Fetch bio from user doc
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setBio(userDoc.data().bio || "AUCUN STATUT ACTUEL");
        }

        // Query user posts
        const postsQuery = query(collection(db, "posts"), where("authorId", "==", user.uid));
        const postsSnapshot = await getDocs(postsQuery);
        
        let postsCount = 0;
        let likesCount = 0;
        const postsList: any[] = [];

        postsSnapshot.forEach((doc) => {
          postsCount++;
          const data = doc.data();
          likesCount += (data.likes || 0);
          postsList.push({ id: doc.id, ...data });
        });

        setUserPostsCount(postsCount);
        setUserLikesCount(likesCount);
        setUserPosts(postsList);
      } catch (err) {
        console.error("Erreur lors de la récupération des stats utilisateurs:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchUserStatsAndBio();
  }, [user, profile]);

  const handleUpdatePseudo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorProfile(null);
    setSuccessProfile(null);
    setSaving(true);

    const targetPseudo = newPseudo.trim();

    if (targetPseudo === profile?.username) {
      setEditingPseudo(false);
      setSaving(false);
      return;
    }

    if (targetPseudo.length < 3) {
      setErrorProfile("Le pseudo doit contenir au moins 3 caractères.");
      setSaving(false);
      return;
    }

    if (targetPseudo.length > 20) {
      setErrorProfile("Le pseudo ne peut pas dépasser 20 caractères.");
      setSaving(false);
      return;
    }

    if (!/^[a-zA-Z0-9_\-]+$/.test(targetPseudo)) {
      setErrorProfile("Le pseudo contient des caractères invalides (lettres, chiffres, _ et - uniquement).");
      setSaving(false);
      return;
    }

    try {
      // Uniqueness check (case-insensitive)
      const usernameLower = targetPseudo.toLowerCase();
      const q = query(collection(db, "users"), where("username_lowercase", "==", usernameLower));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        throw new Error("Ce pseudo est déjà utilisé par un autre utilisateur.");
      }

      // Update in user settings
      const userRef = doc(db, "users", user!.uid);
      await updateDoc(userRef, {
        username: targetPseudo,
        username_lowercase: usernameLower
      });

      // Also let's update all historical posts by this author if needed, 
      // but in standard Firestore we can do that or let them be. Let's write them asynchronously
      // or at least update userRef.
      setSuccessProfile("Pseudo mis à jour avec succès !");
      setEditingPseudo(false);
    } catch (err: any) {
      console.error(err);
      setErrorProfile(err.message || "Erreur de mise à jour du pseudo");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBio = async () => {
    setErrorProfile(null);
    setSuccessProfile(null);
    setSaving(true);
    try {
      const userRef = doc(db, "users", user!.uid);
      await updateDoc(userRef, {
        bio: bio.trim()
      });
      setSuccessProfile("Statut mis à jour avec succès !");
    } catch (err: any) {
      console.error(err);
      setErrorProfile(err.message || "Erreur lors de la sauvegarde du statut");
    } finally {
      setSaving(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="pt-32 pb-20 px-6 bg-bunker-dark min-h-screen flex items-center justify-center">
        <div className="text-center bunker-panel border border-red-500/30 p-12 max-w-md bg-black/60 shadow-xl">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse" />
          <h2 className="text-2xl font-black text-white uppercase italic">Session non identifiée</h2>
          <p className="text-slate-400 font-mono text-xs mt-4 uppercase tracking-widest leading-relaxed">
            Veuillez vous authentifier avec votre compte Google pour accéder aux paramètres de votre profil.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-6 bg-bunker-dark min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* Header section with back to forum button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-px bg-nuclear-yellow" />
              <span className="text-nuclear-yellow font-mono text-[10px] uppercase tracking-[0.4em] font-black">Gestion du compte</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
              MON <span className="text-nuclear-yellow">PROFIL</span>
            </h1>
          </div>

          <button
            onClick={onNavigateToForum}
            className="border border-white/10 hover:border-nuclear-yellow hover:text-nuclear-yellow p-4 text-[10px] font-mono uppercase tracking-widest transition-all text-white bg-white/5"
          >
            ← Retourner au Forum
          </button>
        </div>

        {/* Action alerts */}
        <AnimatePresence>
          {errorProfile && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-4 bg-red-500/10 border border-red-500/50 flex items-start gap-4"
            >
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-500 font-bold uppercase leading-relaxed">{errorProfile}</p>
            </motion.div>
          )}

          {successProfile && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-8 p-4 bg-green-500/10 border border-green-500/50 flex items-start gap-4"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-xs text-green-500 font-bold uppercase leading-relaxed">{successProfile}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* USER CARD INFO */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bunker-panel border-2 border-nuclear-yellow/30 bg-black/40 p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-16 bg-nuclear-yellow" />

              <div className="flex flex-col items-center mb-8">
                {/* Initial circle avatar matching style */}
                <div className="relative w-24 h-24 mb-6">
                  <div className="absolute inset-0 bg-nuclear-yellow/10 rounded-full blur-xl animate-pulse" />
                  <div className="w-24 h-24 border-2 border-nuclear-yellow flex items-center justify-center bg-bunker-dark select-none text-nuclear-yellow font-black text-3xl italic relative">
                    {profile.username.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-bunker-dark animate-pulse shadow-[0_0_8px_#22c55e]" />
                </div>

                <div className="text-center w-full">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-xs text-slate-500 font-mono uppercase tracking-[0.2em]">NOM D'UTILISATEUR :</span>
                  </div>
                  
                  {editingPseudo ? (
                    <form onSubmit={handleUpdatePseudo} className="flex gap-2 w-full mt-2">
                      <input
                        type="text"
                        required
                        value={newPseudo}
                        onChange={(e) => setNewPseudo(e.target.value)}
                        className="flex-grow bg-white/5 border border-white/20 p-2 text-white font-bold outline-none text-xs focus:border-nuclear-yellow italic uppercase"
                      />
                      <button
                        type="submit"
                        disabled={saving}
                        className="bg-nuclear-yellow text-bunker-dark p-2 hover:bg-white transition-all disabled:opacity-50 font-black text-xs uppercase"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">
                        {profile.username}
                      </h3>
                      <button
                        onClick={() => setEditingPseudo(true)}
                        className="text-slate-500 hover:text-nuclear-yellow transition-colors"
                        title="Modifier le pseudo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="mt-4 inline-block bg-nuclear-yellow/10 border border-nuclear-yellow/30 px-3 py-1 font-mono text-[9px] text-nuclear-yellow uppercase tracking-widest">
                    RÔLE : {profile.rank}
                  </div>
                </div>
              </div>

              {/* Account properties */}
              <div className="border-t border-white/10 pt-6 space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 uppercase tracking-widest text-[9px] flex items-center gap-2">
                    <Mail className="w-3 h-3 text-slate-500" /> EMAIL GOOGLE :
                  </span>
                  <span className="text-slate-300 font-bold select-all">{profile.email}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 uppercase tracking-widest text-[9px] flex items-center gap-2">
                    <Compass className="w-3 h-3 text-slate-500" /> NIVEAU D'ACCÈS :
                  </span>
                  <span className="text-green-500 font-bold uppercase">Utilisateur certifié</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 uppercase tracking-widest text-[9px] flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-slate-500" /> COMPTE :
                  </span>
                  <span className="text-slate-300 font-bold uppercase">Actif</span>
                </div>
              </div>
            </div>

            {/* QUICK STATISTICS */}
            <div className="bunker-panel border border-white/5 bg-white/[0.01] p-6 space-y-6">
              <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-4 flex items-center gap-3">
                <Radiation className="w-4 h-4 text-nuclear-yellow" /> STATISTIQUES D'ACTIVITÉ
              </h4>
              
              {loadingStats ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-nuclear-yellow" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/15 p-4 text-center">
                    <MessageSquare className="w-5 h-5 mx-auto mb-2 text-nuclear-yellow" />
                    <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest">Messages</span>
                    <span className="text-2xl font-black text-white italic">{userPostsCount}</span>
                  </div>
                  <div className="bg-white/5 border border-white/15 p-4 text-center">
                    <ThumbsUp className="w-5 h-5 mx-auto mb-2 text-red-500" />
                    <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest">Approbations</span>
                    <span className="text-2xl font-black text-white italic">{userLikesCount}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC POSTS & BIO */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* BIO DE L'UTILISATEUR */}
            <div className="bunker-panel border border-white/10 bg-black/20 p-8 space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                  <Flame className="w-5 h-5 text-nuclear-yellow" /> BIOGRAPHIE ET STATUT PUBLIC
                </h3>
                <button
                  onClick={handleUpdateBio}
                  disabled={saving}
                  className="bg-zinc-800 hover:bg-nuclear-yellow hover:text-bunker-dark border border-white/10 p-2 px-4 font-mono text-[9px] uppercase tracking-widest text-white transition-all disabled:opacity-50"
                >
                  {saving ? "ENREGISTREMENT..." : "SAUVEGARDER"}
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                  Ce texte est visible publiquement par les autres utilisateurs qui consultent votre profil.
                </p>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={150}
                  className="w-full bg-white/5 border border-white/10 p-4 text-white font-mono text-xs outline-none focus:border-nuclear-yellow transition-all uppercase placeholder:text-zinc-600 h-24 resize-none leading-relaxed"
                  placeholder="EX: Développeur passionné de cybersécurité."
                />
                <div className="flex justify-end text-[9px] font-mono text-zinc-600 uppercase">
                  {bio.length} / 150 CARACTÈRES MAX
                </div>
              </div>
            </div>

            {/* OWN TRANSMISSIONS LIST */}
            <div className="bunker-panel border border-white/10 bg-black/20 p-8 space-y-6">
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter border-b border-white/10 pb-4 flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-nuclear-yellow" /> DERNIERS POSTS DE {profile.username}
              </h3>

              {loadingStats ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-nuclear-yellow" />
                </div>
              ) : userPosts.length > 0 ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {userPosts.map((post) => (
                    <div 
                      key={post.id}
                      className="p-4 bg-white/5 border border-white/10 flex hover:border-nuclear-yellow/30 justify-between items-center transition-all group"
                    >
                      <div>
                        <span className="inline-block bg-nuclear-yellow/5 border border-nuclear-yellow/20 px-2 py-0.5 font-mono text-[8px] text-nuclear-yellow uppercase tracking-widest mb-2 italic">
                          {post.category}
                        </span>
                        <h4 className="text-xs font-black text-white group-hover:text-nuclear-yellow transition-colors uppercase italic truncate max-w-md">
                          {post.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-6 text-slate-500 font-mono text-[9px]">
                        <div className="flex items-center gap-1.5">
                          <ThumbsUp className="w-3.5 h-3.5 text-red-500/50" />
                          <span>{post.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{post.commentsCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-white/10">
                  <Compass className="w-10 h-10 text-slate-600 mx-auto mb-4 animate-spin-slow" />
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Aucun post enregistré.</p>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
