import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Product, ProductWithCost } from '../types';
import { cleanAndFormatImageUrl } from '../utils/formatters';

const PRODUCTS_COLLECTION = 'products';
const COSTS_COLLECTION = 'product_costs';

/**
 * Fetch all active products for client catalog
 */
export async function getActiveProducts(): Promise<Product[]> {
  try {
    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('active', '==', true)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data() as Product;
      return {
        ...data,
        id: d.id,
        image_url: cleanAndFormatImageUrl(data.image_url),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
  }
}

/**
 * Fetch all products for admin (including inactive ones)
 */
export async function getAllProductsAdmin(): Promise<ProductWithCost[]> {
  try {
    const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    const products = snap.docs.map(d => {
      const data = d.data() as Product;
      return {
        ...data,
        id: d.id,
        image_url: cleanAndFormatImageUrl(data.image_url),
      };
    });

    // Fetch confidential costs (only admin has permission for this)
    let costsMap = new Map<string, number>();
    try {
      const costsSnap = await getDocs(collection(db, COSTS_COLLECTION));
      costsSnap.docs.forEach(d => {
        const costData = d.data();
        if (costData.purchase_price !== undefined) {
          costsMap.set(d.id, Number(costData.purchase_price));
        }
      });
    } catch (e) {
      console.warn('Could not load costs (requires admin role):', e);
    }

    return products.map(prod => {
      const purchase_price = costsMap.get(prod.id) ?? 0;
      const margin = prod.selling_price - purchase_price;
      const potential_margin = margin * prod.stock;
      return {
        ...prod,
        purchase_price,
        margin,
        potential_margin,
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, PRODUCTS_COLLECTION);
  }
}

/**
 * Get single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as Product;
    return {
      ...data,
      id: snap.id,
      image_url: cleanAndFormatImageUrl(data.image_url),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

/**
 * Create a new product. Stores public info in 'products' and
 * confidential purchase price in 'product_costs' (Admin only).
 */
export async function createProduct(
  productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>,
  purchasePrice?: number
): Promise<string> {
  const newDocRef = doc(collection(db, PRODUCTS_COLLECTION));
  const now = new Date().toISOString();

  const publicData: Omit<Product, 'id'> = {
    ...productData,
    image_url: cleanAndFormatImageUrl(productData.image_url),
    created_at: now,
    updated_at: now,
  };

  try {
    await setDoc(newDocRef, publicData);

    // Save confidential purchase cost separately
    if (purchasePrice !== undefined) {
      await setDoc(doc(db, COSTS_COLLECTION, newDocRef.id), {
        productId: newDocRef.id,
        purchase_price: Number(purchasePrice),
        updated_at: now,
      });
    }

    return newDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PRODUCTS_COLLECTION);
  }
}

/**
 * Update an existing product (Admin only)
 */
export async function updateProduct(
  id: string,
  productData: Partial<Product>,
  purchasePrice?: number
): Promise<void> {
  const docRef = doc(db, PRODUCTS_COLLECTION, id);
  const now = new Date().toISOString();

  const updates: Partial<Product> = {
    ...productData,
    updated_at: now,
  };

  if (productData.image_url !== undefined) {
    updates.image_url = cleanAndFormatImageUrl(productData.image_url);
  }

  try {
    await updateDoc(docRef, updates);

    if (purchasePrice !== undefined) {
      await setDoc(
        doc(db, COSTS_COLLECTION, id),
        {
          productId: id,
          purchase_price: Number(purchasePrice),
          updated_at: now,
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

/**
 * Quick stock update (Admin only)
 */
export async function updateProductStock(id: string, newStock: number): Promise<void> {
  try {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, {
      stock: Math.max(0, newStock),
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

/**
 * Delete product (Admin only)
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
    try {
      await deleteDoc(doc(db, COSTS_COLLECTION, id));
    } catch {
      // Cost doc might not exist
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PRODUCTS_COLLECTION}/${id}`);
  }
}

/**
 * Batch import products (from Excel/CSV)
 */
export async function importBatchProducts(
  products: Array<{
    name: string;
    reference: string;
    description: string;
    category: string;
    image_url: string;
    selling_price: number;
    purchase_price: number;
    stock: number;
    unit: string;
  }>
): Promise<{ added: number }> {
  let count = 0;
  for (const item of products) {
    await createProduct(
      {
        name: item.name,
        reference: item.reference,
        description: item.description,
        category: item.category,
        image_url: cleanAndFormatImageUrl(item.image_url),
        selling_price: item.selling_price,
        stock: item.stock,
        unit: item.unit,
        active: true,
      },
      item.purchase_price
    );
    count++;
  }
  return { added: count };
}

/**
 * Scan all existing products in Firestore and sanitize their image_url
 * (Fixes Google Drive links, Dropbox dl=0, trailing whitespace, quotes, and http://)
 */
export async function repairAllExistingProductImages(): Promise<{ fixed: number; total: number }> {
  try {
    const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
    let fixed = 0;

    for (const d of snap.docs) {
      const data = d.data();
      const rawUrl = data.image_url || '';
      const cleaned = cleanAndFormatImageUrl(rawUrl);

      if (cleaned && cleaned !== rawUrl) {
        await updateDoc(doc(db, PRODUCTS_COLLECTION, d.id), {
          image_url: cleaned,
          updated_at: new Date().toISOString(),
        });
        fixed++;
      }
    }

    return { fixed, total: snap.docs.length };
  } catch (error) {
    console.error('Failed to repair existing product images:', error);
    return { fixed: 0, total: 0 };
  }
}
