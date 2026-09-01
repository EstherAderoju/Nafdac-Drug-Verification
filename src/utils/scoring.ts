import {
  NafdacProduct,
  VerificationInput,
  VerificationResult,
  FieldMatchResult,
  ScoringRuleItem,
  VerificationClassification,
} from '../types';
import { searchNafdacDatabase } from './lookup';
import {
  normalizeText,
  normalizeNrn,
  normalizeActiveIngredient,
  normalizeStrength,
  normalizeManufacturer,
  normalizeDosageForm,
} from './normalization';
import { stringSimilarity, tokenSetRatio, strengthSimilarity } from './similarity';
import { predictWithML } from './classifier';

export function isDateExpired(dateStr: string | null | undefined): boolean {
  if (!dateStr || dateStr === '0000-00-00') return false;
  try {
    const expDate = new Date(dateStr);
    if (isNaN(expDate.getTime())) return false;
    const now = new Date();
    return expDate.getTime() < now.getTime();
  } catch {
    return false;
  }
}

export function evaluateVerification(
  input: VerificationInput,
  selectedProduct?: NafdacProduct | null
): VerificationResult {
  const candidates = searchNafdacDatabase(input, undefined, 5);
  const matchedProduct: NafdacProduct | null =
    selectedProduct !== undefined ? selectedProduct : candidates[0]?.product || null;

  const scoringBreakdown: ScoringRuleItem[] = [];
  const fieldComparisons: FieldMatchResult[] = [];
  const reasons: string[] = [];

  let rawScore = 0;
  // Maximum possible raw positive score = 40 + 20 + 15 + 10 + 10 + 5 + 10 + 5 = 115
  // Minimum possible raw negative score = -40 - 20 - 20 - 15 - 10 - 5 - 20 - 20 = -150

  const submittedNrn = normalizeNrn(input.nrn);
  const submittedName = normalizeText(input.product_name);
  const submittedIng = normalizeActiveIngredient(input.active_ingredient);
  const submittedStr = normalizeStrength(input.strength);
  const submittedMfg = normalizeManufacturer(input.manufacturer_name);
  const submittedForm = normalizeDosageForm(input.dosage_form);

  if (!matchedProduct) {
    // Product not found at all
    scoringBreakdown.push({
      name: 'NAFDAC Registration Number (NRN)',
      points: -40,
      maxPoints: 40,
      minPoints: -40,
      status: 'negative',
      explanation: submittedNrn
        ? `NRN "${input.nrn}" does not exist in the NAFDAC reference database.`
        : 'No valid NAFDAC Registration Number provided.',
    });
    reasons.push('Product could not be matched with any record in the NAFDAC database.');
    if (submittedNrn) {
      reasons.push(`Submitted NRN (${input.nrn}) is not registered in the reference database.`);
    }

    const confidenceScore = Math.max(0, Math.min(100, Math.round(((rawScore + 150) / 265) * 100)));

    return {
      classification: 'NOT FOUND / UNVERIFIED',
      confidence_score: Math.min(confidenceScore, 15),
      raw_score: -40,
      matched_product: null,
      candidates: candidates.map(c => ({
        product: c.product,
        similarity_score: c.similarity_score,
        nrn_match: c.nrn_match,
        name_similarity: c.name_similarity,
      })),
      field_comparisons: [],
      scoring_breakdown: scoringBreakdown,
      reasons,
      recommendation:
        'This product is unverified in the NAFDAC database. Do not consume without consulting a certified pharmacist or verifying via official NAFDAC regulatory portals.',
      disclaimer:
        'This result is a screening assessment and does not constitute official confirmation that a medicine is genuine or counterfeit.',
      timestamp: new Date().toISOString(),
    };
  }

  // 1. NRN Match (+40 / -40)
  const isNrnMatch = submittedNrn !== '' && submittedNrn === matchedProduct.normalized_nrn;
  if (isNrnMatch) {
    rawScore += 40;
    scoringBreakdown.push({
      name: 'NAFDAC Registration Number (NRN)',
      points: 40,
      maxPoints: 40,
      minPoints: -40,
      status: 'positive',
      explanation: `Valid exact NRN match found: ${matchedProduct.nrn}`,
    });
    reasons.push(`NAFDAC registration number (${matchedProduct.nrn}) was verified in database.`);
  } else {
    rawScore -= 40;
    scoringBreakdown.push({
      name: 'NAFDAC Registration Number (NRN)',
      points: -40,
      maxPoints: 40,
      minPoints: -40,
      status: 'negative',
      explanation: submittedNrn
        ? `NRN mismatch (Submitted: ${input.nrn || 'None'}, Reference: ${matchedProduct.nrn})`
        : `No NRN provided (Matched database record has ${matchedProduct.nrn})`,
    });
    reasons.push(
      submittedNrn
        ? `NRN does not correspond to the matched reference product (${input.nrn} vs ${matchedProduct.nrn}).`
        : 'No NRN was supplied on the package.'
    );
  }

  fieldComparisons.push({
    field: 'NAFDAC Registration Number (NRN)',
    submitted: input.nrn || '(Empty)',
    reference: matchedProduct.nrn,
    matched: isNrnMatch,
    score: isNrnMatch ? 40 : -40,
    reason: isNrnMatch ? 'Exact NRN Match' : 'NRN Mismatch / Unverified',
    similarity: isNrnMatch ? 1 : 0,
  });

  // 2. Product Name (+20 strong, +10 partial, -20 mismatch)
  const nameSim = submittedName ? tokenSetRatio(submittedName, matchedProduct.normalized_name || '') : 0;
  if (nameSim >= 0.85) {
    rawScore += 20;
    scoringBreakdown.push({
      name: 'Product Name',
      points: 20,
      maxPoints: 20,
      minPoints: -20,
      status: 'positive',
      explanation: `Strong product name match (${Math.round(nameSim * 100)}% similarity).`,
    });
    reasons.push(`Product name closely matches the registered NAFDAC name (${matchedProduct.product_name}).`);
  } else if (nameSim >= 0.5) {
    rawScore += 10;
    scoringBreakdown.push({
      name: 'Product Name',
      points: 10,
      maxPoints: 20,
      minPoints: -20,
      status: 'positive',
      explanation: `Partial product name similarity (${Math.round(nameSim * 100)}%).`,
    });
    reasons.push(`Product name has partial similarity (${Math.round(nameSim * 100)}%) with ${matchedProduct.product_name}.`);
  } else {
    rawScore -= 20;
    scoringBreakdown.push({
      name: 'Product Name',
      points: -20,
      maxPoints: 20,
      minPoints: -20,
      status: 'negative',
      explanation: `Product name does not match (${Math.round(nameSim * 100)}% similarity).`,
    });
    reasons.push(`Product name "${input.product_name || 'N/A'}" mismatches reference "${matchedProduct.product_name}".`);
  }

  fieldComparisons.push({
    field: 'Product Name',
    submitted: input.product_name || '(Empty)',
    reference: matchedProduct.product_name,
    matched: nameSim >= 0.85,
    score: nameSim >= 0.85 ? 20 : nameSim >= 0.5 ? 10 : -20,
    reason: nameSim >= 0.85 ? 'Strong Name Match' : nameSim >= 0.5 ? 'Partial Match' : 'Name Mismatch',
    similarity: nameSim,
  });

  // 3. Active Ingredient (+15 exact/strong, -20 mismatch)
  const ingSim = submittedIng ? tokenSetRatio(submittedIng, matchedProduct.normalized_ingredient || '') : 0;
  if (ingSim >= 0.75) {
    rawScore += 15;
    scoringBreakdown.push({
      name: 'Active Ingredient',
      points: 15,
      maxPoints: 15,
      minPoints: -20,
      status: 'positive',
      explanation: `Active ingredient matches: ${matchedProduct.active_ingredient}`,
    });
    reasons.push(`Active ingredient matches (${matchedProduct.active_ingredient}).`);
  } else {
    rawScore -= 20;
    scoringBreakdown.push({
      name: 'Active Ingredient',
      points: -20,
      maxPoints: 15,
      minPoints: -20,
      status: 'negative',
      explanation: `Active ingredient mismatch (Submitted: "${input.active_ingredient || 'None'}", Reference: "${matchedProduct.active_ingredient}")`,
    });
    reasons.push(
      `Active ingredient mismatch: Submitted "${input.active_ingredient || 'N/A'}" vs Reference "${matchedProduct.active_ingredient}".`
    );
  }

  fieldComparisons.push({
    field: 'Active Ingredient',
    submitted: input.active_ingredient || '(Empty)',
    reference: matchedProduct.active_ingredient,
    matched: ingSim >= 0.75,
    score: ingSim >= 0.75 ? 15 : -20,
    reason: ingSim >= 0.75 ? 'Ingredient Match' : 'Ingredient Mismatch',
    similarity: ingSim,
  });

  // 4. Strength (+10 exact match, -15 mismatch)
  const strSim = submittedStr ? strengthSimilarity(submittedStr, matchedProduct.normalized_strength || '') : 0;
  if (strSim >= 0.8) {
    rawScore += 10;
    scoringBreakdown.push({
      name: 'Dosage Strength',
      points: 10,
      maxPoints: 10,
      minPoints: -15,
      status: 'positive',
      explanation: `Dosage strength matches: ${matchedProduct.strength}`,
    });
    reasons.push(`Dosage strength matches (${matchedProduct.strength}).`);
  } else {
    rawScore -= 15;
    scoringBreakdown.push({
      name: 'Dosage Strength',
      points: -15,
      maxPoints: 10,
      minPoints: -15,
      status: 'negative',
      explanation: `Dosage strength mismatch (Submitted: "${input.strength || 'None'}", Reference: "${matchedProduct.strength}")`,
    });
    reasons.push(
      `Strength does not match the registered product (${input.strength || 'N/A'} vs ${matchedProduct.strength}).`
    );
  }

  fieldComparisons.push({
    field: 'Strength',
    submitted: input.strength || '(Empty)',
    reference: matchedProduct.strength,
    matched: strSim >= 0.8,
    score: strSim >= 0.8 ? 10 : -15,
    reason: strSim >= 0.8 ? 'Strength Match' : 'Strength Inconsistency',
    similarity: strSim,
  });

  // 5. Manufacturer (+10 strong match, -10 mismatch)
  const mfgSim = submittedMfg ? tokenSetRatio(submittedMfg, matchedProduct.normalized_manufacturer || '') : 0;
  if (mfgSim >= 0.7) {
    rawScore += 10;
    scoringBreakdown.push({
      name: 'Manufacturer Name',
      points: 10,
      maxPoints: 10,
      minPoints: -10,
      status: 'positive',
      explanation: `Manufacturer matches: ${matchedProduct.manufacturer_name} (${matchedProduct.manufacturer_country})`,
    });
    reasons.push(`Manufacturer matches (${matchedProduct.manufacturer_name}).`);
  } else {
    rawScore -= 10;
    scoringBreakdown.push({
      name: 'Manufacturer Name',
      points: -10,
      maxPoints: 10,
      minPoints: -10,
      status: 'negative',
      explanation: `Manufacturer mismatch (Submitted: "${input.manufacturer_name || 'None'}", Reference: "${matchedProduct.manufacturer_name}")`,
    });
    reasons.push(
      `Manufacturer name does not match the NAFDAC record (Submitted: "${input.manufacturer_name || 'N/A'}" vs "${matchedProduct.manufacturer_name}").`
    );
  }

  fieldComparisons.push({
    field: 'Manufacturer',
    submitted: input.manufacturer_name || '(Empty)',
    reference: `${matchedProduct.manufacturer_name} (${matchedProduct.manufacturer_country})`,
    matched: mfgSim >= 0.7,
    score: mfgSim >= 0.7 ? 10 : -10,
    reason: mfgSim >= 0.7 ? 'Manufacturer Match' : 'Manufacturer Mismatch',
    similarity: mfgSim,
  });

  // 6. Dosage Form (+5 match, -5 mismatch)
  const formMatch = submittedForm
    ? (matchedProduct.normalized_dosage_form || '').includes(submittedForm) ||
      submittedForm.includes(matchedProduct.normalized_dosage_form || '')
    : false;

  if (formMatch || !submittedForm) {
    rawScore += formMatch ? 5 : 0;
    scoringBreakdown.push({
      name: 'Dosage Form',
      points: formMatch ? 5 : 0,
      maxPoints: 5,
      minPoints: -5,
      status: formMatch ? 'positive' : 'neutral',
      explanation: formMatch
        ? `Dosage form matches: ${matchedProduct.dosage_form}`
        : 'Dosage form not specified on input.',
    });
    if (formMatch) reasons.push(`Dosage form (${matchedProduct.dosage_form}) is consistent.`);
  } else {
    rawScore -= 5;
    scoringBreakdown.push({
      name: 'Dosage Form',
      points: -5,
      maxPoints: 5,
      minPoints: -5,
      status: 'negative',
      explanation: `Dosage form mismatch (Submitted: "${input.dosage_form}", Reference: "${matchedProduct.dosage_form}")`,
    });
    reasons.push(`Dosage form mismatch: ${input.dosage_form} vs ${matchedProduct.dosage_form}.`);
  }

  fieldComparisons.push({
    field: 'Dosage Form',
    submitted: input.dosage_form || '(Empty)',
    reference: matchedProduct.dosage_form,
    matched: formMatch,
    score: formMatch ? 5 : -5,
    reason: formMatch ? 'Form Match' : 'Form Mismatch',
    similarity: formMatch ? 1 : 0,
  });

  // 7. Regulatory Status (+10 Active, -20 Inactive)
  const isActive = (matchedProduct.status || '').toLowerCase() === 'active';
  if (isActive) {
    rawScore += 10;
    scoringBreakdown.push({
      name: 'Regulatory Status',
      points: 10,
      maxPoints: 10,
      minPoints: -20,
      status: 'positive',
      explanation: 'Product regulatory registration status is currently ACTIVE.',
    });
    reasons.push('Product regulatory status is Active.');
  } else {
    rawScore -= 20;
    scoringBreakdown.push({
      name: 'Regulatory Status',
      points: -20,
      maxPoints: 10,
      minPoints: -20,
      status: 'negative',
      explanation: `Product status is ${matchedProduct.status || 'INACTIVE'} in NAFDAC registry.`,
    });
    reasons.push(`Product regulatory status is ${matchedProduct.status || 'Inactive'}.`);
  }

  fieldComparisons.push({
    field: 'Regulatory Status',
    submitted: 'Checking Database',
    reference: matchedProduct.status,
    matched: isActive,
    score: isActive ? 10 : -20,
    reason: isActive ? 'Active Registration' : `Status is ${matchedProduct.status}`,
    similarity: isActive ? 1 : 0,
  });

  // 8. Expiry Date (+5 valid, -20 expired)
  const isExpired = isDateExpired(input.expiry_date || matchedProduct.expiry_date);
  if (!isExpired) {
    rawScore += 5;
    scoringBreakdown.push({
      name: 'Product Expiry Status',
      points: 5,
      maxPoints: 5,
      minPoints: -20,
      status: 'positive',
      explanation: `Product validity date is valid (Expiry: ${matchedProduct.expiry_date || 'N/A'}).`,
    });
  } else {
    rawScore -= 20;
    scoringBreakdown.push({
      name: 'Product Expiry Status',
      points: -20,
      maxPoints: 5,
      minPoints: -20,
      status: 'negative',
      explanation: `Product registration or validity date has EXPIRED (${matchedProduct.expiry_date}).`,
    });
    reasons.push(`Product expiry date has elapsed (${matchedProduct.expiry_date}).`);
  }

  fieldComparisons.push({
    field: 'Expiry Date',
    submitted: input.expiry_date || 'N/A',
    reference: matchedProduct.expiry_date || 'N/A',
    matched: !isExpired,
    score: !isExpired ? 5 : -20,
    reason: !isExpired ? 'Product is within valid date' : 'Product Expiry Date Passed',
    similarity: !isExpired ? 1 : 0,
  });

  // Normalize rawScore from [-150, 115] range to [0, 100]
  // In typical matching:
  // All matches = 40+20+15+10+10+5+10+5 = 115 points -> 100%
  // 0 raw points -> ~55%
  // All mismatch = -150 points -> 0%
  let normalizedScore = Math.round(((rawScore - (-145)) / (115 - (-145))) * 100);
  normalizedScore = Math.max(0, Math.min(100, normalizedScore));

  // Determine Classification based on configured thresholds:
  // 80–100: LIKELY GENUINE
  // 50–79: SUSPICIOUS / NEEDS VERIFICATION
  // 0–49: NOT FOUND / HIGHLY SUSPICIOUS
  let classification: VerificationClassification;
  if (isExpired && normalizedScore >= 50) {
    classification = 'SUSPICIOUS / EXPIRED';
  } else if (normalizedScore >= 80 && isNrnMatch && nameSim >= 0.8 && ingSim >= 0.7) {
    classification = 'LIKELY GENUINE';
  } else if (normalizedScore >= 50) {
    classification = 'SUSPICIOUS';
  } else {
    classification = 'NOT FOUND / UNVERIFIED';
  }

  // Machine Learning Baseline feature vector and prediction
  const mlPrediction = predictWithML({
    product_name_similarity: nameSim,
    active_ingredient_match: ingSim >= 0.75 ? 1 : 0,
    strength_match: strSim >= 0.8 ? 1 : 0,
    manufacturer_match: mfgSim >= 0.7 ? 1 : 0,
    dosage_form_match: formMatch ? 1 : 0,
    nrn_match: isNrnMatch ? 1 : 0,
    status_valid: isActive ? 1 : 0,
    expiry_valid: !isExpired ? 1 : 0,
    ingredient_similarity: ingSim,
    manufacturer_similarity: mfgSim,
    number_of_matching_fields: [isNrnMatch, nameSim >= 0.8, ingSim >= 0.75, strSim >= 0.8, mfgSim >= 0.7, formMatch, isActive, !isExpired].filter(Boolean).length,
  });

  const recommendation =
    classification === 'LIKELY GENUINE'
      ? 'Product details closely correspond with authoritative NAFDAC records. Always inspect physical packaging security seals and hologram labels prior to administration.'
      : classification === 'SUSPICIOUS / EXPIRED'
      ? 'Do not use this product. The expiry date has elapsed or regulatory registration has lapsed. Report suspicious batches to NAFDAC pharmacovigilance.'
      : 'Inconsistencies detected. Do not rely on this result alone. Verify the product through official NAFDAC regulatory channels or consult a licensed pharmacist.';

  let barcodeNote: string | undefined;
  if (input.barcode) {
    barcodeNote =
      'Barcode detected, but this barcode could not be independently verified against the available NAFDAC reference data (barcode registry linkage pending regulatory integration).';
  }

  return {
    classification,
    confidence_score: normalizedScore,
    raw_score: rawScore,
    matched_product: matchedProduct,
    candidates: candidates.map(c => ({
      product: c.product,
      similarity_score: c.similarity_score,
      nrn_match: c.nrn_match,
      name_similarity: c.name_similarity,
    })),
    field_comparisons: fieldComparisons,
    scoring_breakdown: scoringBreakdown,
    reasons,
    recommendation,
    disclaimer:
      'This result is a screening assessment and does not constitute official confirmation that a medicine is genuine or counterfeit.',
    barcode_note: barcodeNote,
    ml_prediction: mlPrediction,
    timestamp: new Date().toISOString(),
  };
}
