// components/CloudinaryUpload.jsx
import React, { useState } from "react";
import axios from "axios";

const CloudinaryUpload = ({ onUpload }) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "upload_preset"); // change to your preset name

    try {
      const res = await axios.post(
        "https://api.cloudinary.com/v1_1/dnartpsxj/image/upload",
        formData
      );
      onUpload(res.data.secure_url); // send URL back to parent
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block mb-1 font-semibold">Cover Image:</label>
      <input type="file" accept="image/*" onChange={handleUpload} />
      {uploading && <p className="text-sm text-pink-400">Uploading...</p>}
    </div>
  );
};

export default CloudinaryUpload;
