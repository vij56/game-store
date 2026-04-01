import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./GameDetails.css";
import toast from "react-hot-toast";
import { showAddedToCartToast } from "../utils/showAddedToCartToast";

export default function GameDetails() {
  const { id } = useParams();

  const [game, setGame] = useState(null);

  const token = localStorage.getItem("token");

  const fetchGame = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/games/${id}`,
      );
      const data = await res.json();
      setGame(data);
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGame();
  }, [fetchGame]);

  // ✅ SAME POPUP AS HOMEPAGE
  const addToCart = async () => {
    if (!game?._id) return;

    if (!token) {
      toast.error("Please login first");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gameId: game._id }),
      });

      if (!res.ok) {
        toast.error("Failed to add");
        return;
      }

      showAddedToCartToast(game);
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  if (!game) {
    return (
      <section className="game-details-page">
        <div className="gd-loading">Loading game details...</div>
      </section>
    );
  }

  const discountPercent =
    game.price && game.salePrice
      ? Math.max(0, Math.round(((game.price - game.salePrice) / game.price) * 100))
      : 0;

  return (
    <section className="game-details-page">
      <div className="gd-layout">
        <div className="gd-media-card">
          <img src={game.image} alt={game.title} className="gd-cover" />
          {discountPercent > 0 && (
            <span className="gd-badge">Save {discountPercent}%</span>
          )}
        </div>

        <div className="gd-main-card">
          <p className="gd-kicker">Featured Game</p>
          <h1 className="gd-title">{game.title}</h1>
          <p className="gd-subtitle">
            Jump into a premium gaming experience with cinematic visuals and fast-paced gameplay.
          </p>

          <div className="gd-price-box">
            <span className="gd-old">₹{game.price}</span>
            <span className="gd-sale">₹{game.salePrice}</span>
            {discountPercent > 0 && (
              <span className="gd-pill">{discountPercent}% OFF</span>
            )}
          </div>

          <div className="gd-actions">
            <button className="btn gd-add-btn" onClick={() => addToCart()}>
              Add to Cart
            </button>
          </div>

          <div className="gd-meta-grid">
            <div className="gd-meta-item">
              <span>Category</span>
              <strong>{game.genre || "Action"}</strong>
            </div>
            <div className="gd-meta-item">
              <span>Platform</span>
              <strong>{game.platform || "PC"}</strong>
            </div>
            <div className="gd-meta-item">
              <span>Mode</span>
              <strong>{game.mode || "Single / Multiplayer"}</strong>
            </div>
            <div className="gd-meta-item">
              <span>Developer</span>
              <strong>{game.developer || "Studio Prime"}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="gd-sections">
        <div className="gd-panel">
          <h2>About this game</h2>
          <p>{game.description}</p>
        </div>

        <div className="gd-panel">
          <h3>Reviews</h3>

          {game?.reviews?.length > 0 ? (
            <div className="gd-reviews-list">
              {game.reviews.map((r, index) => (
                <div key={index} className="gd-review-item">
                  <div className="gd-review-header">
                    <span className="gd-review-author">
                      {r.user?.username || r.user?.email || "Anonymous"}
                    </span>
                    <span className="gd-review-rating">
                      {r.rating ? `★ ${r.rating}` : "★"}
                    </span>
                  </div>

                  <p className="gd-review-comment">{r.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="gd-no-reviews">No reviews yet</p>
          )}
        </div>
      </div>
    </section>
  );
}
