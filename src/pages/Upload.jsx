import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/fireabase"; // removed storage
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

const ADMIN_UID = "jUVRPKVD9VWGk0guVbDT68FTgxj1";

const Upload = () => {
  const { user } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Write your story...</p>",
  });

  useEffect(() => {
    if (user !== undefined) setAuthChecked(true);
  }, [user]);

  if (!authChecked) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">
        Checking permissions...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">
        Please log in to access this page.
      </div>
    );
  }

  if (user.uid !== ADMIN_UID) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-[#231123] text-white">
        ❌ Access Denied – You are not the Admin.
      </div>
    );
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");

    try {
      const content = editor?.getHTML();

      await addDoc(collection(db, "stories"), {
        title,
        genre,
        content,
        createdAt: serverTimestamp(),
        author: {
          uid: user.uid,
          name: user.displayName,
          email: user.email,
        },
      });

      setTitle("");
      setGenre("");
      if (editor) editor.commands.setContent("");
      setSuccessMsg("✅ Story uploaded successfully!");
    } catch (error) {
      console.error(error);
      alert("❌ Failed to upload story.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-24 bg-[#231123] text-white">
      <h2 className="text-3xl font-bold text-center text-[#c30F45] mb-6">
        Upload a New Story
      </h2>

      <form
        onSubmit={handleUpload}
        className="max-w-2xl mx-auto bg-[#2c1b2f] p-6 rounded-lg shadow space-y-5"
      >
        <input
          type="text"
          placeholder="Story Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 rounded text-black"
          required
        />

        <input
          type="text"
          placeholder="Genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="w-full p-3 rounded text-black"
          required
        />

        {/* TipTap Toolbar + Editor */}
        <div className="bg-white rounded p-2 text-black">
          {editor && (
            <>
              <div className="flex flex-wrap gap-2 mb-2">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 rounded ${editor.isActive("bold") ? "bg-[#c30F45] text-white" : "bg-gray-200"}`}>
                  Bold
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 rounded ${editor.isActive("italic") ? "bg-[#c30F45] text-white" : "bg-gray-200"}`}>
                  Italic
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 rounded ${editor.isActive("bulletList") ? "bg-[#c30F45] text-white" : "bg-gray-200"}`}>
                  • List
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`px-2 py-1 rounded ${editor.isActive("heading", { level: 2 }) ? "bg-[#c30F45] text-white" : "bg-gray-200"}`}>
                  H2
                </button>
                <button type="button" onClick={() => editor.chain().focus().undo().run()} className="px-2 py-1 rounded bg-gray-200">
                  Undo
                </button>
                <button type="button" onClick={() => editor.chain().focus().redo().run()} className="px-2 py-1 rounded bg-gray-200">
                  Redo
                </button>
              </div>
              <EditorContent editor={editor} />
            </>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[#c30F45] hover:opacity-90 rounded font-semibold"
        >
          {loading ? "Uploading..." : "Upload Story"}
        </button>

        {successMsg && (
          <p className="text-green-400 text-center mt-4">{successMsg}</p>
        )}
      </form>
    </div>
  );
};

export default Upload;
