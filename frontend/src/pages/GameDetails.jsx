import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GameDetails.css";

export default function GameDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loadingCart, setLoadingCart] = useState(false);

  useEffect(() => {
    setComment("");

    const fetchGame = async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/games/${id}`,
      );
      const data = await res.json();
      setGame(data);

      const token = localStorage.getItem("token");

      if (token && data.ratings) {
        const userId = JSON.parse(atob(token.split(".")[1])).id;

        const userRating = data.ratings.find((r) => r.user === userId);

        if (userRating) setRating(userRating.value);
      }
    };

    fetchGame();
  }, [id]);

  // ADD TO CART
  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setLoadingCart(true);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ gameId: game._id }),
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    const data = await res.json();

    setLoadingCart(false);

    if (!res.ok) {
      alert(data.msg);
      return;
    }

    navigate("/cart");
  };

  // RATING
  const handleRating = async (value) => {
    setRating(value);

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/games/rate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        gameId: game._id,
        rating: value,
      }),
    });

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const avgRating =
    game?.ratings?.length > 0
      ? (
          game.ratings.reduce((acc, r) => acc + r.value, 0) /
          game?.ratings.length
        ).toFixed(1)
      : "No ratings";

  if (!game) return <h2 style={{ color: "white" }}>Loading...</h2>;

  // REVIEW
  const handleReview = async () => {
    if (!comment.trim()) {
      alert("Write something first");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/games/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameId: game._id,
          comment,
        }),
      },
    );

    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg); // backend will block if not purchased
      return;
    }

    alert("Review submitted");
    setComment("");
  };

  const discount = Math.round(
    ((game.price - game.salePrice) / game.price) * 100,
  );

  return (
    <div className="details-container">
      {/* HERO */}
      <div className="hero-banner">
        <img src={game.image} alt={game.title} />
        <div className="overlay">
          <h1>{game.title}</h1>
        </div>
      </div>

      {/* CONTENT */}
      <div className="details-content">
        <div className="left">
          <img src={game.image} alt={game.title} className="details-image" />
        </div>

        <div className="details-info">
          <div className="price-box">
            <span className="discount">-{discount}%</span>
            <span className="original">₹{game.price}</span>
            <span className="sale">₹{game.salePrice}</span>
          </div>

          <button
            className="buy-btn"
            onClick={handleAddToCart}
            disabled={loadingCart}
          >
            {loadingCart ? "Adding..." : "🛒 Add to Cart"}
          </button>
        </div>
      </div>

      {/* DESCRIPTION */}
      <div className="description">
        <h2>About this game</h2>
        <p>{game.description}</p>
        <p>⭐ {avgRating} / 5</p>

        {/* RATING */}
        <div className="rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => handleRating(star)}
              style={{
                cursor: "pointer",
                color: star <= rating ? "gold" : "gray",
                fontSize: "24px",
              }}
            >
              ★
            </span>
          ))}
        </div>

        {/* REVIEW (always visible, backend controls access) */}
        <div className="review-box">
          <h3>Write a Review</h3>

          <textarea
            placeholder="Write your thoughts..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button onClick={handleReview}>Submit Review</button>
        </div>

        {/* REVIEW LIST */}
        <div className="reviews">
          <h3>Reviews</h3>

          {game.reviews?.length === 0 ? (
            <p>No reviews yet</p>
          ) : (
            game.reviews.map((r) => (
              <div key={r._id} className="review-item">
                <strong>{r.user?.email || "User"}</strong>
                <p>{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
