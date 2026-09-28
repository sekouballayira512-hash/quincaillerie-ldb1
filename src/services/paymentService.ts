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
import { db, auth, handleFirestoreError, OperationType } from '../firebase/config';
import { PaymentRecord, PaymentMethod, PaymentStatus, Quote } from '../types';
import { updateQuoteStatus, getQuoteById } from './quoteService';
import { createOrderFromQuote } from './orderService';
import { sendNotification } from './notificationService';

const PAYMENTS_COLLECTION = 'payments';

export function generatePaymentNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `PAY-${new Date().getFullYear()}-${rand}`;
}

/**
 * Client initiates manual payment confirmation
 */
export async function submitManualPayment(
  quote: Quote,
  method: PaymentMethod,
  refCode?: string,
  proofNote?: string,
  overrideUserId?: string
): Promise<PaymentRecord> {
  const paymentNumber = generatePaymentNumber();
  const now = new Date().toISOString();
  const effectiveUserId = overrideUserId || auth.currentUser?.uid || quote.userId;

  const docRef = doc(collection(db, PAYMENTS_COLLECTION));
  const newPayment: PaymentRecord = {
    id: docRef.id,
    paymentNumber,
    quoteId: quote.id,
    userId: effectiveUserId,
    clientName: quote.clientName,
    clientPhone: quote.clientPhone,
    amount: quote.total,
    method,
    status: 'PAIEMENT EN ATTENTE',
    refCode: refCode || '',
    proofNote: proofNote || '',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(docRef, newPayment);

    // Update Quote status to PAIEMENT EN ATTENTE in Firestore
    await updateQuoteStatus(quote.id, 'PAIEMENT EN ATTENTE');

    // Notify client
    if (effectiveUserId) {
      await sendNotification(
        effectiveUserId,
        `Paiement #${paymentNumber} en attente`,
        `Votre déclaration de paiement de ${quote.total.toLocaleString('fr-FR')} FCFA par ${method} est en cours de vérification par Quincaillerie LDB.`,
        'payment',
        `/devis/${quote.id}`
      );
    }

    return newPayment;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PAYMENTS_COLLECTION);
  }
}

/**
 * Get payments for client
 */
export async function getPaymentsForUser(userId: string): Promise<PaymentRecord[]> {
  try {
    const q = query(
      collection(db, PAYMENTS_COLLECTION),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRecord));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, PAYMENTS_COLLECTION);
  }
}

/**
 * Get all pending payments for Admin
 */
export async function getAllPaymentsAdmin(): Promise<PaymentRecord[]> {
  try {
    const snap = await getDocs(collection(db, PAYMENTS_COLLECTION));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRecord));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, PAYMENTS_COLLECTION);
  }
}

/**
 * Admin confirms payment: marks PAYÉ, updates quote to PAYÉ, and creates confirmed Order
 */
export async function confirmPaymentAdmin(
  paymentId: string,
  quote: Quote | null | undefined,
  adminUid: string,
  fallbackPayment?: PaymentRecord
): Promise<{ orderNumber: string }> {
  try {
    const now = new Date().toISOString();
    const payRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    
    await updateDoc(payRef, {
      status: 'PAYÉ',
      verifiedBy: adminUid,
      verifiedAt: now,
      updatedAt: now,
    });

    let orderNum = '';

    // If quote exists or can be resolved, mark quote as PAYÉ and create customer order
    let resolvedQuote = quote;
    if (!resolvedQuote && fallbackPayment?.quoteId) {
      try {
        resolvedQuote = (await getQuoteById(fallbackPayment.quoteId)) || undefined;
      } catch (e) {
        console.warn('Could not fetch quote by ID in confirmPaymentAdmin:', e);
      }
    }

    if (resolvedQuote && resolvedQuote.id) {
      await updateQuoteStatus(resolvedQuote.id, 'PAYÉ', 'Paiement confirmé par l\'administrateur.');
      const order = await createOrderFromQuote(resolvedQuote, fallbackPayment?.method || 'PAIEMENT VALIDÉ');
      orderNum = order.orderNumber;

      // Link order to payment record
      await updateDoc(payRef, {
        orderId: order.id,
        orderNumber: order.orderNumber,
      });

      if (resolvedQuote.userId) {
        await sendNotification(
          resolvedQuote.userId,
          'Paiement validé avec succès !',
          `Votre paiement de ${resolvedQuote.total.toLocaleString('fr-FR')} FCFA a été confirmé par Quincaillerie LDB. La commande #${order.orderNumber} est en préparation.`,
          'order',
          `/commandes`
        );
      }
    } else if (fallbackPayment) {
      // Create minimal order directly from payment record if quote doc is absent
      const syntheticQuote: Quote = {
        id: fallbackPayment.quoteId || `gen-${Date.now()}`,
        quoteNumber: `LDB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: fallbackPayment.userId,
        clientName: fallbackPayment.clientName,
        clientPhone: fallbackPayment.clientPhone,
        clientEmail: '',
        items: [
          {
            productId: 'direct',
            name: `Articles - Règlement #${fallbackPayment.paymentNumber}`,
            reference: 'REG-DIRECT',
            category: 'Quincaillerie',
            quantity: 1,
            unit: 'Lot',
            selling_price: fallbackPayment.amount,
            subtotal: fallbackPayment.amount,
          },
        ],
        subtotal: fallbackPayment.amount,
        discount: 0,
        total: fallbackPayment.amount,
        status: 'PAYÉ',
        createdAt: now,
        updatedAt: now,
      };
      const order = await createOrderFromQuote(syntheticQuote, fallbackPayment.method);
      orderNum = order.orderNumber;

      await updateDoc(payRef, {
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    }

    return { orderNumber: orderNum };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PAYMENTS_COLLECTION}/${paymentId}`);
  }
}

/**
 * Admin refuses payment
 */
export async function refusePaymentAdmin(
  paymentId: string,
  quoteId: string,
  userId: string,
  reason: string
): Promise<void> {
  try {
    const now = new Date().toISOString();
    const payRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    
    await updateDoc(payRef, {
      status: 'REFUSÉ',
      adminReason: reason,
      updatedAt: now,
    });

    // Reset quote back to ACCEPTÉ so client can retry or pay
    if (quoteId) {
      await updateQuoteStatus(quoteId, 'ACCEPTÉ', `Paiement rejeté : ${reason}`);
    }

    if (userId) {
      await sendNotification(
        userId,
        'Paiement non validé',
        `Votre paiement n'a pas pu être validé : ${reason}. Veuillez contacter le +223 92012334 ou soumettre un nouveau justificatif.`,
        'payment',
        quoteId ? `/devis/${quoteId}` : undefined
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PAYMENTS_COLLECTION}/${paymentId}`);
  }
}
