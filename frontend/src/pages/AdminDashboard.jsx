import { useCallback, useEffect, useMemo, useState } from "react";
import { FaPlus, FaTrash, FaEdit, FaGamepad, FaStar } from "react-icons/fa";
import toast from "react-hot-toast";
import GameForm from "../components/GameForm";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserLibrary, setSelectedUserLibrary] = useState([]);
  const [editingGame, setEditingGame] = useState(null);
  const [gamePendingDelete, setGamePendingDelete] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [libraryUsersLoading, setLibraryUsersLoading] = useState(true);
  const [userLibraryLoading, setUserLibraryLoading] = useState(false);
  const [removingLibraryGameId, setRemovingLibraryGameId] = useState(null);

  // Review management
  const [reviewForm, setReviewForm] = useState({
    gameId: "",
    username: "",
    comment: "",
    rating: 5,
  });
  const [gameReviews, setGameReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchGames = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/games`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Unable to load games");
      const data = await res.json();
      setGames(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load admin games");
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/games/stats`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchLibraryUsers = useCallback(async () => {
    setLibraryUsersLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/games/library-users`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error("Unable to load users");
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLibraryUsersLoading(false);
    }
  }, [token]);

  const fetchSelectedUserLibrary = useCallback(
    async (userId) => {
      if (!userId) {
        setSelectedUserLibrary([]);
        return;
      }

      setUserLibraryLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/games/library-users/${userId}/library`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error("Unable to load library");
        const data = await res.json();
        setSelectedUserLibrary(data.games || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load user library");
      } finally {
        setUserLibraryLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchGames();
    fetchStats();
    fetchLibraryUsers();
  }, [fetchGames, fetchStats, fetchLibraryUsers]);

  useEffect(() => {
    fetchSelectedUserLibrary(selectedUserId);
  }, [fetchSelectedUserLibrary, selectedUserId]);

  const fetchGameReviews = useCallback(
    async (gameId) => {
      if (!gameId) {
        setGameReviews([]);
        return;
      }
      setReviewsLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/admin/games/reviews/${gameId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setGameReviews(data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load reviews");
      } finally {
        setReviewsLoading(false);
      }
    },
    [token],
  );

  const handleReviewGameChange = (gameId) => {
    setReviewForm((f) => ({ ...f, gameId }));
    setEditingReviewId(null);
    setReviewForm((f) => ({
      ...f,
      username: "",
      comment: "",
      rating: 5,
      gameId,
    }));
    fetchGameReviews(gameId);
  };

  const submitAdminReview = async (e) => {
    e.preventDefault();
    const isEdit = !!editingReviewId;
    if (!reviewForm.gameId) {
      toast.error("Select a game");
      return;
    }
    if (!isEdit && !reviewForm.username.trim()) {
      toast.error("Enter a username");
      return;
    }
    if (!reviewForm.comment.trim()) {
      toast.error("Write a review");
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch(
        isEdit
          ? `${import.meta.env.VITE_API_URL}/api/admin/games/reviews/${editingReviewId}`
          : `${import.meta.env.VITE_API_URL}/api/admin/games/reviews`,
        {
          method: isEdit ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(
            isEdit
              ? {
                  comment: reviewForm.comment,
                  rating: reviewForm.rating,
                }
              : reviewForm,
          ),
        },
      );
      if (!res.ok) throw new Error("Failed");
      toast.success(isEdit ? "Review updated" : "Review added");
      setEditingReviewId(null);
      setReviewForm((f) => ({ ...f, username: "", comment: "", rating: 5 }));
      fetchGameReviews(reviewForm.gameId);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const startEditReview = (review) => {
    setEditingReviewId(review._id);
    setReviewForm((f) => ({
      ...f,
      username:
        review.username ||
        review.userId?.username ||
        review.userId?.email ||
        "",
      comment: review.comment || "",
      rating: Number(review.rating) || 5,
    }));
  };

  const cancelEditReview = () => {
    setEditingReviewId(null);
    setReviewForm((f) => ({ ...f, username: "", comment: "", rating: 5 }));
  };

  const deleteGameReview = async (reviewId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/games/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) throw new Error("Failed");
      setGameReviews((prev) => prev.filter((r) => r._id !== reviewId));
      toast.success("Review deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete review");
    }
  };

  const deleteGame = async () => {
    if (!gamePendingDelete?._id) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/games/${gamePendingDelete._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      toast.success("Game deleted");
      setGamePendingDelete(null);
      fetchGames();
    } catch (err) {
      console.error(err);
      toast.error("Unable to delete game");
    }
  };

  const openDeleteConfirm = (game) => {
    setGamePendingDelete(game);
  };

  const removeGameFromLibrary = async (game) => {
    if (!selectedUserId || !game?._id) {
      toast.error("Select a user and game first");
      return;
    }

    setRemovingLibraryGameId(game._id);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/games/library-users/${selectedUserId}/library/${game._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Remove failed");

      setSelectedUserLibrary((prev) =>
        prev.filter((libraryGame) => libraryGame._id !== game._id),
      );
      toast.success(data.msg || "Game removed from library");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Unable to remove game from library");
    } finally {
      setRemovingLibraryGameId(null);
    }
  };

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return games;
    return games.filter(
      (game) =>
        (game.title || "").toLowerCase().includes(query) ||
        String(game.appId || "").includes(query),
    );
  }, [games, search]);

  return (
    <div className="admin-page">
      <div className="admin-stats-row">
        <div className="admin-stat-card">
          <span>Total games</span>
          <strong>{games.length}</strong>
        </div>
        <div className="admin-stat-card accent">
          <span>Total games sold</span>
          <strong>{stats ? stats.totalGamesSold : "—"}</strong>
        </div>
        <div className="admin-stat-card">
          <span>Total orders</span>
          <strong>{stats ? stats.totalOrders : "—"}</strong>
        </div>
        <div className="admin-stat-card accent">
          <span>Total revenue</span>
          <strong>
            {stats ? `₹${stats.totalRevenue.toLocaleString("en-IN")}` : "—"}
          </strong>
        </div>
        <div className="admin-stat-card">
          <span>Today's revenue</span>
          <strong>
            {stats ? `₹${stats.todayRevenue.toLocaleString("en-IN")}` : "—"}
          </strong>
        </div>
        <div className="admin-stat-card">
          <span>Today's orders</span>
          <strong>{stats ? stats.todayOrders : "—"}</strong>
        </div>
      </div>

      <header className="admin-header">
        <div>
          <p className="admin-label">ADMIN PANEL</p>
          <h1 className="admin-modern-title">Game management</h1>
          <p className="admin-subtitle admin-modern-subtitle">
            Add, edit, and remove games with one smooth admin interface.
          </p>
        </div>

        <button className="admin-add-button" onClick={() => setEditingGame({})}>
          <FaPlus /> Add New Game
        </button>
      </header>

      {stats?.dailyRevenue && (
        <div className="admin-revenue-section">
          <p className="admin-label">REVENUE — LAST 7 DAYS</p>
          <div className="revenue-chart">
            {(() => {
              const max = Math.max(
                ...stats.dailyRevenue.map((d) => d.revenue),
                1,
              );
              return stats.dailyRevenue.map((d, i) => (
                <div key={i} className="revenue-bar-col">
                  <span className="revenue-value">
                    {d.revenue > 0
                      ? `₹${d.revenue.toLocaleString("en-IN")}`
                      : ""}
                  </span>
                  <div
                    className="revenue-bar"
                    style={{
                      height: `${Math.max((d.revenue / max) * 140, d.revenue > 0 ? 8 : 2)}px`,
                    }}
                  />
                  <span className="revenue-label">{d.label}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      <div className="admin-tools">
        <div className="search-box">
          <FaGamepad />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or App ID"
          />
        </div>
      </div>

      <section className="admin-library-tools">
        <div className="admin-library-header">
          <div>
            <p className="admin-label">USER LIBRARY MANAGEMENT</p>
            <h2 className="admin-section-title">
              Remove a game from a user's library
            </h2>
            <p className="admin-subtitle admin-section-subtitle">
              Select a player, review their current library, and revoke access
              to any game without deleting order history.
            </p>
          </div>
        </div>

        <div className="admin-library-controls">
          <label className="admin-library-field">
            User
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={libraryUsersLoading}
            >
              <option value="">— Select a user —</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.username} ({user.email})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="admin-library-grid">
          {!selectedUserId ? (
            <div className="admin-library-empty">
              Select a user to view their library.
            </div>
          ) : userLibraryLoading ? (
            <div className="admin-library-empty">Loading user library...</div>
          ) : selectedUserLibrary.length === 0 ? (
            <div className="admin-library-empty">
              This user has no active games in their library.
            </div>
          ) : (
            selectedUserLibrary.map((game) => (
              <article key={game._id} className="admin-library-card">
                <img src={game.image} alt={game.title} />
                <div className="admin-library-card-body">
                  <h3>{game.title}</h3>
                  <p>
                    Purchases: {game.purchaseCount}
                    {game.lastPurchasedAt
                      ? ` • Last purchase ${new Date(game.lastPurchasedAt).toLocaleDateString("en-IN")}`
                      : ""}
                  </p>
                  <button
                    className="action-btn delete"
                    onClick={() => removeGameFromLibrary(game)}
                    disabled={removingLibraryGameId === game._id}
                  >
                    <FaTrash />
                    {removingLibraryGameId === game._id
                      ? "Removing..."
                      : "Remove From Library"}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {/* ── REVIEW MANAGEMENT ─────────────────────────────────────────────── */}
      <section className="admin-review-section">
        <div className="admin-review-section-header">
          <div>
            <p className="admin-label">REVIEW MANAGEMENT</p>
            <h2 className="admin-section-title">Add &amp; Manage Reviews</h2>
            <p className="admin-subtitle admin-section-subtitle">
              Post reviews on behalf of players for any game in your catalogue.
            </p>
          </div>
          <FaStar className="admin-review-section-icon" />
        </div>

        <div className="admin-review-layout">
          {/* Form */}
          <div className="admin-review-form-card">
            <form onSubmit={submitAdminReview} className="admin-review-form">
              <label className="ar-label">
                Game
                <select
                  className="ar-select"
                  value={reviewForm.gameId}
                  disabled={!!editingReviewId}
                  onChange={(e) => handleReviewGameChange(e.target.value)}
                >
                  <option value="">— Select a game —</option>
                  {games.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="ar-label">
                Username
                <input
                  className="ar-input"
                  type="text"
                  placeholder="e.g. Arjun_99"
                  value={reviewForm.username}
                  disabled={!!editingReviewId}
                  onChange={(e) =>
                    setReviewForm((f) => ({ ...f, username: e.target.value }))
                  }
                />
              </label>

              <div className="ar-label">
                Star Rating
                <div className="ar-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`ar-star${star <= reviewForm.rating ? " ar-star--on" : ""}`}
                      onClick={() =>
                        setReviewForm((f) => ({ ...f, rating: star }))
                      }
                      aria-label={`${star} star`}
                    >
                      ★
                    </button>
                  ))}
                  <span className="ar-star-label">{reviewForm.rating} / 5</span>
                </div>
              </div>

              <label className="ar-label">
                Review Text
                <textarea
                  className="ar-textarea"
                  rows={5}
                  placeholder="Write a detailed or short review here..."
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm((f) => ({ ...f, comment: e.target.value }))
                  }
                />
              </label>

              <button
                type="submit"
                className="ar-submit"
                disabled={submittingReview}
              >
                {submittingReview
                  ? editingReviewId
                    ? "Updating..."
                    : "Posting..."
                  : editingReviewId
                    ? "Update Review"
                    : "Post Review"}
              </button>
              {editingReviewId && (
                <button
                  type="button"
                  className="ar-cancel-edit"
                  onClick={cancelEditReview}
                  disabled={submittingReview}
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          {/* Review list for selected game */}
          <div className="admin-review-list-card">
            {!reviewForm.gameId ? (
              <p className="ar-empty">Select a game to see its reviews.</p>
            ) : reviewsLoading ? (
              <p className="ar-empty">Loading reviews...</p>
            ) : gameReviews.length === 0 ? (
              <p className="ar-empty">No reviews yet for this game.</p>
            ) : (
              <ul className="ar-list">
                {gameReviews.map((review) => (
                  <li key={review._id} className="ar-item">
                    <div className="ar-item-head">
                      <span className="ar-item-author">
                        {review.username ||
                          review.userId?.username ||
                          review.userId?.email ||
                          "Anonymous"}
                      </span>
                      <div className="ar-item-right">
                        <span className="ar-item-rating">
                          {"★".repeat(review.rating)}
                          {"☆".repeat(5 - review.rating)}
                        </span>
                        <button
                          className="ar-edit-btn"
                          onClick={() => startEditReview(review)}
                          aria-label="Edit review"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="ar-delete-btn"
                          onClick={() => deleteGameReview(review._id)}
                          aria-label="Delete review"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    <p className="ar-item-comment">{review.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="admin-grid">
        {loading ? (
          <div className="admin-loading">Loading games...</div>
        ) : filteredGames.length === 0 ? (
          <div className="admin-empty">No games found.</div>
        ) : (
          filteredGames.map((game) => (
            <div key={game._id} className="admin-card">
              <img src={game.image} alt={game.title} />
              <div className="card-content">
                <div className="card-title-row">
                  <h2>{game.title}</h2>
                  <span className="price-tag">
                    ₹{game.salePrice || game.price}
                  </span>
                </div>
                <p>{game.description?.slice(0, 110)}...</p>
                <div className="card-footer">
                  <span className="price-line">List: ₹{game.price}</span>
                  <div className="card-actions">
                    <button
                      className="action-btn edit"
                      onClick={() => setEditingGame(game)}
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => openDeleteConfirm(game)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      {editingGame !== null && (
        <GameForm
          game={editingGame}
          onClose={() => {
            setEditingGame(null);
            fetchGames();
          }}
        />
      )}

      {gamePendingDelete && (
        <div className="toast-backdrop" role="dialog" aria-modal="true">
          <div className="toast-modal">
            <p className="admin-label">CONFIRM DELETE</p>
            <h2>Delete this game?</h2>
            <p>"{gamePendingDelete.title}" will be permanently removed.</p>

            <div className="toast-actions">
              <button className="confirm-ok" onClick={deleteGame}>
                OK
              </button>
              <button
                className="confirm-cancel"
                onClick={() => setGamePendingDelete(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
