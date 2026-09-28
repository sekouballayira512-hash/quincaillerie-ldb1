import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { createProduct } from './productService';
import { createCategory, DEFAULT_CATEGORIES } from './categoryService';

export const INITIAL_DEMO_PRODUCTS = [
  {
    name: 'Perceuse à percussion Bosch GSB 650W',
    reference: 'MB001',
    description: 'Perceuse électrique puissante et fiable pour tous vos travaux de perçage dans le béton, l\'acier et le bois.',
    category: 'Outillage',
    image_url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=700&auto=format&fit=crop&q=80',
    selling_price: 45000,
    purchase_price: 33000,
    stock: 14,
    unit: 'Pièce',
  },
  {
    name: 'Meuleuse d\'angle DeWalt 125mm 900W',
    reference: 'DW002',
    description: 'Meuleuse professionnelle robuste pour tronçonner et meuler les fers, briques et carrelages.',
    category: 'Outillage',
    image_url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=700&auto=format&fit=crop&q=80',
    selling_price: 52000,
    purchase_price: 39000,
    stock: 8,
    unit: 'Pièce',
  },
  {
    name: 'Ciment Dangote 42.5R (Sac 50kg)',
    reference: 'MAT-CIM-50',
    description: 'Ciment haute résistance pour fondations, dalles, poteaux et maçonnerie générale.',
    category: 'Matériaux',
    image_url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=700&auto=format&fit=crop&q=80',
    selling_price: 5250,
    purchase_price: 4650,
    stock: 220,
    unit: 'Sac',
  },
  {
    name: 'Fer à béton torsadé FE500 Ø12 (Barre 12m)',
    reference: 'MAT-FER-12',
    description: 'Acier haute adhérence normé pour béton armé et chaînage de bâtiment.',
    category: 'Matériaux',
    image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986b88?w=700&auto=format&fit=crop&q=80',
    selling_price: 7800,
    purchase_price: 6400,
    stock: 95,
    unit: 'Barre',
  },
  {
    name: 'Peinture Blanche Seigneurie Pantex 15L',
    reference: 'PEINT-SEIG-15',
    description: 'Peinture mate garnissante de haute qualité, lessivable, pour murs et plafonds.',
    category: 'Peinture',
    image_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=700&auto=format&fit=crop&q=80',
    selling_price: 38000,
    purchase_price: 29500,
    stock: 25,
    unit: 'Pot 15L',
  },
  {
    name: 'Mitigeur Lavabo Chromé Haut',
    reference: 'ROB-MIT-01',
    description: 'Mitigeur design pour vasque et lavabo, cartouche céramique durable, avec flexibles inox.',
    category: 'Robinetterie',
    image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=700&auto=format&fit=crop&q=80',
    selling_price: 24000,
    purchase_price: 16500,
    stock: 12,
    unit: 'Pièce',
  },
  {
    name: 'Robinet flotteur réservoir WC complet',
    reference: 'ROB-FLOT-02',
    description: 'Mécanisme universel de chasse d\'eau silencieux et résistant au calcaire.',
    category: 'Robinetterie',
    image_url: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=700&auto=format&fit=crop&q=80',
    selling_price: 7500,
    purchase_price: 4800,
    stock: 30,
    unit: 'Kit',
  },
  {
    name: 'Tube Pression PVC Ø32 (Barre 4m)',
    reference: 'PLOM-PVC-32',
    description: 'Tube PVC rigide pour alimentation en eau potable et refoulement 10 bars.',
    category: 'Tuyaux',
    image_url: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=700&auto=format&fit=crop&q=80',
    selling_price: 4500,
    purchase_price: 3100,
    stock: 50,
    unit: 'Barre 4m',
  },
  {
    name: 'Coude PVC 90° Ø32 à coller',
    reference: 'RAC-C32-90',
    description: 'Raccord en PVC pour évacuation ou adduction d\'eau haute résistance.',
    category: 'Raccords',
    image_url: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=700&auto=format&fit=crop&q=80',
    selling_price: 650,
    purchase_price: 350,
    stock: 180,
    unit: 'Pièce',
  },
  {
    name: 'Câble électrique TH 3x2.5mm² (Rouleau 100m)',
    reference: 'ELEC-TH-25',
    description: 'Câble de cuivre pur standard pour prises électriques et appareillage sécurisé.',
    category: 'Électricité',
    image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=700&auto=format&fit=crop&q=80',
    selling_price: 42000,
    purchase_price: 33000,
    stock: 18,
    unit: 'Rouleau 100m',
  },
  {
    name: 'Disjoncteur différentiel Legrand 32A',
    reference: 'ELEC-LEG-32',
    description: 'Disjoncteur de protection modulaire 32 ampères conforme aux normes CE.',
    category: 'Électricité',
    image_url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=700&auto=format&fit=crop&q=80',
    selling_price: 14500,
    purchase_price: 9800,
    stock: 22,
    unit: 'Pièce',
  },
  {
    name: 'Serrure de sûreté à encastrer avec poignées',
    reference: 'QUIN-VACH-01',
    description: 'Ensemble serrure pêne dormant et demi-tour, 3 clés fournies, haute sécurité.',
    category: 'Quincaillerie',
    image_url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=700&auto=format&fit=crop&q=80',
    selling_price: 18500,
    purchase_price: 12500,
    stock: 16,
    unit: 'Coffret',
  },
  {
    name: 'Brouette de chantier renforcée 90L',
    reference: 'OUT-BROU-01',
    description: 'Brouette peinte avec cuve emboutie et roue gonflée renforcée pour transport de béton et sable.',
    category: 'Outillage',
    image_url: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=700&auto=format&fit=crop&q=80',
    selling_price: 35000,
    purchase_price: 25000,
    stock: 9,
    unit: 'Pièce',
  },
  {
    name: 'Pelle ronde de maçonnerie manche bois',
    reference: 'OUT-PEL-01',
    description: 'Pelle en acier trempé haute durabilité pour malaxage de mortier et terrassement.',
    category: 'Outillage',
    image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=700&auto=format&fit=crop&q=80',
    selling_price: 4500,
    purchase_price: 2900,
    stock: 28,
    unit: 'Pièce',
  },
];

export async function checkAndSeedDatabase(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, 'products'));
    if (snap.empty) {
      console.log('Database empty, auto-seeding initial hardware store catalog...');
      await seedHardwareCatalog();
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Initial check skipped:', error);
    return false;
  }
}

export async function seedHardwareCatalog(): Promise<{ count: number }> {
  // Seed categories first
  const catSnap = await getDocs(collection(db, 'categories'));
  if (catSnap.empty) {
    for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
      await createCategory(DEFAULT_CATEGORIES[i], i);
    }
  }

  // Seed products
  let count = 0;
  for (const prod of INITIAL_DEMO_PRODUCTS) {
    await createProduct(
      {
        name: prod.name,
        reference: prod.reference,
        description: prod.description,
        category: prod.category,
        image_url: prod.image_url,
        selling_price: prod.selling_price,
        stock: prod.stock,
        unit: prod.unit,
        active: true,
      },
      prod.purchase_price
    );
    count++;
  }
  return { count };
}

export async function clearAllProducts(): Promise<void> {
  const snap = await getDocs(collection(db, 'products'));
  for (const d of snap.docs) {
    await deleteDoc(d.ref);
    try {
      await deleteDoc(doc(db, 'product_costs', d.id));
    } catch {
      // Ignore
    }
  }
}
