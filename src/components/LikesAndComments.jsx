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
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyMap, setReplyMap] = useState({});
  const [editMap, setEditMap] = useState({});
  const [collapseMap, setCollapseMap] = useState({});

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
        } else if (r.replies && r.replies.length > 0) {
          return { ...r, replies: updateLikes(r.replies) };
        }
        return r;
      });

    const updatedReplies = updateLikes(commentData.replies || []);
    await updateDoc(commentDoc, { replies: updatedReplies });
    window.location.reload();
  };

  const toggleLike = async () => {
    if (!user) return alert("Login to like");
    const ref = doc(db, "stories", storyId, "likes", user.uid);
    if (liked) {
      await deleteDoc(ref);
      setLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      await setDoc(ref, { likedAt: serverTimestamp() });
      setLiked(true);
      setLikesCount((prev) => prev + 1);
    }
  };

  const postComment = async () => {
    if (!user || !newComment.trim()) return;
    await addDoc(collection(db, "stories", storyId, "comments"), {
      text: newComment,
      author: {
        uid: user.uid,
        name: user.displayName || user.email,
        photoURL:
          user.photoURL ||
          `https://ui-avatars.com/api/?name=${user.displayName}`,
      },
      createdAt: serverTimestamp(),
      replies: [],
    });
    setNewComment("");
    window.location.reload();
  };

  const toggleCollapse = (id) => {
    setCollapseMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteComment = async (id) => {
    await deleteDoc(doc(db, "stories", storyId, "comments", id));
    setComments((prev) => prev.filter((c) => c.id !== id));
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
  window.location.reload();
};


  const handleReplyChange = (key, value) => {
    setReplyMap((prev) => ({ ...prev, [key]: value }));
  };

  const postReply = async (commentId, parentReplyId = null) => {
    const commentDoc = doc(db, "stories", storyId, "comments", commentId);
    const snap = await getDoc(commentDoc);
    if (!snap.exists()) return;

    const commentData = snap.data();

    // Determine the correct key
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

    const addNestedReply = (replies) => {
      return replies.map((r) => {
        if (r.id === parentReplyId) {
          return { ...r, replies: [...(r.replies || []), newReply] };
        } else if (r.replies && r.replies.length > 0) {
          return { ...r, replies: addNestedReply(r.replies) };
        }
        return r;
      });
    };

    const updatedReplies = parentReplyId
      ? addNestedReply(commentData.replies || [])
      : [...(commentData.replies || []), newReply];

    await updateDoc(commentDoc, { replies: updatedReplies });
    setReplyMap((prev) => ({ ...prev, [replyKey]: "" }));
    window.location.reload();
  };

  //   const postReply = async (commentId, parentReplyId = null) => {
  //     const commentDoc = doc(db, "stories", storyId, "comments", commentId);
  //     const snap = await getDoc(commentDoc);
  //     if (!snap.exists()) return;

  //     const commentData = snap.data();
  //     const newReply = {
  //       id: uuidv4(),
  //       text: replyMap[parentReplyId || commentId],
  //       author: {
  //         uid: user.uid,
  //         name: user.displayName || user.email,
  //         photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`,
  //       },
  //       createdAt: new Date(),
  //       replies: [],
  //     };

  //     const updatedReplies = parentReplyId
  //       ? commentData.replies.map((r) =>
  //           r.id === parentReplyId
  //             ? { ...r, replies: [...(r.replies || []), newReply] }
  //             : r
  //         )
  //       : [...(commentData.replies || []), newReply];

  //     await updateDoc(commentDoc, { replies: updatedReplies });
  //     setReplyMap((prev) => ({ ...prev, [parentReplyId || commentId]: "" }));
  //     window.location.reload();
  //   };

 const renderReplies = (replies, commentId) =>
  replies.map((r) => {
    const replyTime = r.createdAt?.seconds
      ? new Date(r.createdAt.seconds * 1000)
      : r.createdAt instanceof Date
      ? r.createdAt
      : null;
    const canEditReply =
      replyTime && differenceInMinutes(new Date(), replyTime) <= 15;
    const key = `${commentId}_${r.id}`;
    const isEditing = editMap[key];
    const hasLiked = Array.isArray(r.likes) && r.likes.includes(user?.uid);
    const likesCount = Array.isArray(r.likes) ? r.likes.length : 0;

    return (
<div key={r.id} className="ml-10 mt-2 bg-[#1f1f38]/80 backdrop-blur-md border border-[#2a2a3c] p-3 rounded-xl">
        <div className="flex gap-2 items-start">
          <img src={r.author.photoURL} className="w-8 h-8 rounded-full" />
          <div className="flex-1">
            <p className="font-bold text-pink-300">{r.author.name}</p>

            {isEditing ? (
              <>
                <textarea
                  value={replyMap[key] || r.text}
                  onChange={(e) => handleReplyChange(key, e.target.value)}
                  className="w-full text-sm p-1 text-black rounded"
                />
                <button
                  onClick={() =>
                    saveEditedReply(commentId, r.id, replyMap[key] || r.text)
                  }
                  className="text-xs text-green-400 hover:underline mt-1"
                >
                  Save
                </button>
              </>
            ) : (
              <p>{r.text}</p>
            )}

            <p className="text-xs text-gray-400">
              {replyTime
                ? formatDistanceToNow(replyTime, { addSuffix: true })
                : "Just now"}
            </p>

            <div className="flex gap-3 text-xs mt-1 items-center">
              {/* ❤️ Like Button */}
              {user && (
                <button
                  className={`hover:underline ${
                    hasLiked ? "text-pink-400" : "text-gray-300"
                  }`}
                  onClick={() => toggleReplyLike(commentId, r.id)}
                >
                  {hasLiked ? "❤️" : "🤍"} {likesCount}
                </button>
              )}

              {/* Edit/Delete for Author */}
              {user?.uid === r.author.uid && canEditReply && (
                <>
                  <button
                    onClick={() =>
                      setEditMap((prev) => ({ ...prev, [key]: true }))
                    }
                    className="text-yellow-300 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-400 hover:underline"
                    onClick={() => deleteNestedReply(commentId, r.id)}
                  >
                    Delete
                  </button>
                </>
              )}

              {/* Reply */}
              {user && (
                <button
                  className="text-blue-300 hover:underline"
                  onClick={() => handleReplyChange(key + "_new", "")}
                >
                  Reply
                </button>
              )}
            </div>

            {/* New nested reply input */}
            {replyMap[key + "_new"] !== undefined && (
              <div className="mt-1">
                <textarea
                  value={replyMap[key + "_new"]}
                  onChange={(e) =>
                    handleReplyChange(key + "_new", e.target.value)
                  }
                  placeholder="Write a nested reply..."
                  className="w-full text-sm p-1 text-black rounded"
                />
                <button
                  onClick={() => postReply(commentId, r.id)}
                  className="mt-1 px-3 py-1 bg-[#c30F45] text-white text-xs rounded"
                >
                  Reply
                </button>
              </div>
            )}

            {/* Nested replies */}
            {Array.isArray(r.replies) &&
              r.replies.length > 0 &&
              renderReplies(r.replies, commentId)}
          </div>
        </div>
      </div>
    );
  });


  //   const saveEditedReply = async (commentId, replyId, newText) => {
  //     const commentDoc = doc(db, "stories", storyId, "comments", commentId);
  //     const snap = await getDoc(commentDoc);
  //     if (!snap.exists()) return;

  //     const commentData = snap.data();
  //     const updatedReplies = commentData.replies.map((r) =>
  //       r.id === replyId ? { ...r, text: newText } : r
  //     );

  //     await updateDoc(commentDoc, { replies: updatedReplies });
  //     setEditMap((prev) => ({ ...prev, [`${commentId}_${replyId}`]: false }));
  //     window.location.reload();
  //   };

  const saveEditedReply = async (commentId, replyId, newText) => {
    const commentDoc = doc(db, "stories", storyId, "comments", commentId);
    const snap = await getDoc(commentDoc);
    if (!snap.exists()) return;

    const commentData = snap.data();

    const updateNestedReply = (replies) => {
      return replies.map((r) => {
        if (r.id === replyId) {
          return { ...r, text: newText };
        } else if (r.replies && r.replies.length > 0) {
          return { ...r, replies: updateNestedReply(r.replies) };
        }
        return r;
      });
    };

    const updatedReplies = updateNestedReply(commentData.replies || []);
    await updateDoc(commentDoc, { replies: updatedReplies });

    setEditMap((prev) => ({ ...prev, [`${commentId}_${replyId}`]: false }));
    window.location.reload();
  };

  const deleteNestedReply = async (commentId, replyId) => {
    const commentDoc = doc(db, "stories", storyId, "comments", commentId);
    const snap = await getDoc(commentDoc);
    if (!snap.exists()) return;

    const commentData = snap.data();

    const removeReply = (replies) => {
      return replies
        .map((r) =>
          r.id === replyId
            ? null
            : {
                ...r,
                replies: r.replies ? removeReply(r.replies) : [],
              }
        )
        .filter(Boolean);
    };

    const updatedReplies = removeReply(commentData.replies || []);
    await updateDoc(commentDoc, { replies: updatedReplies });

    window.location.reload();
  };

  return (
    <div className="mt-10">
      <button
        onClick={toggleLike}
        className={`px-6 py-2 mb-4 rounded-full transition-transform ${
          liked ? "bg-[#c30F45]" : "bg-gray-500 hover:scale-110"
        } animate-pulse`}
      >
        <span className="inline-block">{liked ? "❤️" : "💔"}</span>{" "}
        {liked ? "Unlike" : "Like"} {likesCount}
      </button>

      <div className="mt-6">
        <h3 className="text-2xl font-semibold mb-4">💬 Comments</h3>

       {comments.map((c) => {
  const commentTime = c.createdAt?.seconds
    ? new Date(c.createdAt.seconds * 1000)
    : c.createdAt instanceof Date
    ? c.createdAt
    : null;
  const canEdit =
    commentTime && differenceInMinutes(new Date(), commentTime) <= 15;
  const isEditing = editMap[c.id];
  const hasLiked = Array.isArray(c.likes) && c.likes.includes(user?.uid);
  const likesCount = Array.isArray(c.likes) ? c.likes.length : 0;

  return (
<div key={c.id} className="bg-[#1f1f38]/80 backdrop-blur-md border border-[#2a2a3c] p-4 rounded-xl mb-4 shadow-sm">
      <div className="flex items-start gap-3">
        <img
          src={c.author.photoURL}
          className="w-10 h-10 rounded-full"
        />
        <div className="flex-1">
          <p className="font-bold text-[#c30F45]">{c.author.name}</p>

          {isEditing ? (
            <>
              <textarea
                value={replyMap[c.id] || c.text}
                onChange={(e) =>
                  handleReplyChange(c.id, e.target.value)
                }
                className="w-full p-2 rounded text-black"
              />
              <button
                onClick={async () => {
                  await updateDoc(
                    doc(db, "stories", storyId, "comments", c.id),
                    {
                      ...c,
                      text: replyMap[c.id],
                    }
                  );
                  setEditMap((prev) => ({ ...prev, [c.id]: false }));
                  window.location.reload();
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
            {/* ❤️ Like Button */}
            {user && (
              <button
                className={`hover:underline ${
                  hasLiked ? "text-pink-400" : "text-gray-300"
                }`}
                onClick={() => toggleCommentLike(c.id)}
              >
                {hasLiked ? "❤️" : "🤍"} {likesCount}
              </button>
            )}

            {user?.uid === c.author.uid && canEdit && (
              <>
                <button
                  onClick={() =>
                    setEditMap((prev) => ({ ...prev, [c.id]: true }))
                  }
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
                onChange={(e) =>
                  handleReplyChange(c.id, e.target.value)
                }
                placeholder="Write a reply..."
                className="w-full p-1 text-sm text-black rounded"
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


        {user ? (
          <div className="mt-4">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full p-2 rounded text-black h-20"
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
      </div>
    </div>
  );
};

export default LikesAndComments;
