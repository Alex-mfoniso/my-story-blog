import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import CookieConsent from "./CookieConsent";

// Assume these paths are correct for your project structure
import { Home, Search, Bell, User, Pencil, Plus } from "lucide-react"; // Assuming these are imported for MainLayout usage

// Import the newly created policy page components
import TermsPage from "../pages/TermsPage";
import PrivacyPolicyPage from "../pages/PrivacyPolicyPage";
import CookiePolicyPage from "../pages/CookiePolicyPage";
import AccessibilityPage from "../pages/AccessibilityPage";

const MainLayout = ({ children }) => {
  const { user } = useAuth(); // Assuming useAuth hook is available
  const location = useLocation();

  // Hide Sidebars on Login/Register pages if preferred
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/";

  if (isAuthPage) {
    return <div className="min-h-screen bg-black text-white">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      {/* Cookie Consent Banner */}
      <CookieConsent />

      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="w-full max-w-[600px] border-x border-[#2f3336] min-h-screen flex flex-col relative lg:ml-64 xl:mr-80 xl:ml-64">
        {/* Mobile Header (Sticky) */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3 flex items-center justify-between lg:hidden">
          <Link to="/home">
            <h1 className="text-xl font-extrabold text-[#c30F45]">A's Stories</h1>
          </Link>
          {user ? (
            <Link to="/profile">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                className="w-8 h-8 rounded-full border border-[#c30F45]"
                alt="Profile"
              />
            </Link>
          ) : (
            <Link to="/login" className="text-sm font-bold hover:text-[#c30F45]">Log in</Link>
          )}
        </header>

        {/* Page Content */}
        <div className="flex-1">
          {children}
        </div>

        {/* Floating Action Button (Mobile) */}
        {user && location.pathname === "/" && (
          <Link 
            to="/upload" 
            className="fixed bottom-20 right-4 w-14 h-14 bg-[#c30F45] rounded-full flex items-center justify-center text-white shadow-2xl lg:hidden hover:scale-110 transition-transform active:scale-95"
          >
            {/* Replaced ✍️ emoji with Pencil icon */}
            <Pencil className="text-2xl" />
          </Link>
        )}

        {/* Mobile Navigation (Bottom Bar) */}
        <nav className="fixed bottom-0 left-0 w-full bg-black border-t border-[#2f3336] flex justify-around items-center py-3 lg:hidden z-50">
          {/* Replaced emojis with Lucide icons */}
          <Link to="/home" className="text-3xl"><Home /></Link>
          <Link to="/stories" className="text-3xl"><Search /></Link>
          {/* Post Button */}
          {user && (
            <Link to="/upload" className="flex items-center justify-center rounded-full bg-[#c30F45] shadow-xl text-white text-3xl">
              <Plus className="text-white text-3xl" />
            </Link>
          )}
          <Link to="/notifications" className="text-3xl"><Bell /></Link>
          <Link to="/profile" className="text-3xl"><User /></Link>
        </nav>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  );
};

export default MainLayout;
