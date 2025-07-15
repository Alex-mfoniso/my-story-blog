// src/pages/StoryDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/fireabase";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns";

const StoryDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [story, setStory] = useState(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [bookmark, setBookmark] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch story, likes, comments
  useEffect(() => {
    const fetchStoryData = async () => {
      setLoading(true);
      try {
        const storyRef = doc(db, "stories", id);
        const snap = await getDoc(storyRef);
        if (snap.exists()) {
          setStory({ id: snap.id, ...snap.data() });
        }

        // Likes
        if (user) {
          const likeRef = doc(db, "stories", id, "likes", user.uid);
          const likeSnap = await getDoc(likeRef);
          setLiked(likeSnap.exists());
        }

        const likesCol = await getDocs(collection(db, "stories", id, "likes"));
        setLikes(likesCol.size);

        // Comments
        const q = query(collection(db, "stories", id, "comments"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

        // Bookmark status
        if (user) {
          const bookmarkRef = doc(db, "users", user.uid, "bookmarks", id);
          const bookmarkSnap = await getDoc(bookmarkRef);
          setBookmark(bookmarkSnap.exists());
        }
      } catch (error) {
        console.error("Error fetching story:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStoryData();
  }, [id, user]);

  const handleLike = async () => {
    if (!user) return alert("Login to like this story.");
    const likeRef = doc(db, "stories", id, "likes", user.uid);
    await setDoc(likeRef, { likedAt: new Date() });
    setLiked(true);
    setLikes((prev) => prev + 1);
  };

  const handleBookmark = async () => {
    if (!user) return alert("Login to bookmark.");
    const bookmarkRef = doc(db, "users", user.uid, "bookmarks", id);

    try {
      if (bookmark) {
        await deleteDoc(bookmarkRef);
        setBookmark(false);
      } else {
        await setDoc(bookmarkRef, {
          storyId: id,
          createdAt: new Date(),
        });
        setBookmark(true);
      }
    } catch (err) {
      console.error("Bookmark error:", err);
    }
  };

  const handleComment = async () => {
    if (!user) return alert("Login to comment.");
    if (!newComment.trim()) return;

    await addDoc(collection(db, "stories", id, "comments"), {
      text: newComment,
      author: user.displayName || "Anonymous",
      photoURL: user.photoURL || "https://ui-avatars.com/api/?name=User",
      uid: user.uid,
      createdAt: new Date(),
    });

    setNewComment("");
    const q = query(collection(db, "stories", id, "comments"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const handleDelete = async (commentId) => {
    await deleteDoc(doc(db, "stories", id, "comments", commentId));
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  if (loading || !story) return <div className="text-white text-center py-10">Loading story...</div>;

  return (
    <div className="min-h-screen px-4 py-24 bg-[#231123] text-white max-w-3xl mx-auto">
      <div className="bg-[#2c1b2f] p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-[#c30F45]">{story.title}</h1>
          <button onClick={handleBookmark} title="Bookmark this story">
            {bookmark ? "🔖" : "📑"}
          </button>
        </div>

        <p className="text-sm text-gray-300 mb-2">
          {story.genre} • by {story.author?.name || "Anonymous"} •{" "}
          {formatDistanceToNow(new Date(story.createdAt?.seconds * 1000), { addSuffix: true })}
        </p>

        <div
          className="prose prose-invert max-w-none text-white mb-6"
          dangerouslySetInnerHTML={{ __html: story.content }}
        />

        {/* Like button */}
        <button
          disabled={liked}
          onClick={handleLike}
          className={`px-4 py-1 rounded mb-4 ${liked ? "bg-gray-600" : "bg-[#c30F45]"}`}
        >
          ❤️ {liked ? "Liked" : "Like"} ({likes})
        </button>

        {/* Comments section */}
        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">💬 Comments</h2>

          {comments.map((c) => (
            <div
              key={c.id}
              className="flex items-start space-x-3 bg-[#3a263e] p-3 rounded mb-2"
            >
              <img
                src={c.photoURL}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-bold text-[#c30F45]">{c.author}</p>
                <p className="text-sm">{c.text}</p>
                <p className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(c.createdAt?.seconds * 1000), {
                    addSuffix: true,
                  })}
                </p>
                {user?.uid === c.uid && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-xs text-red-400 mt-1 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}

          {user ? (
            <div className="mt-4">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full p-2 rounded text-black"
              />
              <button
                onClick={handleComment}
                className="mt-2 px-4 py-1 bg-[#c30F45] rounded"
              >
                Post
              </button>
            </div>
          ) : (
            <p className="text-sm mt-2">🔐 Log in to comment.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoryDetail;
