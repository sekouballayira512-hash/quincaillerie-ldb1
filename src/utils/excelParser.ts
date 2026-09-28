import * as XLSX from 'xlsx';
import { cleanAndFormatImageUrl } from './formatters';

export interface ParsedProductRow {
  id: string; // temporary row id
  name: string;
  reference: string;
  description: string;
  category: string;
  image_url: string;
  selling_price: number;
  purchase_price: number;
  stock: number;
  unit: string;
  isValid: boolean;
  errors: string[];
}

export interface ParseExcelResult {
  products: ParsedProductRow[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateReferences: string[];
  detectedColumns: { original: string; mappedTo: string }[];
}

function normalizeKey(key: string): string {
  if (!key) return '';
  return String(key)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Intelligent number parser handling French, English, and FCFA currency strings
 */
export function parseCleanNumber(val: unknown): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (!val) return 0;

  let s = String(val).trim();
  // Strip currency tokens
  s = s.replace(/fcfa|cfa|f\s*cfa|\$|€|eur|xof/gi, '').trim();
  // Strip spaces (including non-breaking spaces)
  s = s.replace(/[\s\u00A0\u202F]+/g, '');

  if (!s) return 0;

  // Handle commas and periods
  if (s.includes(',') && s.includes('.')) {
    if (s.indexOf('.') < s.indexOf(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    const parts = s.split(',');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 3) {
      s = parts[0] + parts[1];
    } else {
      s = s.replace(',', '.');
    }
  }

  const num = parseFloat(s.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : Math.abs(num);
}

type ColumnRole =
  | 'name'
  | 'reference'
  | 'description'
  | 'category'
  | 'image_url'
  | 'selling_price'
  | 'purchase_price'
  | 'stock'
  | 'unit'
  | 'unknown';

function detectColumnRole(header: string): ColumnRole {
  const norm = normalizeKey(header);
  if (!norm) return 'unknown';

  // 1. Purchase price (Check BEFORE selling price)
  if (
    norm.includes('achat') ||
    norm.includes('purchase') ||
    norm.includes('cout') ||
    norm.includes('revient') ||
    norm === 'pa' ||
    (norm.startsWith('pa') && norm.length <= 4) ||
    norm.includes('prixfournisseur')
  ) {
    return 'purchase_price';
  }

  // 2. Selling price (Vente, Prix, PV, PU, Tarif, Montant)
  if (
    norm.includes('vente') ||
    norm.includes('selling') ||
    norm.includes('prix') ||
    norm.includes('price') ||
    norm.includes('tarif') ||
    norm.includes('montant') ||
    norm === 'pv' ||
    norm === 'pu' ||
    norm.includes('prixunitaire') ||
    norm.includes('prixttc') ||
    norm.includes('prixht')
  ) {
    return 'selling_price';
  }

  // 3. Photo / URL / Image (Check thoroughly for all French/English synonyms)
  if (
    norm.includes('url') ||
    norm.includes('image') ||
    norm.includes('photo') ||
    norm.includes('img') ||
    norm.includes('picture') ||
    norm.includes('pic') ||
    norm.includes('pics') ||
    norm.includes('pictures') ||
    norm.includes('lien') ||
    norm.includes('visuel') ||
    norm.includes('vignette') ||
    norm.includes('illustration') ||
    norm.includes('media') ||
    norm.includes('fichier') ||
    norm.includes('icone') ||
    norm.includes('apercu')
  ) {
    return 'image_url';
  }

  // 4. Stock / Quantité
  if (
    norm.includes('stock') ||
    norm.includes('qte') ||
    norm.includes('quantite') ||
    norm.includes('qty') ||
    norm.includes('dispo') ||
    norm.includes('inventaire') ||
    norm.includes('nombre')
  ) {
    return 'stock';
  }

  // 5. Référence / Code
  if (
    norm.includes('ref') ||
    norm.includes('code') ||
    norm.includes('sku') ||
    norm.includes('numero') ||
    norm === 'id'
  ) {
    return 'reference';
  }

  // 6. Catégorie / Famille / Rayon
  if (
    norm.includes('cat') ||
    norm.includes('famille') ||
    norm.includes('rayon') ||
    norm.includes('groupe') ||
    norm.includes('type')
  ) {
    return 'category';
  }

  // 7. Unité
  if (
    norm.includes('unit') ||
    norm.includes('mesure') ||
    norm.includes('conditionnement') ||
    norm.includes('emballage')
  ) {
    return 'unit';
  }

  // 8. Description
  if (
    norm.includes('desc') ||
    norm.includes('caract') ||
    norm.includes('detail') ||
    norm.includes('info')
  ) {
    return 'description';
  }

  // 9. Nom / Désignation / Article / Libellé
  if (
    norm.includes('nom') ||
    norm.includes('design') ||
    norm.includes('article') ||
    norm.includes('libelle') ||
    norm.includes('produit') ||
    norm.includes('item') ||
    norm.includes('name') ||
    norm.includes('titre')
  ) {
    return 'name';
  }

  return 'unknown';
}

export async function parseExcelOrCsvFile(file: File): Promise<ParseExcelResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
    blankrows: false,
  });

