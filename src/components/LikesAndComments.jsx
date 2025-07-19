import React, { useEffect, useState } from "react";
import { db } from "../firebase/fireabase";
import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  collection,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { v4 as uuidv4 } from "uuid";

const LikesAndComments = ({ storyId }) => {
  const [likeLoading, setLikeLoading] = useState(false);
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyMap, setReplyMap] = useState({});
  const [editMap, setEditMap] = useState({});
  const [collapseMap, setCollapseMap] = useState({});
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    const fetchData = async () => {
      const likesSnap = await getDocs(
        collection(db, "stories", storyId, "likes")
      );
      setLikesCount(likesSnap.size);

      if (user) {
        const likeRef = doc(db, "stories", storyId, "likes", user.uid);
        const likeSnap = await getDoc(likeRef);
        setLiked(likeSnap.exists());
      }

      const q = query(
        collection(db, "stories", storyId, "comments"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setComments(data);
    };

    fetchData();
  }, [storyId, user]);

  const toggleLike = async () => {
    if (!user || likeLoading) return;
    setLikeLoading(true);

    const ref = doc(db, "stories", storyId, "likes", user.uid);
    const snap = await getDoc(ref);
    const alreadyLiked = snap.exists();

    if (alreadyLiked) {
      await deleteDoc(ref);
      setLiked(false);
      setLikesCount((prev) => Math.max(prev - 1, 0));
    } else {
      await setDoc(ref, { likedAt: serverTimestamp() });
      setLiked(true);
      setLikesCount((prev) => prev + 1);
    }

    setLikeLoading(false);
  };

  const postComment = async () => {
    if (!user || !newComment.trim()) return;
    const newDoc = await addDoc(
      collection(db, "stories", storyId, "comments"),
      {
        text: newComment,
        author: {
          uid: user.uid,
          name: user.displayName || user.email,
          photoURL:
            user.photoURL ||
            `https://ui-avatars.com/api/?name=${user.displayName}`,
        },
        createdAt: new Date(),
        replies: [],
      }
    );
    const newCommentObj = {
      id: newDoc.id,
      text: newComment,
      author: {
        uid: user.uid,
        name: user.displayName || user.email,
        photoURL:
          user.photoURL ||
          `https://ui-avatars.com/api/?name=${user.displayName}`,
      },
      createdAt: new Date(),
      replies: [],
    };
    setComments([newCommentObj, ...comments]);
    setNewComment("");
  };

  const toggleCommentLike = async (commentId) => {
    if (!user) return alert("Login to like comments");

    const commentRef = doc(db, "stories", storyId, "comments", commentId);
    const snap = await getDoc(commentRef);
    if (!snap.exists()) return;

    const data = snap.data();
    const hasLiked = Array.isArray(data.likes) && data.likes.includes(user.uid);
    const updatedLikes = hasLiked
      ? data.likes.filter((uid) => uid !== user.uid)
      : [...(data.likes || []), user.uid];

    await updateDoc(commentRef, { likes: updatedLikes });
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId ? { ...comment, likes: updatedLikes } : comment
      )
    );
  };

  const handleReplyChange = (key, value) => {
    setReplyMap((prev) => ({ ...prev, [key]: value }));
  };

  const postReply = async (commentId, parentReplyId = null) => {
    const commentDoc = doc(db, "stories", storyId, "comments", commentId);
    const snap = await getDoc(commentDoc);
    if (!snap.exists()) return;

    const commentData = snap.data();

    const replyKey = parentReplyId
      ? `${commentId}_${parentReplyId}_new`
      : commentId;
    const replyText = replyMap[replyKey]?.trim();
    if (!replyText) return;

    const newReply = {
      id: uuidv4(),
      text: replyText,
      author: {
        uid: user.uid,
        name: user.displayName || user.email,
        photoURL:
          user.photoURL ||
          `https://ui-avatars.com/api/?name=${user.displayName}`,
      },
      createdAt: new Date(),
      replies: [],
      likes: [],
    };

    const addNestedReply = (replies) =>
      replies.map((r) =>
        r.id === parentReplyId
          ? { ...r, replies: [...(r.replies || []), newReply] }
          : { ...r, replies: addNestedReply(r.replies || []) }
      );

    const updatedReplies = parentReplyId
      ? addNestedReply(commentData.replies || [])
      : [...(commentData.replies || []), newReply];

    await updateDoc(commentDoc, { replies: updatedReplies });
    setReplyMap((prev) => ({ ...prev, [replyKey]: "" }));
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: updatedReplies }
          : comment
      )
    );
  };

  const saveEditedReply = async (commentId, replyId, newText) => {
    const commentDoc = doc(db, "stories", storyId, "comments", commentId);
    const snap = await getDoc(commentDoc);
    if (!snap.exists()) return;

    const commentData = snap.data();

    const updateNestedReply = (replies) =>
      replies.map((r) =>
        r.id === replyId
          ? { ...r, text: newText }
          : { ...r, replies: updateNestedReply(r.replies || []) }
      );

    const updatedReplies = updateNestedReply(commentData.replies || []);
    await updateDoc(commentDoc, { replies: updatedReplies });
    setEditMap((prev) => ({ ...prev, [`${commentId}_${replyId}`]: false }));
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: updatedReplies }
          : comment
      )
    );
  };

  const toggleReplyLike = async (commentId, replyId) => {
    if (!user) return alert("Login to like replies");

    const commentDoc = doc(db, "stories", storyId, "comments", commentId);
    const snap = await getDoc(commentDoc);
    if (!snap.exists()) return;
    const commentData = snap.data();

    const updateLikes = (replies) =>
      replies.map((r) => {
        if (r.id === replyId) {
          const hasLiked = r.likes?.includes(user.uid);
          return {
            ...r,
            likes: hasLiked
              ? r.likes.filter((uid) => uid !== user.uid)
              : [...(r.likes || []), user.uid],
          };
        } else if (r.replies?.length) {
          return { ...r, replies: updateLikes(r.replies) };
        }
        return r;
      });

    const updatedReplies = updateLikes(commentData.replies || []);
    await updateDoc(commentDoc, { replies: updatedReplies });
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: updatedReplies }
          : comment
      )
    );
  };

  const deleteComment = async (id) => {
    await deleteDoc(doc(db, "stories", storyId, "comments", id));
    setComments((prev) => prev.filter((c) => c.id !== id));
  };

  const toggleCollapse = (id) => {
    setCollapseMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteNestedReply = async (commentId, replyId) => {
    const commentDoc = doc(db, "stories", storyId, "comments", commentId);
    const snap = await getDoc(commentDoc);
    if (!snap.exists()) return;

    const commentData = snap.data();

    const removeReply = (replies) =>
      replies
        .map((r) =>
          r.id === replyId
            ? null
            : { ...r, replies: removeReply(r.replies || []) }
        )
        .filter(Boolean);

    const updatedReplies = removeReply(commentData.replies || []);
    await updateDoc(commentDoc, { replies: updatedReplies });
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === commentId
          ? { ...comment, replies: updatedReplies }
          : comment
      )
    );
  };
  const renderReplies = (replies, commentId, parentId = null, level = 1) => {
    return replies.map((reply) => {
      const replyKey = `${commentId}_${reply.id}`;
      const isEditing = editMap[replyKey];
      const canEdit =
        reply.createdAt instanceof Date &&
        differenceInMinutes(new Date(), reply.createdAt) <= 15;
      const hasLiked =
        Array.isArray(reply.likes) && reply.likes.includes(user?.uid);
      const likesCount = Array.isArray(reply.likes) ? reply.likes.length : 0;

      return (
        <div
          key={reply.id}
          className={`mt-3 ml-${level * 4} p-2 bg-[#2a2a3c] rounded`}
        >
          <div className="flex items-start gap-2">
            <img
              src={reply.author.photoURL}
              alt={reply.author.name}
              className="w-8 h-8 rounded-full"
            />
            <div className="flex-1">
              <p className="font-semibold text-[#c30F45]">
                {reply.author.name}
              </p>

              {isEditing ? (
                <>
                  <textarea
                    value={replyMap[replyKey] || reply.text}
                    onChange={(e) =>
                      handleReplyChange(replyKey, e.target.value)
                    }
                    className="w-full p-1 text-white rounded"
                  />
                  <button
                    onClick={() =>
                      saveEditedReply(commentId, reply.id, replyMap[replyKey])
                    }
                    className="text-green-400 text-xs hover:underline mt-1"
                  >
                    Save
                  </button>
                </>
              ) : (
                <p className="text-white">{reply.text}</p>
              )}

              <p className="text-xs text-gray-400">
                {reply.createdAt instanceof Date
                  ? formatDistanceToNow(reply.createdAt, { addSuffix: true })
                  : "Just now"}
              </p>

              <div className="flex gap-2 text-xs mt-1">
                {user && (
                  <button
                    onClick={() => toggleReplyLike(commentId, reply.id)}
                    className={`hover:underline ${
                      hasLiked ? "text-pink-400" : "text-gray-300"
                    }`}
                  >
                    {hasLiked ? "❤️" : "🤍"} {likesCount}
                  </button>
                )}
                {user?.uid === reply.author.uid && canEdit && (
                  <>
                    <button
                      onClick={() =>
                        setEditMap((prev) => ({
                          ...prev,
                          [replyKey]: true,
                        }))
                      }
                      className="text-yellow-300 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteNestedReply(commentId, reply.id)}
                      className="text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>

              {/* Reply to this reply */}
              <div className="mt-2">
                <textarea
                  value={replyMap[`${replyKey}_new`] || ""}
                  onChange={(e) =>
                    handleReplyChange(`${replyKey}_new`, e.target.value)
                  }
                  placeholder="Write a reply..."
                  className="w-full p-1 text-sm text-white rounded"
                />
                <button
                  onClick={() => postReply(commentId, reply.id)}
                  className="mt-1 px-3 py-1 bg-[#c30F45] text-white text-sm rounded"
                >
                  Reply
                </button>
              </div>

              {/* Render nested replies */}
              {Array.isArray(reply.replies) &&
                renderReplies(reply.replies, commentId, reply.id, level + 1)}
            </div>
          </div>
        </div>
      );
    });
  };

  return (

  <div className="mt-10">
    <button
      onClick={toggleLike}
      disabled={likeLoading}
      className={`px-6 py-2 mb-4 rounded-full transition-transform ${
        liked ? "bg-[#c30F45]" : "bg-gray-500 hover:scale-110"
      } ${likeLoading ? "opacity-50 cursor-not-allowed" : "animate-pulse"}`}
    >
      <span>{liked ? "❤️" : "💔"}</span> {liked ? "Unlike" : "Like"} {likesCount}
    </button>

    <div className="mt-6">
      <h3 className="text-2xl font-semibold mb-4">💬 Comments</h3>

      {/* 🆙 Comment Box at Top */}
      {user ? (
        <div className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-2 rounded text-white h-20"
          />
          <button
            onClick={postComment}
            className="mt-2 px-4 py-2 bg-[#c30F45] rounded text-white"
          >
            Post
          </button>
        </div>
      ) : (
        <p className="text-sm mt-2">🔐 Log in to comment.</p>
      )}

      {/* 💬 Comments List */}
      {comments.slice(0, visibleCount).map((c) => {
        const commentTime = c.createdAt?.seconds
          ? new Date(c.createdAt.seconds * 1000)
          : c.createdAt instanceof Date
          ? c.createdAt
          : null;
        const canEdit = commentTime && differenceInMinutes(new Date(), commentTime) <= 15;
        const isEditing = editMap[c.id];
        const hasLiked = Array.isArray(c.likes) && c.likes.includes(user?.uid);
        const likesCount = Array.isArray(c.likes) ? c.likes.length : 0;

        return (
          <div
            key={c.id}
            className="bg-[#1f1f38]/80 backdrop-blur-md border border-[#2a2a3c] p-4 rounded-xl mb-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <img src={c.author.photoURL} className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <p className="font-bold text-[#c30F45]">{c.author.name}</p>
                {isEditing ? (
                  <>
                    <textarea
                      value={replyMap[c.id] || c.text}
                      onChange={(e) => handleReplyChange(c.id, e.target.value)}
                      className="w-full p-2 rounded text-white"
                    />
                    <button
                      onClick={async () => {
                        await updateDoc(doc(db, "stories", storyId, "comments", c.id), {
                          ...c,
                          text: replyMap[c.id],
                        });
                        setEditMap((prev) => ({ ...prev, [c.id]: false }));
                        window.location.reload(); // Optional: Could remove this to avoid full reload
                      }}
                      className="text-xs text-green-400 hover:underline mt-1"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <p>{c.text}</p>
                )}

                <p className="text-xs text-gray-400">
                  {commentTime
                    ? formatDistanceToNow(commentTime, { addSuffix: true })
                    : "Just now"}
                </p>

                <div className="flex gap-3 text-xs mt-1 items-center">
                  {user && (
                    <button
                      className={`hover:underline ${hasLiked ? "text-pink-400" : "text-gray-300"}`}
                      onClick={() => toggleCommentLike(c.id)}
                    >
                      {hasLiked ? "❤️" : "🤍"} {likesCount}
                    </button>
                  )}
                  {user?.uid === c.author.uid && canEdit && (
                    <>
                      <button
                        onClick={() => setEditMap((prev) => ({ ...prev, [c.id]: true }))}
                        className="text-yellow-300 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => toggleCollapse(c.id)}
                  className="text-sm text-blue-300 mt-1 hover:underline"
                >
                  {collapseMap[c.id]
                    ? "Hide replies"
                    : `Show replies (${(c.replies || []).length})`}
                </button>

                {user && (
                  <div className="mt-2">
                    <textarea
                      value={replyMap[c.id] || ""}
                      onChange={(e) => handleReplyChange(c.id, e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full p-1 text-sm text-white rounded"
                    />
                    <button
                      onClick={() => postReply(c.id)}
                      className="mt-1 px-3 py-1 bg-[#c30F45] text-white text-sm rounded"
                    >
                      Reply
                    </button>
                  </div>
                )}

                {collapseMap[c.id] &&
                  Array.isArray(c.replies) &&
                  renderReplies(c.replies, c.id)}
              </div>
            </div>
          </div>
        );
      })}

      {/* 👇 Show More/Less */}
      {comments.length > visibleCount && (
        <div className="text-center mt-4">
          <button
            onClick={() => setVisibleCount((prev) => prev + 5)}
            className="text-[#c30F45] underline hover:text-pink-400"
          >
            Show more comments
          </button>
        </div>
      )}

      {visibleCount > 5 && (
        <div className="text-center mt-2">
          <button
            onClick={() => setVisibleCount(5)}
            className="text-gray-300 text-sm underline hover:text-white"
          >
            Show less
          </button>
        </div>
      )}
    </div>
  </div>
);

    
};

export default LikesAndComments;
