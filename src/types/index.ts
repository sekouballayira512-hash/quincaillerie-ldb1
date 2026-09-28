export type UserRole = 'CLIENT' | 'ADMIN';

export interface UserProfile {
  uid: string;
  fullName: string;
  phone: string;
  email: string;
  address?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  reference: string;
  description: string;
  category: string;
  image_url: string;
  selling_price: number;
  stock: number;
  unit: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  // Note: purchase_price is stored separately in product_costs collection for security
}

export interface ProductCost {
  productId: string;
  purchase_price: number;
  updated_at: string;
  updated_by?: string;
}

export interface ProductWithCost extends Product {
  purchase_price?: number;
  margin?: number;
  potential_margin?: number;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  order: number;
  active: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface QuoteItem {
  productId: string;
  name: string;
  reference: string;
  category: string;
  image_url?: string;
  quantity: number;
  unit: string;
  selling_price: number;
  subtotal: number;
}

export type QuoteStatus = 
  | 'EN ATTENTE'
  | 'MODIFIÉ'
  | 'ACCEPTÉ'
  | 'REFUSÉ'
  | 'PAIEMENT EN ATTENTE'
  | 'PAYÉ';

export interface Quote {
  id: string;
  quoteNumber: string;
  userId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  items: QuoteItem[];
  subtotal: number;
  discount: number;
  total: number;
  clientNote?: string;
  adminNote?: string;
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'EN ATTENTE'
  | 'CONFIRMÉE'
  | 'EN PRÉPARATION'
  | 'PRÊTE'
  | 'EN LIVRAISON'
  | 'LIVRÉE'
  | 'ANNULÉE';

export interface Order {
  id: string;
  orderNumber: string;
  quoteId?: string;
  userId: string;
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  items: QuoteItem[];
  total: number;
  paymentMethod?: string;
  paymentStatus: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'WAVE' | 'ORANGE_MONEY' | 'MAX_IT';
export type PaymentStatus = 'PAIEMENT EN ATTENTE' | 'PAYÉ' | 'REFUSÉ';

export interface PaymentRecord {
  id: string;
  paymentNumber: string;
  quoteId?: string;
  orderId?: string;
  userId: string;
  clientName: string;
  clientPhone: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  refCode?: string;
  proofNote?: string;
  adminReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'quote' | 'payment' | 'order' | 'info';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  phone: string;
  address: string;
  logo_url?: string;
  banner_text?: string;
  whatsappNumber: string;
}
