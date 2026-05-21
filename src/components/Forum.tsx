import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  Radiation, 
  Clock, 
  Filter, 
  PlusCircle, 
  ArrowUpCircle,
  Hash,
  ShieldAlert,
  AlertTriangle,
  X,
  Send,
  ChevronRight,
  Activity,
  Users,
  Flame,
  CheckCircle2,
  Loader2,
  Search,
  Trash2,
  User,
  Pin,
  Bookmark,
  Bold,
  Italic,
  List,
  Code,
  BookOpen,
  ShieldCheck,
  AlertOctagon
} from "lucide-react";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  Timestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRank?: "ADMIN" | "DEV" | "MOD" | "VETERAN" | "MEMBRE";
  title: string;
  content: string;
  category: "all" | "discussion" | "news" | "suggestion" | "bug";
  likes: number;
  commentsCount: number;
  timestamp: string; // Using string for easy JSON storage
  isPinned?: boolean;
  hasStaffReply?: boolean;
  deleted?: boolean;
}

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRank?: string;
  text: string;
  timestamp: string;
  isStaff?: boolean;
}

interface ForumProps {
  onNavigateToRules?: () => void;
}

export default function Forum({ onNavigateToRules }: ForumProps = {}) {
  const { user, profile, openAuthModal } = useAuth();
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [activeTab, setActiveTab] = useState<"all" | "discussion" | "news" | "suggestion" | "bug" | "trending" | "bookmarks">("all");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "discussion" as Post["category"] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Safety and Moderation features
  const [flaggedPosts, setFlaggedPosts] = useState<string[]>([]);
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportReason, setReportReason] = useState("inappropriate");
  const [reportDetails, setReportDetails] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportResult, setReportResult] = useState<{
    violatesRules: boolean;
    reason: string;
    aiComment: string;
  } | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [activeComments, setActiveComments] = useState<Comment[]>([]);

  // Functional features: Bookmark system & smart Like system & markdown helpers
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [activeEditorTab, setActiveEditorTab] = useState<"write" | "preview">("write");

  // Load draft on mount/user change
  useEffect(() => {
    if (user) {
      const savedDraft = localStorage.getItem(`bunker_draft_${user.uid}`);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setNewPost(draft);
        } catch (e) {
          console.error("Error loading draft", e);
        }
      }
    }
  }, [user]);

  // Save draft whenever title, content or category changes
  useEffect(() => {
    if (user && (newPost.title || newPost.content)) {
      localStorage.setItem(`bunker_draft_${user.uid}`, JSON.stringify(newPost));
    }
  }, [newPost, user]);

  // Real-time listener for AI flagged posts
  useEffect(() => {
    if (!user) {
      setFlaggedPosts([]);
      return;
    }
    const reportsQuery = query(collection(db, "reports"));
    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const flaggedIds = snapshot.docs
        .filter(doc => doc.data().violatesRules === true)
        .map(doc => doc.data().postId as string);
      setFlaggedPosts(flaggedIds);
    }, (error) => {
      console.warn("Could not load reports: ", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (user) {
      const storedBookmarks = localStorage.getItem(`bunker_bookmarks_${user.uid}`);
      setBookmarks(storedBookmarks ? JSON.parse(storedBookmarks) : []);

      const storedLikes = localStorage.getItem(`bunker_likes_${user.uid}`);
      setLikedPosts(storedLikes ? JSON.parse(storedLikes) : []);
    } else {
      setBookmarks([]);
      setLikedPosts([]);
    }
  }, [user]);

  const toggleBookmark = (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }
    const newBookmarks = bookmarks.includes(postId)
      ? bookmarks.filter(id => id !== postId)
      : [...bookmarks, postId];
    setBookmarks(newBookmarks);
    localStorage.setItem(`bunker_bookmarks_${user.uid}`, JSON.stringify(newBookmarks));
  };

  const insertFormatting = (syntaxBefore: string, syntaxAfter: string = "") => {
    setNewPost(prev => ({
      ...prev,
      content: prev.content + syntaxBefore + syntaxAfter
    }));
  };

  const renderMarkdownPreview = (text: string) => {
    if (!text) return <p className="text-slate-650 italic uppercase font-mono text-[9px] tracking-wider">La console d'aperçu d'édition est vide...</p>;
    const lines = text.split("\n");
    return (
      <div className="space-y-2 font-mono text-xs text-slate-300 leading-relaxed max-w-none">
        {lines.map((line, idx) => {
          if (line.startsWith("- ")) {
            return (
              <li key={idx} className="list-disc ml-6 uppercase text-nuclear-yellow/70 tracking-wide font-black">
                {line.substring(2)}
              </li>
            );
          }
          if (line.startsWith("> ")) {
            return (
              <div key={idx} className="border-l border-white/20 pl-3 py-1 italic bg-white/[0.01] text-slate-400 uppercase">
                {line.substring(2)}
              </div>
            );
          }
          if (line.startsWith("### ")) {
            return (
              <h5 key={idx} className="text-white font-black text-[10px] tracking-widest uppercase italic mt-4">
                {line.substring(4)}
              </h5>
            );
          }
          return (
            <p key={idx} className="min-h-[12px]">
              {line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).map((part, pIdx) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return <strong key={pIdx} className="text-nuclear-yellow font-bold uppercase">{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith("*") && part.endsWith("*")) {
                  return <span key={pIdx} className="text-slate-100 italic uppercase">{part.slice(1, -1)}</span>;
                }
                if (part.startsWith("`") && part.endsWith("`")) {
                  return <code key={pIdx} className="px-1.5 py-0.5 bg-white/10 text-nuclear-yellow border border-white/5 rounded text-[10px]">{part.slice(1, -1)}</code>;
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  const formatTime = (ts: any) => {
    if (!ts) return "En attente...";
    const date = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString();
  };

  // Dynamic sector stats and hot topics
  const activeSurvivorsCount = 12 + new Set(posts.map(p => p.authorId || "")).size;
  const totalLikes = posts.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalComments = posts.reduce((acc, p) => acc + (p.commentsCount || 0), 0);
  const trendPercentage = Math.min(500, 100 + posts.length * 10 + totalLikes * 5 + totalComments * 8);
  const sortedPostsForSignal = [...posts].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeB - timeA;
  });
  const latestSignal = sortedPostsForSignal[0] ? formatTime(sortedPostsForSignal[0].timestamp).toUpperCase() : "SANS SIGNAL";

  const hotTopics = [...posts]
    .sort((a, b) => b.commentsCount - a.commentsCount || b.likes - a.likes)
    .slice(0, 3);

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: { userId: user?.uid, email: user?.email },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  };

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "posts");
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedPost) return;

    const q = query(collection(db, `posts/${selectedPost.id}/comments`), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setActiveComments(commentsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `posts/${selectedPost.id}/comments`);
    });

    return () => unsubscribe();
  }, [selectedPost]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPost.title || !newPost.content) return;
    setSubmitting(true);

    try {
      await addDoc(collection(db, "posts"), {
        authorId: user.uid,
        authorName: profile ? profile.username : "Utilisateur",
        authorRank: profile ? profile.rank : "MEMBRE", // internal TS compatibility
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        likes: 0,
        commentsCount: 0,
        timestamp: serverTimestamp(),
        isPinned: false
      });

      setView("list");
      if (user) {
        localStorage.removeItem(`bunker_draft_${user.uid}`);
      }
      setNewPost({ title: "", content: "", category: "discussion" });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "posts");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePinPost = async (postId: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!profile || (profile.rank !== "ADMIN" && profile.rank !== "DEV")) return;

    try {
      await updateDoc(doc(db, "posts", postId), {
        isPinned: !currentStatus
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (!window.confirm("Confirmer la suppression de ce post ?")) return;

    try {
      await updateDoc(doc(db, "posts", postId), {
        deleted: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const handleReportPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reportingPost) return;
    setReportLoading(true);
    setReportResult(null);

    try {
      const response = await fetch("/api/report-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: reportingPost.title,
          content: reportingPost.content,
          category: reportingPost.category,
          reporterReason: reportReason,
          details: reportDetails
        })
      });

      if (!response.ok) {
        throw new Error("Erreur de communication avec le serveur de sécurité");
      }

      const result = await response.json();
      setReportResult(result);

      // Now save the report directly in Firestore!
      await addDoc(collection(db, "reports"), {
        reporterId: user.uid,
        postId: reportingPost.id,
        reason: reportReason,
        details: reportDetails,
        aiDecision: result.reason,
        aiComment: result.aiComment,
        violatesRules: result.violatesRules,
        timestamp: serverTimestamp()
      });

      // If the AI says it violates rules, hide and deselect
      if (result.violatesRules) {
        setFlaggedPosts(prev => [...prev, reportingPost.id]);
        if (selectedPost?.id === reportingPost.id) {
          setSelectedPost(null);
          setView("list");
        }
      }
    } catch (error) {
      console.error("Failed to report post via AI: ", error);
      // Fallback: save standard report to Firestore even if AI fails
      try {
        await addDoc(collection(db, "reports"), {
          reporterId: user.uid,
          postId: reportingPost.id,
          reason: reportReason,
          details: reportDetails,
          aiDecision: "Échec analyse IA. Analyse manuelle par le staff requise.",
          aiComment: "⚠️ MODÉRATION EN SUSPENS",
          violatesRules: false, // Default is false when AI fails, pending review
          timestamp: serverTimestamp()
        });
        
        setReportResult({
          violatesRules: false,
          reason: "Le serveur IA est inaccessible mais votre signalement a bien été enregistré. Le staff va l'étudier de toute urgence.",
          aiComment: "⚠️ RESEAU RECONNAISSANCE EN PANNE"
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "reports");
      }
    } finally {
      setReportLoading(false);
    }
  };
  
  const handleUpvote = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal();
      return;
    }
    
    try {
      const isLiked = likedPosts.includes(postId);
      const postRef = doc(db, "posts", postId);
      
      if (isLiked) {
        // Unlike post of this ID
        await updateDoc(postRef, {
          likes: increment(-1)
        });
        const updatedLikes = likedPosts.filter(id => id !== postId);
        setLikedPosts(updatedLikes);
        localStorage.setItem(`bunker_likes_${user.uid}`, JSON.stringify(updatedLikes));
        
        // Optimistically update selectedPost states if viewing details
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(prev => prev ? { ...prev, likes: Math.max(0, prev.likes - 1) } : null);
        }
      } else {
        // Like post of this ID
        await updateDoc(postRef, {
          likes: increment(1)
        });
        const updatedLikes = [...likedPosts, postId];
        setLikedPosts(updatedLikes);
        localStorage.setItem(`bunker_likes_${user.uid}`, JSON.stringify(updatedLikes));
        
        // Optimistically update selectedPost states if viewing details
        if (selectedPost && selectedPost.id === postId) {
          setSelectedPost(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  const [commentText, setCommentText] = useState("");
  const handleAddComment = async () => {
    if (!user || !selectedPost || !commentText.trim()) return;
    
    const text = commentText;
    setCommentText(""); // Optimistic clear

    try {
      const commentPath = `posts/${selectedPost.id}/comments`;
      await addDoc(collection(db, commentPath), {
        authorId: user.uid,
        authorName: profile ? profile.username : "Utilisateur",
        authorRank: profile ? profile.rank : "MEMBRE", // internal TS compatibility
        text: text,
        timestamp: serverTimestamp(),
        isStaff: profile?.rank === "ADMIN" || profile?.rank === "DEV"
      });

      // Increment comment count
      await updateDoc(doc(db, "posts", selectedPost.id), {
        commentsCount: increment(1),
        ...( (profile?.rank === "ADMIN" || profile?.rank === "DEV") ? { hasStaffReply: true } : {} )
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `posts/${selectedPost.id}/comments`);
    }
  };

  const openPost = (post: Post) => {
    setSelectedPost(post);
    setView("detail");
  };

  const filteredPosts = [...posts]
    .filter(p => {
      if (p.deleted) return false;
      if (flaggedPosts.includes(p.id)) return false;
      
      // If bookmarked tab is selected, match only bookmarked posts
      if (activeTab === "bookmarks") {
        return bookmarks.includes(p.id);
      }
      
      // For general categories, 'trending' shows all posts matching search, but we sort them differently later
      const matchesCategory = activeTab === "all" || activeTab === "trending" || p.category === activeTab;
      
      const queryLower = searchQuery.toLowerCase();
      const matchesSearch = p.title.toLowerCase().includes(queryLower) || 
                            p.content.toLowerCase().includes(queryLower);
      return matchesCategory && matchesSearch;
    });

  // Apply sorting for trending engagement rating
  if (activeTab === "trending") {
    filteredPosts.sort((a, b) => {
      const scoreA = (a.likes || 0) * 2 + (a.commentsCount || 0) * 3;
      const scoreB = (b.likes || 0) * 2 + (b.commentsCount || 0) * 3;
      return scoreB - scoreA;
    });
  }

  const rules = [
    "Respectez tous les membres de la communauté.",
    "Pas de spam ou de publicité non sollicitée.",
    "Postez dans les catégories appropriées.",
    "Signalez les bugs avec le maximum de détails.",
    "Les insultes et comportements toxiques sont proscrits."
  ];

  return (
    <div className="pt-32 pb-20 px-6 bg-bunker-dark min-h-screen">
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {view === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Verification Banner */}
              {user && !profile?.isVerified && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mb-10 bg-red-500/10 border border-red-500/50 p-6 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-red-500 p-3">
                      <ShieldAlert className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase text-sm tracking-widest italic">Authenticité non validée</h4>
                      <p className="text-[10px] text-slate-400 font-mono uppercase tracking-[0.2em] mt-1">Veuillez confirmer votre identité via le canal de communication.</p>
                    </div>
                  </div>
                </motion.div>
              )}
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-px bg-nuclear-yellow" />
                    <span className="text-nuclear-yellow font-mono text-[10px] uppercase tracking-[0.4em] font-black">Espace Communautaire</span>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
                    FORUM <span className="text-nuclear-yellow">OFFICIEL.</span>
                  </h1>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6 items-end">
                  <div className="w-full md:w-64 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-nuclear-yellow transition-colors" />
                    <input 
                      type="text"
                      placeholder="RECHERCHER..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-white font-mono text-xs outline-none focus:border-nuclear-yellow/50 transition-all uppercase placeholder:text-white/10"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (!user) {
                        openAuthModal();
                      } else if (!profile?.isVerified) {
                        alert("Accès limité : Vous devez valider votre compte pour publier un message.");
                      } else {
                        const isRulesAgreed = localStorage.getItem("rules_agreed") === "true" || localStorage.getItem("bunker_rules_agreed") === "true";
                        if (!isRulesAgreed) {
                          if (confirm("Pour publier un sujet, vous devez d'abord lire et accepter le règlement du forum. Souhaitez-vous le consulter maintenant ?")) {
                            onNavigateToRules?.();
                          }
                        } else {
                          setView("create");
                        }
                      }
                    }}
                    className="bg-nuclear-yellow hover:bg-white text-bunker-dark px-8 py-4 font-black uppercase italic text-sm transition-all flex items-center gap-3 active:scale-95 shadow-[0_0_30px_rgba(251,191,36,0.2)] cursor-pointer"
                  >
                    <PlusCircle className="w-5 h-5" /> Créer un post
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Sidebar */}
                <div className="lg:col-span-3 space-y-8">
                  {user && (
                    <div className="bunker-panel p-6 border border-nuclear-yellow/20 bg-nuclear-yellow/[0.02]">
                      <h3 className="text-white font-black uppercase text-[10px] tracking-[0.3em] mb-6 flex items-center gap-3">
                        <User className="w-4 h-4 text-nuclear-yellow" /> Votre Profil
                      </h3>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-nuclear-yellow/10 border border-nuclear-yellow/50 flex items-center justify-center font-black text-nuclear-yellow italic">
                          {(profile ? profile.username : "??").substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">
                            {profile ? profile.username : "PSEUDO REQUIS"}
                          </p>
                          <span className="text-[8px] text-nuclear-yellow font-mono uppercase tracking-[0.2em]">
                            RÔLE: {profile?.rank || "UTILISATEUR"}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="flex justify-between items-center">
                          <span className="text-[8px] text-slate-500 uppercase font-mono">Posts publiés</span>
                          <span className="text-[10px] text-white font-black">{posts.filter(p => p.authorId === user.uid).length}</span>
                        </div>
                        <div className="flex justify-between items-center text-green-500">
                          <span className="text-[8px] uppercase font-mono">Dernière Connexion</span>
                          <span className="text-[10px] font-black italic">MAINTENANT</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bunker-panel p-6 border border-white/5 bg-white/[0.01]">
                    <h3 className="text-white font-black uppercase text-[10px] tracking-[0.3em] mb-6 flex items-center gap-3">
                      <Activity className="w-4 h-4 text-nuclear-yellow" /> Activité du forum
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 uppercase font-mono">Membres en ligne</span>
                        <div className="flex items-center gap-2">
                          <Users className="w-3 h-3 text-green-500" />
                          <span className="text-[10px] text-white font-black">{activeSurvivorsCount}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 uppercase font-mono">Tendance Forum</span>
                        <div className="flex items-center gap-2">
                          <Flame className="w-3 h-3 text-red-500" />
                          <span className="text-[10px] text-white font-black">+{trendPercentage}%</span>
                        </div>
                      </div>
                      <div className="h-px bg-white/5 w-full my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] text-slate-500 uppercase font-mono">Dernier message</span>
                        <span className="text-[10px] text-nuclear-yellow font-black italic uppercase">{latestSignal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bunker-panel p-6 border border-white/5">
                    <h3 className="text-white font-black uppercase text-[10px] tracking-[0.3em] mb-6 flex items-center gap-3">
                      <Filter className="w-4 h-4 text-nuclear-yellow" /> Catégories
                    </h3>
                    <div className="space-y-1">
                      {[
                        { id: "all", label: "Tous les Sujets" },
                        { id: "trending", label: "🔥 Sujets Tendances" },
                        { id: "bookmarks", label: "⭐ Vos Favoris" },
                        { id: "news", label: "Mises à Jour" },
                        { id: "discussion", label: "Discussions" },
                        { id: "suggestion", label: "Suggestions" },
                        { id: "bug", label: "Bugs & Support" },
                      ].map((tab, index) => (
                        <motion.button
                          key={tab.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => {
                            if (tab.id === "bookmarks" && !user) {
                              openAuthModal();
                            } else {
                              setActiveTab(tab.id as any);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-3 text-[11px] font-black uppercase italic tracking-widest transition-all cursor-pointer ${
                            activeTab === tab.id 
                              ? "bg-nuclear-yellow text-bunker-dark" 
                              : "text-slate-400 hover:bg-white/5"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {tab.label}
                          </span>
                          {tab.id === "bookmarks" && user && (
                            <span className={`text-[9px] px-1.5 py-0.5 font-bold ${activeTab === "bookmarks" ? "bg-bunker-dark text-nuclear-yellow" : "bg-white/5 text-slate-500"}`}>
                              {bookmarks.length}
                            </span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                   <div 
                    onClick={onNavigateToRules}
                    className="bunker-panel p-6 border border-white/5 hover:border-nuclear-yellow/30 bg-white/[0.01] hover:bg-nuclear-yellow/[0.01] transition-all cursor-pointer group/rules block text-left"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white group-hover/rules:text-nuclear-yellow transition-colors font-black uppercase text-[10px] tracking-[0.3em] flex items-center gap-3">
                        <ShieldAlert className="w-4 h-4 text-nuclear-yellow" /> Règlement
                      </h3>
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest group-hover/rules:text-white transition-colors shrink-0">VOIR TOUT →</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed uppercase mb-3">
                      Charte officielle de sécurité, d'anonymat et de respect mutuel au sein de notre forum. Consignes de modération et règles communautaires détaillées.
                    </p>
                    <div className="h-1 w-full bg-white/5 rounded overflow-hidden">
                      <div className="h-full bg-nuclear-yellow/40 w-[100%]" />
                    </div>
                  </div>

                  <div className="bunker-panel p-6 border border-red-500/20 bg-red-500/[0.02]">
                    <h3 className="text-red-500 font-black uppercase text-[10px] tracking-[0.3em] mb-4 flex items-center gap-3">
                      <AlertTriangle className="w-4 h-4" /> Attention
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 leading-relaxed uppercase">
                      Toute demande de remboursement doit être accompagnée d'une preuve de transaction valide.
                    </p>
                  </div>
                </div>

                {/* Feed */}
                <div className="lg:col-span-9 space-y-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 bunker-panel">
                      <Loader2 className="w-12 h-12 text-nuclear-yellow animate-spin mb-4" />
                      <p className="text-slate-500 font-black uppercase italic tracking-widest text-sm">Chargement des discussions...</p>
                    </div>
                  ) : filteredPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 bunker-panel">
                      <Radiation className="w-12 h-12 text-slate-700 mb-4" />
                      <p className="text-slate-500 font-black uppercase italic tracking-widest text-sm">Aucun sujet de discussion répertorié.</p>
                    </div>
                  ) : filteredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                      transition={{ delay: index * 0.1 }}
                      className={`group bunker-panel border transition-all duration-300 relative overflow-hidden ${
                        post.isPinned 
                          ? "border-nuclear-yellow/40 bg-nuclear-yellow/[0.03]" 
                          : "border-white/5 hover:border-nuclear-yellow/20 bg-white/[0.01]"
                      }`}
                    >
                      {/* Interactive background glow */}
                      <div className="absolute inset-0 bg-nuclear-yellow/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      
                      <div className="p-8 relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center font-black text-slate-500 text-xs italic">
                              {post.authorName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                                  {post.authorName}
                                </p>
                                {post.authorRank && (
                                  <span className={`text-[7px] px-1.5 py-0.5 border font-black tracking-tighter ${
                                    post.authorRank === "ADMIN" || post.authorRank === "DEV" 
                                      ? "bg-red-500/10 border-red-500 text-red-500" 
                                      : "bg-nuclear-yellow/10 border-nuclear-yellow text-nuclear-yellow"
                                  }`}>
                                    {post.authorRank}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-slate-500 font-mono text-[8px] uppercase tracking-widest">
                                <span className={`flex items-center gap-1.5 font-bold uppercase transition-colors ${
                                  post.category === "news" ? "text-red-500" : "text-white/40"
                                }`}>
                                  <Hash className="w-2 h-2 text-nuclear-yellow" /> {post.category === "news" ? "DÉPÊCHE_VITE" : post.category}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-2 h-2" /> {formatTime(post.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {post.isPinned && (
                            <div className="px-3 py-1 bg-nuclear-yellow text-bunker-dark text-[10px] font-black uppercase tracking-widest italic">
                              ÉPINGLÉ
                            </div>
                          )}

                          {(profile?.rank === "ADMIN" || profile?.rank === "DEV") && (
                            <button 
                              onClick={(e) => handlePinPost(post.id, !!post.isPinned, e)}
                              className={`p-2 border transition-all ${
                                post.isPinned 
                                  ? "bg-nuclear-yellow border-nuclear-yellow text-bunker-dark" 
                                  : "bg-white/5 border-white/10 text-slate-500 hover:text-nuclear-yellow"
                              }`}
                              title={post.isPinned ? "Désépingler" : "Épingler"}
                            >
                              <Pin className={`w-3 h-3 ${post.isPinned ? "fill-current" : ""}`} />
                            </button>
                          )}
                        </div>

                        <h2 
                          onClick={() => openPost(post)}
                          className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight mb-4 group-hover:text-nuclear-yellow transition-colors leading-tight cursor-pointer"
                        >
                          {post.title}
                        </h2>
                        <p className="text-slate-400 font-mono text-xs leading-relaxed mb-8 max-w-3xl whitespace-pre-wrap line-clamp-3">
                          {post.content}
                        </p>

                        <div className="flex items-center gap-6 pt-6 border-t border-white/5">
                          <button 
                            onClick={(e) => handleUpvote(post.id, e)}
                            className="flex items-center gap-2 group/btn hover:scale-110 transition-transform cursor-pointer"
                          >
                            <ArrowUpCircle className={`w-5 h-5 transition-colors ${
                              likedPosts.includes(post.id) 
                                ? "text-nuclear-yellow fill-nuclear-yellow/20" 
                                : "text-slate-500 group-hover/btn:text-nuclear-yellow"
                            }`} />
                            <span className={`text-[11px] font-black transition-colors ${
                              likedPosts.includes(post.id) ? "text-nuclear-yellow font-black" : "text-slate-400 group-hover/btn:text-white"
                            }`}>{post.likes}</span>
                          </button>
                          <button 
                            onClick={() => openPost(post)}
                            className="flex items-center gap-2 group/btn cursor-pointer"
                          >
                            <MessageSquare className="w-5 h-5 text-slate-500 group-hover/btn:text-white transition-colors" />
                            <span className="text-[11px] font-black text-slate-400 group-hover/btn:text-white transition-colors">{post.commentsCount}</span>
                          </button>

                          <button 
                            onClick={(e) => toggleBookmark(post.id, e)}
                            className="flex items-center gap-2 group/bookmark hover:scale-110 transition-transform cursor-pointer"
                            title="Ajouter aux favoris"
                          >
                            <Bookmark className={`w-5 h-5 transition-colors ${
                              bookmarks.includes(post.id) 
                                ? "text-nuclear-yellow fill-nuclear-yellow" 
                                : "text-slate-500 group-hover/bookmark:text-white"
                            }`} />
                          </button>
                          
                          {user && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportingPost(post);
                                setReportReason("inappropriate");
                                setReportDetails("");
                                setReportResult(null);
                              }}
                              className="flex items-center gap-2 group/report hover:scale-110 transition-transform cursor-pointer"
                              title="Signaler ce sujet à l'IA de modération"
                            >
                              <AlertOctagon className="w-5 h-5 text-slate-500 group-hover/report:text-yellow-550 group-hover/report:text-yellow-500 transition-colors" />
                            </button>
                          )}
                          
                          {(user?.uid === post.authorId || profile?.rank === "ADMIN" || profile?.rank === "DEV") && (
                            <button 
                              onClick={(e) => handleDeletePost(post.id, e)}
                              className="flex items-center gap-2 group/delete hover:scale-110 transition-transform cursor-pointer"
                              title="Supprimer ce sujet"
                            >
                              <Trash2 className="w-5 h-5 text-slate-700 group-hover/delete:text-red-500 transition-colors" />
                            </button>
                          )}
                          
                          {post.hasStaffReply && (
                            <div className="flex items-center gap-2 border-l border-white/10 pl-6 h-4">
                              <CheckCircle2 className="w-3 h-3 text-red-500" />
                              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Réponse_Staff</span>
                            </div>
                          )}
                          <button 
                            onClick={() => openPost(post)}
                            className="ml-auto text-[10px] font-black text-white/20 uppercase tracking-[0.2em] hover:text-nuclear-yellow transition-colors group-hover:text-white flex items-center gap-2"
                          >
                            Voir le sujet <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {view === "create" && (() => {
            const isRulesAgreed = localStorage.getItem("rules_agreed") === "true" || localStorage.getItem("bunker_rules_agreed") === "true";

            return (
              <motion.div
                key="create"
                initial={{ opacity: 0, scale: 0.99, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.99, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="max-w-6xl mx-auto"
              >
                {/* Header Navigation */}
                <div className="flex justify-between items-center mb-8">
                  <button 
                    onClick={() => setView("list")}
                    className="text-slate-500 hover:text-white flex items-center gap-2 font-black uppercase text-[10px] tracking-widest italic cursor-pointer transition-colors"
                  >
                    <X className="w-4 h-4" /> Annuler et retourner au Forum
                  </button>
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                    Mode rédaction de message
                  </span>
                </div>

                {!isRulesAgreed ? (
                  /* Rules Signature Required Block */
                  <div className="bunker-panel p-10 border border-red-500/20 bg-red-500/[0.01] text-center max-w-xl mx-auto space-y-6">
                    <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 text-red-500 rounded-full flex items-center justify-center mx-auto">
                      <ShieldAlert className="w-8 h-8 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                      Signature de la charte requise
                    </h2>
                    <p className="text-xs text-slate-400 font-mono leading-relaxed max-w-md mx-auto uppercase">
                      Pour préserver la qualité des échanges au sein de notre communauté, vous devez impérativement signer le règlement officiel du forum avant de pouvoir publier un sujet.
                    </p>
                    <button 
                      onClick={() => onNavigateToRules?.()}
                      className="bg-nuclear-yellow hover:bg-white text-bunker-dark p-4 px-8 font-black uppercase italic transition-all inline-flex items-center gap-3 text-xs shadow-lg cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" /> Lire et signer le règlement
                    </button>
                  </div>
                ) : (
                  /* Main Two-Column Creation Screen */
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column - Instructions & Metadata (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                      
                      {/* Guide Block */}
                      <div className="bunker-panel p-6 border border-white/5 bg-white/[0.01]">
                        <h3 className="text-white font-black uppercase text-[10px] tracking-[0.3em] mb-4 flex items-center gap-3">
                          <BookOpen className="w-4 h-4 text-nuclear-yellow" /> Guide de publication
                        </h3>
                        <ul className="space-y-3 text-slate-400 font-sans text-[11px] leading-relaxed">
                          <li className="flex items-start gap-2">
                            <span className="text-nuclear-yellow font-bold mt-0.5">•</span>
                            <span><strong>Soyez précis:</strong> Décrivez clairement votre sujet dans le titre ainsi que dans le corps.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-nuclear-yellow font-bold mt-0.5">•</span>
                            <span><strong>Catégorisation:</strong> Choisissez soigneusement la rubrique afin de guider les lecteurs.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-nuclear-yellow font-bold mt-0.5">•</span>
                            <span><strong>Mise en page:</strong> Utilisez le format Markdown pour structurer en titres, listes et codes.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-nuclear-yellow font-bold mt-0.5">•</span>
                            <span><strong>Respect mutuel:</strong> Tout contenu inapproprié, déplacé ou insultant est sévèrement modéré.</span>
                          </li>
                        </ul>
                      </div>

                      {/* Signature Status Check */}
                      <div className="bunker-panel p-5 border border-green-500/10 bg-green-500/[0.02]">
                        <div className="flex gap-4 items-center">
                          <div className="w-10 h-10 rounded border border-green-500 bg-green-500/10 text-green-500 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <span className="text-[8px] font-mono text-green-500 block uppercase tracking-widest font-black">STATUT DIRECTIVE</span>
                            <span className="text-xs font-black text-white uppercase italic tracking-tight">Règlement signé</span>
                          </div>
                        </div>
                      </div>

                      {/* Cheatsheet Formatting Quick Help */}
                      <div className="bunker-panel p-6 border border-white/5 bg-white/[0.01]">
                        <h3 className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] mb-4">
                          Syntaxe Markdown
                        </h3>
                        <div className="space-y-2.5 font-mono text-[9px] text-slate-500 uppercase tracking-wider">
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-slate-400">**Texte en gras**</span>
                            <span>Gras</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-slate-400">*Texte en italique*</span>
                            <span>Italique</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-slate-400">### Mon Titre 3</span>
                            <span>Titre h3</span>
                          </div>
                          <div className="flex justify-between border-b border-white/5 pb-1">
                            <span className="text-slate-400">- Élément de liste</span>
                            <span>Liste</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">`code en direct`</span>
                            <span>Code</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Editor & Form Fields (8 cols) */}
                    <div className="lg:col-span-8 bg-slate-900/40 border border-white/10 p-8 md:p-10 rounded shadow-[0_24px_100px_rgba(0,0,0,0.8)] backdrop-blur-xl relative overflow-hidden">
                      {/* Subtle header accent */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-nuclear-yellow/10 via-nuclear-yellow/50 to-nuclear-yellow/10" />

                      <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-8 flex items-center justify-between">
                        <span>Nouveau Sujet</span>
                        <span className="text-[10px] font-mono text-nuclear-yellow uppercase tracking-widest font-bold">Plateforme de rédaction</span>
                      </h2>

                      <form onSubmit={handleCreatePost} className="space-y-8">
                        {localStorage.getItem(`bunker_draft_${user?.uid}`) && (
                          <div className="p-4 bg-nuclear-yellow/5 border border-nuclear-yellow/20 flex items-center justify-between text-xs rounded">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-nuclear-yellow animate-ping" />
                              <span className="font-mono text-slate-350 text-slate-300 uppercase tracking-widest text-[9px]">
                                Brouillon de l'abri chargé automatiquement.
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setNewPost({ title: "", content: "", category: "discussion" });
                                if (user) {
                                  localStorage.removeItem(`bunker_draft_${user.uid}`);
                                }
                              }}
                              className="text-[9px] font-mono text-red-500 hover:text-white uppercase font-black tracking-widest bg-red-500/10 hover:bg-red-500 px-3 py-1.5 transition-all cursor-pointer rounded border border-red-500/20"
                            >
                              Effacer
                            </button>
                          </div>
                        )}
                        
                        {/* Title Input */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-black text-nuclear-yellow uppercase tracking-widest">
                              Titre du Sujet
                            </label>
                            <span className="text-[9px] font-mono text-slate-500 uppercase">
                              {newPost.title.length} / 80 CARACTÈRES
                            </span>
                          </div>
                          <input 
                            type="text"
                            required
                            maxLength={80}
                            value={newPost.title}
                            onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                            className="w-full bg-slate-950/60 border border-white/10 p-4 rounded text-white font-bold outline-none focus:border-nuclear-yellow transition-all placeholder:text-white/10 italic text-base focus:ring-1 focus:ring-nuclear-yellow/40"
                            placeholder="Entrez un titre représentatif et clair..."
                          />
                        </div>

                        {/* Category Selector Visual Grid */}
                        <div className="space-y-3">
                          <label className="block text-[10px] font-black text-nuclear-yellow uppercase tracking-widest">
                            Sélectionner une catégorie
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { id: "discussion", label: "Discussions", desc: "Sujets généraux et échanges communautaires", icon: MessageSquare },
                              { id: "suggestion", label: "Suggestions", desc: "Propositions d'améliorations", icon: Flame },
                              { id: "bug", label: "Rapport d'Anomalie", desc: "Dysfonctionnements à corriger", icon: AlertTriangle }
                            ].map((cat) => {
                              const Icon = cat.icon;
                              const selected = newPost.category === cat.id;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => setNewPost({ ...newPost, category: cat.id as any })}
                                  className={`p-4 border text-left transition-all relative rounded overflow-hidden cursor-pointer ${
                                    selected 
                                      ? "border-nuclear-yellow bg-nuclear-yellow/[0.04] text-white shadow-[0_4px_20px_rgba(251,191,36,0.05)]" 
                                      : "border-white/5 bg-white/[0.01] text-slate-400 hover:border-white/10 hover:bg-white/[0.02]"
                                  }`}
                                >
                                  <div className="flex items-center gap-3 mb-2">
                                    <Icon className={`w-4 h-4 ${selected ? "text-nuclear-yellow" : "text-slate-500"}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-wider ${selected ? "text-nuclear-yellow" : "text-white"}`}>{cat.label}</span>
                                  </div>
                                  <p className="text-[9px] font-mono leading-relaxed text-slate-500">{cat.desc}</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Post Content Editor with Write/Preview Tabs */}
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-black text-nuclear-yellow uppercase tracking-widest">
                              Contenu détaillé
                            </label>
                            
                            {/* Visual Mode Selector Tabs */}
                            <div className="flex border border-white/10 p-0.5 rounded bg-slate-950/60 font-mono text-[9px] font-black tracking-widest uppercase">
                              <button
                                type="button"
                                onClick={() => setActiveEditorTab("write")}
                                className={`px-3 py-1.5 transition-all cursor-pointer ${
                                  activeEditorTab === "write" 
                                    ? "bg-nuclear-yellow text-bunker-dark rounded-sm font-black" 
                                    : "text-slate-500 hover:text-white"
                                }`}
                              >
                                Éditeur
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveEditorTab("preview")}
                                className={`px-3 py-1.5 transition-all cursor-pointer ${
                                  activeEditorTab === "preview" 
                                    ? "bg-nuclear-yellow text-bunker-dark rounded-sm font-black" 
                                    : "text-slate-500 hover:text-white"
                                }`}
                              >
                                Aperçu en Direct
                              </button>
                            </div>
                          </div>

                          {activeEditorTab === "write" ? (
                            <div className="rounded border border-white/10 overflow-hidden bg-slate-950/20">
                              {/* Rich Toolbar Formatting */}
                              <div className="flex flex-wrap gap-1 border-b border-white/10 bg-white/[0.02] p-2 items-center">
                                <button
                                  type="button"
                                  onClick={() => insertFormatting("**", "**")}
                                  className="p-1.5 px-2.5 bg-white/5 hover:bg-nuclear-yellow/10 border border-white/10 hover:border-nuclear-yellow/50 text-slate-350 hover:text-nuclear-yellow font-bold text-xs cursor-pointer transition-all rounded"
                                  title="Gras (**)"
                                >
                                  <Bold className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertFormatting("*", "*")}
                                  className="p-1.5 px-2.5 bg-white/5 hover:bg-nuclear-yellow/10 border border-white/10 hover:border-nuclear-yellow/50 text-slate-350 hover:text-nuclear-yellow italic cursor-pointer transition-all rounded"
                                  title="Italique (*)"
                                >
                                  <Italic className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertFormatting("- ")}
                                  className="p-1.5 px-2.5 bg-white/5 hover:bg-nuclear-yellow/10 border border-white/10 hover:border-nuclear-yellow/50 text-slate-350 hover:text-nuclear-yellow cursor-pointer transition-all rounded"
                                  title="Liste puces (- )"
                                >
                                  <List className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertFormatting("`", "`")}
                                  className="p-1.5 px-2.5 bg-white/5 hover:bg-nuclear-yellow/10 border border-white/10 hover:border-nuclear-yellow/50 text-slate-350 hover:text-nuclear-yellow font-mono text-xs cursor-pointer transition-all rounded"
                                  title="Code (`)"
                                >
                                  <Code className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertFormatting("> ")}
                                  className="p-1.5 px-2.5 bg-white/5 hover:bg-nuclear-yellow/10 border border-white/10 hover:border-nuclear-yellow/50 text-slate-400 hover:text-nuclear-yellow font-mono text-[9px] uppercase tracking-wider font-extrabold cursor-pointer transition-all rounded"
                                  title="Citation (>)"
                                >
                                  QUOTE
                                </button>
                                <button
                                  type="button"
                                  onClick={() => insertFormatting("### ")}
                                  className="p-1.5 px-2.5 bg-white/5 hover:bg-nuclear-yellow/10 border border-white/10 hover:border-nuclear-yellow/50 text-slate-400 hover:text-nuclear-yellow font-mono text-[9px] uppercase tracking-wider font-extrabold cursor-pointer transition-all rounded"
                                  title="Titre (###)"
                                >
                                  TITRE
                                </button>
                                
                                <div className="ml-auto text-[7.5px] font-mono text-slate-600 uppercase tracking-widest hidden sm:block pr-2 select-none">
                                  Markdown assisté activé
                                </div>
                              </div>
                              
                              <textarea 
                                required
                                rows={12}
                                value={newPost.content}
                                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                                className="w-full bg-slate-950/40 p-5 pr-10 text-slate-300 font-mono text-xs outline-none focus:bg-slate-950/60 transition-colors placeholder:text-slate-700 resize-none leading-relaxed"
                                placeholder="Rédigez votre sujet avec rigueur...\nVous pouvez utiliser les raccourcis de formatage ci-dessus pour embellir la mise en page de votre texte."
                              />
                            </div>
                          ) : (
                            <div className="w-full bg-slate-950/50 border border-white/10 p-6 min-h-[300px] overflow-y-auto font-mono text-xs rounded-sm">
                              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-3">
                                <div className="w-2 h-2 rounded-full bg-nuclear-yellow animate-pulse" />
                                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest font-black">CONTENU_DÉCODÉ : APERÇU LOCAL</span>
                              </div>
                              <div className="prose prose-invert max-w-none">
                                {renderMarkdownPreview(newPost.content)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Submission CTA Block */}
                        <button 
                          type="submit"
                          disabled={submitting}
                          className="w-full bg-nuclear-yellow hover:bg-white text-bunker-dark p-4 font-black uppercase italic transition-all flex items-center justify-center gap-4 text-sm disabled:opacity-50 tracking-wider shadow-[0_4px_30px_rgba(251,191,36,0.15)] cursor-pointer"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Publication en cours...</span>
                            </>
                          ) : (
                            <>
                              <span>Publier le Sujet</span>
                              <Send className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })()}

          {view === "detail" && selectedPost && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="max-w-4xl mx-auto"
            >
              <motion.button 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => setView("list")}
                className="text-slate-500 hover:text-white mb-8 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest italic transition-all group"
              >
                <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1" /> Retour_Forum
              </motion.button>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bunker-panel border border-white/10 mb-10 overflow-hidden bg-white/[0.01] relative shadow-[0_0_100px_rgba(0,0,0,0.5)]"
              >
                {/* Decorative scanning line */}
                <motion.div 
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-px bg-nuclear-yellow/10 z-0 pointer-events-none"
                />

                <div className="p-10 relative z-10">
                  <div className="flex justify-between items-start mb-8 pb-8 border-b border-white/5">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center font-black text-slate-500 text-lg italic">
                        {selectedPost.authorName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-[14px] font-black text-white uppercase tracking-widest">
                            {selectedPost.authorName}
                          </p>
                          {selectedPost.authorRank && (
                            <span className={`text-[8px] px-2 py-0.5 border font-black tracking-tighter ${
                              selectedPost.authorRank === "ADMIN" || selectedPost.authorRank === "DEV" 
                                ? "bg-red-500/10 border-red-500 text-red-500" 
                                : "bg-nuclear-yellow/10 border-nuclear-yellow text-nuclear-yellow"
                            }`}>
                              {selectedPost.authorRank}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-slate-500 font-mono text-[9px] uppercase tracking-widest">
                          <span className="flex items-center gap-1.5 font-bold text-white/40 uppercase">
                            <Hash className="w-3 h-3 text-nuclear-yellow" /> {selectedPost.category}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatTime(selectedPost.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Panel for bookmarking and creator deletion */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => toggleBookmark(selectedPost.id, e)}
                        className={`p-2.5 border transition-all cursor-pointer ${
                          bookmarks.includes(selectedPost.id) 
                            ? "bg-nuclear-yellow/10 border-nuclear-yellow text-nuclear-yellow" 
                            : "bg-white/5 border-white/10 text-slate-500 hover:text-white"
                        }`}
                        title={bookmarks.includes(selectedPost.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                      >
                        <Bookmark className={`w-4 h-4 ${bookmarks.includes(selectedPost.id) ? "fill-current" : ""}`} />
                      </button>

                      {user && (
                        <button 
                          onClick={() => {
                            setReportingPost(selectedPost);
                            setReportReason("inappropriate");
                            setReportDetails("");
                            setReportResult(null);
                          }}
                          className="flex items-center gap-2 bg-yellow-500/10 hover:bg-yellow-500 hover:text-bunker-dark border border-yellow-500/30 text-yellow-500 p-2.5 px-4 font-mono text-[10px] uppercase tracking-widest transition-all rounded font-bold cursor-pointer transition-colors"
                          title="Signaler ce sujet à l'IA de modération"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" /> Signaler
                        </button>
                      )}

                      {(user?.uid === selectedPost.authorId || profile?.rank === "ADMIN" || profile?.rank === "DEV") && (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm("Confirmer la suppression définitive de ce post ?")) return;
                            try {
                              await updateDoc(doc(db, "posts", selectedPost.id), {
                                deleted: true
                              });
                              setView("list");
                              setSelectedPost(null);
                            } catch (error) {
                              handleFirestoreError(error, OperationType.DELETE, `posts/${selectedPost.id}`);
                            }
                          }}
                          className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/30 text-red-500 p-2.5 px-4 font-mono text-[10px] uppercase tracking-widest transition-all rounded font-bold cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Supprimer
                        </button>
                      )}
                    </div>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-8 leading-tight">
                    {selectedPost.title}
                  </h1>
                  
                  <div className="text-slate-400 font-mono text-sm md:text-base leading-relaxed mb-12 whitespace-pre-wrap max-w-none border-l-2 border-white/5 pl-8 italic">
                    {selectedPost.content}
                  </div>

                  <div className="flex items-center gap-8 pt-8 border-t border-white/5">
                    <button 
                      onClick={(e) => handleUpvote(selectedPost.id, e)}
                      className="flex items-center gap-3 px-8 py-4 bg-nuclear-yellow text-bunker-dark border border-nuclear-yellow hover:bg-white transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]"
                    >
                      <ArrowUpCircle className="w-6 h-6" />
                      <span className="text-sm font-black uppercase italic">{selectedPost.likes} <span className="text-[10px] ml-2 tracking-widest">Approbations</span></span>
                    </button>
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-6 h-6 text-slate-500" />
                      <span className="text-sm font-black text-white">{activeComments.length} <span className="text-[10px] text-slate-500 uppercase ml-2 tracking-widest">Réponses</span></span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Comments Section */}
              <div className="space-y-6">
                <h3 className="text-white font-black uppercase text-xl italic tracking-tight flex items-center gap-3 mb-8">
                  <MessageSquare className="w-5 h-5 text-nuclear-yellow" /> Section_Commentaires
                </h3>
                
                {/* Comment Input */}
                <div className="bunker-panel p-6 border border-white/10 bg-white/[0.02] mb-10">
                  {!user ? (
                    <div className="text-center py-4">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identification requise pour répondre</p>
                    </div>
                  ) : !profile?.isVerified ? (
                    <div className="text-center py-4">
                      <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">Vérification email requise pour transmettre une réponse</p>
                    </div>
                  ) : (
                    <>
                      <textarea 
                        placeholder="Écrire une réponse tactique..."
                        className="w-full bg-transparent border-none p-0 text-white font-mono text-sm outline-none resize-none placeholder:text-slate-600 mb-4"
                        rows={3}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <button 
                          onClick={handleAddComment}
                          className="bg-white/10 hover:bg-white text-bunker-dark px-6 py-2.5 font-black uppercase italic text-xs transition-all flex items-center gap-2"
                        >
                           Poster_Réponse <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <AnimatePresence>
                  {activeComments.length > 0 ? activeComments.map((comment, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`bunker-panel p-6 border transition-all duration-300 relative mb-6 ${
                        comment.isStaff 
                          ? "border-red-500/30 bg-red-500/[0.03] shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]" 
                          : "border-white/5 bg-white/[0.005] hover:bg-white/[0.02]"
                      }`}
                    >
                      {comment.isStaff && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-red-500 text-white text-[8px] font-black uppercase tracking-[0.2em] italic">
                          Délégation Staff
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 border flex items-center justify-center font-black text-xs italic ${
                            comment.isStaff ? "bg-red-500/10 border-red-500 text-red-500" : "bg-white/5 border-white/10 text-slate-600"
                          }`}>
                            {comment.authorName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black uppercase tracking-widest block ${
                                comment.isStaff ? "text-red-500" : "text-nuclear-yellow"
                              }`}>{comment.authorName}</span>
                              {comment.authorRank && (
                                <span className={`text-[7px] px-1.5 py-0.5 border font-black tracking-tighter ${
                                  comment.isStaff ? "bg-red-500/10 border-red-500 text-red-500" : "bg-nuclear-yellow/10 border-nuclear-yellow text-nuclear-yellow"
                                }`}>
                                  {comment.authorRank}
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">{formatTime(comment.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      <p className={`font-mono text-xs leading-relaxed ${
                        comment.isStaff ? "text-slate-200" : "text-slate-400"
                      }`}>
                        {comment.text}
                      </p>
                    </motion.div>
                  )) : (
                    <p className="text-center py-10 text-slate-600 font-black uppercase italic tracking-widest text-sm border border-dashed border-white/5">
                      Prêt pour le premier commentaire de la discussion...
                    </p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {reportingPost && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-xl bg-slate-900 border border-white/10 p-6 md:p-8 rounded shadow-[0_24px_100px_rgba(0,0,0,0.9)] relative overflow-hidden"
              >
                {/* Visual Scanner Head Accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  reportResult && reportResult.violatesRules 
                    ? "bg-red-500" 
                    : reportResult 
                      ? "bg-green-500" 
                      : "bg-yellow-500/50 animate-pulse"
                }`} />

                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white font-black uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-yellow-500 animate-pulse" /> 
                    <span>Modération de l'abri par IA</span>
                  </h3>
                  <button 
                    onClick={() => setReportingPost(null)}
                    disabled={reportLoading}
                    className="text-slate-500 hover:text-white cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6 font-mono border-b border-white/5 pb-4">
                  <span className="text-[9px] block uppercase tracking-wider text-slate-500">Sujet à auditer :</span>
                  <span className="text-white text-xs block font-bold truncate mt-1">"{reportingPost.title}"</span>
                  <span className="text-[8px] text-slate-600 block uppercase mt-0.5">Par {reportingPost.authorName} • Catégorie {reportingPost.category.toUpperCase()}</span>
                </div>

                {!reportResult ? (
                  <form onSubmit={handleReportPost} className="space-y-5">
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-yellow-500 uppercase tracking-widest font-bold">
                        Motif principal du signalement
                      </label>
                      <select 
                        required
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/15 p-3.5 rounded text-white font-bold outline-none font-mono text-xs focus:border-yellow-500 cursor-pointer"
                      >
                        <option value="Inapproprié / Grossier">Contenu inapproprié ou grossier</option>
                        <option value="Harcèlement / intimidation">Harcèlement, haine ou intimidation</option>
                        <option value="Arnaque / tentative d\'escroquerie">Arnaque, tentative d'escroquerie ou de vol d'items</option>
                        <option value="Doxxing d\'informations réelles">Divulgation d'infos réelles / Doxxing</option>
                        <option value="Spam / Publicité intempestive">Spam / Publicité intempestive hors-sujet</option>
                        <option value="Autre infraction à la charte">Autre / Manquement à la charte</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[9px] font-black text-yellow-500 uppercase tracking-widest font-bold">
                        Détails complémentaires (Recommandé)
                      </label>
                      <textarea 
                        rows={4}
                        value={reportDetails}
                        onChange={(e) => setReportDetails(e.target.value)}
                        className="w-full bg-slate-950/80 border border-white/15 p-3.5 rounded text-slate-300 font-mono text-xs outline-none focus:border-yellow-500 resize-none leading-relaxed placeholder:text-slate-700"
                        placeholder="Précisez pourquoi ce sujet ne respecte pas les consignes pour guider l'analyse de l'IA de sécurité..."
                      />
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit"
                        disabled={reportLoading}
                        className="w-full bg-yellow-500 hover:bg-white text-bunker-dark p-4 font-black uppercase italic transition-all flex items-center justify-center gap-3 text-xs disabled:opacity-50 tracking-wider shadow-[0_4px_30px_rgba(234,179,8,0.1)] cursor-pointer"
                      >
                        {reportLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Audit IA en cours (Vérification charte)...
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4" />
                            Lancer l'audit automatique par l'IA
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-5">
                    {/* Security Verdict Banner */}
                    <div className={`p-4 border font-mono flex items-center gap-4 ${
                      reportResult.violatesRules 
                        ? "bg-red-500/15 border-red-500/40 text-red-500" 
                        : "bg-green-500/15 border-green-500/40 text-green-500"
                    }`}>
                      <div className="flex-1">
                        <span className="text-[8px] uppercase tracking-widest font-black block mb-1">DÉCISION DU CONTRÔLEUR IA :</span>
                        <p className="text-xs font-black uppercase tracking-wider">{reportResult.aiComment}</p>
                      </div>
                      <div className="text-base font-black">
                        {reportResult.violatesRules ? "⚠️ ENFREINT" : "✅ CONFORME"}
                      </div>
                    </div>

                    {/* AI Feedback Reason explanation */}
                    <div className="bunker-panel p-4 bg-slate-950/40 border border-white/5 space-y-2 font-mono">
                      <span className="text-[8px] text-slate-500 block uppercase tracking-widest">Rapport d'analyse détaillé :</span>
                      <p className="text-xs text-slate-300 leading-relaxed italic">{reportResult.reason}</p>
                    </div>

                    {reportResult.violatesRules && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-[9px] font-mono text-red-400 uppercase tracking-widest leading-normal text-center select-none">
                        ⚠️ Ce post a été retiré de votre flux de discussion en temps réel sous surveillance du réseau.
                      </div>
                    )}

                    <div className="pt-2">
                      <button 
                        type="button"
                        onClick={() => setReportingPost(null)}
                        className="w-full bg-white/10 hover:bg-white/20 text-white font-black uppercase text-xs p-3.5 tracking-wider font-mono italic transition-all cursor-pointer"
                      >
                        Quitter le rapport de sécurité
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

