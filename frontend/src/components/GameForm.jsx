import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import "./GameForm.css";

const GameForm = ({ game, onClose }) => {
  const isEdit = game && game._id;

  const computeSalePrice = (priceValue, discountPercentValue) => {
    const price = Number(priceValue);
    const discountPercent = Number(discountPercentValue);

    if (!Number.isFinite(price) || price <= 0) return "";
    if (!Number.isFinite(discountPercent) || discountPercent <= 0) {
      return String(Math.round(price));
    }

    const clampedPercent = Math.min(Math.max(discountPercent, 0), 100);
    const sale = price - (price * clampedPercent) / 100;
    return String(Math.max(0, Math.round(sale)));
  };

  const [form, setForm] = useState({
    appId: "",
    title: "",
    description: "",
    price: "",
    discountPercent: "",
    salePrice: "",
    image: "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    const price = Number(game.price || 0);
    const salePrice = Number(game.salePrice || game.price || 0);
    const discountPercent =
      price > 0
        ? Math.max(
            0,
            Math.min(100, Math.round(((price - salePrice) / price) * 100)),
          )
        : 0;

    setForm({
      appId: game.appId || "",
      title: game.title || "",
      description: game.description || "",
      price: game.price || "",
      discountPercent: discountPercent || "",
      salePrice: game.salePrice || "",
      image: game.image || "",
    });
  }, [game]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "appId") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 7);
      setForm((prev) => ({
        ...prev,
        appId: digitsOnly,
      }));
      return;
    }

    if (name === "price" || name === "discountPercent") {
      const digitsOnly = value.replace(/\D/g, "");
      const normalizedValue =
        name === "discountPercent" ? digitsOnly.slice(0, 3) : digitsOnly;

      const nextPrice = name === "price" ? normalizedValue : form.price;
      const nextDiscount =
        name === "discountPercent" ? normalizedValue : form.discountPercent;

      setForm((prev) => ({
        ...prev,
        [name]: normalizedValue,
        salePrice: computeSalePrice(nextPrice, nextDiscount),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
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
    const parsedAppId = Number(form.appId);

    if (!form.title || !form.price || !form.image || !form.appId) {
      toast.error("Please fill app id, title, price and image");
      return;
    }

    if (
      !Number.isInteger(parsedAppId) ||
      parsedAppId < 10000 ||
      parsedAppId > 9999999
    ) {
      toast.error("App ID must be a 5 to 7 digit number");
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
        appId: parsedAppId,
        price: Number(form.price),
        discountPercent: Number(form.discountPercent || 0),
        salePrice: Number(
          computeSalePrice(form.price, form.discountPercent || 0),
        ),
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
            App ID
            <input
              name="appId"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={7}
              value={form.appId}
              onChange={handleChange}
              placeholder="5 to 7 digits"
            />
          </label>

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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.price}
              onChange={handleChange}
              placeholder="Regular price"
            />
          </label>

          <label>
            Discount %
            <input
              name="discountPercent"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              value={form.discountPercent}
              onChange={handleChange}
              placeholder="e.g. 80"
            />
          </label>

          <label>
            Sale Price
            <input
              name="salePrice"
              type="number"
              value={form.salePrice}
              readOnly
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
