// import React, { useEffect, useState } from "react";
// import { db } from "../firebase/fireabase";
// import {
//   collection,
//   getDocs,
//   query,
//   orderBy,
//   doc,
//   updateDoc,
//   addDoc,
//   getDoc,
//   onSnapshot,
// } from "firebase/firestore";
// import { useAuth } from "../context/AuthContext";

// const Stories = () => {
//   const [stories, setStories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const { user } = useAuth();
//   const [comments, setComments] = useState({});
//   const [newComments, setNewComments] = useState({});

//   useEffect(() => {
//     const fetchStories = async () => {
//       try {
//         const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
//         const snapshot = await getDocs(q);
//         const data = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setStories(data);

//         // Subscribe to comments for each story
//         data.forEach((story) => {
//           const commentsRef = collection(db, "stories", story.id, "comments");
//           onSnapshot(commentsRef, (snap) => {
//             setComments((prev) => ({
//               ...prev,
//               [story.id]: snap.docs.map((doc) => doc.data()),
//             }));
//           });
//         });
//       } catch (error) {
//         console.error("Error fetching stories:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStories();
//   }, []);

//   const handleLike = async (storyId) => {
//     if (!user) return alert("Login to like");

//     const storyRef = doc(db, "stories", storyId);
//     const storySnap = await getDoc(storyRef);
//     const currentLikes = storySnap.data()?.likes || 0;

//     await updateDoc(storyRef, {
//       likes: currentLikes + 1,
//     });
//   };

//   const handleComment = async (storyId) => {
//     if (!user) return alert("Login to comment");

//     const text = newComments[storyId];
//     if (!text) return;

//     const commentsRef = collection(db, "stories", storyId, "comments");
//     await addDoc(commentsRef, {
//       text,
//       author: user.displayName || "Anonymous",
//       createdAt: new Date(),
//     });

//     setNewComments((prev) => ({ ...prev, [storyId]: "" }));
//   };

//   return (
//     <div className="min-h-screen px-4 py-24 bg-[#231123] text-white">
//       <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-6">All Stories</h2>

//       {loading ? (
//         <p className="text-center">📖 Loading stories...</p>
//       ) : stories.length === 0 ? (
//         <p className="text-center">No stories yet. Stay tuned!</p>
//       ) : (
//         <div className="space-y-10 max-w-3xl mx-auto">
//           {stories.map((story) => (
//             <div key={story.id} className="bg-[#2c1b2f] p-6 rounded shadow space-y-4">
//               <h3 className="text-2xl font-bold text-[#c30F45]">{story.title}</h3>
//               <p className="text-sm text-gray-300">{story.genre} • by {story.author?.name || "Anonymous"}</p>
//               <div
//                 className="prose prose-invert max-w-none text-white"
//                 dangerouslySetInnerHTML={{ __html: story.content }}
//               />

//               {/* 👍 Like button */}
//               <button
//                 onClick={() => handleLike(story.id)}
//                 className="mt-2 px-4 py-1 bg-[#c30F45] rounded"
//               >
//                 ❤️ Like ({story.likes || 0})
//               </button>

//               {/* 💬 Comment Section */}
//               <div className="mt-4">
//                 <h4 className="text-lg font-bold mb-2">Comments:</h4>
//                 {(comments[story.id] || []).map((c, i) => (
//                   <div key={i} className="bg-[#3a2540] p-2 rounded mb-2">
//                     <strong>{c.author}</strong>: {c.text}
//                   </div>
//                 ))}

//                 {user ? (
//                   <div className="mt-2">
//                     <input
//                       type="text"
//                       value={newComments[story.id] || ""}
//                       onChange={(e) =>
//                         setNewComments((prev) => ({
//                           ...prev,
//                           [story.id]: e.target.value,
//                         }))
//                       }
//                       placeholder="Write a comment..."
//                       className="w-full text-black p-2 rounded mb-2"
//                     />
//                     <button
//                       onClick={() => handleComment(story.id)}
//                       className="px-4 py-1 bg-[#c30F45] rounded"
//                     >
//                       Post
//                     </button>
//                   </div>
//                 ) : (
//                   <p className="text-sm mt-2">🔒 Log in to post a comment.</p>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default Stories;

// src/pages/Stories.jsx
import React, { useEffect, useState } from "react";
import { db } from "../firebase/fireabase";
import { collection, getDocs, query, orderBy, getCountFromServer } from "firebase/firestore";
import { Link } from "react-router-dom";

const Stories = () => {
  const [stories, setStories] = useState([]);

  useEffect(() => {
    const fetchStories = async () => {
      const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const enrichedData = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const likesSnap = await getCountFromServer(collection(db, "stories", doc.id, "likes"));
          const commentsSnap = await getCountFromServer(collection(db, "stories", doc.id, "comments"));

          return {
            id: doc.id,
            ...doc.data(),
            likeCount: likesSnap.data().count,
            commentCount: commentsSnap.data().count,
          };
        })
      );

      setStories(enrichedData);
    };

    fetchStories();
  }, []);

  return (
    <div className="min-h-screen px-4 py-24 bg-[#231123] text-white">
      <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-6">Stories</h2>

      <div className="space-y-6 max-w-3xl mx-auto">
        {stories.map((story) => (
          <div key={story.id} className="bg-[#2c1b2f] p-6 rounded shadow">
            <h3 className="text-2xl font-bold text-[#c30F45]">{story.title}</h3>
            <p className="text-sm text-gray-300 mb-2">
              {story.genre} • by {story.author?.name || "Anonymous"}
            </p>
            <p className="text-gray-200 line-clamp-3" dangerouslySetInnerHTML={{ __html: story.content }} />
            <div className="flex items-center text-sm text-gray-400 mt-3 gap-4">
              <span>❤️ {story.likeCount} likes</span>
              <span>💬 {story.commentCount} comments</span>
            </div>
            <Link
              to={`/story/${story.id}`}
              className="mt-4 inline-block text-[#c30F45] underline hover:text-pink-400"
            >
              Read more →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;
