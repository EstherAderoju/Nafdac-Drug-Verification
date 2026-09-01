import { VerificationInput } from '../types';

/**
 * Client-side Regex & Heuristic Parser for drug package text.
 * Extracts NRN, active ingredients, strength, manufacturer, and expiry date.
 */
export function parseDrugPackageText(text: string): Partial<VerificationInput> {
  if (!text) return {};

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const result: Partial<VerificationInput> = {
    extracted_package_text: text,
  };

  // 1. NAFDAC Reg No. Regex: e.g., NAFDAC Reg No: A4-1234, NRN: B4-6460, Reg. No. 04-3939, A11-100247
  const nrnMatch = text.match(
    /(?:NAFDAC\s*(?:REG(?:ISTRATION)?\.?\s*(?:NO|NUMBER)?:?|NRN:?|REG\.?\s*NO\.?:?)\s*)([A-Z0-9]{2,3}-[0-9]{4,6}|[0-9]{2}-[0-9]{4})/i
  ) || text.match(/\b([A-Z][0-9]{1,2}-[0-9]{4,6}|[0-9]{2}-[0-9]{4})\b/);

  if (nrnMatch) {
    result.nrn = nrnMatch[1].trim();
  }

  // 2. Strength Extraction: e.g. 20 mg/120 mg, 80mg; 480mg, 500mg, 80 mg/mL, 50 mg/5 mL
  const strengthMatch = text.match(
    /\b(\d+(?:\.\d+)?\s*(?:mg|g|mcg|iu)(?:\s*[\/;+]\s*\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|5ml|mL))*)\b/i
  );
  if (strengthMatch) {
    result.strength = strengthMatch[1].trim();
  }

  // 3. Active Ingredients: Artemether, Lumefantrine, Artesunate, Amodiaquine, Chloroquine, Quinine, Piperaquine, Paracetamol
  const ingredients: string[] = [];
  const commonIngredients = [
    'Artemether',
    'Lumefantrine',
    'Artesunate',
    'Amodiaquine',
    'Chloroquine',
    'Quinine',
    'Piperaquine',
    'Dihydroartemisinin',
    'Paracetamol',
    'Pyronaridine',
    'Sulfadoxine',
    'Pyrimethamine',
  ];

  commonIngredients.forEach(ing => {
    if (new RegExp(`\\b${ing}\\b`, 'i').test(text)) {
      ingredients.push(ing);
    }
  });
  if (ingredients.length > 0) {
    result.active_ingredient = Array.from(new Set(ingredients)).join('; ');
  }

  // 4. Dosage Form
  const formMatch = text.match(/\b(Dispersible Tablet|Tablet|Caplet|Capsule|Softgel|Injection|Syrup|Suspension|Granules)\b/i);
  if (formMatch) {
    result.dosage_form = formMatch[1];
  }

  // 5. Expiry Date: EXP: 2028-05-24 or EXP: 05/2028 or EXP. DATE: 2028
  const expMatch = text.match(/(?:EXP(?:IRY)?\.?\s*(?:DATE)?:?\s*)([0-9]{4}[-/][0-9]{2}(?:[-/][0-9]{2})?|[0-9]{2}[-/][0-9]{4})/i);
  if (expMatch) {
    result.expiry_date = expMatch[1];
  }

  // 6. Batch No
  const bnfMatch = text.match(/(?:B(?:ATCH)?\.?\s*(?:NO|NUMBER)?:?\s*)([A-Z0-9-]+)/i);
  if (bnfMatch) {
    result.batch_number = bnfMatch[1];
  }

  // 7. Manufacturer: Manufactured by ..., Mfd by ...
  const mfgMatch = text.match(/(?:M(?:ANU)?F(?:ACTURED)?\.?\s*BY:?\s*)([^\n,]+(?:Ltd|Limited|PLC|Pvt|GMBH|Co|Laboratories|Pharma)?)/i);
  if (mfgMatch) {
    result.manufacturer_name = mfgMatch[1].trim();
  }

  // 8. Product name heuristics (first non-empty line or line with "Tablets/Syrup")
  if (lines.length > 0) {
    const candidateName = lines.find(l => !l.startsWith('NAFDAC') && !l.startsWith('EXP') && !l.startsWith('BN') && l.length > 3);
    if (candidateName) {
      result.product_name = candidateName.replace(/\b(Tablets|Tablet|Capsules|Syrup|Injection)\b/gi, '').trim();
    }
  }

  return result;
}

/**
 * Server-side AI OCR extraction endpoint wrapper
 */
export async function analyzePackageWithAI(
  imageBase64?: string,
  rawText?: string
): Promise<Partial<VerificationInput>> {
  try {
    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, rawText }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.extracted || parseDrugPackageText(rawText || '');
    }
  } catch (err) {
    console.warn('AI OCR fallback to local parser:', err);
  }
  return parseDrugPackageText(rawText || '');
}
