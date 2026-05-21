import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  username: string;
  username_lowercase?: string;
  rank: "ADMIN" | "DEV" | "MOD" | "VETERAN" | "MEMBRE";
  isVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<boolean>; // Returns true if profile exists, false if creation needed
  createProfile: (username: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {},
  logout: async () => {},
  loginWithGoogle: async () => false,
  createProfile: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  useEffect(() => {
    let profileUnsubscribe: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (profileUnsubscribe) {
        profileUnsubscribe();
        profileUnsubscribe = null;
      }

      if (currentUser) {
        // Listen to profile changes in real-time
        profileUnsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), async (profileDoc) => {
          if (profileDoc.exists()) {
            const data = profileDoc.data() as UserProfile;
            setProfile(data);
            
            // Auto-verify profile if email is verified in Auth
            if (currentUser.emailVerified && !data.isVerified) {
              await updateDoc(doc(db, 'users', currentUser.uid), {
                isVerified: true
              });
            }
          } else {
            // Profile doesn't exist yet, we don't auto-create it
            // This forces user to pick a pseudo
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to profile:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (profileUnsubscribe) profileUnsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const profileDoc = await getDoc(doc(db, 'users', result.user.uid));
    return profileDoc.exists();
  };

  const createProfile = async (username: string) => {
    if (!auth.currentUser) throw new Error("Aucun utilisateur connecté.");
    const currentUser = auth.currentUser;

    const cleanedUsername = username.trim();
    if (cleanedUsername.length < 3) {
      throw new Error("Le pseudo doit contenir au moins 3 caractères.");
    }
    if (cleanedUsername.length > 20) {
      throw new Error("Le pseudo ne peut pas dépasser 20 caractères.");
    }
    if (!/^[a-zA-Z0-9_\-]+$/.test(cleanedUsername)) {
      throw new Error("Le pseudo contient des caractères invalides (lettres, chiffres, _ et - uniquement).");
    }

    const usernameLower = cleanedUsername.toLowerCase();
    
    // Check uniqueness (case-insensitive) in users collection
    const q = query(collection(db, "users"), where("username_lowercase", "==", usernameLower));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      throw new Error("Ce pseudo est déjà utilisé par un autre membre.");
    }

    const newProfile: UserProfile = {
      uid: currentUser.uid,
      email: currentUser.email || "",
      username: cleanedUsername,
      username_lowercase: usernameLower,
      rank: "MEMBRE",
      isVerified: true // Auto-verify Google or new unique profile registration
    };

    await setDoc(doc(db, 'users', currentUser.uid), {
      ...newProfile,
      createdAt: serverTimestamp()
    });
    setProfile(newProfile);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAuthModalOpen, 
      openAuthModal, 
      closeAuthModal,
      logout,
      loginWithGoogle,
      createProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
