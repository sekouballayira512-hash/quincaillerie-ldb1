import { jsPDF } from 'jspdf';
import { Quote } from '../types';
import { formatFCFA, formatDate, STORE_NAME, STORE_ADDRESS, STORE_PHONE } from './formatters';

export function generateQuotePDF(quote: Quote): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let y = 18;

  // Header Background Accent
  doc.setFillColor(21, 128, 61); // Emerald green #15803d
  doc.rect(0, 0, pageWidth, 6, 'F');

  // Company Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(21, 128, 61);
  doc.text(STORE_NAME, margin, y);

  // Quote Title & Number (Right aligned)
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text(`DEVIS #${quote.quoteNumber}`, pageWidth - margin, y, { align: 'right' });

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Tout pour vos projets au Mali', margin, y);
  doc.text(`Date : ${formatDate(quote.createdAt)}`, pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.text(`Adresse : ${STORE_ADDRESS}`, margin, y);
  doc.text(`Statut : ${quote.status}`, pageWidth - margin, y, { align: 'right' });

  y += 5;
  doc.text(`Téléphone / WhatsApp : ${STORE_PHONE}`, margin, y);

  y += 10;
  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += 8;

  // Client Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('INFORMATIONS CLIENT', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Client : ${quote.clientName || 'N/A'}`, margin + 5, y + 12);
  doc.text(`Téléphone : ${quote.clientPhone || 'N/A'}`, margin + 5, y + 17);

  if (quote.clientEmail) {
    doc.text(`Email : ${quote.clientEmail}`, margin + 90, y + 12);
  }

  y += 28;

  // Table Headers
  const colX = {
    product: margin + 3,
    ref: margin + 70,
    qty: margin + 105,
    price: margin + 125,
    subtotal: pageWidth - margin - 3,
  };

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('DÉSIGNATION PRODUIT', colX.product, y + 5.5);
  doc.text('RÉFÉRENCE', colX.ref, y + 5.5);
  doc.text('QTÉ / UNITÉ', colX.qty, y + 5.5);
  doc.text('PRIX UNITAIRE', colX.price, y + 5.5);
  doc.text('SOUS-TOTAL', colX.subtotal, y + 5.5, { align: 'right' });

  y += 9;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  quote.items.forEach((item, index) => {
    // Check page height
    if (y > pageHeight - 45) {
      doc.addPage();
      y = 20;
    }

    if (index % 2 === 1) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F');
    }

    doc.setTextColor(15, 23, 42);
    // Truncate product name if too long
    const cleanName = item.name.length > 36 ? item.name.substring(0, 34) + '...' : item.name;
    doc.text(cleanName, colX.product, y + 1);
    
    doc.setTextColor(100, 116, 139);
    doc.text(item.reference || '-', colX.ref, y + 1);
    
    doc.setTextColor(15, 23, 42);
    doc.text(`${item.quantity} ${item.unit || ''}`, colX.qty, y + 1);
    doc.text(formatFCFA(item.selling_price), colX.price, y + 1);
    
    doc.setFont('helvetica', 'bold');
    doc.text(formatFCFA(item.subtotal), colX.subtotal, y + 1, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += 7.5;
  });

  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Summary Totals Block
  const totalBoxWidth = 80;
  const totalBoxX = pageWidth - margin - totalBoxWidth;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(totalBoxX, y, totalBoxWidth, quote.discount > 0 ? 32 : 24, 2, 2, 'F');

  let totalY = y + 6;
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Sous-total :', totalBoxX + 5, totalY);
  doc.text(formatFCFA(quote.subtotal), pageWidth - margin - 5, totalY, { align: 'right' });

  if (quote.discount > 0) {
    totalY += 6;
    doc.setTextColor(220, 38, 38);
    doc.text('Remise accordée :', totalBoxX + 5, totalY);
    doc.text(`- ${formatFCFA(quote.discount)}`, pageWidth - margin - 5, totalY, { align: 'right' });
  }

  totalY += 7;
  doc.setDrawColor(203, 213, 225);
  doc.line(totalBoxX + 5, totalY - 2, pageWidth - margin - 5, totalY - 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61);
  doc.text('TOTAL :', totalBoxX + 5, totalY + 3);
  doc.text(formatFCFA(quote.total), pageWidth - margin - 5, totalY + 3, { align: 'right' });

  // Notes (Left side of total)
  if (quote.clientNote || quote.adminNote) {
    const notesX = margin;
    const notesWidth = pageWidth - margin * 2 - totalBoxWidth - 10;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Notes / Instructions :', notesX, y + 6);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    
    let noteY = y + 11;
    if (quote.adminNote) {
      doc.text(`Quincaillerie LDB : ${quote.adminNote}`, notesX, noteY, { maxWidth: notesWidth });
      noteY += 8;
    }
    if (quote.clientNote) {
      doc.text(`Client : ${quote.clientNote}`, notesX, noteY, { maxWidth: notesWidth });
    }
  }

  // Footer Payment & Contact instructions
  const footerY = pageHeight - 22;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Ce devis est valable 15 jours à compter de sa date d\'émission.', margin, footerY);
  doc.text(`Moyens de paiement acceptés : Wave (+223 92012334) • Orange Money / Max it (+223 92012334)`, margin, footerY + 4);
  doc.text(`${STORE_NAME} - Torokorobougou, en face du tribunal, Bamako - Mali - Tel/WhatsApp: ${STORE_PHONE}`, margin, footerY + 8);

  return doc;
}

export function downloadQuotePDF(quote: Quote) {
  const doc = generateQuotePDF(quote);
  doc.save(`DEVIS_${quote.quoteNumber}.pdf`);
}

export async function shareQuote(quote: Quote) {
  const doc = generateQuotePDF(quote);
  const pdfBlob = doc.output('blob');
  const file = new File([pdfBlob], `DEVIS_${quote.quoteNumber}.pdf`, { type: 'application/pdf' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Devis #${quote.quoteNumber} - Quincaillerie LDB`,
        text: `Voici le devis #${quote.quoteNumber} d'un montant de ${formatFCFA(quote.total)}.`,
        files: [file],
      });
      return;
    } catch {
      // Fallback
    }
  }

  // Fallback: download
  downloadQuotePDF(quote);
}
