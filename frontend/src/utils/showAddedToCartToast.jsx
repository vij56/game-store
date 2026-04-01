import toast from "react-hot-toast";

export function showAddedToCartToast(game) {
  toast.dismiss();

  const id = toast.custom(
    (t) => (
      <div className="toast-backdrop">
        <div className="toast-modal">
          {game?.image && <img src={game.image} alt={game.title} />}

          <h2>{game?.title ? `${game.title} added` : "Added to cart"}</h2>
          <p>Added to cart successfully 🛒</p>

          <div className="toast-actions">
            <button onClick={() => toast.dismiss(t.id)}>Added to Cart</button>
          </div>
        </div>
      </div>
    ),
    {
      duration: 1000,
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

  setTimeout(() => toast.dismiss(id), 1000);
}
