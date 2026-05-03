import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../context/AuthContext";
import LikesAndComments from "../components/LikesAndComments";
import { Helmet } from "react-helmet";

const WORDS_PER_PAGE = 300;
const FONT_SIZES = ["text-sm", "text-base", "text-lg", "text-xl", "text-2xl"];

const StoryDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmark, setBookmark] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [fontSizeIndex, setFontSizeIndex] = useState(1);

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
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-[#c30F45] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const words = story.content?.split(" ") || [];
  const totalPages = Math.max(1, Math.ceil(words.length / WORDS_PER_PAGE));
  const pageWords = words.slice((currentPage - 1) * WORDS_PER_PAGE, currentPage * WORDS_PER_PAGE);
  const pageContent = pageWords.join(" ");
  
  const progressPercentage = (currentPage / totalPages) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      <Helmet>
        <title>{story.title} | Alex's Stories</title>
      </Helmet>

      {/* Sticky Progress Bar */}
      <div className="fixed top-0 lg:top-0 left-0 w-full lg:w-full h-1 bg-gray-900 z-50">
        <div 
          className="h-full bg-[#c30F45] transition-all duration-300 ease-out" 
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Header with Back Button */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3 flex items-center gap-6">
        <Link to="/" className="hover:bg-[#181818] p-2 rounded-full transition">
          <span className="text-xl">←</span>
        </Link>
        <div>
          <h2 className="text-lg font-bold leading-tight truncate w-64">{story.title}</h2>
          <p className="text-xs text-gray-500">{totalPages} {totalPages === 1 ? 'page' : 'pages'}</p>
        </div>
      </header>

      <article className="px-4 py-6">
        {story.image && (
          <img src={story.image} alt="cover" className="rounded-2xl w-full max-h-[400px] object-cover mb-6 border border-[#2f3336]" />
        )}

        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-extrabold mb-1">{story.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Link to={`/author/${story.authorId || story.author?.uid}`} className="font-bold text-white hover:underline">
                {story.author?.name || "Anonymous"}
              </Link>
              <span>·</span>
              <span>{story.genre}</span>
              <span>·</span>
              <span>{story.createdAt?.seconds ? formatDistanceToNow(new Date(story.createdAt.seconds * 1000), { addSuffix: true }) : ""}</span>
            </div>
          </div>
          <button onClick={toggleBookmark} className="text-2xl hover:scale-110 transition p-2">
            {bookmark ? "🔖" : "📑"}
          </button>
        </div>

        {/* Accessibility Controls */}
        <div className="flex gap-2 mb-6 bg-[#16181c] p-1 rounded-lg w-fit border border-[#2f3336]">
          <button onClick={decreaseFontSize} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition">A-</button>
          <button onClick={increaseFontSize} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition text-lg">A+</button>
        </div>

        <div
          className={`prose prose-invert max-w-none text-gray-200 leading-relaxed mb-10 transition-all duration-300 ${FONT_SIZES[fontSizeIndex]}`}
          dangerouslySetInnerHTML={{ __html: pageContent }}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mb-10 bg-[#16181c] p-3 rounded-xl border border-[#2f3336]">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage((p) => p - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-gray-800 rounded-full font-bold disabled:opacity-30 hover:bg-gray-700 transition"
            >
              Previous
            </button>
            <span className="text-gray-500 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 py-2 bg-gray-800 rounded-full font-bold disabled:opacity-30 hover:bg-gray-700 transition"
            >
              Next
            </button>
          </div>
        )}

        <div className="border-t border-[#2f3336] pt-6">
          <LikesAndComments storyId={id} authorId={story.authorId || story.author?.uid} storyTitle={story.title} />
        </div>
      </article>
    </div>
  );
};

export default StoryDetail;
