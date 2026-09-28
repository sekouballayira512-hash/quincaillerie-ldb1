export const STORE_PHONE = '+223 92012334';
export const STORE_WHATSAPP = '22392012334';
export const STORE_ADDRESS = 'Torokorobougou, en face du tribunal';
export const STORE_NAME = 'QUINCAILLERIE LDB';
export const STORE_TAGLINE = 'Tout pour vos projets au Mali';
export const STORE_MOTTO = 'Qualité • Conseil • Proximité';

/**
 * Format amount into FCFA currency string with space thousand-separators
 * Example: 45000 -> "45 000 FCFA"
 */
export function formatFCFA(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 FCFA';
  }
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

/**
 * Format ISO date string into readable French format
 * Example: "27 septembre 2026 à 14:30"
 */
export function formatDate(isoString: string, includeTime = false): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return isoString;

  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  };
  return date.toLocaleDateString('fr-FR', options);
}

/**
 * Generate WhatsApp chat URL with prefilled text
 */
export function getWhatsAppUrl(message?: string): string {
  const base = `https://wa.me/${STORE_WHATSAPP}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate Quote WhatsApp link
 */
export function getQuoteWhatsAppUrl(quoteNumber: string, amount: number): string {
  const text = `Bonjour Quincaillerie LDB,\n\nJe souhaite vous contacter concernant le devis #${quoteNumber}.\n\nMontant : ${formatFCFA(amount)}.\n\nMerci.`;
  return getWhatsAppUrl(text);
}

/**
 * Generate Payment verification WhatsApp link
 */
export function getPaymentWhatsAppUrl(
  referenceNumber: string,
  amount: number,
  mode: string
): string {
  const text = `Bonjour Quincaillerie LDB,\n\nJe viens d'effectuer le paiement.\n\nDevis/Commande :\n${referenceNumber}\n\nMontant :\n${formatFCFA(amount)}\n\nMode :\n${mode}\n\nMerci de vérifier mon paiement.`;
  return getWhatsAppUrl(text);
}

/**
 * Status color mappings for Devis
 */
export function getQuoteStatusBadge(status: string): { bg: string; text: string; border: string; label: string } {
  switch (status) {
    case 'EN ATTENTE':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', label: '🟠 EN ATTENTE' };
    case 'MODIFIÉ':
      return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-300', label: '🔵 MODIFIÉ' };
    case 'ACCEPTÉ':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300', label: '🟢 ACCEPTÉ' };
    case 'REFUSÉ':
      return { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-300', label: '🔴 REFUSÉ' };
    case 'PAIEMENT EN ATTENTE':
      return { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-300', label: '🟣 PAIEMENT EN ATTENTE' };
    case 'PAYÉ':
      return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400', label: '✅ PAYÉ' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-300', label: status };
  }
}

/**
 * Status color mappings for Commandes
 */
export function getOrderStatusBadge(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case 'EN ATTENTE':
      return { bg: 'bg-amber-100 text-amber-900', text: 'text-amber-900', label: 'En attente' };
    case 'CONFIRMÉE':
      return { bg: 'bg-blue-100 text-blue-900', text: 'text-blue-900', label: 'Confirmée' };
    case 'EN PRÉPARATION':
      return { bg: 'bg-indigo-100 text-indigo-900', text: 'text-indigo-900', label: 'En préparation' };
    case 'PRÊTE':
      return { bg: 'bg-teal-100 text-teal-900', text: 'text-teal-900', label: 'Prête en magasin' };
    case 'EN LIVRAISON':
      return { bg: 'bg-orange-100 text-orange-900', text: 'text-orange-900', label: 'En cours de livraison' };
    case 'LIVRÉE':
      return { bg: 'bg-emerald-100 text-emerald-900', text: 'text-emerald-900', label: 'Livrée' };
    case 'ANNULÉE':
      return { bg: 'bg-rose-100 text-rose-900', text: 'text-rose-900', label: 'Annulée' };
    default:
      return { bg: 'bg-gray-100 text-gray-800', text: 'text-gray-800', label: status };
  }
}

/**
 * Intelligent image URL normalizer and cleaner:
 * - Removes surrounding quotes and whitespace
 * - Converts Google Drive share links into direct embeddable preview image links
 * - Fixes Google Images search redirects (extracts real imgurl)
 * - Converts Dropbox links (dl=0 -> raw=1)
 * - Upgrades insecure http:// to https:// to prevent Mixed Content browser blocking
 */
export function cleanAndFormatImageUrl(rawUrl: unknown): string {
  if (!rawUrl) return '';
  let url = String(rawUrl).trim();

  // Strip leading/trailing quotes or backticks if copied from spreadsheet formulas
  url = url.replace(/^["'`]|["'`]$/g, '').trim();
  // Strip control chars, line breaks, or multiple spaces
  url = url.replace(/[\r\n\t]+/g, '').trim();

  if (!url) return '';

  // 1. Google Drive Links:
  // e.g. drive.google.com/file/d/1B2C.../view?usp=sharing
  // e.g. drive.google.com/open?id=1B2C...
  // e.g. drive.google.com/uc?id=1B2C...
  const gDriveMatch = url.match(
    /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([a-zA-Z0-9_-]+)/i
  );
  if (gDriveMatch && gDriveMatch[1]) {
    const fileId = gDriveMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 2. Google Image Search URL (contains &imgurl= or ?imgurl=)
  if (url.includes('google.') && url.includes('imgurl=')) {
    try {
      const match = url.match(/[?&]imgurl=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch {
      // Fallback
    }
  }

  // 3. Dropbox links: dl=0 -> raw=1 for direct binary stream
  if (url.includes('dropbox.com') && url.includes('dl=0')) {
    url = url.replace('dl=0', 'raw=1');
  }

  // 4. Scheme fix (protocol-relative or www.)
  if (url.startsWith('//')) {
    url = 'https:' + url;
  } else if (url.startsWith('www.')) {
    url = 'https://' + url;
  } else if (url.startsWith('http://')) {
    // Upgrade insecure HTTP to HTTPS to avoid browser Mixed Content blocking
    url = url.replace(/^http:\/\//i, 'https://');
  }

  return url;
}

