import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Category } from '../types';

const CATEGORIES_COLLECTION = 'categories';

export const DEFAULT_CATEGORIES: string[] = [
  'Outillage',
  'Plomberie',
  'Électricité',
  'Peinture',
  'Robinetterie',
  'Tuyaux',
  'Raccords',
  'Matériaux',
  'Quincaillerie',
];

export async function getCategories(): Promise<Category[]> {
  try {
    const snap = await getDocs(collection(db, CATEGORIES_COLLECTION));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
    if (list.length === 0) {
      // Return default list if not yet stored in DB
      return DEFAULT_CATEGORIES.map((name, index) => ({
        id: `cat-${index}`,
        name,
        order: index,
        active: true,
        created_at: new Date().toISOString(),
      }));
    }
    return list.sort((a, b) => a.order - b.order);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, CATEGORIES_COLLECTION);
  }
}

export async function createCategory(name: string, order: number, icon?: string): Promise<string> {
  try {
    const docRef = doc(collection(db, CATEGORIES_COLLECTION));
    const newCat: Category = {
      id: docRef.id,
      name,
      order,
      icon: icon || '',
      active: true,
      created_at: new Date().toISOString(),
    };
    await setDoc(docRef, newCat);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, CATEGORIES_COLLECTION);
  }
}

export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${CATEGORIES_COLLECTION}/${id}`);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${CATEGORIES_COLLECTION}/${id}`);
  }
}