  if (rawRows.length === 0) {
    return {
      products: [],
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
      duplicateReferences: [],
      detectedColumns: [],
    };
  }

  const firstRowKeys = Object.keys(rawRows[0] || {});
  const columnMapping = new Map<string, ColumnRole>();
  const detectedColumns: { original: string; mappedTo: string }[] = [];

  firstRowKeys.forEach(col => {
    const role = detectColumnRole(col);
    columnMapping.set(col, role);
    if (role !== 'unknown') {
      const labels: Record<string, string> = {
        name: 'Nom / Désignation',
        reference: 'Référence',
        description: 'Description',
        category: 'Catégorie',
        image_url: 'Photo / URL',
        selling_price: 'Prix de vente',
        purchase_price: 'Prix d\'achat',
        stock: 'Stock',
        unit: 'Unité',
      };
      detectedColumns.push({ original: col, mappedTo: labels[role] || role });
    }
  });

  // Smart URL Content-sniffing: If no column header matched 'image_url', check cell contents
  const hasImageColumn = Array.from(columnMapping.values()).includes('image_url');
  if (!hasImageColumn) {
    for (const key of firstRowKeys) {
      if (columnMapping.get(key) === 'unknown') {
        const containsWebUrls = rawRows.slice(0, 15).some(r => {
          const val = String(r[key] || '').trim().toLowerCase();
          return (
            val.startsWith('http://') ||
            val.startsWith('https://') ||
            val.startsWith('//') ||
            val.startsWith('www.') ||
            val.includes('drive.google.com') ||
            val.includes('dropbox.com') ||
            val.includes('cloudinary.com') ||
            val.includes('unsplash.com') ||
            val.includes('imgur.com') ||
            /\.(jpe?g|png|webp|gif|svg|avif)($|\?)/i.test(val)
          );
        });
        if (containsWebUrls) {
          columnMapping.set(key, 'image_url');
          detectedColumns.push({ original: key, mappedTo: 'Photo / URL (auto-détecté par contenu)' });
          break;
        }
      }
    }
  }

  // Fallback for Name column if not found
  const hasNameColumn = Array.from(columnMapping.values()).includes('name');
  if (!hasNameColumn && firstRowKeys.length > 0) {
    columnMapping.set(firstRowKeys[0], 'name');
    detectedColumns.unshift({ original: firstRowKeys[0], mappedTo: 'Nom (auto-détecté)' });
  }

  // Fallback for Price column if not found
  const hasPriceColumn = Array.from(columnMapping.values()).includes('selling_price');
  if (!hasPriceColumn) {
    for (const key of firstRowKeys) {
      if (columnMapping.get(key) === 'unknown') {
        const val = rawRows[0][key];
        if (typeof val === 'number' || (typeof val === 'string' && /[0-9]/.test(val))) {
          columnMapping.set(key, 'selling_price');
          detectedColumns.push({ original: key, mappedTo: 'Prix de vente (auto-détecté)' });
          break;
        }
      }
    }
  }

  const products: ParsedProductRow[] = [];
  const refMap = new Map<string, number>();

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    let name = '';
    let reference = '';
    let description = '';
    let category = '';
    let image_url = '';
    let selling_price = 0;
    let purchase_price = 0;
    let stock = 10;
    let unit = 'Pièce';

    let hasAnyData = false;

    for (const [key, rawVal] of Object.entries(row)) {
      if (rawVal !== '' && rawVal !== null && rawVal !== undefined) {
        hasAnyData = true;
      }

      const role = columnMapping.get(key) || detectColumnRole(key);
      const strVal = String(rawVal ?? '').trim();

      switch (role) {
        case 'name':
          if (!name && strVal) name = strVal;
          break;
        case 'reference':
          if (!reference && strVal) reference = strVal;
          break;
        case 'description':
          if (!description && strVal) description = strVal;
          break;
        case 'category':
          if (!category && strVal) category = strVal;
          break;
        case 'image_url':
          if (strVal) {
            // Automatically clean quotes, whitespace, and convert Google Drive/Dropbox links
            const cleaned = cleanAndFormatImageUrl(strVal);
            if (cleaned) image_url = cleaned;
          }
          break;
        case 'selling_price':
          if (strVal || typeof rawVal === 'number') {
            const p = parseCleanNumber(rawVal);
            if (p > 0) selling_price = p;
          }
          break;
        case 'purchase_price':
          if (strVal || typeof rawVal === 'number') {
            const p = parseCleanNumber(rawVal);
            if (p > 0) purchase_price = p;
          }
          break;
        case 'stock':
          if (strVal || typeof rawVal === 'number') {
            const s = Math.round(parseCleanNumber(rawVal));
            stock = Math.max(0, s);
          }
          break;
        case 'unit':
          if (strVal) unit = strVal;
          break;
      }
    }

