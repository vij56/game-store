import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { jwtDecode } from "jwt-decode";
import GameCard from "../components/GameCard";
import { buildInvoicePdf } from "../utils/invoicePdf";
import "./Library.css";

export default function Library() {
  const [games, setGames] = useState([]);
  const [reviewsByGame, setReviewsByGame] = useState({});
  const [editorByGame, setEditorByGame] = useState({});
  const [savingByGame, setSavingByGame] = useState({});
  const [downloadingInvoiceByGame, setDownloadingInvoiceByGame] = useState({});
  const instructionsDownloadUrl = `${import.meta.env.VITE_API_URL}/api/instructions/download`;

  const token = localStorage.getItem("token");
  const currentUser = useMemo(() => {
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  }, [token]);

  const isOwnReview = (review) => {
    if (!currentUser) return false;
    return review.user?._id === currentUser.id;
  };

  const fetchGameReviews = async (gameId) => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/games/${gameId}`,
      );
      if (!res.ok) return;
      const gameData = await res.json();
      setReviewsByGame((prev) => ({
        ...prev,
        [gameId]: gameData.reviews || [],
      }));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const loadLibrary = async () => {
      if (!token) {
        setGames([]);
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/orders/owned`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await res.json();
        const ownedGames = data || [];
        setGames(ownedGames);

        await Promise.all(ownedGames.map((game) => fetchGameReviews(game._id)));
      } catch (error) {
        console.error(error);
      }
    };

    loadLibrary();
  }, [token]);

  const openAddReview = (gameId) => {
    setEditorByGame((prev) => ({
      ...prev,
      [gameId]: {
        mode: "add",
        reviewId: null,
        rating: 5,
        comment: "",
      },
    }));
  };

  const openEditReview = (gameId, review) => {
    setEditorByGame((prev) => ({
      ...prev,
      [gameId]: {
        mode: "edit",
        reviewId: review._id,
        rating: Number(review.rating) || 5,
        comment: review.comment || "",
      },
    }));
  };

  const closeEditor = (gameId) => {
    setEditorByGame((prev) => {
      const next = { ...prev };
      delete next[gameId];
      return next;
    });
  };

  const onEditorChange = (gameId, patch) => {
    setEditorByGame((prev) => ({
      ...prev,
      [gameId]: {
        ...prev[gameId],
        ...patch,
      },
    }));
  };

  const submitReview = async (gameId) => {
    const editor = editorByGame[gameId];
    if (!editor) return;

    const comment = editor.comment.trim();
    if (!comment) {
      toast.error("Please write a review");
      return;
    }

    setSavingByGame((prev) => ({ ...prev, [gameId]: true }));
    try {
      const isEdit = editor.mode === "edit";
      const endpoint = isEdit
        ? `${import.meta.env.VITE_API_URL}/api/games/review/update`
        : `${import.meta.env.VITE_API_URL}/api/games/review`;

      const payload = isEdit
        ? {
            reviewId: editor.reviewId,
            rating: Number(editor.rating),
            comment,
          }
        : {
            gameId,
            rating: Number(editor.rating),
            comment,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.msg || "Failed to save review");
        return;
      }

      toast.success(isEdit ? "Review updated" : "Review added");
      await fetchGameReviews(gameId);
      closeEditor(gameId);
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    } finally {
      setSavingByGame((prev) => ({ ...prev, [gameId]: false }));
    }
  };

  const downloadInvoiceForGame = async (game) => {
    const gameId = game?._id;
    const invoiceMeta = game?.latestInvoice;

    if (!gameId || !invoiceMeta?.orderId || !invoiceMeta?.signature) {
      toast.error("Invoice is not available for this purchase");
      return;
    }

    if (downloadingInvoiceByGame[gameId]) return;

    setDownloadingInvoiceByGame((prev) => ({ ...prev, [gameId]: true }));

    try {
      const invoiceUrl =
        invoiceMeta.invoiceUrl ||
        `${window.location.origin}/invoice/${invoiceMeta.orderId}/${invoiceMeta.signature}`;

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/orders/invoice/public/${invoiceMeta.orderId}?sig=${invoiceMeta.signature}`,
      );
      const data = await res.json();

      if (!res.ok || !data?.order) {
        toast.error(data?.msg || "Unable to load invoice");
        return;
      }

      const qrDataUrl = await QRCode.toDataURL(invoiceUrl, {
        margin: 1,
        width: 160,
        errorCorrectionLevel: "M",
      });

      const { doc, invoiceNumber } = buildInvoicePdf({
        order: data.order,
        qrDataUrl,
        invoiceUrl,
      });

      doc.save(`Invoice-${game.title}-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("Unable to download invoice");
    } finally {
      setDownloadingInvoiceByGame((prev) => ({ ...prev, [gameId]: false }));
    }
  };

  return (
    <div className="library-page">
      <div className="library-header">
        <h1 className="library-modern-title">Your Library 🎮</h1>
        <p className="library-subtitle library-modern-subtitle">
          All purchased titles in one place. Jump in anytime and continue your
          progress.
        </p>
        {games.length > 0 && (
          <a
            className="library-instructions-link"
            href={instructionsDownloadUrl}
          >
            Download Instructions PDF
          </a>
        )}
      </div>

      {games.length === 0 ? (
        <div className="library-empty">
          <p>No games in your library yet.</p>
        </div>
      ) : (
        <div className="library-grid">
          {games.map((game) => (
            <div key={game._id} className="library-card-shell">
              <GameCard game={game} mode="library" />

              <div className="library-review-box">
                {(() => {
                  const gameReviews = reviewsByGame[game._id] || [];
                  const ownReview = gameReviews.find((review) =>
                    isOwnReview(review),
                  );
                  const totalReviews = gameReviews.length;
                  const averageRating = totalReviews
                    ? (
                        gameReviews.reduce(
                          (sum, review) => sum + (Number(review.rating) || 0),
                          0,
                        ) / totalReviews
                      ).toFixed(1)
                    : null;

                  const editor = editorByGame[game._id];
                  const isSaving = !!savingByGame[game._id];
                  const isDownloadingInvoice =
                    !!downloadingInvoiceByGame[game._id];

                  return (
                    <>
                      <div className="library-utility-actions">
                        <button
                          className="library-review-btn secondary"
                          onClick={() => downloadInvoiceForGame(game)}
                          disabled={isDownloadingInvoice}
                        >
                          {isDownloadingInvoice
                            ? "Preparing Invoice..."
                            : "Download Invoice PDF"}
                        </button>
                      </div>

                      <div className="library-review-head">
                        <div>
                          <p className="library-review-label">REVIEWS</p>
                        </div>

                        {totalReviews > 0 ? (
                          <div className="library-review-score">
                            <span>★ {averageRating}</span>
                          </div>
                        ) : (
                          <div className="library-review-score empty">
                            <span>New</span>
                          </div>
                        )}
                      </div>

                      {!editor ? (
                        <>
                          <div className="library-review-actions">
                            {!ownReview ? (
                              <button
                                className="library-review-btn primary"
                                onClick={() => openAddReview(game._id)}
                              >
                                Add Review
                              </button>
                            ) : (
                              <button
                                className="library-review-btn primary"
                                onClick={() =>
                                  openEditReview(game._id, ownReview)
                                }
                              >
                                Update Review
                              </button>
                            )}
                          </div>

                          {ownReview && (
                            <div className="library-own-review-preview">
                              <div className="library-own-review-stars">
                                {"★".repeat(Number(ownReview.rating) || 0)}
                                {"☆".repeat(
                                  5 - (Number(ownReview.rating) || 0),
                                )}
                              </div>
                              <p className="library-own-review-text">
                                {ownReview.comment}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="library-review-editor">
                          <label className="library-rating-field">
                            Select Rating
                            <select
                              value={editor.rating}
                              onChange={(event) =>
                                onEditorChange(game._id, {
                                  rating: Number(event.target.value),
                                })
                              }
                            >
                              <option value={5}>5 Stars</option>
                              <option value={4}>4 Stars</option>
                              <option value={3}>3 Stars</option>
                              <option value={2}>2 Stars</option>
                              <option value={1}>1 Star</option>
                            </select>
                          </label>

                          <label>
                            Write Review
                            <textarea
                              rows={4}
                              placeholder={`Share your thoughts on ${game.title}`}
                              value={editor.comment}
                              onChange={(event) =>
                                onEditorChange(game._id, {
                                  comment: event.target.value,
                                })
                              }
                            />
                          </label>

                          <div className="library-review-editor-actions">
                            <button
                              className="library-review-btn primary"
                              onClick={() => submitReview(game._id)}
                              disabled={isSaving}
                            >
                              {isSaving
                                ? "Saving..."
                                : editor.mode === "edit"
                                  ? "Update Review"
                                  : "Add Review"}
                            </button>

                            <button
                              className="library-review-btn secondary"
                              onClick={() => closeEditor(game._id)}
                              disabled={isSaving}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
