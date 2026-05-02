// import React, { useState, useEffect } from "react";
// import { useAuth } from "../context/AuthContext";

// const Header = () => {
//   const [open, setOpen] = useState(false);
//   const [darkMode, setDarkMode] = useState(() => {
//     return localStorage.getItem("theme") === "dark";
//   });

//   const { user } = useAuth();

//   useEffect(() => {
//     const root = document.documentElement;
//     if (darkMode) {
//       root.classList.add("dark");
//       localStorage.setItem("theme", "dark");
//     } else {
//       root.classList.remove("dark");
//       localStorage.setItem("theme", "light");
//     }
//   }, [darkMode]);

//   return (
//     <header className="w-full px-6 py-4 flex justify-between items-center bg-[#231123] text-white fixed top-0 z-50">
//       <h1 className="text-xl font-bold" style={{ color: "#c30F45" }}>
//         Alex's Stories
//       </h1>

//       <div className="flex items-center gap-4">
//         <button
//           onClick={() => setOpen(!open)}
//           className="md:hidden text-white text-2xl"
//         >
//           ☰
//         </button>
//       </div>

//       <nav
//         className={`${
//           open ? "block" : "hidden"
//         } absolute top-16 left-0 w-full bg-[#231123] md:static md:flex md:space-x-6 md:w-auto`}
//       >
//         <a href="/" className="block px-4 py-2 hover:text-[#c30F45]">
//           Home
//         </a>
//         <a href="/stories" className="block px-4 py-2 hover:text-[#c30F45]">
//           Stories
//         </a>

//         {user ? (
//         <>
//             <a href="/bookmarks" className="block px-4 py-2 hover:text-[#c30F45]">
//               My Bookmarks
//             </a>
//             <a href="/profile" className="block px-4 py-2 hover:text-[#c30F45]">
//               Profile
//             </a>
//           </>
//         ) : (
//           <>
//             <a href="/login" className="block px-4 py-2 hover:text-[#c30F45]">
//               Login
//             </a>
//             <a href="/register" className="block px-4 py-2 hover:text-[#c30F45]">
//               Register
//             </a>
//           </>
//         )}
//       </nav>
//     </header>
//   );
// };

// export default Header;

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

