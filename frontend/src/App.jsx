import Navbar from "./components/Navbar";
import SearchBar from "./components/SearchBar";
import HeroSlider from "./components/HeroSlider";
import SectionTitle from "./components/SectionTitle";
import GameList from "./components/GameList";
import { useEffect, useState } from "react";

import { Routes, Route } from "react-router-dom";
import GameDetails from "./pages/GameDetails";
import Cart from "./pages/Cart";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import Success from "./pages/Success";

function Home() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/games`)
      .then((res) => res.json())
      .then((data) => {
        setGames(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false); // ✅ important
      });
  }, []);

  if (loading) return <h2 style={{ color: "white" }}>Loading...</h2>;

  return (
    <>
      <SearchBar />
      <HeroSlider />
      <SectionTitle title="🔥 Featured Games" />
      <GameList games={games} />
    </>
  );
}

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game/:id" element={<GameDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
      </Routes>
    </>
  );
}

export default App;
