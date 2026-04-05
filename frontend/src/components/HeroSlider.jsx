import { useEffect, useState } from "react";
import "./HeroSlider.css";

export default function HeroSlider({ games = [] }) {
  const [index, setIndex] = useState(0);
  const images = games
    .map((game) => game?.image)
    .filter((image) => typeof image === "string" && image.trim().length > 0)
    .slice(0, 8);

  useEffect(() => {
    if (images.length <= 1) {
      setIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="slider">
        <div className="hero-overlay">
          <h1 className="hero-banner-title">Discover Amazing Games 🎮</h1>
          <p className="hero-banner-subtitle">
            Explore top trending and best-selling games
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="slider">
      <div
        className="slider-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((img, i) => (
          <img key={i} src={img} alt="banner" />
        ))}
      </div>

      <div className="hero-overlay">
        <h1 className="hero-banner-title">Discover Amazing Games 🎮</h1>

        <p className="hero-banner-subtitle">
          Explore top trending and best-selling games
        </p>
      </div>
    </div>
  );
}
