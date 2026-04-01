import { useCallback, useEffect, useMemo, useState } from "react";
import { FaPlus, FaTrash, FaEdit, FaGamepad } from "react-icons/fa";
import toast from "react-hot-toast";
import GameForm from "../components/GameForm";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [games, setGames] = useState([]);
  const [editingGame, setEditingGame] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

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

  useEffect(() => {
    fetchGames();
    fetchStats();
  }, [fetchGames, fetchStats]);

  const deleteGame = async (id) => {
    const confirmed = window.confirm("Delete this game permanently?");
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/games/${id}`,
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
      fetchGames();
    } catch (err) {
      console.error(err);
      toast.error("Unable to delete game");
    }
  };

  const filteredGames = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return games;
    return games.filter(
      (game) =>
        game.title.toLowerCase().includes(query) ||
        game.description.toLowerCase().includes(query),
    );
  }, [games, search]);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-label">ADMIN PANEL</p>
          <h1>Game management</h1>
          <p className="admin-subtitle">
            Add, edit, and remove games with one smooth admin interface.
          </p>
        </div>

        <button className="admin-add-button" onClick={() => setEditingGame({})}>
          <FaPlus /> Add New Game
        </button>
      </header>

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
            placeholder="Search game by title"
          />
        </div>
      </div>

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
                      onClick={() => deleteGame(game._id)}
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
    </div>
  );
};

export default AdminDashboard;
