import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { v4 as uuidv4 } from "uuid";

const UploadForm = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [fileFile, setFileFile] = useState(null); // For the downloadable file
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!title || !description || !price || !imageFile) {
      setMessage("Please fill in all fields and select an image.");
      setLoading(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage("You must be logged in to upload a project.");
        setLoading(false);
        return;
      }

      // Upload image to Supabase storage
      const imageFileName = `${uuidv4()}-${imageFile.name}`;
      const { data: _imageData, error: imageError } = await supabase.storage
        .from('projects')
        .upload(`images/${imageFileName}`, imageFile);

      if (imageError) throw imageError;

      const imageUrl = supabase.storage.from('projects').getPublicUrl(`images/${imageFileName}`).data.publicUrl;

      let fileUrl = null;
      if (fileFile) {
        const fileFileName = `${uuidv4()}-${fileFile.name}`;
        const { data: _fileData, error: fileError } = await supabase.storage
          .from('projects')
          .upload(`files/${fileFileName}`, fileFile);

        if (fileError) throw fileError;

        fileUrl = supabase.storage.from('projects').getPublicUrl(`files/${fileFileName}`).data.publicUrl;
      }

      // Insert project into Supabase
      const { error: insertError } = await supabase
        .from('projects')
        .insert({
          title,
          description,
          price: parseFloat(price),
          image_url: imageUrl,
          file_url: fileUrl,
          seller_id: user.id,
        });

      if (insertError) throw insertError;

      setMessage("Project uploaded successfully!");
      setTitle("");
      setDescription("");
      setPrice("");
      setImageFile(null);
      setFileFile(null);
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded shadow w-full max-w-lg space-y-4"
    >
      <h2 className="text-xl font-bold text-blue-600">Upload Project</h2>
      {message && <p className="text-sm text-green-600">{message}</p>}

      <input
        type="text"
        placeholder="Project Title"
        className="w-full border p-2 rounded"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Description"
        className="w-full border p-2 rounded"
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        type="number"
        placeholder="Price (KES)"
        className="w-full border p-2 rounded"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <input
        type="file"
        accept="image/*"
        className="w-full border p-2 rounded"
        onChange={(e) => setImageFile(e.target.files[0])}
      />

      <input
        type="file"
        accept="*/*"
        className="w-full border p-2 rounded"
        onChange={(e) => setFileFile(e.target.files[0])}
        placeholder="Optional: Upload project file for download"
      />

      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Uploading..." : "Upload Project"}
      </button>
    </form>
  );
};

export default UploadForm;
