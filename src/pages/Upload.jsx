import React, { useEffect, useState, useRef } from "react";
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

const Upload = () => {
  const { user } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const editorLoaded = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Write your story...</p>",
  });

  useEffect(() => {
    if (user !== undefined) setAuthChecked(true);
  }, [user]);

  // Load draft from local storage on mount
  useEffect(() => {
    if (user && editor && !editorLoaded.current) {
      const savedDraft = localStorage.getItem(`draft_${user.uid}`);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.title) setTitle(draft.title);
          if (draft.genre) setGenre(draft.genre);
          if (draft.imageUrl) setImageUrl(draft.imageUrl);
          if (draft.content) editor.commands.setContent(draft.content);
        } catch (e) {
          console.error("Failed to load draft:", e);
        }
      }
      editorLoaded.current = true;
    }
  }, [user, editor]);

  // Auto-save to local storage
  useEffect(() => {
    if (!user || !editorLoaded.current) return;
    const timeoutId = setTimeout(() => {
      const content = editor?.getHTML() || "";
      if (title || genre || imageUrl || content.length > 30) {
        setIsAutoSaving(true);
        localStorage.setItem(`draft_${user.uid}`, JSON.stringify({ title, genre, imageUrl, content }));
        setTimeout(() => setIsAutoSaving(false), 1000);
      }
    }, 2000); // Save 2 seconds after last change
    return () => clearTimeout(timeoutId);
  }, [title, genre, imageUrl, editor?.getHTML(), user]);

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

  const handleUpload = async (e, isDraft = false) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");

    try {
      const content = editor?.getHTML() || "";
      const finalImageUrl = imageUrl || DEFAULT_IMAGE;
      const cleanText = content.replace(/<[^>]+>/g, "");
      const excerpt = cleanText.slice(0, 150);
      
      // Calculate Reading Time (avg 200 words per minute)
      const wordCount = cleanText.split(/\s+/).filter(word => word.length > 0).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));

      await addDoc(collection(db, "stories"), {
        title,
        genre,
        image: finalImageUrl,
        content,
        excerpt,
        readingTime,
        isDraft,
        createdAt: serverTimestamp(),
        authorId: user.uid,
        author: {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
        },
      });

      // Clear draft on successful upload
      localStorage.removeItem(`draft_${user.uid}`);
      
      setTitle("");
      setGenre("");
      setImageUrl("");
      if (editor) editor.commands.setContent("<p>Write your story...</p>");
      setSuccessMsg(isDraft ? "✅ Draft saved to cloud!" : "✅ Story published successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("❌ Failed to save story.");
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) return <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">Checking permissions...</div>;
  if (!user) return <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">Please log in to access this page.</div>;

  return (
    <div className="min-h-screen px-4 py-24 bg-[#231123] text-white">
      <div className="max-w-2xl mx-auto flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#c30F45]">Upload a New Story</h2>
        {isAutoSaving && <span className="text-sm text-gray-400 italic animate-pulse">Saving draft...</span>}
      </div>

      <form className="max-w-2xl mx-auto bg-[#2c1b2f] p-6 rounded-lg shadow space-y-5">
        <input type="text" placeholder="Story Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 rounded text-black border focus:ring-2 focus:ring-[#c30F45] outline-none" required />
        <input type="text" placeholder="Genre (e.g. Sci-Fi, Romance)" value={genre} onChange={(e) => setGenre(e.target.value)} className="w-full p-3 rounded text-black border focus:ring-2 focus:ring-[#c30F45] outline-none" required />

        <div>
          <label className="block mb-1 font-semibold text-gray-300">Cover Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#c30F45] file:text-white hover:file:bg-pink-600 cursor-pointer" />
          {imageUrl && <img src={imageUrl} alt="Cover Preview" className="mt-4 w-full max-h-64 object-cover rounded shadow border border-[#3a2e4e]" />}
        </div>

        <div className="bg-white rounded overflow-hidden text-black">
          {editor && (
            <>
              <div className="flex flex-wrap gap-2 p-2 bg-gray-100 border-b border-gray-300">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 rounded text-sm ${editor.isActive("bold") ? "bg-[#c30F45] text-white" : "bg-white hover:bg-gray-200 shadow-sm border"}`}>Bold</button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 rounded text-sm ${editor.isActive("italic") ? "bg-[#c30F45] text-white" : "bg-white hover:bg-gray-200 shadow-sm border"}`}>Italic</button>
                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 rounded text-sm ${editor.isActive("bulletList") ? "bg-[#c30F45] text-white" : "bg-white hover:bg-gray-200 shadow-sm border"}`}>• List</button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 rounded text-sm ${editor.isActive("heading", { level: 2 }) ? "bg-[#c30F45] text-white" : "bg-white hover:bg-gray-200 shadow-sm border"}`}>H2</button>
                <button type="button" onClick={() => editor.chain().focus().undo().run()} className="px-2 py-1 rounded text-sm bg-white hover:bg-gray-200 shadow-sm border ml-auto">Undo</button>
                <button type="button" onClick={() => editor.chain().focus().redo().run()} className="px-2 py-1 rounded text-sm bg-white hover:bg-gray-200 shadow-sm border">Redo</button>
              </div>
              <div className="p-4 min-h-[300px]">
                <EditorContent editor={editor} className="prose max-w-none focus:outline-none" />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-4 pt-4 border-t border-[#3a2e4e]">
          <button type="button" onClick={(e) => handleUpload(e, true)} disabled={loading} className="w-1/3 py-3 bg-gray-700 hover:bg-gray-600 rounded font-semibold text-white transition">
            Save as Draft
          </button>
          <button type="submit" onClick={(e) => handleUpload(e, false)} disabled={loading} className="w-2/3 py-3 bg-[#c30F45] hover:opacity-90 rounded font-semibold text-white transition shadow-lg">
            {loading ? "Publishing..." : "Publish Story"}
          </button>
        </div>

        {successMsg && <p className="text-green-400 text-center mt-4 font-medium">{successMsg}</p>}
      </form>

      <div className="text-center mt-10 text-gray-400">
        <p className="mb-2">Want to update existing stories?</p>
        <Link to="/manage-stories" className="inline-block px-6 py-2 bg-[#2c1b2f] border border-[#3a2e4e] text-white rounded hover:bg-[#3a2e4e] transition">📂 Manage Stories</Link>
      </div>
    </div>
  );
};

export default Upload;
