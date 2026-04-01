import { useEffect, useState } from "react";
import GameCard from "../components/GameCard";
import "./Library.css";

export default function Library() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    const loadLibrary = async () => {
      const token = localStorage.getItem("token");

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
        setGames(data || []);
      } catch (error) {
        console.error(error);
      }
    };

    loadLibrary();
  }, []);

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>Your Library 🎮</h1>
        <p className="library-subtitle">
          All purchased titles in one place. Jump in anytime and continue your
          progress.
        </p>
      </div>

      {games.length === 0 ? (
        <div className="library-empty">
          <p>No games in your library yet.</p>
        </div>
      ) : (
        <div className="cart-grid">
          {games.map((game) => (
            <GameCard key={game._id} game={game} mode="library" />
          ))}
        </div>
      )}
    </div>
  );
}
