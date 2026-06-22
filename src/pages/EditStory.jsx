import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import axios from "axios";
import { ArrowLeft, ImagePlus, Save, Send, X } from "lucide-react";
import { db } from "../firebase/fireabase";
import { useAuth } from "../context/AuthContext";

const EDIT_WINDOW_MINUTES = 15;
const CLOUDINARY_UPLOAD_URL =
  "https://api.cloudinary.com/v1_1/dnartpsxj/image/upload";
const CLOUDINARY_PRESET = "MY_blog";

const EditStory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [authChecked, setAuthChecked] = useState(false);
  const [storyChecked, setStoryChecked] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [denyMessage, setDenyMessage] = useState("");
  const [story, setStory] = useState(null);
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class:
          "min-h-[280px] text-white text-base leading-8 focus:outline-none prose prose-invert max-w-none prose-p:my-4 prose-headings:text-white prose-strong:text-white prose-ul:my-4 prose-ol:my-4",
      },
    },
  });

  useEffect(() => {
    if (user !== undefined) setAuthChecked(true);
  }, [user]);

  useEffect(() => {
    const loadStory = async () => {
      try {
        const docRef = doc(db, "stories", id);
        const snap = await getDoc(docRef);

        if (!snap.exists()) {
          setCanEdit(false);
          setDenyMessage("Story not found.");
          return;
        }

        const data = snap.data();
        const isOwner =
          data.author?.uid === user?.uid || data.authorId === user?.uid;
        const createdSeconds = data.createdAt?.seconds;
        const isDraft = data.isDraft === true;
        const withinWindow = createdSeconds
          ? Date.now() - createdSeconds * 1000 <= EDIT_WINDOW_MINUTES * 60 * 1000
          : false;

        if (!isOwner) {
          setCanEdit(false);
          setDenyMessage("Access denied. You can only edit your own story.");
          return;
        }

        if (!isDraft && !withinWindow) {
          setCanEdit(false);
          setDenyMessage(
            "Editing window closed. Published stories can only be edited within 15 minutes of posting.",
          );
          return;
        }

        setStory({ id: snap.id, ...data });
        setCanEdit(true);
        setTitle(data.title || "");
        setGenre(data.genre || "");
        setImageUrl(data.image || "");
        if (editor) editor.commands.setContent(data.content || "");
      } catch (error) {
        console.error("Error loading story:", error);
        setCanEdit(false);
        setDenyMessage("Failed to load story.");
      } finally {
        setStoryChecked(true);
      }
    };

    if (editor && user) loadStory();
  }, [editor, id, user]);

  const triggerImagePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_PRESET);

    try {
      setUploadingImage(true);
      const res = await axios.post(CLOUDINARY_UPLOAD_URL, formData);
      setImageUrl(res.data.secure_url);
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Failed to upload image.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleUpdate = async (e, publish = false) => {
    if (e) e.preventDefault();

    if (!canEdit) {
      alert("You can only edit your own story.");
      return;
    }

    setLoading(true);
    setSuccessMsg("");

    try {
      const content = editor?.getHTML() || "";
      const text = editor?.getText().trim() || "";
      const excerpt = text.slice(0, 160);
      const willBeDraft = story?.isDraft ? !publish : false;

      await updateDoc(doc(db, "stories", id), {
        title,
        genre: genre || "General",
        image: imageUrl,
        content,
        excerpt,
        isDraft: willBeDraft,
        updatedAt: serverTimestamp(),
      });

      setStory((prev) => (prev ? { ...prev, isDraft: willBeDraft } : prev));

      setSuccessMsg(
        publish
          ? "Story published successfully."
          : "Story updated successfully.",
      );
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Checking access...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Please log in.
      </div>
    );
  }

  if (!storyChecked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Loading story...
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 text-center text-white">
        <div className="max-w-md space-y-3">
          <p className="text-2xl font-bold">Edit unavailable</p>
          <p className="text-sm text-gray-400">{denyMessage || "Access denied."}</p>
          <button
            type="button"
            onClick={() => navigate("/manage-stories")}
            className="inline-flex items-center gap-2 rounded-full border border-[#2f3336] px-4 py-2 text-sm font-semibold text-white hover:bg-white/5"
          >
            <ArrowLeft size={16} />
            Back to my stories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-50 border-b border-[#2f3336] bg-black/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => navigate("/manage-stories")}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#2f3336] px-3 py-2 text-sm font-semibold text-white hover:bg-white/5"
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <div className="text-left md:flex-1 md:text-center">
            <p className="text-sm font-semibold text-white md:text-base">
              Edit Story
            </p>
            <p className="text-xs text-gray-400 md:text-sm">
              {successMsg || "Refine your story, then save or publish it."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <button
              type="button"
              onClick={() => handleUpdate(null, false)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-full border border-[#2f3336] px-3 py-2 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-60"
            >
              <Save size={16} />
              {loading && !story?.isDraft ? "Saving..." : "Save"}
            </button>

            {story?.isDraft ? (
              <button
                type="button"
                onClick={() => handleUpdate(null, true)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-[#c30F45] px-3 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
              >
                <Send size={16} />
                {loading ? "Publishing..." : "Publish"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleUpdate(null, false)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-full bg-[#c30F45] px-3 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60"
              >
                <Save size={16} />
                {loading ? "Updating..." : "Update"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 lg:py-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-[#2f3336] bg-[#111214] p-5 shadow-2xl shadow-black/20 md:p-6">
              <div className="flex flex-col gap-3 border-b border-[#2f3336] pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                    Keep editing your story
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-gray-400 md:text-[15px]">
                    Update the title, category, cover image, and body content.
                  </p>
                </div>
                <span className="rounded-full border border-[#2f3336] px-3 py-1 text-xs font-semibold text-[#c30F45]">
                  {story?.isDraft ? "Draft" : "Published"}
                </span>
              </div>

              <form
                onSubmit={(e) => handleUpdate(e, false)}
                className="mt-6 space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Story title"
                    className="w-full rounded-2xl border border-[#2f3336] bg-black/70 px-4 py-3 text-lg font-semibold text-white outline-none transition focus:border-[#c30F45]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Genre
                  </label>
                  <input
                    type="text"
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    placeholder="Genre"
                    className="w-full rounded-2xl border border-[#2f3336] bg-black/70 px-4 py-3 text-sm font-semibold text-[#c30F45] outline-none transition focus:border-[#c30F45]"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                        Cover Image
                      </label>
                      <p className="text-xs text-gray-500">
                        Add or replace the featured image for this story.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={triggerImagePicker}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-2 rounded-full border border-[#2f3336] px-3 py-2 text-sm font-semibold text-white hover:bg-white/5 disabled:opacity-60"
                    >
                      <ImagePlus size={16} />
                      {uploadingImage ? "Uploading..." : imageUrl ? "Change image" : "Upload image"}
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {imageUrl ? (
                    <div className="relative overflow-hidden rounded-3xl border border-[#2f3336]">
                      <img
                        src={imageUrl}
                        alt="Story cover"
                        className="h-56 w-full object-cover sm:h-72"
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur hover:bg-black"
                        aria-label="Remove image"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex min-h-48 items-center justify-center rounded-3xl border border-dashed border-[#2f3336] bg-black/40 px-6 text-center text-sm text-gray-500">
                      No cover image selected yet.
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Story Body
                  </label>
                  <div className="rounded-3xl border border-[#2f3336] bg-black/70 p-4 md:p-5">
                    <EditorContent editor={editor} />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {story?.isDraft ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdate(null, false)}
                        disabled={loading}
                        className="flex-1 rounded-2xl border border-[#2f3336] px-4 py-3 font-semibold text-white transition hover:bg-white/5 disabled:opacity-60"
                      >
                        {loading ? "Saving..." : "Save Draft"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdate(null, true)}
                        disabled={loading}
                        className="flex-1 rounded-2xl bg-[#c30F45] px-4 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                      >
                        {loading ? "Publishing..." : "Publish Story"}
                      </button>
                    </>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-2xl bg-[#c30F45] px-4 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                    >
                      {loading ? "Updating..." : "Update Story"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
            <div className="rounded-3xl border border-[#2f3336] bg-[#111214] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                Edit Rules
              </p>
              <ul className="mt-4 space-y-3 text-sm text-gray-300">
                <li>Only the owner can edit this story.</li>
                <li>Published stories can be edited for 15 minutes after posting.</li>
                <li>Drafts can be saved and published from this page.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-[#2f3336] bg-[#111214] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                Preview
              </p>
              <div className="mt-4 space-y-3">
                <p className="text-lg font-bold text-white">
                  {title || "Your story title"}
                </p>
                <p className="text-sm text-[#c30F45]">
                  {genre || "General"}
                </p>
                <p className="text-sm leading-6 text-gray-400">
                  {editor?.getText().slice(0, 140) ||
                    "Add some text and it will show up here as a quick preview."}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default EditStory;
