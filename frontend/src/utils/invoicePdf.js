import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB");
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

export const buildInvoicePdf = ({ order, qrDataUrl, invoiceUrl }) => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 24;

  const orderNumber = order?.orderId || order?._id || "-";
  const invoiceNumber = String(orderNumber).slice(-6).toUpperCase();

  const items = (order?.items || []).map((item, index) => {
    const quantity = Number(item.quantity) || 1;
    const unitRate = Number(item.game?.salePrice || item.game?.price || 0);
    const lineSubtotal = unitRate * quantity;
    const tax = lineSubtotal * 0.12;
    const lineTotal = lineSubtotal + tax;

    return {
      no: index + 1,
      product: item.game?.title || "Game",
      qty: quantity,
      unitRate,
      discount: 0,
      tax,
      total: lineTotal,
    };
  });

  const subtotal = items.reduce(
    (sum, item) => sum + item.unitRate * item.qty,
    0,
  );
  const discount = 0;
  const totalTax = items.reduce((sum, item) => sum + item.tax, 0);
  const shipping = 0;
  const total = subtotal - discount + totalTax + shipping;

  doc.setFillColor(66, 133, 244);
  doc.rect(pageWidth - 290, 0, 290, 88, "F");
  doc.triangle(
    pageWidth - 290,
    0,
    pageWidth - 340,
    0,
    pageWidth - 290,
    88,
    "F",
  );

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("INVOICE", pageWidth - 20, 34, { align: "right" });

  doc.setFontSize(11);
  doc.text(`Order Name: #${orderNumber}`, pageWidth - 285, 70);
  doc.text(`Invoice No: ${invoiceNumber}`, pageWidth - 20, 70, {
    align: "right",
  });

  doc.setTextColor(60, 75, 95);
  doc.setFontSize(18);
  doc.text("GAME STORE", margin, 44);
  doc.setDrawColor(210, 214, 220);
  doc.line(margin, 110, pageWidth - margin, 110);

  doc.setFontSize(12);
  doc.setTextColor(70, 110, 160);
  doc.setFont("helvetica", "bold");
  doc.text("Billing", margin, 138);
  doc.text("Ship To", pageWidth - margin, 138, { align: "right" });

  doc.setTextColor(40, 48, 62);
  doc.setFont("helvetica", "normal");
  doc.text("Customer", margin, 160);
  doc.text("Digital Delivery", pageWidth - margin, 160, { align: "right" });

  doc.setFillColor(246, 247, 249);
  doc.rect(margin, 174, pageWidth - margin * 2, 28, "F");
  doc.setTextColor(66, 66, 66);
  doc.setFont("helvetica", "bold");
  doc.text(`Date Of Supply : ${formatDate(order?.createdAt)}`, margin + 8, 192);
  doc.text(`Invoice Date: ${formatDate(order?.createdAt)}`, margin + 210, 192);
  doc.text("Payment Method: razorpay", pageWidth - margin - 8, 192, {
    align: "right",
  });

  autoTable(doc, {
    startY: 214,
    head: [["No.", "Products", "Qty", "Unit Rate", "Discount", "Tax", "Total"]],
    body: items.map((item) => [
      item.no,
      item.product,
      item.qty,
      formatCurrency(item.unitRate),
      formatCurrency(item.discount),
      formatCurrency(item.tax),
      formatCurrency(item.total),
    ]),
    theme: "grid",
    headStyles: {
      fillColor: [66, 133, 244],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 10, cellPadding: 6, textColor: [45, 45, 45] },
    margin: { left: margin, right: margin },
  });

  const tableBottom = doc.lastAutoTable?.finalY || 300;
  const summaryTop = tableBottom + 16;
  const summaryLeft = pageWidth - 240;
  const summaryWidth = 216;

  if (qrDataUrl) {
    doc.addImage(qrDataUrl, "PNG", margin, summaryTop, 92, 92);
    doc.setTextColor(90, 95, 105);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Scan to open invoice", margin + 6, summaryTop + 106);
  }

  doc.setDrawColor(224, 226, 230);
  doc.rect(summaryLeft, summaryTop, summaryWidth, 106);

  const rowGap = 22;
  const labelX = summaryLeft + 10;
  const valueX = summaryLeft + summaryWidth - 10;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(75, 82, 95);
  doc.setFontSize(10);
  doc.text("Total Amount Before Tax", labelX, summaryTop + 16);
  doc.text(formatCurrency(subtotal), valueX, summaryTop + 16, {
    align: "right",
  });
  doc.text("Discount", labelX, summaryTop + 16 + rowGap);
  doc.text(formatCurrency(discount), valueX, summaryTop + 16 + rowGap, {
    align: "right",
  });
  doc.text("Total Tax", labelX, summaryTop + 16 + rowGap * 2);
  doc.text(formatCurrency(totalTax), valueX, summaryTop + 16 + rowGap * 2, {
    align: "right",
  });

  doc.setFillColor(66, 133, 244);
  doc.rect(summaryLeft, summaryTop + 70, summaryWidth, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Total", labelX, summaryTop + 92);
  doc.text(formatCurrency(total), valueX, summaryTop + 92, {
    align: "right",
  });

  const termsTop = summaryTop + 130;
  doc.setTextColor(55, 55, 55);
  doc.setFont("helvetica", "bold");
  doc.text("Terms & Condition", margin, termsTop);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const termsText =
    "By purchasing from our platform, you agree to digital product terms and support policy. This is a computer generated invoice and does not require a signature.";
  doc.text(termsText, margin, termsTop + 16, {
    maxWidth: pageWidth - margin * 2,
    lineHeightFactor: 1.4,
  });

  if (invoiceUrl) {
    doc.setTextColor(66, 133, 244);
    doc.setFontSize(9);
    doc.text(`Invoice URL: ${invoiceUrl}`, margin, termsTop + 84, {
      maxWidth: pageWidth - margin * 2,
    });
  }

  doc.setDrawColor(66, 133, 244);
  doc.line(margin, 760, pageWidth - margin, 760);
  doc.setFontSize(10);
  doc.setTextColor(35, 35, 35);
  doc.text("Thank you for your business", margin, 778);
  doc.text("Generated from: game-store", pageWidth - margin, 778, {
    align: "right",
  });

  return {
    doc,
    invoiceNumber,
  };
};
