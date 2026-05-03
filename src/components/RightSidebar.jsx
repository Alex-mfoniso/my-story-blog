import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { useAuth } from "../context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

const RightSidebar = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // Global Search Logic
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

  // Fetch "Who to follow" suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const q = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(4)
        );
        const snapshot = await getDocs(q);
        const users = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.id !== user?.uid);
        setSuggestedUsers(users);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    fetchSuggestions();
  }, [user]);

  return (
    <aside className="fixed right-0 top-0 h-screen w-80 border-l border-[#2f3336] flex flex-col px-6 py-4 z-50 bg-black hidden xl:flex">
      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearch(true)}
            className="bg-[#202327] border-transparent rounded-full py-2.5 px-12 text-sm text-white focus:outline-none focus:bg-black focus:border-[#c30F45] focus:ring-1 focus:ring-[#c30F45] w-full transition-all duration-200"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
        </div>

        <AnimatePresence>
          {showSearch && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-full left-0 w-full bg-black border border-[#2f3336] rounded-xl mt-2 overflow-hidden shadow-2xl z-[60]"
            >
              {searchResults.map(u => (
                <Link
                  key={u.id}
                  to={`/author/${u.id}`}
                  onClick={() => { setShowSearch(false); setSearchQuery(""); }}
                  className="flex items-center gap-3 p-3 hover:bg-[#181818] transition border-b border-[#2f3336] last:border-0"
                >
                  <img src={u.photoURL} className="w-10 h-10 rounded-full border border-[#2f3336]" alt="" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">{u.displayName}</span>
                    <span className="text-xs text-gray-500">@{u.email?.split("@")[0]}</span>
                  </div>
                </Link>
              ))}
              <Link
                to={`/search-users?q=${searchQuery}`}
                onClick={() => setShowSearch(false)}
                className="block p-3 text-center text-sm text-[#c30F45] hover:bg-[#181818] transition"
              >
                Show more
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Who to follow */}
      <div className="bg-[#16181c] rounded-2xl overflow-hidden border border-[#16181c]">
        <h2 className="text-xl font-extrabold text-white px-4 py-3">Who to follow</h2>
        
        {loadingSuggestions ? (
          <div className="p-4 text-center text-gray-500 text-sm">Loading authors...</div>
        ) : suggestedUsers.length > 0 ? (
          <div className="flex flex-col">
            {suggestedUsers.map(u => (
              <Link
                key={u.id}
                to={`/author/${u.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-[#1d1f23] transition duration-200"
              >
                <div className="flex items-center gap-3">
                  <img src={u.photoURL} className="w-10 h-10 rounded-full border border-[#2f3336]" alt="" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white truncate w-24">{u.displayName}</span>
                    <span className="text-xs text-gray-500 truncate w-24">@{u.email?.split("@")[0]}</span>
                  </div>
                </div>
                <button className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors">
                  View
                </button>
              </Link>
            ))}
            <Link to="/search-users" className="p-4 text-[#c30F45] text-sm hover:bg-[#1d1f23] transition">
              Show more
            </Link>
          </div>
        ) : (
          <div className="p-4 text-gray-500 text-sm">No new authors found.</div>
        )}
      </div>

      {/* Footer / Links */}
      <div className="mt-6 px-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        <Link to="/" className="hover:underline">Terms of Service</Link>
        <Link to="/" className="hover:underline">Privacy Policy</Link>
        <Link to="/" className="hover:underline">Cookie Policy</Link>
        <Link to="/" className="hover:underline">Accessibility</Link>
        <span>© 2026 Alex's Stories</span>
      </div>
    </aside>
  );
};

export default RightSidebar;
