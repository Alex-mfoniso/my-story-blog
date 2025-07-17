// import React, { useEffect, useState } from "react";
// import { useAuth } from "../context/AuthContext";
// import { db } from "../firebase/fireabase";
// import { collection, addDoc, serverTimestamp } from "firebase/firestore";
// import { EditorContent, useEditor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import axios from "axios";
// import { Link } from "react-router-dom";


// const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dnartpsxj/image/upload";
// const CLOUDINARY_PRESET = "MY_blog"; // your unsigned preset
// const DEFAULT_IMAGE = "https://via.placeholder.com/600x400?text=No+Image";

// const ADMIN_UID = "hzPSPeMCTvOy6aPVDS5UgnWDJTZ2";

// const Upload = () => {
//   const { user } = useAuth();
//   const [authChecked, setAuthChecked] = useState(false);
//   const [title, setTitle] = useState("");
//   const [genre, setGenre] = useState("");
//   const [imageUrl, setImageUrl] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [successMsg, setSuccessMsg] = useState("");

//   const editor = useEditor({
//     extensions: [StarterKit],
//     content: "<p>Write your story...</p>",
//   });

//   useEffect(() => {
//     if (user !== undefined) setAuthChecked(true);
//   }, [user]);

//   const handleImageUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("upload_preset", CLOUDINARY_PRESET);

//     try {
//       const res = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
//       setImageUrl(res.data.secure_url);
//     } catch (error) {
//       console.error("Image upload error:", error);
//       alert("❌ Failed to upload image.");
//     }
//   };

//   const handleUpload = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setSuccessMsg("");

//     try {
//       const content = editor?.getHTML();
//       const finalImageUrl = imageUrl || DEFAULT_IMAGE;

//       await addDoc(collection(db, "stories"), {
//         title,
//         genre,
//         image: finalImageUrl,
//         content,
//         createdAt: serverTimestamp(),
//         author: {
//           uid: user.uid,
//           name: user.displayName,
//           email: user.email,
//         },
//       });

//       setTitle("");
//       setGenre("");
//       setImageUrl("");
//       if (editor) editor.commands.setContent("");
//       setSuccessMsg("✅ Story uploaded successfully!");
//     } catch (error) {
//       console.error("Upload error:", error);
//       alert("❌ Failed to upload story.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!authChecked) {
//     return (
//       <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">
//         Checking permissions...
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">
//         Please log in to access this page.
//       </div>
//     );
//   }

