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
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow, differenceInMinutes } from "date-fns";
import { v4 as uuidv4 } from "uuid";

const LikesAndComments = ({ storyId, authorId, storyTitle }) => {
  const { user } = useAuth();
  const [likeLoading, setLikeLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [replyMap, setReplyMap] = useState({});
  const [editMap, setEditMap] = useState({});
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    if (!storyId) return;

    // Likes listener
    const likesQuery = collection(db, "stories", storyId, "likes");
    const unsubLikes = onSnapshot(likesQuery, (snap) => {
      setLikesCount(snap.size);
      if (user) {
        setLiked(snap.docs.some(d => d.id === user.uid));
      }
    });

    // Comments listener
    const commentsQuery = query(
      collection(db, "stories", storyId, "comments"),
      orderBy("createdAt", "desc")
    );
    const unsubComments = onSnapshot(commentsQuery, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubLikes();
      unsubComments();
    };
  }, [storyId, user]);

  const toggleLike = async () => {
    if (!user || likeLoading) return;
    setLikeLoading(true);
    const ref = doc(db, "stories", storyId, "likes", user.uid);
    try {
      if (liked) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, { likedAt: serverTimestamp() });
        if (authorId && authorId !== user.uid) {
          const notifRef = doc(collection(db, "users", authorId, "notifications"));
          await setDoc(notifRef, {
            type: "like",
            fromUserId: user.uid,
            fromUserName: user.displayName || user.email,
            storyId,
            storyTitle,
            read: false,
            createdAt: new Date()
          });
        }
      }
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setLikeLoading(false);
    }
  };

  const postComment = async () => {
    if (!user || !newComment.trim()) return;
    try {
      const commentData = {
        text: newComment,
        author: {
          uid: user.uid,
          name: user.displayName || user.email,
          photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`,
        },
        createdAt: serverTimestamp(),
        replies: [],
        likes: [],
      };
      await addDoc(collection(db, "stories", storyId, "comments"), commentData);
      setNewComment("");

      if (authorId && authorId !== user.uid) {
        const notifRef = doc(collection(db, "users", authorId, "notifications"));
        await setDoc(notifRef, {
          type: "comment",
          fromUserId: user.uid,
          fromUserName: user.displayName || user.email,
          storyId,
          storyTitle,
          read: false,
          createdAt: new Date()
        });
      }
    } catch (err) {
      console.error("Comment error:", err);
    }
  };

  const toggleCommentLike = async (commentId) => {
    if (!user) return;
    const commentRef = doc(db, "stories", storyId, "comments", commentId);
    const snap = await getDoc(commentRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const hasLiked = data.likes?.includes(user.uid);
    await updateDoc(commentRef, {
      likes: hasLiked ? data.likes.filter(id => id !== user.uid) : [...(data.likes || []), user.uid]
    });
  };

  const postReply = async (commentId, parentReplyId = null) => {
    const replyKey = parentReplyId ? `${commentId}_${parentReplyId}` : commentId;
    const text = replyMap[replyKey]?.trim();
    if (!user || !text) return;

    const commentRef = doc(db, "stories", storyId, "comments", commentId);
    const snap = await getDoc(commentRef);
    if (!snap.exists()) return;
    const commentData = snap.data();

    const newReply = {
      id: uuidv4(),
      text,
      author: {
        uid: user.uid,
        name: user.displayName || user.email,
        photoURL: user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`,
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

    await updateDoc(commentRef, { replies: updatedReplies });
    setReplyMap(prev => ({ ...prev, [replyKey]: "" }));

    if (commentData.author?.uid && commentData.author.uid !== user.uid) {
      const notifRef = doc(collection(db, "users", commentData.author.uid, "notifications"));
      await setDoc(notifRef, {
        type: "reply",
        fromUserId: user.uid,
        fromUserName: user.displayName || user.email,
        storyId,
        storyTitle,
        read: false,
        createdAt: new Date()
      });
    }
  };

  const renderComment = (comment, isReply = false) => {
    const createdAt = comment.createdAt?.seconds 
      ? new Date(comment.createdAt.seconds * 1000) 
      : comment.createdAt instanceof Date ? comment.createdAt : new Date();
    
    const hasLiked = comment.likes?.includes(user?.uid);
    const isEditing = editMap[comment.id];
    const canEdit = user?.uid === comment.author.uid && differenceInMinutes(new Date(), createdAt) <= 15;

    return (
      <div key={comment.id} className="group relative flex gap-3 px-4 py-3 border-b border-[#2f3336] hover:bg-[#080808] transition duration-200">
        {/* Thread line for replies */}
        {isReply && <div className="absolute left-[2.25rem] top-0 bottom-0 w-0.5 bg-[#2f3336]"></div>}
        
        <div className="flex-shrink-0 z-10">
          <img 
            src={comment.author.photoURL} 
            alt="" 
            className="w-10 h-10 rounded-full border border-[#2f3336]" 
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-1">
            <span className="font-bold text-white truncate">{comment.author.name}</span>
            <span className="text-gray-500 text-sm">·</span>
            <span className="text-gray-500 text-sm">{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
          </div>

          {isEditing ? (
            <div className="mt-1">
              <textarea 
                className="w-full bg-black border border-[#c30F45] rounded-lg p-2 text-white focus:outline-none"
                defaultValue={comment.text}
                onBlur={async (e) => {
                  const newText = e.target.value.trim();
                  if (newText && newText !== comment.text) {
                    const ref = doc(db, "stories", storyId, "comments", comment.id);
                    await updateDoc(ref, { text: newText });
                  }
                  setEditMap(prev => ({ ...prev, [comment.id]: false }));
                }}
              />
            </div>
          ) : (
            <p className="text-[15px] text-white leading-normal whitespace-pre-wrap">{comment.text}</p>
          )}

          <div className="flex items-center justify-between mt-3 text-gray-500 max-w-sm">
            <button 
              onClick={() => setReplyMap(prev => ({ ...prev, [comment.id]: prev[comment.id] === undefined ? "" : undefined }))}
              className="flex items-center gap-2 group/btn"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover/btn:bg-blue-500/10 group-hover/btn:text-blue-500 transition">
                <span>💬</span>
              </div>
              <span className="text-xs group-hover/btn:text-blue-500">{comment.replies?.length || 0}</span>
            </button>

            <button 
              onClick={() => toggleCommentLike(comment.id)}
              className={`flex items-center gap-2 group/btn ${hasLiked ? "text-pink-600" : ""}`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover/btn:bg-pink-500/10 group-hover/btn:text-pink-500 transition">
                <span>{hasLiked ? "❤️" : "🤍"}</span>
              </div>
              <span className="text-xs group-hover/btn:text-pink-500">{comment.likes?.length || 0}</span>
            </button>

            {canEdit && (
              <button 
                onClick={() => setEditMap(prev => ({ ...prev, [comment.id]: true }))}
                className="hover:text-[#c30F45] transition text-xs"
              >
                Edit
              </button>
            )}

            {user?.uid === comment.author.uid && (
              <button 
                onClick={() => deleteDoc(doc(db, "stories", storyId, "comments", comment.id))}
                className="hover:text-red-500 transition text-xs"
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply Input */}
          {replyMap[comment.id] !== undefined && (
            <div className="mt-4 flex gap-3">
              <img src={user?.photoURL} alt="" className="w-8 h-8 rounded-full border border-[#2f3336]" />
              <div className="flex-1">
                <textarea 
                  value={replyMap[comment.id]}
                  onChange={(e) => setReplyMap(prev => ({ ...prev, [comment.id]: e.target.value }))}
                  placeholder="Post your reply"
                  className="w-full bg-black border-none text-white text-[15px] focus:outline-none resize-none min-h-[60px]"
                />
                <div className="flex justify-end border-t border-[#2f3336] pt-2">
                  <button 
                    onClick={() => postReply(comment.id)}
                    disabled={!replyMap[comment.id]?.trim()}
                    className="bg-[#c30F45] text-white px-4 py-1.5 rounded-full font-bold text-sm disabled:opacity-50 hover:bg-[#a30d3a] transition"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Render Threaded Replies */}
          {comment.replies?.map(reply => (
            <div key={reply.id} className="mt-4 flex gap-3 relative">
              <div className="absolute left-[-1.75rem] top-0 bottom-0 w-0.5 bg-[#2f3336]"></div>
              <div className="flex-shrink-0">
                <img src={reply.author.photoURL} alt="" className="w-8 h-8 rounded-full border border-[#2f3336]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  <span className="font-bold text-white text-sm truncate">{reply.author.name}</span>
                  <span className="text-gray-500 text-xs">·</span>
                  <span className="text-gray-500 text-xs">
  {reply.createdAt
    ? formatDistanceToNow(
        reply.createdAt?.seconds
          ? new Date(reply.createdAt.seconds * 1000)
          : new Date(reply.createdAt),
        { addSuffix: true }
      )
    : 'just now'}
</span>
                </div>
                <p className="text-sm text-white leading-normal">{reply.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col">
      {/* Post Action Bar (Like) */}
      <div className="flex items-center gap-6 px-4 py-3 border-y border-[#2f3336] mb-4">
        <button 
          onClick={toggleLike}
          disabled={likeLoading}
          className={`flex items-center gap-2 font-bold transition ${liked ? "text-pink-600" : "text-gray-500 hover:text-pink-600"}`}
        >
          <span className="text-xl">{liked ? "❤️" : "🤍"}</span>
          <span>{likesCount}</span>
        </button>
        <div className="text-gray-500">
          <span className="font-bold text-white">{comments.length}</span>
          <span className="ml-1">Comments</span>
        </div>
      </div>

      {/* Main Comment Input */}
      {user ? (
        <div className="px-4 py-3 flex gap-3 border-b border-[#2f3336]">
          <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-[#2f3336]" />
          <div className="flex-1">
            <textarea 
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Post your comment"
              className="w-full bg-black border-none text-white text-xl focus:outline-none resize-none min-h-[100px]"
            />
            <div className="flex justify-end border-t border-[#2f3336] pt-3">
              <button 
                onClick={postComment}
                disabled={!newComment.trim()}
                className="bg-[#c30F45] text-white px-6 py-2 rounded-full font-bold disabled:opacity-50 hover:bg-[#a30d3a] transition shadow-lg"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border-b border-[#2f3336]">
          <Link to="/login" className="text-[#c30F45] font-bold hover:underline">Log in</Link> to join the conversation.
        </div>
      )}

      {/* Comments List */}
      <div className="flex flex-col">
        {comments.slice(0, visibleCount).map(comment => renderComment(comment))}
        
        {comments.length > visibleCount && (
          <button 
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="p-4 text-[#c30F45] text-center hover:bg-[#080808] transition font-bold"
          >
            Show more comments
          </button>
        )}
      </div>
    </div>
  );
};

export default LikesAndComments;
