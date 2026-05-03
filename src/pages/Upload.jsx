import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/fireabase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const CLOUDINARY_UPLOAD_URL = "https://api.cloudinary.com/v1_1/dnartpsxj/image/upload";
const CLOUDINARY_PRESET = "MY_blog";

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const editorLoaded = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[300px] text-lg leading-relaxed',
      },
    },
  });

  // Load draft from local storage
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

  // Auto-save
  useEffect(() => {
    if (!user || !editorLoaded.current) return;
    const timeoutId = setTimeout(() => {
      const content = editor?.getHTML() || "";
      if (title || genre || imageUrl || content.length > 20) {
        setIsAutoSaving(true);
        localStorage.setItem(`draft_${user.uid}`, JSON.stringify({ title, genre, imageUrl, content }));
        setTimeout(() => setIsAutoSaving(false), 1000);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [title, genre, imageUrl, editor?.getHTML(), user]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);
    try {
      setLoading(true);
      const res = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
      setImageUrl(res.data.secure_url);
    } catch (error) {
      console.error("Image upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (isDraft = false) => {
    if (!title.trim() || !editor?.getText().trim()) return;
    setLoading(true);
    try {
      const content = editor.getHTML();
      const cleanText = editor.getText();
      const excerpt = cleanText.slice(0, 160);
      const wordCount = cleanText.split(/\s+/).filter(w => w.length > 0).length;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));

      await addDoc(collection(db, "stories"), {
        title,
        genre: genre || "General",
        image: imageUrl || "",
        content,
        excerpt,
        readingTime,
        isDraft,
        createdAt: serverTimestamp(),
        authorId: user.uid,
        author: {
          uid: user.uid,
          name: user.displayName || "Anonymous",
          photoURL: user.photoURL || "",
        },
      });

      localStorage.removeItem(`draft_${user.uid}`);
      navigate("/");
    } catch (error) {
      console.error("Publish error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="text-center py-20">Please log in.</div>;

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Compose Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 rounded-full hover:bg-[#181818] transition">
            <span className="text-xl">✕</span>
          </Link>
          <span className="font-bold hidden sm:inline">Compose Story</span>
          {isAutoSaving && <span className="text-xs text-gray-500 animate-pulse">Draft saved</span>}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handlePublish(true)}
            disabled={loading || !title}
            className="text-white font-bold px-4 py-1.5 rounded-full hover:bg-[#181818] transition text-sm"
          >
            Save Draft
          </button>
          <button 
            onClick={() => handlePublish(false)}
            disabled={loading || !title || !editor?.getText().trim()}
            className="bg-[#c30F45] text-white font-bold px-6 py-1.5 rounded-full hover:bg-[#a30d3a] transition text-sm disabled:opacity-50"
          >
            {loading ? "..." : "Post"}
          </button>
        </div>
      </header>

      {/* Editor Feed */}
      <div className="px-4 py-6 max-w-[600px] mx-auto w-full">
        <div className="flex gap-4">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
            className="w-12 h-12 rounded-full border border-[#2f3336] flex-shrink-0" 
            alt="" 
          />
          <div className="flex-1 space-y-4">
            <input 
              type="text" 
              placeholder="Story Title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-black text-2xl font-extrabold text-white placeholder-gray-600 focus:outline-none w-full"
            />
            
            <input 
              type="text" 
              placeholder="Add genre..." 
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="bg-black text-sm text-[#c30F45] placeholder-gray-600 focus:outline-none w-full font-bold"
            />

            <div className="prose prose-invert max-w-none">
              <EditorContent editor={editor} placeholder="What's your story?" />
            </div>

            {imageUrl && (
              <div className="relative rounded-2xl overflow-hidden border border-[#2f3336]">
                <img src={imageUrl} alt="Cover" className="w-full object-cover max-h-[400px]" />
                <button 
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 bg-black/60 p-2 rounded-full hover:bg-black transition"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Editor Toolbar (Footer) */}
            <div className="sticky bottom-20 lg:bottom-4 bg-black border-t border-[#2f3336] pt-3 flex items-center justify-between">
              <div className="flex gap-4">
                <label className="cursor-pointer group">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  <div className="w-9 h-9 rounded-full flex items-center justify-center group-hover:bg-blue-500/10 transition">
                    <span className="text-blue-500 text-xl">🖼️</span>
                  </div>
                </label>
                <button 
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition ${editor?.isActive('bold') ? 'bg-[#c30F45]/10 text-[#c30F45]' : 'hover:bg-[#c30F45]/10 text-gray-500 hover:text-[#c30F45]'}`}
                >
                  <span className="font-bold">B</span>
                </button>
                <button 
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition ${editor?.isActive('italic') ? 'bg-[#c30F45]/10 text-[#c30F45]' : 'hover:bg-[#c30F45]/10 text-gray-500 hover:text-[#c30F45]'}`}
                >
                  <span className="italic">I</span>
                </button>
              </div>
              <div className="text-xs text-gray-500">
                {editor?.getText().length} characters
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;
