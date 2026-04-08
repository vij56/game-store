import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./GameDetails.css";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import { showAddedToCartToast } from "../utils/showAddedToCartToast";

export default function GameDetails() {
  const { id } = useParams();

  const [game, setGame] = useState(null);
  const [ownedGameIds, setOwnedGameIds] = useState([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  // edit state
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 5, comment: "" });
  const [isEditingReview, setIsEditingReview] = useState(false);

  const token = localStorage.getItem("token");
  const currentUser = (() => {
    if (!token) return null;

    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  })();

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

  useEffect(() => {
    if (!token) {
      setOwnedGameIds([]);
      return;
    }

    const fetchOwnedGames = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/orders/owned`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) {
          return;
        }

        const data = await res.json();
        setOwnedGameIds((data || []).map((ownedGame) => ownedGame._id));
      } catch (err) {
        console.error(err);
      }
    };

    fetchOwnedGames();
  }, [token]);

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

      showAddedToCartToast(game, {
        showContinueShopping: false,
        showGoToCart: true,
      });
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    }
  };

  const realReviews = game?.reviews || [];
  const currentUserReview =
    realReviews.find((r) => currentUser && r.user?._id === currentUser.id) ||
    null;
  const displayReviews = realReviews.map((review, index) => ({
    id: review._id || `review-${index}`,
    rawId: review._id,
    author: review.user?.username || review.user?.email || "Anonymous",
    rating: review.rating,
    comment: review.comment,
    isOwn: !!(
      currentUserReview &&
      review._id &&
      review._id === currentUserReview._id
    ),
  }));
  const totalReviews = displayReviews.length;
  const averageReviewRating = totalReviews
    ? (
        displayReviews.reduce(
          (sum, review) => sum + (Number(review.rating) || 0),
          0,
        ) / totalReviews
      ).toFixed(1)
    : null;

  if (!game) {
    return (
      <section className="game-details-page">
        <div className="gd-loading">Loading game details...</div>
      </section>
    );
  }

  const discountPercent =
    game.price && game.salePrice
      ? Math.max(
          0,
          Math.round(((game.price - game.salePrice) / game.price) * 100),
        )
      : 0;
  const ownsGame = ownedGameIds.includes(game._id);
  const hasCurrentUserReview = !!currentUserReview;

  const startEdit = (review) => {
    setEditingReviewId(review.id);
    setEditForm({ rating: review.rating, comment: review.comment });
  };

  const cancelEdit = () => {
    setEditingReviewId(null);
    setEditForm({ rating: 5, comment: "" });
  };

  const submitEditReview = async (event) => {
    event.preventDefault();
    const trimmed = editForm.comment.trim();
    if (!trimmed) {
      toast.error("Review cannot be empty");
      return;
    }
    setIsEditingReview(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/games/review/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            reviewId: editingReviewId,
            rating: Number(editForm.rating),
            comment: trimmed,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.msg || "Failed to update");
        return;
      }
      toast.success("Review updated");
      cancelEdit();
      fetchGame();
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setIsEditingReview(false);
    }
  };

  const submitReview = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error("Please login to write a review");
      return;
    }

    if (!ownsGame) {
      toast.error("Purchase this game before reviewing it");
      return;
    }

    const trimmedComment = reviewForm.comment.trim();
    if (!trimmedComment) {
      toast.error("Write a short review first");
      return;
    }

    setIsSubmittingReview(true);

    try {
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
            rating: Number(reviewForm.rating),
            comment: trimmedComment,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.msg || "Failed to submit review");
        return;
      }

      setReviewForm({ rating: 5, comment: "" });
      toast.success("Review submitted");
      fetchGame();
    } catch (err) {
      console.error(err);
      toast.error("Server error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
            Jump into a premium gaming experience with cinematic visuals and
            fast-paced gameplay.
          </p>

          <div className="gd-price-box">
            <span className="gd-old">₹{game.price}</span>
            <span className="gd-sale">₹{game.salePrice}</span>
            {discountPercent > 0 && (
              <span className="gd-pill">{discountPercent}% OFF</span>
            )}
          </div>

          <div className="gd-actions">
            {/* Add to Cart button hidden as per requirements */}
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
          <div className="gd-reviews-head">
            {totalReviews > 0 && (
              <div className="gd-reviews-summary">
                <div className="gd-reviews-score-card">
                  <span className="gd-reviews-score-star">★</span>
                  <div className="gd-reviews-score-copy">
                    <span className="gd-reviews-stars">
                      {averageReviewRating}
                    </span>
                    <span className="gd-reviews-label">Average rating</span>
                  </div>
                </div>

                <span className="gd-reviews-count">
                  {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                </span>
              </div>
            )}
          </div>

          <div className="gd-review-form-wrap">
            {token ? (
              ownsGame ? (
                hasCurrentUserReview ? null : (
                  <form className="gd-review-form" onSubmit={submitReview}>
                    <div className="gd-review-form-head">
                      <div>
                        <h4 className="gd-review-form-title">Write a Review</h4>
                        <p className="gd-review-note">
                          Share your experience with other players.
                        </p>
                      </div>

                      <label className="gd-review-rating-field">
                        <span>Select Rating</span>
                        <select
                          value={reviewForm.rating}
                          onChange={(event) =>
                            setReviewForm((currentForm) => ({
                              ...currentForm,
                              rating: Number(event.target.value),
                            }))
                          }
                        >
                          <option value={5}>5 Stars</option>
                          <option value={4}>4 Stars</option>
                          <option value={3}>3 Stars</option>
                          <option value={2}>2 Stars</option>
                          <option value={1}>1 Star</option>
                        </select>
                      </label>
                    </div>

                    <textarea
                      className="gd-review-textarea"
                      rows={4}
                      placeholder={`What stood out to you in ${game.title}?`}
                      value={reviewForm.comment}
                      onChange={(event) =>
                        setReviewForm((currentForm) => ({
                          ...currentForm,
                          comment: event.target.value,
                        }))
                      }
                    />

                    <button
                      type="submit"
                      className="btn gd-review-submit"
                      disabled={isSubmittingReview}
                    >
                      {isSubmittingReview ? "Submitting..." : "Post Review"}
                    </button>
                  </form>
                )
              ) : null
            ) : (
              <p className="gd-review-note">
                Login to write a review after purchasing this game.
              </p>
            )}
          </div>

          {displayReviews.length > 0 ? (
            <div className="gd-reviews-list">
              {displayReviews.map((review) => (
                <div
                  key={review.id}
                  className={`gd-review-item${review.isOwn ? " gd-review-item--own" : ""}`}
                >
                  {editingReviewId === review.id ? (
                    /* ── inline edit form ── */
                    <form
                      className="gd-review-edit-form"
                      onSubmit={submitEditReview}
                    >
                      <div className="gd-review-edit-head">
                        <span className="gd-review-author">
                          {review.author}
                        </span>
                        <label className="gd-review-rating-field">
                          <span>Select Rating</span>
                          <select
                            value={editForm.rating}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                rating: Number(e.target.value),
                              }))
                            }
                          >
                            {[5, 4, 3, 2, 1].map((s) => (
                              <option key={s} value={s}>
                                {s} {s === 1 ? "Star" : "Stars"}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <textarea
                        className="gd-review-textarea"
                        rows={4}
                        value={editForm.comment}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            comment: e.target.value,
                          }))
                        }
                      />
                      <div className="gd-review-edit-actions">
                        <button
                          type="submit"
                          className="btn gd-review-submit"
                          disabled={isEditingReview}
                        >
                          {isEditingReview ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          className="gd-review-cancel-btn"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ── normal view ── */
                    <>
                      <div className="gd-review-header">
                        <span className="gd-review-author">
                          {review.author}
                        </span>
                        <div className="gd-review-meta">
                          <span className="gd-review-rating">
                            {review.rating ? `★ ${review.rating}` : "★"}
                          </span>
                          {review.isOwn && (
                            <div className="gd-review-own-actions">
                              <button
                                className="gd-review-action-btn gd-review-edit-btn"
                                onClick={() => startEdit(review)}
                                title="Update review"
                              >
                                Update Review
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="gd-review-comment">{review.comment}</p>
                    </>
                  )}
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
