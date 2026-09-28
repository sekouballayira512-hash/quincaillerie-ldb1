import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Quote, QuoteItem, QuoteStatus } from '../types';
import { sendNotification } from './notificationService';

const QUOTES_COLLECTION = 'quotes';

/**
 * Generate unique quote number: DEVIS #LDB-2026-XXXX
 */
export function generateQuoteNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LDB-${year}-${rand}`;
}

/**
 * Create a new customer quote
 */
export async function createQuote(
  userId: string,
  clientName: string,
  clientPhone: string,
  clientEmail: string,
  items: QuoteItem[],
  clientNote?: string
): Promise<Quote> {
  const quoteNumber = generateQuoteNumber();
  const now = new Date().toISOString();

  const subtotal = items.reduce((sum, it) => sum + it.subtotal, 0);
  const discount = 0;
  const total = subtotal - discount;

  const quoteDocRef = doc(collection(db, QUOTES_COLLECTION));
  const newQuote: Quote = {
    id: quoteDocRef.id,
    quoteNumber,
    userId,
    clientName,
    clientPhone,
    clientEmail,
    items,
    subtotal,
    discount,
    total,
    clientNote: clientNote || '',
    adminNote: '',
    status: 'EN ATTENTE',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(quoteDocRef, newQuote);

    // Notify user of quote submission
    await sendNotification(
      userId,
      `Devis #${quoteNumber} enregistré`,
      `Votre demande de devis #${quoteNumber} a bien été enregistrée et est en cours d'examen.`,
      'quote',
      `/devis/${quoteDocRef.id}`
    );

    return newQuote;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, QUOTES_COLLECTION);
  }
}

/**
 * Get all quotes for the current client
 */
export async function getQuotesForUser(userId: string): Promise<Quote[]> {
  try {
    const q = query(
      collection(db, QUOTES_COLLECTION),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Quote));
    // Sort descending by creation date
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, QUOTES_COLLECTION);
  }
}

/**
 * Get all quotes for admin
 */
export async function getAllQuotesAdmin(): Promise<Quote[]> {
  try {
    const snap = await getDocs(collection(db, QUOTES_COLLECTION));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Quote));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, QUOTES_COLLECTION);
  }
}

/**
 * Get single quote by ID
 */
export async function getQuoteById(id: string): Promise<Quote | null> {
  try {
    const docRef = doc(db, QUOTES_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Quote;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${QUOTES_COLLECTION}/${id}`);
  }
}

/**
 * Update quote status (e.g. ACCEPTÉ, REFUSÉ, PAIEMENT EN ATTENTE, etc.)
 */
export async function updateQuoteStatus(
  quoteId: string,
  status: QuoteStatus,
  adminNote?: string
): Promise<void> {
  try {
    const docRef = doc(db, QUOTES_COLLECTION, quoteId);
    const existing = await getDoc(docRef);
    if (!existing.exists()) return;
    const quote = existing.data() as Quote;

    const updatePayload: Partial<Quote> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (adminNote !== undefined) {
      updatePayload.adminNote = adminNote;
    }

    await updateDoc(docRef, updatePayload);

    // Send notification to customer
    let msg = `Le statut de votre devis #${quote.quoteNumber} est maintenant : ${status}`;
    if (status === 'ACCEPTÉ') {
      msg = `Votre devis #${quote.quoteNumber} a été validé ! Vous pouvez procéder au paiement par Wave ou Orange Money.`;
    } else if (status === 'REFUSÉ') {
      msg = `Votre devis #${quote.quoteNumber} a été refusé. ${adminNote ? 'Raison: ' + adminNote : ''}`;
    } else if (status === 'PAIEMENT EN ATTENTE') {
      msg = `Votre déclaration de paiement pour le devis #${quote.quoteNumber} est en cours de vérification par Quincaillerie LDB.`;
    } else if (status === 'PAYÉ') {
      msg = `Votre paiement pour le devis #${quote.quoteNumber} est validé ! Votre commande est désormais confirmée.`;
    }

    await sendNotification(
      quote.userId,
      `Mise à jour devis #${quote.quoteNumber}`,
      msg,
      'quote',
      `/devis/${quoteId}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${QUOTES_COLLECTION}/${quoteId}`);
  }
}

/**
 * Admin modifications of quote items, unit prices, discounts, or notes
 */
export async function adminModifyQuote(
  quoteId: string,
  items: QuoteItem[],
  discount: number,
  adminNote?: string
): Promise<void> {
  try {
    const docRef = doc(db, QUOTES_COLLECTION, quoteId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const current = snap.data() as Quote;

    const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.selling_price), 0);
    const total = Math.max(0, subtotal - discount);

    const updatedQuote: Partial<Quote> = {
      items: items.map(it => ({
        ...it,
        subtotal: it.quantity * it.selling_price,
      })),
      subtotal,
      discount,
      total,
      status: 'MODIFIÉ',
      adminNote: adminNote || current.adminNote || '',
      updatedAt: new Date().toISOString(),
    };

    await updateDoc(docRef, updatedQuote);

    // Prompt user with required notification: « Votre devis #LDB-2026-XXXX a été modifié. »
    await sendNotification(
      current.userId,
      `Votre devis #${current.quoteNumber} a été modifié`,
      `Quincaillerie LDB a révisé les tarifs/quantités de votre devis #${current.quoteNumber}. Montant révisé : ${total.toLocaleString('fr-FR')} FCFA.`,
      'quote',
      `/devis/${quoteId}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${QUOTES_COLLECTION}/${quoteId}`);
  }
}