    // Skip empty lines
    if (!hasAnyData || (!name && selling_price === 0 && !reference)) {
      continue;
    }

    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Nom manquant');
    }

    if (selling_price <= 0) {
      errors.push('Prix de vente non détecté ou égal à 0');
    }

    if (!reference) {
      reference = `REF-LDB-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    if (!category) {
      category = 'Quincaillerie';
    }

    if (!unit) {
      unit = 'Pièce';
    }

    // If no valid image URL was provided in this row, assign default placeholder
    if (!image_url) {
      image_url = 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=600&auto=format&fit=crop&q=80';
    }

    const cleanRef = reference.toUpperCase().trim();
    refMap.set(cleanRef, (refMap.get(cleanRef) || 0) + 1);

    products.push({
      id: `row-${i}-${Date.now()}`,
      name: name.trim(),
      reference: cleanRef,
      description: description || `Produit sélectionné pour vos chantiers et travaux.`,
      category: category.trim(),
      image_url: image_url.trim(),
      selling_price,
      purchase_price,
      stock,
      unit: unit.trim(),
      isValid: errors.length === 0,
      errors,
    });
  }

  const duplicates: string[] = [];
  refMap.forEach((count, ref) => {
    if (count > 1) {
      duplicates.push(ref);
    }
  });

  return {
    products,
    totalRows: products.length,
    validCount: products.filter(p => p.isValid).length,
    invalidCount: products.filter(p => !p.isValid).length,
    duplicateReferences: duplicates,
    detectedColumns,
  };
}

export function generateSampleExcelFile(): void {
  const sampleData = [
    {
      'Nom': 'Perceuse à percussion Bosch 650W',
      'Référence': 'MB001',
      'Description': 'Perceuse électrique puissante et fiable pour tous travaux.',
      'Catégorie': 'Outillage',
      'URL': 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
      'Prix de vente': 45000,
      'Prix d\'achat': 32000,
      'Stock': 15,
      'Unité': 'Pièce',
    },
    {
      'Nom': 'Ciment Dangote 42.5R (50kg)',
      'Référence': 'MAT-CIM-50',
      'Description': 'Ciment haute résistance pour fondations et gros œuvre.',
      'Catégorie': 'Matériaux',
      'URL': 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=80',
      'Prix de vente': 5250,
      'Prix d\'achat': 4600,
      'Stock': 150,
      'Unité': 'Sac',
    },
    {
      'Nom': 'Mitigeur Lavabo Chromé Grohe',
      'Référence': 'ROB-MIT-01',
      'Description': 'Mitigeur design chromé haute durabilité avec flexibles inox.',
      'Catégorie': 'Robinetterie',
      'URL': 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
      'Prix de vente': 18500,
      'Prix d\'achat': 12000,
      'Stock': 8,
      'Unité': 'Pièce',
    },
    {
      'Nom': 'Tube Pression PVC Ø32 (Barre 4m)',
      'Référence': 'PLOM-PVC-32',
      'Description': 'Tube PVC assainissement et adduction d\'eau pression 10 bars.',
      'Catégorie': 'Tuyaux',
      'URL': 'https://images.unsplash.com/photo-1542013936693-884638332954?w=600&auto=format&fit=crop&q=80',
      'Prix de vente': 4500,
      'Prix d\'achat': 3200,
      'Stock': 45,
      'Unité': 'Barre',
    },
    {
      'Nom': 'Peinture Blanche Seigneurie Pantex 15L',
      'Référence': 'PEINT-SEIG-15',
      'Description': 'Peinture acrylique mate blanche haut pouvoir couvrant.',
      'Catégorie': 'Peinture',
      'URL': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=600&auto=format&fit=crop&q=80',
      'Prix de vente': 38000,
      'Prix d\'achat': 29000,
      'Stock': 20,
      'Unité': 'Pot 15L',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produits');
  XLSX.writeFile(wb, 'modele_catalogue_quincaillerie_ldb.xlsx');
}
