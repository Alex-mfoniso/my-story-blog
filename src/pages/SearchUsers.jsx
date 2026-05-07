import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  doc,
  deleteDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SearchUsers = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [followingIds, setFollowingIds] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "following"),
      (snap) => {
        setFollowingIds(new Set(snap.docs.map((d) => d.id)));
      },
    );
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const search = async () => {
      if (searchTerm.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const lowerQuery = searchTerm.toLowerCase();
        const q = query(
          collection(db, "users"),
          where("displayNameLower", ">=", lowerQuery),
          where("displayNameLower", "<=", lowerQuery + "\uf8ff"),
          limit(20),
        );

        const snap = await getDocs(q);
        const users = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((u) => u.id !== user?.uid);

        setResults(users);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(search, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, user]);

  const toggleFollow = async (targetUserId) => {
    if (!user) return alert("Login to follow authors");
    const followerRef = doc(db, "users", targetUserId, "followers", user.uid);
    const followingRef = doc(db, "users", user.uid, "following", targetUserId);
    if (followingIds.has(targetUserId)) {
      await deleteDoc(followerRef);
      await deleteDoc(followingRef);
    } else {
      await setDoc(followerRef, { followedAt: new Date() });
      await setDoc(followingRef, { followedAt: new Date() });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Sticky Search Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search authors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#202327] border-transparent rounded-full py-2.5 px-12 text-sm text-white focus:outline-none focus:bg-black focus:border-[#c30F45] focus:ring-1 focus:ring-[#c30F45] w-full transition-all duration-200"
          />
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></span>
        </div>
      </header>

      {/* Results List */}
      <div className="pb-20 lg:pb-0">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-[#c30F45] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : results.length > 0 ? (
          results.map((u) => (
            <div
              key={u.id}
              className="p-4 border-b border-[#2f3336] hover:bg-[#080808] transition duration-200 flex items-center justify-between"
            >
              <Link
                to={`/author/${u.id}`}
                className="flex items-center gap-3 min-w-0"
              >
                <img
                  src={
                    u.photoURL ||
                    `https://ui-avatars.com/api/?name=${u.displayName}`
                  }
                  alt=""
                  className="w-12 h-12 rounded-full border border-[#2f3336] flex-shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-bold text-white hover:underline truncate">
                    {u.displayName}
                  </h3>
                  <p className="text-gray-500 text-sm truncate">
                    @{u.email?.split("@")[0]}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => toggleFollow(u.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${followingIds.has(u.id) ? "border border-[#2f3336] text-white hover:text-red-500 hover:border-red-500" : "bg-white text-black hover:bg-gray-200"}`}
              >
                {followingIds.has(u.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))
        ) : searchTerm.length >= 2 ? (
          <div className="text-center py-20 px-8">
            <h3 className="text-2xl font-bold text-white mb-2">
              No results for "{searchTerm}"
            </h3>
            <p className="text-gray-500 text-sm">
              Try searching for people you know or keywords.
            </p>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>Discover amazing authors and storytellers.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchUsers;
