import "./GameCard.css";
import { useNavigate } from "react-router-dom";

export default function GameCard({
  game,
  hideTitle,
  onAddToCart,
  disableClick = true, // ✅ default disabled
  mode,
  dragging = false,
  titleTopPriceBottom = false,
}) {
  const navigate = useNavigate();
  const price = Number(game?.price || 0);
  const salePrice = Number(game?.salePrice || 0);
  const discountPercent =
    price > 0 && salePrice > 0 && salePrice < price
      ? Math.round(((price - salePrice) / price) * 100)
      : 0;

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
      {discountPercent > 0 && (
        <span className="discount-badge">{discountPercent}% OFF</span>
      )}

      {/* CONTENT */}
      <div className="card-content">
        {titleTopPriceBottom ? (
          <>
            {!hideTitle && (
              <span className="game-title game-title-top">{game.title}</span>
            )}
            <div className="price price-bottom">
              <span className="old">₹{game.price}</span>
              <span className="sale">₹{game.salePrice}</span>
            </div>
          </>
        ) : (
          <div className="card-row">
            <div className="price">
              <span className="old">₹{game.price}</span>
              <span className="sale">₹{game.salePrice}</span>
            </div>

            {!hideTitle && <span className="game-title">{game.title}</span>}
          </div>
        )}
      </div>

      {/* BUTTONS */}
      {mode !== "library" && (
        <div className="hover-overlay">
          <div className="hover-buttons">
            {/* ADD TO CART button hidden as per requirements */}

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
