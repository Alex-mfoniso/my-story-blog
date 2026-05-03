import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const StoryCard = ({ story, onBookmark, isBookmarked }) => {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // Prevent navigation if clicking on a button or link
    if (e.target.closest("button") || e.target.closest("a")) return;
    navigate(`/story/${story.id}`);
  };

  return (
    <article 
      onClick={handleCardClick}
      className="px-4 py-3 border-b border-[#2f3336] hover:bg-[#080808] transition duration-200 cursor-pointer flex gap-3"
    >
      {/* Author Avatar */}
      <div className="flex-shrink-0">
        <Link to={`/author/${story.authorId || story.author?.uid}`}>
          <img
            src={story.author?.photoURL || `https://ui-avatars.com/api/?name=${story.author?.name || "A"}`}
            alt={story.author?.name}
            className="w-10 h-10 rounded-full border border-[#2f3336] hover:opacity-90 transition"
          />
        </Link>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-0.5">
          <Link 
            to={`/author/${story.authorId || story.author?.uid}`}
            className="font-bold text-white hover:underline truncate"
          >
            {story.author?.name || "Anonymous"}
          </Link>
          <span className="text-gray-500 text-sm">·</span>
          <span className="text-gray-500 text-sm truncate">
            {story.createdAt?.seconds 
              ? formatDistanceToNow(new Date(story.createdAt.seconds * 1000)) 
              : "just now"}
          </span>
        </div>

        <h3 className="text-base font-bold text-white mb-1 leading-tight">
          {story.title}
        </h3>

        <div 
          className="text-[15px] text-gray-300 leading-normal mb-3 line-clamp-3"
          dangerouslySetInnerHTML={{ 
            __html: story.excerpt || story.content?.replace(/<[^>]+>/g, "").slice(0, 160) + "..."
          }}
        />

        {story.image && (
          <div className="rounded-2xl overflow-hidden border border-[#2f3336] mb-3 max-h-[400px]">
            <img 
              src={story.image} 
              alt={story.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Action Icons */}
        <div className="flex items-center justify-between text-gray-500 max-w-md">
          <div className="flex items-center gap-1 group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-blue-500/10 group-hover:text-blue-500 transition">
              <span>💬</span>
            </div>
            <span className="text-xs group-hover:text-blue-500">{story.commentCount || 0}</span>
          </div>

          <div className="flex items-center gap-1 group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-pink-500/10 group-hover:text-pink-500 transition">
              <span>❤️</span>
            </div>
            <span className="text-xs group-hover:text-pink-500">{story.likeCount || story.likes || 0}</span>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              onBookmark(story.id);
            }}
            className="group"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-[#c30F45]/10 group-hover:text-[#c30F45] transition ${isBookmarked ? "text-[#c30F45]" : ""}`}>
              <span>{isBookmarked ? "🔖" : "📑"}</span>
            </div>
          </button>

          <div className="flex items-center gap-1 group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-green-500/10 group-hover:text-green-500 transition">
              <span>📤</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default StoryCard;
