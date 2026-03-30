import "./GameCard.css";
import { useNavigate } from "react-router-dom";

export default function GameCard({ game }) {
  const navigate = useNavigate();

  return (
    <div className="game-card" onClick={() => navigate(`/game/${game._id}`)}>
      <img src={game.image} alt={game.title} />

      <h3>{game.title}</h3>

      <div className="price">
        <span className="old">₹{game.price}</span>
        <span className="sale">₹{game.salePrice}</span>
      </div>
    </div>
  );
}
