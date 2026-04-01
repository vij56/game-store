import "./GameCard.css";
import { useNavigate } from "react-router-dom";

export default function GameCard({
  game,
  hideTitle,
  onAddToCart,
  disableClick = true, // ✅ default disabled
  mode,
  dragging = false,
}) {
  const navigate = useNavigate();

  // ❌ DISABLED card click unless explicitly allowed
  const handleCardClick = () => {
    if (disableClick) return;
    navigate(`/game/${game._id}`);
  };

  return (
    <div
      className={`game-card ${mode === "library" ? "library" : ""}`}
      onClick={handleCardClick}
      style={{ cursor: disableClick ? "default" : "pointer" }} // ✅ UX fix
    >
      {/* IMAGE */}
      <img src={game.image} alt={game.title} />

      {/* CONTENT */}
      <div className="card-content">
        <div className="card-row">
          <div className="price">
            <span className="old">₹{game.price}</span>
            <span className="sale">₹{game.salePrice}</span>
          </div>

          {!hideTitle && <span className="game-title">{game.title}</span>}
        </div>
      </div>

      {/* BUTTONS */}
      {mode !== "library" && (
        <div className="hover-overlay">
          <div className="hover-buttons">
            {/* ADD TO CART */}
            <button
              className="btn"
              onClick={(e) => {
                e.stopPropagation(); // 🔒 prevent any parent trigger
                if (dragging) return;
                onAddToCart && onAddToCart(game);
              }}
            >
              Add to Cart
            </button>

            {/* INFO */}
            <button
              className="btn info-btn"
              onClick={(e) => {
                e.stopPropagation(); // 🔒 prevent card click
                if (dragging) return;
                navigate(`/game/${game._id}`);
              }}
            >
              Info
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
