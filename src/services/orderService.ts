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
import { Order, OrderStatus, Quote } from '../types';
import { sendNotification } from './notificationService';

const ORDERS_COLLECTION = 'orders';

export function generateOrderNumber(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CMD-LDB-${new Date().getFullYear()}-${rand}`;
}

export async function createOrderFromQuote(quote: Quote, paymentMethod: string): Promise<Order> {
  const orderNumber = generateOrderNumber();
  const now = new Date().toISOString();
  const docRef = doc(collection(db, ORDERS_COLLECTION));

  const newOrder: Order = {
    id: docRef.id,
    orderNumber,
    quoteId: quote.id,
    userId: quote.userId,
    clientName: quote.clientName,
    clientPhone: quote.clientPhone,
    clientAddress: '',
    items: quote.items,
    total: quote.total,
    paymentMethod,
    paymentStatus: 'PAYÉ',
    status: 'CONFIRMÉE',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(docRef, newOrder);
    return newOrder;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, ORDERS_COLLECTION);
  }
}

export async function getOrdersForUser(userId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, ORDERS_COLLECTION);
  }
}

export async function getAllOrdersAdmin(): Promise<Order[]> {
  try {
    const snap = await getDocs(collection(db, ORDERS_COLLECTION));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, ORDERS_COLLECTION);
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const order = snap.data() as Order;

    await updateDoc(docRef, {
      status,
      updatedAt: new Date().toISOString(),
    });

    let msg = `Le statut de votre commande #${order.orderNumber} est désormais : ${status}.`;
    if (status === 'PRÊTE') {
      msg = `Votre commande #${order.orderNumber} est prête ! Vous pouvez passer la récupérer à la quincaillerie à Torokorobougou.`;
    } else if (status === 'EN LIVRAISON') {
      msg = `Votre commande #${order.orderNumber} est actuellement en cours d'acheminement vers votre chantier.`;
    } else if (status === 'LIVRÉE') {
      msg = `Votre commande #${order.orderNumber} a été livrée. Merci de faire confiance à Quincaillerie LDB !`;
    }

    await sendNotification(
      order.userId,
      `Commande #${order.orderNumber} : ${status}`,
      msg,
      'order',
      '/commandes'
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ORDERS_COLLECTION}/${orderId}`);
  }
}
