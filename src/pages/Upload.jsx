import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/fireabase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { Camera, Bold, Italic } from "lucide-react";

const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/dnartpsxj/image/upload";
const CLOUDINARY_PRESET = "MY_blog";

const Upload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoSave, setAutoSave] = useState(false);

  const editorReady = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class:
          "min-h-[220px] text-white text-base leading-relaxed focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!user || !editor || editorReady.current) return;

    const saved = localStorage.getItem(`draft_${user.uid}`);
    if (saved) {
      const draft = JSON.parse(saved);
      setTitle(draft.title || "");
      setGenre(draft.genre || "");
      setImageUrl(draft.imageUrl || "");
      if (draft.content) editor.commands.setContent(draft.content);
    }

    editorReady.current = true;
  }, [user, editor]);

  useEffect(() => {
    if (!user || !editorReady.current) return;

    const t = setTimeout(() => {
      const content = editor?.getHTML() || "";

      if (title || genre || imageUrl || content.length > 10) {
        setAutoSave(true);

        localStorage.setItem(
          `draft_${user.uid}`,
          JSON.stringify({
            title,
            genre,
            imageUrl,
            content,
          })
        );

        setTimeout(() => setAutoSave(false), 800);
      }
    }, 1200);

    return () => clearTimeout(t);
  }, [title, genre, imageUrl, editor?.getHTML(), user]);

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_PRESET);

    try {
      setLoading(true);
      const res = await axios.post(CLOUDINARY_UPLOAD_URL, data);
      setImageUrl(res.data.secure_url);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const publish = async (draft = false) => {
    if (!title || !editor?.getText().trim()) return;

    try {
      setLoading(true);

      const text = editor.getText();
      const excerpt = text.slice(0, 160);

      await addDoc(collection(db, "stories"), {
        title,
        genre: genre || "General",
        image: imageUrl || "",
        content: editor.getHTML(),
        excerpt,
        isDraft: draft,
        createdAt: serverTimestamp(),
        authorId: user.uid,
        author: {
          uid: user.uid,
          name: user.displayName,
          photoURL: user.photoURL,
        },
      });

      localStorage.removeItem(`draft_${user.uid}`);
      navigate("/");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Please login
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white">

      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 py-3 flex items-center justify-between">
        <Link className="text-white text-xl">✕</Link>

        <div className="text-xs text-gray-400">
          {autoSave ? "Saving draft..." : "Compose story"}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => publish(true)}
            className="px-3 py-1 rounded-full border border-[#2f3336] text-sm"
          >
            Save
          </button>

          <button
            onClick={() => publish(false)}
            className="px-4 py-1 rounded-full bg-[#c30F45] text-sm font-bold"
          >
            Post
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-2xl mx-auto px-4 py-6">

        <div className="flex gap-3">

          {/* AVATAR */}
          <img
            src={
              user.photoURL ||
              `https://ui-avatars.com/api/?name=${user.displayName}`
            }
            className="w-11 h-11 rounded-full border border-[#2f3336]"
          />

          <div className="flex-1 space-y-4">

            {/* TITLE */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title your story..."
              className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-gray-500 outline-none"
            />

            {/* GENRE */}
            <input
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Genre (optional)"
              className="w-full bg-transparent text-sm text-[#c30F45] font-semibold placeholder:text-gray-500 outline-none"
            />

            {/* EDITOR */}
            <div>
              <EditorContent editor={editor} />
            </div>

            {/* IMAGE */}
            {imageUrl && (
              <div className="relative rounded-xl overflow-hidden border border-[#2f3336]">
                <img src={imageUrl} className="w-full object-cover" />
                <button
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 bg-black/70 px-2 rounded-full"
                >
                  ✕
                </button>
              </div>
            )}

            {/* TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2f3336] pt-3">

              {/* CAMERA BUTTON */}
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0f172a] border border-[#334155] hover:border-[#c30F45] cursor-pointer transition">
                <Camera size={18} className="text-[#c30F45]" />
                <span className="text-sm font-semibold">
                  Upload Photo
                </span>
                <input
                  type="file"
                  hidden
                  onChange={uploadImage}
                  accept="image/*"
                />
              </label>

              {/* FORMATTING */}
              <div className="flex gap-2">

                <button
                  onClick={() =>
                    editor?.chain().focus().toggleBold().run()
                  }
                  className={`p-2 rounded-lg border ${
                    editor?.isActive("bold")
                      ? "bg-[#c30F45] border-[#c30F45]"
                      : "border-[#2f3336]"
                  }`}
                >
                  <Bold size={16} />
                </button>

                <button
                  onClick={() =>
                    editor?.chain().focus().toggleItalic().run()
                  }
                  className={`p-2 rounded-lg border ${
                    editor?.isActive("italic")
                      ? "bg-[#c30F45] border-[#c30F45]"
                      : "border-[#2f3336]"
                  }`}
                >
                  <Italic size={16} />
                </button>

              </div>

              {/* CHAR COUNT */}
              <span className="text-xs text-gray-500">
                {editor?.getText().length || 0} chars
              </span>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Upload;