import { useEffect, useState } from "react";
import "./HeroSlider.css";

const images = [
  "https://wallpapercave.com/wp/wp14665652.png",
  "https://wallpapercave.com/wp/wp14821485.webp",
  "https://wallpapercave.com/wp/wp15000222.webp",
  "https://wallpapercave.com/wp/wp15000204.webp",
  "https://wallpapercave.com/wp/wp14841071.webp",
  "https://wallpapercave.com/wp/wp15000231.webp",
];

export default function HeroSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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

      <div className="overlay">
        <h1 className="hero-title">Discover Amazing Games 🎮</h1>

        <p className="hero-subtitle">
          Explore top trending and best-selling games
        </p>
      </div>
    </div>
  );
}
