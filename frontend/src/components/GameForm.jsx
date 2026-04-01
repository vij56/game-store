import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import "./GameForm.css";

const GameForm = ({ game, onClose }) => {
  const isEdit = game && game._id;

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    salePrice: "",
    image: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    setForm({
      title: game.title || "",
      description: game.description || "",
      price: game.price || "",
      salePrice: game.salePrice || "",
      image: game.image || "",
    });
  }, [game]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("image", file);

    setUploading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/games/upload-image`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: data,
        },
      );

      if (!res.ok) throw new Error("Upload failed");

      const { imageUrl } = await res.json();
      setForm((prev) => ({ ...prev, image: imageUrl }));
      toast.success("Image uploaded");
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.price || !form.image) {
      toast.error("Please fill title, price and image");
      return;
    }

    setSaving(true);

    try {
      const url = isEdit
        ? `${import.meta.env.VITE_API_URL}/api/admin/games/${game._id}`
        : `${import.meta.env.VITE_API_URL}/api/admin/games`;
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...form,
        price: Number(form.price),
        salePrice: Number(form.salePrice || form.price),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Unable to save game");
      }

      toast.success(isEdit ? "Game updated" : "Game added");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="game-form-modal">
        <div className="modal-header">
          <div>
            <p className="modal-label">Admin Control</p>
            <h2>{isEdit ? "Update game" : "Create new game"}</h2>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="form-grid">
          <label>
            Title
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Game title"
            />
          </label>

          <label>
            Price
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              placeholder="Regular price"
            />
          </label>

          <label>
            Sale Price
            <input
              name="salePrice"
              type="number"
              value={form.salePrice}
              onChange={handleChange}
              placeholder="Discounted price"
            />
          </label>

          <label>
            Cover Image
            <label htmlFor="coverImageInput" className="image-upload-area">
              {form.image ? (
                <>
                  <img
                    src={form.image}
                    alt="cover preview"
                    className="image-preview"
                  />
                  {uploading && (
                    <div className="upload-overlay">
                      <span>Uploading...</span>
                    </div>
                  )}
                </>
              ) : uploading ? (
                <span className="image-upload-hint">Uploading...</span>
              ) : (
                <span className="image-upload-hint">Click to browse image</span>
              )}
            </label>
            {form.image && (
              <button
                type="button"
                className="image-remove-btn"
                onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
              >
                Remove image
              </button>
            )}
          </label>
        </div>

        <input
          id="coverImageInput"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          style={{ display: "none" }}
          onChange={handleImageChange}
        />

        <label className="full-width">
          Description
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Game description"
          />
        </label>

        <div className="form-actions">
          <button
            className="save-button"
            onClick={handleSubmit}
            disabled={saving || uploading}
          >
            {saving ? "Saving..." : isEdit ? "Update Game" : "Create Game"}
          </button>
          <button
            className="cancel-button"
            onClick={onClose}
            disabled={saving || uploading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameForm;
