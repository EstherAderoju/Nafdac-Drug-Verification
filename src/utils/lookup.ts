import { NAFDAC_PRODUCTS } from '../data/nafdacData';
import { NafdacProduct, VerificationInput } from '../types';
import {
  normalizeText,
  normalizeNrn,
  normalizeActiveIngredient,
  normalizeStrength,
  normalizeManufacturer,
  normalizeDosageForm,
} from './normalization';
import { stringSimilarity, tokenSetRatio, strengthSimilarity } from './similarity';

export interface ScoredCandidate {
  product: NafdacProduct;
  similarity_score: number;
  nrn_match: boolean;
  name_similarity: number;
  ingredient_similarity: number;
  strength_similarity: number;
  manufacturer_similarity: number;
  dosage_form_match: boolean;
}

/**
 * Fast lookup system for NAFDAC dataset.
 * Supports NRN exact match, fuzzy product name, active ingredient, manufacturer, and multi-field combinations.
 */
export function searchNafdacDatabase(
  input: VerificationInput,
  products: NafdacProduct[] = NAFDAC_PRODUCTS,
  limit: number = 5
): ScoredCandidate[] {
  const normNrn = normalizeNrn(input.nrn);
  const normName = normalizeText(input.product_name);
  const normIng = normalizeActiveIngredient(input.active_ingredient);
  const normStr = normalizeStrength(input.strength);
  const normMfg = normalizeManufacturer(input.manufacturer_name);
  const normForm = normalizeDosageForm(input.dosage_form);

  const candidates: ScoredCandidate[] = [];

  for (const product of products) {
    const isNrnExact = normNrn !== '' && product.normalized_nrn === normNrn;

    const nameSim = normName
      ? tokenSetRatio(normName, product.normalized_name || '')
      : 0;

    const ingSim = normIng
      ? tokenSetRatio(normIng, product.normalized_ingredient || '')
      : 0;

    const strSim = normStr
      ? strengthSimilarity(normStr, product.normalized_strength || '')
      : 0;

    const mfgSim = normMfg
      ? tokenSetRatio(normMfg, product.normalized_manufacturer || '')
      : 0;

    const formMatch = normForm
      ? (product.normalized_dosage_form || '').includes(normForm) ||
        normForm.includes(product.normalized_dosage_form || '')
      : false;

    // Calculate ranking score based on search priority:
    // 1. Exact NRN (+1000)
    // 2. Exact Name (+300)
    // 3. Name similarity (* 100)
    // 4. Ingredient similarity (* 60)
    // 5. Strength match (* 40)
    // 6. Manufacturer similarity (* 30)
    // 7. Dosage form match (* 20)

    let rankingScore = 0;
    if (isNrnExact) rankingScore += 1000;
    if (normName && normName === product.normalized_name) rankingScore += 300;
    rankingScore += nameSim * 100;
    rankingScore += ingSim * 60;
    rankingScore += strSim * 40;
    rankingScore += mfgSim * 30;
    if (formMatch) rankingScore += 20;

    // Filter out completely irrelevant records when not matching NRN or name
    const hasAnySignal =
      isNrnExact ||
      nameSim > 0.35 ||
      ingSim > 0.6 ||
      (mfgSim > 0.6 && nameSim > 0.2);

    if (hasAnySignal || normNrn === '') {
      candidates.push({
        product,
        similarity_score: rankingScore,
        nrn_match: isNrnExact,
        name_similarity: nameSim,
        ingredient_similarity: ingSim,
        strength_similarity: strSim,
        manufacturer_similarity: mfgSim,
        dosage_form_match: formMatch,
      });
    }
  }

  // Sort descending by ranking score
  candidates.sort((a, b) => b.similarity_score - a.similarity_score);

  return candidates.slice(0, limit);
}

/**
 * Exact NRN Lookup
 */
export function lookupByNrn(
  nrn: string,
  products: NafdacProduct[] = NAFDAC_PRODUCTS
): NafdacProduct | null {
  const normalized = normalizeNrn(nrn);
  if (!normalized) return null;
  return products.find(p => p.normalized_nrn === normalized) || null;
}
