import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { AppNotification } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  type: 'quote' | 'payment' | 'order' | 'info' = 'info',
  link?: string
): Promise<string> {
  const docRef = doc(collection(db, NOTIFICATIONS_COLLECTION));
  const newNotif: AppNotification = {
    id: docRef.id,
    userId,
    title,
    message,
    type,
    read: false,
    link: link || '',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, newNotif);
    return docRef.id;
  } catch (error) {
    console.error('Failed to create notification', error);
    return '';
  }
}

export async function getUserNotifications(userId: string): Promise<AppNotification[]> {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, NOTIFICATIONS_COLLECTION);
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  try {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, id);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${NOTIFICATIONS_COLLECTION}/${id}`);
  }
}

export async function markAllNotificationsAsRead(notifications: AppNotification[]): Promise<void> {
  for (const notif of notifications) {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }
  }
}