//   if (user.uid !== ADMIN_UID) {
//     return (
//       <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">
//         ❌ Access Denied – You are not the Admin.
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen px-4 py-24 bg-[#231123] text-white">
//       <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-6">
//         Upload a New Story
//       </h2>

//       <form
//         onSubmit={handleUpload}
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

//         {/* Cover Image Upload */}
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
//               alt="Cover Preview"
//               className="mt-2 w-full max-h-64 object-cover rounded shadow"
//             />
//           )}
//         </div>

//         {/* TipTap Toolbar + Editor */}
//         <div className="bg-white rounded p-2 text-black">
//           {editor && (
//             <>
//               <div className="flex flex-wrap gap-2 mb-2">
//                 <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 rounded ${editor.isActive("bold") ? "bg-[#c30F45] text-white" : "bg-gray-200"}`}>Bold</button>
//                 <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 rounded ${editor.isActive("italic") ? "bg-[#c30F45] text-white" : "bg-gray-200"}`}>Italic</button>
//                 <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 rounded ${editor.isActive("bulletList") ? "bg-[#c30F45] text-white" : "bg-gray-200"}`}>• List</button>
//                 <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 rounded ${editor.isActive("heading", { level: 2 }) ? "bg-[#c30F45] text-white" : "bg-gray-200"}`}>H2</button>
//                 <button type="button" onClick={() => editor.chain().focus().undo().run()} className="px-2 py-1 rounded bg-gray-200">Undo</button>
//                 <button type="button" onClick={() => editor.chain().focus().redo().run()} className="px-2 py-1 rounded bg-gray-200">Redo</button>
//               </div>
//               <EditorContent editor={editor} />
//             </>
//           )}
//         </div>

//         <button
//           type="submit"
//           disabled={loading}
//           className="w-full py-3 bg-[#c30F45] hover:opacity-90 rounded font-semibold"
//         >
//           {loading ? "Uploading..." : "Upload Story"}
//         </button>

//         {successMsg && (
//           <p className="text-green-400 text-center mt-4">{successMsg}</p>
//         )}
//       </form>
//       <div className="text-center mt-10">
//   <p className="mb-2">Want to update existing stories?</p>
//   <Link
//     to="/manage-stories"
//     className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//   >
//     📂 Manage Stories
//   </Link>
// </div>
//     </div>
//   );
// };

// export default Upload;

// src/pages/Upload.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/fireabase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import axios from "axios";
import { Link } from "react-router-dom";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dnartpsxj/image/upload";
const CLOUDINARY_PRESET = "MY_blog";
const DEFAULT_IMAGE = "https://via.placeholder.com/600x400?text=No+Image";
const ADMIN_UID = "hzPSPeMCTvOy6aPVDS5UgnWDJTZ2";

const Upload = () => {
  const { user } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Write your story...</p>",
  });

  useEffect(() => {
    if (user !== undefined) setAuthChecked(true);
  }, [user]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);

    try {
      const res = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
      setImageUrl(res.data.secure_url);
    } catch (error) {
      console.error("Image upload error:", error);
      alert("❌ Failed to upload image.");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");

    try {
      const content = editor?.getHTML();
      const finalImageUrl = imageUrl || DEFAULT_IMAGE;
      const excerpt = content.replace(/<[^>]+>/g, "").slice(0, 150);

      await addDoc(collection(db, "stories"), {
        title,
        genre,
        image: finalImageUrl,
        content,
        excerpt,
        createdAt: serverTimestamp(),
        author: {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
        },
      });

      setTitle("");
      setGenre("");
      setImageUrl("");
      if (editor) editor.commands.setContent("");
      setSuccessMsg("✅ Story uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Failed to upload story.");
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) return <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">Checking permissions...</div>;
  if (!user) return <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">Please log in to access this page.</div>;
  if (user.uid !== ADMIN_UID) return <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">❌ Access Denied – You are not the Admin.</div>;

  return (
    <div className="min-h-screen px-4 py-24 bg-[#231123] text-white">
      <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-6">Upload a New Story</h2>

      <form onSubmit={handleUpload} className="max-w-2xl mx-auto bg-[#2c1b2f] p-6 rounded-lg shadow space-y-5">
        <input type="text" placeholder="Story Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 rounded text-black" required />
        <input type="text" placeholder="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-3 rounded text-black" required />

        <div>
          <label className="block mb-1 font-semibold">Cover Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-white" />
          {imageUrl && <img src={imageUrl} alt="Cover Preview" className="mt-2 w-full max-h-64 object-cover rounded shadow" />}
        </div>

        <div className="bg-white rounded p-2 text-black">
          {editor && (
            <>
              <div className="flex flex-wrap gap-2 mb-2">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 rounded ${editor.isActive("bold") ? "bg-[#c30F45] text-white" : "bg-gray-200"}`}>Bold</button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 rounded ${editor.isActive("italic") ? "bg-[#c30F45] text-white" : "bg-gray-200"}`}>Italic</button>
                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 rounded ${editor.isActive("bulletList") ? "bg-[#c30F45] text-white" : "bg-gray-200"}`}>• List</button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 rounded ${editor.isActive("heading", { level: 2 }) ? "bg-[#c30F45] text-white" : "bg-gray-200"}`}>H2</button>
                <button type="button" onClick={() => editor.chain().focus().undo().run()} className="px-2 py-1 rounded bg-gray-200">Undo</button>
                <button type="button" onClick={() => editor.chain().focus().redo().run()} className="px-2 py-1 rounded bg-gray-200">Redo</button>
              </div>
              <EditorContent editor={editor} />
            </>
          )}
        </div>

        <button type="submit" disabled={loading} className="w-full py-3 bg-[#c30F45] hover:opacity-90 rounded font-semibold">
          {loading ? "Uploading..." : "Upload Story"}
        </button>

        {successMsg && <p className="text-green-400 text-center mt-4">{successMsg}</p>}
      </form>

      <div className="text-center mt-10">
        <p className="mb-2">Want to update existing stories?</p>
        <Link to="/manage-stories" className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">📂 Manage Stories</Link>
      </div>
    </div>
  );
};

export default Upload;

