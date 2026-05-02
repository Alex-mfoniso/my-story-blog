import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";

const SearchUsers = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const search = async () => {
      if (searchTerm.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const lowerQuery = searchTerm.toLowerCase();
        // Firestore prefix search trick
        const q = query(
          collection(db, "users"),
          where("displayNameLower", ">=", lowerQuery),
          where("displayNameLower", "<=", lowerQuery + "\uf8ff"),
          limit(20)
        );
        
        const snap = await getDocs(q);
        const users = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.id !== user?.uid); // Don't show self
        
        setResults(users);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, user]);

  return (
    <div className="min-h-screen bg-[#231123] text-white pt-24 pb-12 px-4 font-sans">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-[#c30F45] mb-8 text-center">Find Authors</h1>
        
        <div className="relative mb-12">
          <input
            type="text"
            placeholder="Search by name (e.g. Alex)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 pl-12 rounded-2xl bg-[#1f1f38]/80 border border-[#3a2e4e] text-white focus:outline-none focus:ring-2 focus:ring-[#c30F45] shadow-xl text-lg"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-gray-500">🔍</span>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400 animate-pulse text-xl">Searching for storytellers...</div>
        ) : results.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((u, index) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#2c1b2f] p-4 rounded-2xl border border-[#3a2e4e] flex items-center gap-4 hover:border-[#c30F45] transition shadow-lg group"
              >
                <img 
                  src={u.photoURL || `https://ui-avatars.com/api/?name=${u.displayName}`} 
                  alt={u.displayName} 
                  className="w-16 h-16 rounded-full border-2 border-[#c30F45] object-cover group-hover:scale-105 transition"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg group-hover:text-[#c30F45] transition">{u.displayName}</h3>
                  <p className="text-xs text-gray-400 truncate max-w-[150px]">{u.email}</p>
                </div>
                <Link 
                  to={`/author/${u.id}`} 
                  className="bg-[#c30F45] text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-pink-600 transition"
                >
                  View Profile
                </Link>
              </motion.div>
            ))}
          </div>
        ) : searchTerm.length >= 2 ? (
          <div className="text-center py-20 bg-[#1f1f38]/50 rounded-3xl border border-[#3a2e4e]">
            <span className="text-6xl block mb-4">🕵️</span>
            <p className="text-xl text-gray-400">No authors found matching "{searchTerm}"</p>
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg italic">Start typing to discover amazing authors...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchUsers;
