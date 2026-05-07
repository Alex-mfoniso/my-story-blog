import React, { useEffect, useState } from "react";
import { db } from "../firebase/fireabase";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../context/AuthContext";

const EDIT_WINDOW_MINUTES = 15;

const ManageStories = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "stories"),
      where("authorId", "==", user.uid),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setStories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filtered = stories.filter((s) =>
    s.title?.toLowerCase().includes(search.toLowerCase()),
  );

  const canEditStory = (story) => {
    const createdSeconds = story.createdAt?.seconds;
    if (!createdSeconds) return false;
    const createdMs = createdSeconds * 1000;
    return Date.now() - createdMs <= EDIT_WINDOW_MINUTES * 60 * 1000;
  };

  const handleDelete = async (storyId) => {
    if (!window.confirm("Delete this story permanently?")) return;
    try {
      await deleteDoc(doc(db, "stories", storyId));
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  if (!user) return <div className="text-center py-20">Please log in.</div>;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3">
        <h2 className="text-xl font-bold">Manage Stories</h2>
        <p className="text-xs text-gray-500">{stories.length} stories found</p>
      </header>

      {/* Search Bar */}
      <div className="p-4 border-b border-[#2f3336]">
        <div className="relative group">
          <input
            type="text"
            placeholder="Search your stories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#202327] border-transparent rounded-full py-2 px-10 text-sm text-white focus:outline-none focus:bg-black focus:border-[#c30F45] focus:ring-1 focus:ring-[#c30F45] w-full transition-all duration-200"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm"></span>
        </div>
      </div>

      {/* Stories List */}
      <div className="pb-20 lg:pb-0">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#c30F45] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No stories found.
          </div>
        ) : (
          filtered.map((story) => (
            <div
              key={story.id}
              className="p-4 border-b border-[#2f3336] hover:bg-[#080808] transition duration-200"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-lg truncate mb-1">
                    {story.title}
                  </h3>
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span className="text-[#c30F45] font-bold">
                      {story.genre}
                    </span>
                    <span>·</span>
                    <span>
                      {story.createdAt?.seconds
                        ? formatDistanceToNow(
                            new Date(story.createdAt.seconds * 1000),
                            { addSuffix: true },
                          )
                        : "just now"}
                    </span>
                  </div>
                  {story.isDraft && (
                    <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded mt-2 inline-block">
                      DRAFT
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {canEditStory(story) ? (
                    <Link
                      to={`/edit/${story.id}`}
                      className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-bold hover:bg-gray-200 transition text-center"
                    >
                      Edit
                    </Link>
                  ) : (
                    <span className="text-[10px] text-gray-600 font-bold text-right">
                      Locked
                    </span>
                  )}
                  <button
                    onClick={() => handleDelete(story.id)}
                    className="text-red-500 text-xs font-bold hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ManageStories;
