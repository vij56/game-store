import toast from "react-hot-toast";

export function showAddedToCartToast(game, options = {}) {
  const { showContinueShopping = false, showGoToCart = true } = options;
  const hasActions = showContinueShopping || showGoToCart;
  const toastDuration = hasActions ? 6000 : 1400;

  toast.dismiss();

  const toastId = toast.custom(
    (t) => {
      const continueShopping = () => {
        toast.dismiss(t.id);
      };

      const goCart = () => {
        toast.dismiss(t.id);
        window.location.href = "/cart";
      };

      return (
        <div className="toast-backdrop">
          <div
            className={`toast-modal${hasActions ? "" : " toast-modal--compact"}`}
          >
            {!hasActions && <div className="toast-success-icon">✓</div>}
            {game?.image && <img src={game.image} alt={game.title} />}

            <h2>{game?.title || "Item added"}</h2>
            <p>
              {hasActions
                ? "Choose what you want to do next."
                : "Added to cart successfully."}
            </p>

            {hasActions && (
              <div className="toast-actions">
                {showContinueShopping && (
                  <button onClick={continueShopping}>Continue Shopping</button>
                )}
                {showGoToCart && <button onClick={goCart}>Go to Cart</button>}
              </div>
            )}
          </div>
        </div>
      );
    },
    {
      duration: toastDuration,
      position: "top-left",
      style: {
        position: "fixed",
        inset: 0,
        transform: "none",
        background: "transparent",
        boxShadow: "none",
        padding: 0,
        margin: 0,
        maxWidth: "100vw",
        width: "100vw",
        height: "100vh",
      },
    },
  );

  // Fallback close to guarantee removal for custom full-screen toasts.
  setTimeout(() => toast.dismiss(toastId), toastDuration);
  setTimeout(() => toast.remove(toastId), toastDuration + 1200);
}
