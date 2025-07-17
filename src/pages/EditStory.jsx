// // src/pages/EditStory.jsx
// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { db } from "../firebase/fireabase";
// import {
//   doc,
//   getDoc,
//   updateDoc,
//   serverTimestamp,
// } from "firebase/firestore";
// import { useAuth } from "../context/AuthContext";
// import { EditorContent, useEditor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import axios from "axios";

// const ADMIN_UID = "hzPSPeMCTvOy6aPVDS5UgnWDJTZ2";

// const EditStory = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [authChecked, setAuthChecked] = useState(false);
//   const [title, setTitle] = useState("");
//   const [genre, setGenre] = useState("");
//   const [imageUrl, setImageUrl] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [successMsg, setSuccessMsg] = useState("");

//   const editor = useEditor({
//     extensions: [StarterKit],
//     content: "<p>Loading story...</p>",
//   });

//   useEffect(() => {
//     if (user !== undefined) setAuthChecked(true);
//   }, [user]);

//   useEffect(() => {
//     const loadStory = async () => {
//       try {
//         const docRef = doc(db, "stories", id);
//         const snap = await getDoc(docRef);
//         if (snap.exists()) {
//           const data = snap.data();
//           setTitle(data.title);
//           setGenre(data.genre);
//           setImageUrl(data.image || "");
//           if (editor) editor.commands.setContent(data.content);
//         }
//       } catch (error) {
//         console.error("Error loading story:", error);
//       }
//     };
//     if (editor) loadStory();
//   }, [editor, id]);

//   const handleImageUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("upload_preset", "MY_blog");

//     try {
//       const res = await axios.post(
//         "https://api.cloudinary.com/v1_1/dnartpsxj/image/upload",
//         formData
//       );
//       setImageUrl(res.data.secure_url);
//     } catch (err) {
//       console.error("Image upload error:", err);
//       alert("❌ Failed to upload image.");
//     }
//   };

//   const handleUpdate = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setSuccessMsg("");

//     try {
//       const content = editor?.getHTML();

//       await updateDoc(doc(db, "stories", id), {
//         title,
//         genre,
//         image: imageUrl,
//         content,
//         updatedAt: serverTimestamp(),
//       });

//       setSuccessMsg("✅ Story updated successfully!");
//     } catch (err) {
//       console.error(err);
//       alert("❌ Update failed.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!authChecked) return <div className="text-white p-10">Checking...</div>;
//   if (!user) return <div className="text-white p-10">Please log in.</div>;
//   if (user.uid !== ADMIN_UID)
//     return <div className="text-white p-10">Access Denied</div>;

//   return (
//     <div className="min-h-screen px-4 py-24 bg-[#231123] text-white">
//       <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-6">
//         ✏️ Edit Story
//       </h2>
//       <form
//         onSubmit={handleUpdate}
//         className="max-w-2xl mx-auto bg-[#2c1b2f] p-6 rounded-lg shadow space-y-5"
//       >
//         <input
//           type="text"
//           placeholder="Story Title"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           className="w-full p-3 rounded text-black"
//           required
//         />

//         <input
//           type="text"
//           placeholder="Genre"
//           value={genre}
//           onChange={(e) => setGenre(e.target.value)}
//           className="w-full p-3 rounded text-black"
//           required
//         />

//         <div>
//           <label className="block mb-1 font-semibold">Cover Image</label>
//           <input
//             type="file"
//             accept="image/*"
//             onChange={handleImageUpload}
//             className="text-white"
//           />
//           {imageUrl && (
//             <img
//               src={imageUrl}
//               alt="cover"
//               className="mt-2 w-full max-h-64 object-cover rounded"
//             />
//           )}
//         </div>

//         <div className="bg-white rounded p-2 text-black">
//           <EditorContent editor={editor} />
//         </div>

//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full py-3 bg-[#c30F45] hover:opacity-90 rounded font-semibold"
//         >
//           {loading ? "Updating..." : "Update Story"}
//         </button>

//         {successMsg && (
//           <div className="text-green-400 text-center mt-4">
//             {successMsg}
//             <button
//               onClick={() => navigate("/upload")}
//               className="ml-2 underline text-sm text-blue-300"
//             >
//               Go back to Upload Page
//             </button>
//           </div>
//         )}
//       </form>
//     </div>
//   );
// };

// export default EditStory;
// src/pages/EditStory.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase/fireabase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import axios from "axios";

const ADMIN_UID = "hzPSPeMCTvOy6aPVDS5UgnWDJTZ2";

const EditStory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Loading story...</p>",
  });

  useEffect(() => {
    if (user !== undefined) setAuthChecked(true);
  }, [user]);

  useEffect(() => {
    const loadStory = async () => {
      try {
        const docRef = doc(db, "stories", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setTitle(data.title);
          setGenre(data.genre);
          setImageUrl(data.image || "");
          if (editor) editor.commands.setContent(data.content);
        }
      } catch (error) {
        console.error("Error loading story:", error);
      }
    };
    if (editor) loadStory();
  }, [editor, id]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "MY_blog");

    try {
      const res = await axios.post("https://api.cloudinary.com/v1_1/dnartpsxj/image/upload", formData);
      setImageUrl(res.data.secure_url);
    } catch (err) {
      console.error("Image upload error:", err);
      alert("❌ Failed to upload image.");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");

    try {
      const content = editor?.getHTML();
      const excerpt = content.replace(/<[^>]+>/g, "").slice(0, 150);

      await updateDoc(doc(db, "stories", id), {
        title,
        genre,
        image: imageUrl,
        content,
        excerpt,
        updatedAt: serverTimestamp(),
      });

      setSuccessMsg("✅ Story updated successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Update failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) return <div className="text-white p-10">Checking...</div>;
  if (!user) return <div className="text-white p-10">Please log in.</div>;
  if (user.uid !== ADMIN_UID) return <div className="text-white p-10">Access Denied</div>;

  return (
    <div className="min-h-screen px-4 py-24 bg-[#231123] text-white">
      <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-6">✏️ Edit Story</h2>

      <form onSubmit={handleUpdate} className="max-w-2xl mx-auto bg-[#2c1b2f] p-6 rounded-lg shadow space-y-5">
        <input type="text" placeholder="Story Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 rounded text-black" required />
        <input type="text" placeholder="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-3 rounded text-black" required />

        <div>
          <label className="block mb-1 font-semibold">Cover Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-white" />
          {imageUrl && <img src={imageUrl} alt="cover" className="mt-2 w-full max-h-64 object-cover rounded" />}
        </div>

        <div className="bg-white rounded p-2 text-black">
          <EditorContent editor={editor} />
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 bg-[#c30F45] hover:opacity-90 rounded font-semibold">
          {loading ? "Updating..." : "Update Story"}
        </button>

        {successMsg && (
          <div className="text-green-400 text-center mt-4">
            {successMsg}
            <button onClick={() => navigate("/upload")} className="ml-2 underline text-sm text-blue-300">Go back to Upload Page</button>
          </div>
        )}
      </form>
    </div>
  );
};

export default EditStory;

