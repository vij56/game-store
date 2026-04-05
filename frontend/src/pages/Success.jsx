import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { buildInvoicePdf } from "../utils/invoicePdf";
import "./Success.css";

export default function Success() {
  const navigate = useNavigate();
  const [galleryGames, setGalleryGames] = useState([]);
  const [latestOrder, setLatestOrder] = useState(null);
  const [invoicePublicUrl, setInvoicePublicUrl] = useState("");
  const instructionsDownloadUrl = `${import.meta.env.VITE_API_URL}/api/instructions/download`;

  useEffect(() => {
    const token = localStorage.getItem("token");

    const loadGameImages = async () => {
      try {
        const ownedRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/orders/owned`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );

        if (ownedRes.ok) {
          const ownedData = await ownedRes.json();
          if (Array.isArray(ownedData) && ownedData.length > 0) {
            setGalleryGames(ownedData.filter((g) => g?.image));
            return;
          }
        }

        const allGamesRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/games`,
        );
        if (!allGamesRes.ok) return;

        const allGamesData = await allGamesRes.json();
        if (!Array.isArray(allGamesData)) return;
        setGalleryGames(allGamesData.filter((g) => g?.image));
      } catch (error) {
        console.error(error);
      }
    };

    loadGameImages();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const loadLatestInvoiceData = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/orders/invoice/latest-link`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) return;
        const data = await res.json();
        if (!data?.order) return;

        setLatestOrder(data.order);
        setInvoicePublicUrl(data.invoiceUrl || "");
      } catch (error) {
        console.error(error);
      }
    };

    loadLatestInvoiceData();
  }, []);

  const handleDownloadInvoicePdf = async () => {
    if (!latestOrder) {
      toast.error("Invoice is not ready yet");
      return;
    }

    try {
      const qrDataUrl = invoicePublicUrl
        ? await QRCode.toDataURL(invoicePublicUrl, {
            margin: 1,
            width: 160,
            errorCorrectionLevel: "M",
          })
        : null;

      const { doc, invoiceNumber } = buildInvoicePdf({
        order: latestOrder,
        qrDataUrl,
        invoiceUrl: invoicePublicUrl,
      });

      doc.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate invoice PDF");
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");

    link.href = instructionsDownloadUrl;
    link.click();
  };

  return (
    <div className="success-page">
      <section className="success-hero">
        <p className="success-kicker">PAYMENT CONFIRMED</p>
        <h1>Purchase successful. You are all set.</h1>
        <p className="success-subtitle">
          Your order is confirmed. Download the instructions file now and keep
          it saved for later.
        </p>

        <div className="success-actions">
          <button className="btn" onClick={handleDownload}>
            Download Instructions PDF
          </button>
          <button className="btn" onClick={handleDownloadInvoicePdf}>
            Download Invoice PDF
          </button>
          <button
            className="btn secondary"
            onClick={() => navigate("/library")}
          >
            Go To Library
          </button>
        </div>
      </section>

      <section className="success-gallery card">
        <h2>Game Gallery</h2>
        <p className="success-gallery-copy">
          Real game covers from your database.
        </p>
        {galleryGames.length === 0 ? (
          <p className="success-gallery-empty">No game images available yet.</p>
        ) : (
          <div className="success-gallery-grid">
            {galleryGames.slice(0, 8).map((game) => (
              <img
                key={game._id}
                src={game.image}
                alt={game.title || "Game cover"}
                className="success-gallery-image"
                loading="lazy"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
