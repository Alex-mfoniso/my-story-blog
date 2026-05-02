import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../context/AuthContext";
import LikesAndComments from "../components/LikesAndComments";
import { Helmet } from "react-helmet";

const WORDS_PER_PAGE = 250;
const FONT_SIZES = ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl"];

const StoryDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmark, setBookmark] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSizeIndex, setFontSizeIndex] = useState(1); // Default to "text-base"

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "stories", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setStory({ id: snap.id, ...snap.data() });
        }

        if (user) {
          const bookmarkSnap = await getDoc(doc(db, "users", user.uid, "bookmarks", id));
          setBookmark(bookmarkSnap.exists());
        }
      } catch (err) {
        console.error("Failed to load story:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id, user]);

  const toggleBookmark = async () => {
    if (!user) return alert("Login to bookmark.");
    const ref = doc(db, "users", user.uid, "bookmarks", id);
    try {
      if (bookmark) {
        await deleteDoc(ref);
        setBookmark(false);
      } else {
        await setDoc(ref, { savedAt: new Date() });
        setBookmark(true);
      }
    } catch (err) {
      console.error("Bookmark error:", err);
    }
  };

  const increaseFontSize = () => setFontSizeIndex(prev => Math.min(prev + 1, FONT_SIZES.length - 1));
  const decreaseFontSize = () => setFontSizeIndex(prev => Math.max(prev - 1, 0));

  if (loading || !story) {
    return <div className="text-white text-center py-10">Loading story...</div>;
  }

  const words = story.content.split(" ");
  const totalPages = Math.max(1, Math.ceil(words.length / WORDS_PER_PAGE));
  const pageWords = words.slice((currentPage - 1) * WORDS_PER_PAGE, currentPage * WORDS_PER_PAGE);
  const pageContent = pageWords.join(" ");
  
  const progressPercentage = (currentPage / totalPages) * 100;

  return (
    <div className="min-h-screen px-4 py-24 bg-gradient-to-br from-[#0f0f1c] via-[#1a1a2e] to-[#1f1f38] text-white">
      <Helmet>
        <title>{story.title} | My Story Blog</title>
        <meta name="description" content={story.excerpt || "Read this amazing story on My Story Blog."} />
        <meta property="og:title" content={story.title} />
        <meta property="og:description" content={story.excerpt || "Read this amazing story on My Story Blog."} />
        {story.image && <meta property="og:image" content={story.image} />}
      </Helmet>

      {/* Progress Bar (Sticky Top) */}
      <div className="fixed top-0 left-0 w-full h-1 bg-[#2a2a45] z-50">
        <div className="h-full bg-[#c30F45] transition-all duration-300 ease-out" style={{ width: `${progressPercentage}%` }}></div>
      </div>

      <div className="max-w-3xl mx-auto bg-[#1f1f38]/80 backdrop-blur-sm border border-[#3a2e4e] p-6 rounded-xl shadow-lg relative">
        
        {/* Accessibility Controls */}
        <div className="absolute -top-12 right-0 flex gap-2 bg-[#2c1b2f] p-1 rounded-t-lg border-x border-t border-[#3a2e4e]">
          <button onClick={decreaseFontSize} title="Decrease Text Size" className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded text-sm">A-</button>
          <button onClick={increaseFontSize} title="Increase Text Size" className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded text-lg">A+</button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-4xl font-bold text-[#c30F45]">{story.title}</h1>
          <button onClick={toggleBookmark} className="text-2xl hover:scale-110 transition-transform" title="Bookmark">
            {bookmark ? "🔖" : "📑"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-6 border-b border-[#3a2e4e] pb-4">
          <span className="bg-[#2c1b2f] px-2 py-1 rounded text-gray-300">{story.genre}</span>
          <span>•</span>
          <span>by <span className="font-semibold text-white">{story.author?.name || "Anonymous"}</span></span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(story.createdAt?.seconds * 1000), { addSuffix: true })}</span>
          {story.readingTime && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 text-yellow-500">⏱️ {story.readingTime} min read</span>
            </>
          )}
        </div>

        {story.image && (
          <img src={story.image} alt="cover" className="rounded-lg w-full max-h-[400px] object-cover mb-8 shadow-md" />
        )}

        <div
          className={`prose prose-invert max-w-none text-gray-200 leading-relaxed mb-10 transition-all duration-300 ${FONT_SIZES[fontSizeIndex]}`}
          dangerouslySetInnerHTML={{ __html: pageContent }}
        />

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mb-10 bg-[#2c1b2f] p-3 rounded-lg border border-[#3a2e4e]">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage((p) => p - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded font-medium disabled:opacity-30 transition"
            >
              ← Previous
            </button>
            <span className="text-gray-400 font-medium tracking-wide">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded font-medium disabled:opacity-30 transition"
            >
              Next →
            </button>
          </div>
        )}

        <LikesAndComments storyId={id} authorId={story.authorId || story.author?.uid} storyTitle={story.title} />
      </div>
    </div>
  );
};

export default StoryDetail;
