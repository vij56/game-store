import GameCard from "./GameCard";
import "./GameList.css";

export default function GameList({ games, addToCart }) {
  if (!games?.length) {
    return <p style={{ color: "gray" }}>No games available</p>;
  }

  return (
    <div className="game-grid">
      {games.map((game) => (
        <GameCard
          key={game._id}
          game={game}
          onAddToCart={addToCart}
          titleTopPriceBottom={true}
        />
      ))}
    </div>
  );
}
