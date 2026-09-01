/**
 * Text Normalization Pipeline for Pharmaceutical Drug Information
 * Normalizes NRN, product names, active ingredients, strengths, dosage forms, and manufacturer names.
 */

export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s/.-]/g, ' ') // keep alphanumeric, slash, dot, dash
    .replace(/\s+/g, ' ');
}

export function normalizeNrn(nrn: string | null | undefined): string {
  if (!nrn) return '';
  // NAFDAC numbers typically follow formats like: A4-1234, B4-6460, 04-3939, A11-100247, C4-0160
  return nrn
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/\s+/g, '');
}

export function normalizeStrength(strength: string | null | undefined): string {
  if (!strength) return '';
  return strength
    .toLowerCase()
    .replace(/\s*;\s*/g, '; ')
    .replace(/(\d+)\s*(mg|g|mcg|ml|l|%|iu|iu\/ml|mg\/ml|mg\/5ml|mg\/5\s*ml|g\/100ml)/gi, '$1$2')
    .replace(/mg\/5\s*ml/gi, 'mg/5ml')
    .replace(/base/gi, '')
    .replace(/approx\.?/gi, '')
    .replace(/equiv(alent)?\.?\s*to/gi, 'equiv')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeDosageForm(form: string | null | undefined): string {
  if (!form) return '';
  const lower = form.toLowerCase().trim();
  if (lower.includes('dispersible')) return 'dispersible tablet';
  if (lower.includes('tablets') || lower.includes('tablet') || lower.includes('caplet')) return 'tablet';
  if (lower.includes('capsule') || lower.includes('softgel') || lower.includes('soft gel')) return 'capsule';
  if (lower.includes('injection') || lower.includes('solution for injection') || lower.includes('powder for injection')) return 'injection';
  if (lower.includes('syrup') || lower.includes('oral liquid') || lower.includes('liquid') || lower.includes('drop')) return 'syrup';
  if (lower.includes('suspension') || lower.includes('powder for suspension')) return 'suspension';
  if (lower.includes('granule') || lower.includes('oral powder') || lower.includes('powder')) return 'powder/granules';
  return lower;
}

export function normalizeActiveIngredient(ingredient: string | null | undefined): string {
  if (!ingredient) return '';
  return ingredient
    .toLowerCase()
    .replace(/\(as [^)]+\)/g, '')
    .replace(/\([^)]+\)/g, '')
    .replace(/hydrochloride/gi, '')
    .replace(/phosphate/gi, '')
    .replace(/sulfate|sulphate/gi, '')
    .replace(/maleate/gi, '')
    .replace(/tetraphosphate/gi, '')
    .replace(/dihydrochloride/gi, '')
    .replace(/;\s*/g, '; ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeManufacturer(mfg: string | null | undefined): string {
  if (!mfg) return '';
  return mfg
    .toLowerCase()
    .replace(/pvt\.?\s*ltd\.?/gi, 'ltd')
    .replace(/limited/gi, 'ltd')
    .replace(/corporation|corp\.?/gi, 'corp')
    .replace(/company|co\.?/gi, 'co')
    .replace(/industries|ind\.?/gi, 'ind')
    .replace(/pharmaceuticals|pharmaceutical|pharma/gi, 'pharma')
    .replace(/plc/gi, '')
    .replace(/m\/s\.?/gi, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
