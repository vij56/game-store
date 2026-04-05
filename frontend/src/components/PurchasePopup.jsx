import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./PurchasePopup.css";

const NAMES = [
  "Anand Gupta",
  "Riya Sharma",
  "Mohammed Ali",
  "Priya Patel",
  "Carlos Mendez",
  "Aisha Khan",
  "Rohan Verma",
  "Emily Chen",
  "Sanjay Nair",
  "Sofia Rossi",
  "Arjun Mehta",
  "Natasha Lee",
  "Dev Malhotra",
  "Maria Santos",
  "Vikram Singh",
  "Jordan Brooks",
  "Neha Kapoor",
  "Lucas Kim",
  "Tarun Joshi",
  "Zara Ahmed",
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getHomePageGameTitles() {
  return [...document.querySelectorAll(".game-grid .game-title")]
    .map((node) => node.textContent?.trim())
    .filter(Boolean);
}

function areSameTitles(currentTitles, nextTitles) {
  return (
    currentTitles.length === nextTitles.length &&
    currentTitles.every((title, index) => title === nextTitles[index])
  );
}

function generateNotification(names, games) {
  if (!names.length || !games.length) return null;
  return {
    name: randomFrom(names),
    game: randomFrom(games),
    time: `${Math.floor(Math.random() * 55) + 1}s ago`,
  };
}

export default function PurchasePopup() {
  const location = useLocation();
  const [games, setGames] = useState([]);
  const [notification, setNotification] = useState(null);
  const [visible, setVisible] = useState(false);
  const gamesRef = useRef([]);

  const hidden = ["/login", "/register", "/checkout"].includes(
    location.pathname,
  );

  // Read titles from homepage cards when available; fall back to API otherwise.
  useEffect(() => {
    const syncFromHomePageCards = () => {
      const titles = [...new Set(getHomePageGameTitles())];
      if (titles.length) {
        setGames((currentTitles) => {
          if (areSameTitles(currentTitles, titles)) {
            return currentTitles;
          }
          gamesRef.current = titles;
          return titles;
        });
        return true;
      }
      return false;
    };

    if (location.pathname === "/" && syncFromHomePageCards()) {
      const observer = new MutationObserver(() => {
        syncFromHomePageCards();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
      });

      return () => observer.disconnect();
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/games`)
      .then((r) => r.json())
      .then((data) => {
        const titles = data.map((g) => g.title);
        setGames(titles);
        gamesRef.current = titles;
      })
      .catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    gamesRef.current = games;
  }, [games]);

  useEffect(() => {
    if (notification || !games.length) return;

    // Show first notification after a short delay
    const initial = setTimeout(() => {
      const n = generateNotification(NAMES, gamesRef.current);
      if (n) {
        setNotification(n);
        setVisible(true);
      }
    }, 1500);
    return () => clearTimeout(initial);
  }, [games, notification]);

  useEffect(() => {
    if (!notification) return;

    const interval = setInterval(() => {
      // Fade out, swap content, fade back in
      setVisible(false);
      setTimeout(() => {
        const n = generateNotification(NAMES, gamesRef.current);
        if (n) {
          setNotification(n);
          setVisible(true);
        }
      }, 350);
    }, 5000);

    return () => clearInterval(interval);
  }, [notification]);

  if (!notification || hidden) return null;

  return (
    <div
      className={`purchase-popup ${visible ? "purchase-popup--show" : "purchase-popup--hide"}`}
    >
      <div className="purchase-popup__icon">🎮</div>
      <div className="purchase-popup__body">
        <p className="purchase-popup__name">{notification.name}</p>
        <p className="purchase-popup__msg">
          just purchased{" "}
          <span className="purchase-popup__game">{notification.game}</span>
        </p>
        <p className="purchase-popup__time">{notification.time}</p>
      </div>
    </div>
  );
}
