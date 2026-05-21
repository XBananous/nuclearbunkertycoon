import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Forum from "./components/Forum";
import Profile from "./components/Profile";
import Footer from "./components/Footer";
import Auth from "./components/Auth";
import Rules from "./components/Rules";
import { AnimatePresence, motion } from "motion/react";
import { AuthProvider, useAuth } from "./context/AuthContext";

function AppContent() {
  const [currentView, setCurrentView] = useState<"forum" | "profile" | "auth" | "rules">("forum");
  const { isAuthModalOpen, closeAuthModal, user, profile, loading } = useAuth();

  // Redirect if they log out while viewing Profile page
  useEffect(() => {
    if (!user && currentView === "profile") {
      setCurrentView("forum");
    }
  }, [user, currentView]);

  // Intercept openAuthModal triggers (from anywhere in the app) and redirect to the Auth Page
  useEffect(() => {
    if (isAuthModalOpen) {
      setCurrentView("auth");
      closeAuthModal();
    }
  }, [isAuthModalOpen, closeAuthModal]);

  // If the user is logged in with Google, but has not completed their pseudonym setup, force pseudo selector
  const showForcePseudoSetup = !!(user && !profile && !loading);

  const handleAuthSuccess = () => {
    setCurrentView("forum");
  };

  const handleAuthCancel = () => {
    setCurrentView("forum");
  };

  return (
    <div className="min-h-screen flex flex-col bg-bunker-dark">
      <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {showForcePseudoSetup ? (
            <motion.div
              key="auth_force"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Auth onSuccess={handleAuthSuccess} onCancel={handleAuthCancel} />
            </motion.div>
          ) : currentView === "auth" ? (
            <motion.div
              key="auth_view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Auth onSuccess={handleAuthSuccess} onCancel={handleAuthCancel} />
            </motion.div>
          ) : currentView === "rules" ? (
            <motion.div
              key="rules_view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Rules onNavigateBack={() => setCurrentView("forum")} />
            </motion.div>
          ) : currentView === "profile" && user && profile ? (
            <motion.div
              key="profile_view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Profile onNavigateToForum={() => setCurrentView("forum")} />
            </motion.div>
          ) : (
            <motion.div
              key="forum_view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <Forum onNavigateToRules={() => {
                setCurrentView("rules");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
