import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  Search, // Keep Search import in case it's used elsewhere
  Bell,
  Bookmark,
  Users,
  User,
  Shield,
  DoorOpen,
} from "lucide-react"; // Added Lucide imports

const ADMIN_UID = "jUVRPKVD9VWGk0guVbDT68FTgxj1";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.uid === ADMIN_UID;

  // Updated navItems: Restored icon for "Explore"
  const navItems = [
    { name: "Home", path: "/home", icon: Home },
    { name: "Explore", path: "/stories", icon: Search }, // Restored Search icon
    { name: "Notifications", path: "/notifications", icon: Bell, auth: true },
    { name: "Bookmarks", path: "/bookmarks", icon: Bookmark, auth: true },
    { name: "Find Authors", path: "/search-users", icon: Users, auth: true },
    { name: "Profile", path: "/profile", icon: User, auth: true },
  ];

  const activeClass = "font-bold text-[#c30F45]";
  const inactiveClass = "text-gray-300 hover:bg-[#181818] hover:text-white";

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-[#2f3336] flex flex-col px-4 py-6 z-50 bg-black hidden lg:flex">
      {/* Logo */}
      <Link to="/" className="mb-8 px-4">
        <h1 className="text-2xl font-extrabold text-[#c30F45] tracking-tight">
          A's Stories
        </h1>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          if (item.auth && !user) return null;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-full text-xl transition-all duration-200 ${
                isActive ? activeClass : inactiveClass
              }`}
            >
              {item.icon && ( // Conditionally render the icon span
                <span><item.icon /></span>
              )}
              <span>{item.name}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            to="/admin"
            className={`flex items-center gap-4 px-4 py-3 rounded-full text-xl transition-all duration-200 ${
              location.pathname === "/admin" ? activeClass : inactiveClass
            }`}
          >
            <span><Shield /></span> {/* Replaced 🛡️ with Shield icon */}
            <span>Admin</span>
          </Link>
        )}
      </nav>

      {/* Post Button */}
      {user && (
        <Link
          to="/upload"
          className="mt-4 w-full bg-[#c30F45] text-white py-3 rounded-full text-center font-bold text-lg hover:bg-[#a30d3a] transition-colors shadow-lg"
        >
          Post Story
        </Link>
      )}

      {/* User Profile / Logout */}
      <div className="mt-auto border-t border-[#2f3336] pt-4">
        {user ? (
          <div className="flex items-center justify-between px-2">
            <Link to="/profile" className="flex items-center gap-3">
              <img
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                alt="Profile"
                className="w-10 h-10 rounded-full border border-[#2f3336]"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white truncate w-24">
                  {user.displayName || "User"}
                </span>
                <span className="text-xs text-gray-500 truncate w-24">
                  @{user.email?.split("@")[0]}
                </span>
              </div>
            </Link>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-[#c30F45] transition-colors"
              title="Logout"
            >
              <DoorOpen /> {/* Replaced 🚪 with DoorOpen icon */}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full border border-[#c30F45] text-[#c30F45] py-2 rounded-full text-center font-bold hover:bg-[#c30F45]/10 transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="w-full bg-white text-black py-2 rounded-full text-center font-bold hover:bg-gray-200 transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