import { collection, query, where, onSnapshot, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase/fireabase";

const ADMIN_UID = "jUVRPKVD9VWGk0guVbDT68FTgxj1";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  const { user } = useAuth();
  const isAdmin = user?.uid === ADMIN_UID;

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "notifications"), where("read", "==", false));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUnreadCount(snap.size);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Global Search Logic
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      try {
        const lowerQuery = searchQuery.toLowerCase();
        const q = query(
          collection(db, "users"),
          where("displayNameLower", ">=", lowerQuery),
          where("displayNameLower", "<=", lowerQuery + "\uf8ff"),
          limit(5)
        );
        const snapshot = await getDocs(q);
        setSearchResults(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Search error:", err);
      }
    };
    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <header className="w-full px-6 py-4 flex items-center bg-[#0c0c0c] text-white fixed top-0 z-50 shadow-md">
      <div className="flex-shrink-0">
        <Link to="/">
          <h1 className="text-xl font-extrabold tracking-wide text-[#c30F45]">
            Alex's Stories
          </h1>
        </Link>
      </div>

      {/* Centered Global Search Bar (Desktop) */}
      <div className="flex-1 flex justify-center px-4">
        {user && (
          <div className="hidden lg:block relative w-full max-w-md">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearch(true)}
                className="bg-[#1f1f38] border border-[#3a2e4e] rounded-full py-1.5 px-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#c30F45] w-full transition-all duration-300"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></span>
            </div>

            <AnimatePresence>
              {showSearch && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 w-full bg-[#1f1f38] border border-[#3a2e4e] rounded-xl mt-2 overflow-hidden shadow-2xl"
                >
                  {searchResults.map(u => (
                    <Link
                      key={u.id}
                      to={`/author/${u.id}`}
                      onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                      className="flex items-center gap-3 p-3 hover:bg-[#2c1b2f] transition"
                    >
                      <img src={u.photoURL} className="w-8 h-8 rounded-full border border-[#c30F45]" alt="" />
                      <span className="text-sm font-medium">{u.displayName}</span>
                    </Link>
                  ))}
                  <Link
                    to={`/search-users?q=${searchQuery}`}
                    onClick={() => setShowSearch(false)}
                    className="block p-2 text-center text-xs text-[#c30F45] bg-[#0c0c0c] hover:underline"
                  >
                    See all results
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Hamburger Button (Mobile) */}
      <button
        onClick={() => setOpen(!open)}
        className="md:hidden text-white focus:outline-none ml-auto"
      >
        <motion.div
          initial={false}
          animate={open ? "open" : "closed"}
          className="w-6 h-6 flex flex-col justify-between"
        >
          <motion.span
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: 45, y: 7 },
            }}
            className="block h-0.5 w-full bg-white"
          />
          <motion.span
            variants={{
              closed: { opacity: 1 },
              open: { opacity: 0 },
            }}
            className="block h-0.5 w-full bg-white"
          />
          <motion.span
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: -45, y: -7 },
            }}
            className="block h-0.5 w-full bg-white"
          />
        </motion.div>
      </button>

      {/* Desktop Nav */}
      <nav className="hidden md:flex space-x-6 text-sm font-medium items-center ml-auto">
        <Link to="/" className="hover:text-[#c30F45]">Home</Link>
        <Link to="/stories" className="hover:text-[#c30F45]">Stories</Link>
        {user ? (
          <>
            <Link to="/search-users" className="hover:text-[#c30F45]">Find Authors</Link>
            <Link to="/upload" className="hover:text-[#c30F45]">Post Story</Link>
            {isAdmin && <Link to="/admin" className="hover:text-[#c30F45]">Admin</Link>}
            <Link to="/bookmarks" className="hover:text-[#c30F45]">My Bookmarks</Link>
            <Link to="/profile" className="hover:text-[#c30F45]">Profile</Link>
            <Link to="/notifications" className="relative hover:text-[#c30F45] flex items-center">
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-[#c30F45] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-[#c30F45]">Login</Link>
            <Link to="/register" className="hover:text-[#c30F45]">Register</Link>
          </>
        )}
      </nav>

      {/* Mobile Nav */}
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute left-0 w-full bg-[#0c0c0c] shadow-lg md:hidden flex flex-col items-start px-6 py-4 space-y-4 text-sm z-40"
            style={{ top: "100%" }} // fix the mobile menu to stick to bottom of header without space
          >
            {/* Mobile Search */}
            {user && (
              <div className="w-full relative pb-4 border-b border-[#3a2e4e]">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1f1f38] border border-[#3a2e4e] rounded-full py-2 px-10 text-sm focus:outline-none"
                />
                <span className="absolute left-3 top-2 text-gray-400"></span>
                {searchResults.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {searchResults.slice(0, 3).map(u => (
                      <Link key={u.id} to={`/author/${u.id}`} onClick={() => setOpen(false)} className="flex items-center gap-2 p-2 bg-[#1f1f38] rounded-lg">
                        <img src={u.photoURL} className="w-6 h-6 rounded-full" alt="" />
                        <span className="text-xs">{u.displayName}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Link to="/" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">Home</Link>
            <Link to="/stories" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">Stories</Link>
            {user ? (
              <>
                <Link to="/search-users" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">Find Authors</Link>
                <Link to="/upload" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">Post Story</Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">Admin</Link>
                )}
                <Link to="/bookmarks" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">My Bookmarks</Link>
                <Link to="/profile" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">Profile</Link>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">Login</Link>
                <Link to="/register" onClick={() => setOpen(false)} className="hover:text-[#c30F45]">Register</Link>
              </>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
