import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import HeroSlider from "./components/HeroSlider";
import SectionTitle from "./components/SectionTitle";
import GameList from "./components/GameList";
import { useEffect, useState } from "react";

import { Routes, Route, Navigate } from "react-router-dom";
import GameDetails from "./pages/GameDetails";
import Cart from "./pages/Cart";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import Success from "./pages/Success";
import AdminDashboard from "./pages/AdminDashboard";
import { jwtDecode } from "jwt-decode";

import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { showAddedToCartToast } from "./utils/showAddedToCartToast";
import Library from "./pages/Library";
import AdSenseSlot from "./components/AdSenseSlot";

function Home() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // ✅ ONLY clear toasts (no auth logic here)
  useEffect(() => {
    toast.dismiss();
  }, []);

  const addToCart = async (input) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    const gameId = typeof input === "object" ? input._id : input;
    const game = typeof input === "object" ? input : null;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gameId }),
      });

      if (!res.ok) {
        toast.error("Failed to add");
        return;
      }

      showAddedToCartToast(game);
    } catch (error) {
      console.error(error);
      toast.error("Server error");
    }
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/games`)
      .then((res) => res.json())
      .then((data) => {
        setGames(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <h2 style={{ color: "white" }}>Loading...</h2>;

  const filteredGames = search.trim()
    ? games.filter((g) =>
        g.title.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : games;

  return (
    <>
      <SearchBar value={search} onChange={setSearch} />
      <HeroSlider />
      <SectionTitle title="🔥 Featured Games" />

      <GameList games={filteredGames} addToCart={addToCart} />
    </>
  );
}

function App() {
  const leftTopSlot =
    import.meta.env.VITE_ADSENSE_LEFT_TOP_SLOT ||
    import.meta.env.VITE_ADSENSE_LEFT_SLOT;
  const leftBottomSlot =
    import.meta.env.VITE_ADSENSE_LEFT_BOTTOM_SLOT ||
    import.meta.env.VITE_ADSENSE_LEFT_SLOT;
  const rightTopSlot =
    import.meta.env.VITE_ADSENSE_RIGHT_TOP_SLOT ||
    import.meta.env.VITE_ADSENSE_RIGHT_SLOT;
  const rightBottomSlot =
    import.meta.env.VITE_ADSENSE_RIGHT_BOTTOM_SLOT ||
    import.meta.env.VITE_ADSENSE_RIGHT_SLOT;

  const user = (() => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      return jwtDecode(token);
    } catch {
      localStorage.removeItem("token");
      return null;
    }
  })();

  return (
    <div className="app-layout">
      <aside
        className="side-ads side-ads-left"
        aria-label="Left advertisement rail"
      >
        <div className="side-ads-stack">
          <div className="side-ads-card">
            <AdSenseSlot
              slot={leftTopSlot}
              format="vertical"
              responsive={false}
              adClassName="side-adsense-ins"
              fallbackClassName="adsense-fallback adsense-fallback-side"
            />
          </div>
          <div className="side-ads-card">
            <AdSenseSlot
              slot={leftBottomSlot}
              format="vertical"
              responsive={false}
              adClassName="side-adsense-ins"
              fallbackClassName="adsense-fallback adsense-fallback-side"
            />
          </div>
        </div>
      </aside>

      <div className="app-center">
        <Navbar />
        <Toaster
          position="top-center"
          containerStyle={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            position: "fixed",
            pointerEvents: "none",
          }}
        />

        <main className="app-content">
          <div
            className="mobile-ads mobile-ads-top"
            aria-label="Top mobile advertisement"
          >
            <AdSenseSlot
              slot={import.meta.env.VITE_ADSENSE_MOBILE_TOP_SLOT}
              format="auto"
              responsive={true}
              adClassName="mobile-adsense-ins"
              fallbackClassName="adsense-fallback adsense-fallback-compact"
            />
          </div>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game/:id" element={<GameDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/success" element={<Success />} />
            <Route path="/library" element={<Library />} />
            <Route
              path="/admin"
              element={
                user?.role === "admin" ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>

          <div
            className="mobile-ads mobile-ads-bottom"
            aria-label="Bottom mobile advertisement"
          >
            <AdSenseSlot
              slot={import.meta.env.VITE_ADSENSE_MOBILE_BOTTOM_SLOT}
              format="auto"
              responsive={true}
              adClassName="mobile-adsense-ins"
              fallbackClassName="adsense-fallback adsense-fallback-compact"
            />
          </div>
        </main>
      </div>

      <aside
        className="side-ads side-ads-right"
        aria-label="Right advertisement rail"
      >
        <div className="side-ads-stack">
          <div className="side-ads-card">
            <AdSenseSlot
              slot={rightTopSlot}
              format="vertical"
              responsive={false}
              adClassName="side-adsense-ins"
              fallbackClassName="adsense-fallback adsense-fallback-side"
            />
          </div>
          <div className="side-ads-card">
            <AdSenseSlot
              slot={rightBottomSlot}
              format="vertical"
              responsive={false}
              adClassName="side-adsense-ins"
              fallbackClassName="adsense-fallback adsense-fallback-side"
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;
