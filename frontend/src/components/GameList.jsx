import GameCard from "./GameCard";
import "./GameList.css";

export default function GameList({ games }) {
  return (
    <div className="game-grid">
      {games.map((game) => (
        <GameCard key={game._id} game={game} />
      ))}
    </div>
  );
}
