import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { buildInvoicePdf } from "../utils/invoicePdf";

export default function InvoiceDownload() {
  const { orderId, signature } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const invoiceUrl = `${window.location.origin}/invoice/${orderId}/${signature}`;

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/orders/invoice/public/${orderId}?sig=${signature}`,
        );

        const data = await res.json();
        if (!res.ok || !data?.order) {
          toast.error(data?.msg || "Invalid invoice link");
          return;
        }

        setOrder(data.order);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load invoice");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId, signature]);

  const downloadInvoice = async () => {
    if (!order || downloading) return;

    setDownloading(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(invoiceUrl, {
        margin: 1,
        width: 160,
        errorCorrectionLevel: "M",
      });

      const { doc, invoiceNumber } = buildInvoicePdf({
        order,
        qrDataUrl,
        invoiceUrl,
      });

      doc.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("Unable to download invoice");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="success-page">
        <section className="success-hero">
          <h1>Loading Invoice...</h1>
        </section>
      </div>
    );
  }

  return (
    <div className="success-page">
      <section className="success-hero">
        <p className="success-kicker">INVOICE ACCESS</p>
        <h1>Invoice ready for download</h1>
        <p className="success-subtitle">
          This secure link lets you generate and download your invoice PDF.
        </p>

        <div className="success-actions">
          <button
            className="btn"
            onClick={downloadInvoice}
            disabled={downloading || !order}
          >
            {downloading ? "Preparing PDF..." : "Download Invoice PDF"}
          </button>
        </div>
      </section>
    </div>
  );
}
