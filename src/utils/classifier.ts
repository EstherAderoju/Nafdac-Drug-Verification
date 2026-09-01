import { MLFeatureVector, MLPredictionResult, VerificationInput } from '../types';

/**
 * Logistic Regression Weights trained on normalized feature space
 * (Higher weights for NRN match, name similarity, and active ingredient match)
 */
const LOGISTIC_WEIGHTS = {
  bias: -3.2,
  nrn_match: 3.8,
  product_name_similarity: 2.5,
  active_ingredient_match: 1.8,
  strength_match: 1.2,
  manufacturer_match: 1.1,
  dosage_form_match: 0.6,
  status_valid: 0.9,
  expiry_valid: 0.8,
  ingredient_similarity: 1.5,
  manufacturer_similarity: 1.0,
  number_of_matching_fields: 0.4,
};

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));
}

export function predictWithML(features: MLFeatureVector): MLPredictionResult {
  let logit = LOGISTIC_WEIGHTS.bias;
  const contributions: Array<{ feature: string; weight: number; contribution: number }> = [];

  const addContrib = (feature: string, val: number, weight: number) => {
    const c = val * weight;
    logit += c;
    contributions.push({ feature, weight, contribution: Math.round(c * 100) / 100 });
  };

  addContrib('NRN Exact Match', features.nrn_match, LOGISTIC_WEIGHTS.nrn_match);
  addContrib('Product Name Similarity', features.product_name_similarity, LOGISTIC_WEIGHTS.product_name_similarity);
  addContrib('Active Ingredient Match', features.active_ingredient_match, LOGISTIC_WEIGHTS.active_ingredient_match);
  addContrib('Ingredient Similarity', features.ingredient_similarity, LOGISTIC_WEIGHTS.ingredient_similarity);
  addContrib('Strength Match', features.strength_match, LOGISTIC_WEIGHTS.strength_match);
  addContrib('Manufacturer Match', features.manufacturer_match, LOGISTIC_WEIGHTS.manufacturer_match);
  addContrib('Manufacturer Similarity', features.manufacturer_similarity, LOGISTIC_WEIGHTS.manufacturer_similarity);
  addContrib('Dosage Form Match', features.dosage_form_match, LOGISTIC_WEIGHTS.dosage_form_match);
  addContrib('Regulatory Status Active', features.status_valid, LOGISTIC_WEIGHTS.status_valid);
  addContrib('Valid Expiry Date', features.expiry_valid, LOGISTIC_WEIGHTS.expiry_valid);
  addContrib('Number of Matching Fields', features.number_of_matching_fields, LOGISTIC_WEIGHTS.number_of_matching_fields);

  const genuineProb = Math.round(sigmoid(logit) * 100) / 100;
  const suspiciousProb = Math.round((1 - genuineProb) * 100) / 100;

  contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

  return {
    model_name: 'Calibrated Logistic Regression (Baseline Screening Model)',
    predicted_label: genuineProb >= 0.65 ? 'LIKELY GENUINE' : 'SUSPICIOUS',
    genuine_probability: genuineProb,
    suspicious_probability: suspiciousProb,
    feature_vector: features,
    feature_importances: contributions,
    note:
      'Interpretable linear model combining regulatory ID certainty with multi-field text similarity vectors.',
  };
}

/**
 * Clearly labeled Synthetic Suspicious & Genuine Test Cases
 * strictly for evaluation and prototype testing.
 */
export interface TestCasePreset {
  id: string;
  name: string;
  category: 'Genuine Reference' | 'Synthetic Suspicious' | 'Expired Test' | 'Unknown Product';
  description: string;
  isSynthetic: boolean;
  expectedClassification: string;
  input: VerificationInput;
}

export const TEST_CASE_PRESETS: TestCasePreset[] = [
  {
    id: 'scenario-1',
    name: 'Scenario 1: Exact Match (Lonart Tablets)',
    category: 'Genuine Reference',
    description: 'Genuine product with exact NRN, name, active ingredient, strength and manufacturer.',
    isSynthetic: false,
    expectedClassification: 'LIKELY GENUINE',
    input: {
      product_name: 'Lonart Tablets',
      nrn: '04-8969',
      active_ingredient: 'Artemether; Lumefantrine',
      strength: '20 mg; 120 mg',
      manufacturer_name: 'Bliss GVS Pharma Limited',
      dosage_form: 'Tablet',
      barcode: '6151100293847',
      expiry_date: '2028-04-25',
    },
  },
  {
    id: 'scenario-2',
    name: 'Scenario 2: Altered NRN Digits (SYNTHETIC)',
    category: 'Synthetic Suspicious',
    description: 'Legitimate product name but the NRN is altered by digits (e.g. 04-9999 vs 04-8969).',
    isSynthetic: true,
    expectedClassification: 'SUSPICIOUS',
    input: {
      product_name: 'Lonart Tablets',
      nrn: '04-9999', // Altered NRN
      active_ingredient: 'Artemether; Lumefantrine',
      strength: '20 mg; 120 mg',
      manufacturer_name: 'Bliss GVS Pharma Limited',
      dosage_form: 'Tablet',
      expiry_date: '2028-04-25',
    },
  },
  {
    id: 'scenario-3',
    name: 'Scenario 3: Wrong Manufacturer (SYNTHETIC)',
    category: 'Synthetic Suspicious',
    description: 'Valid product name & NRN but paired with a non-registered manufacturer.',
    isSynthetic: true,
    expectedClassification: 'SUSPICIOUS',
    input: {
      product_name: 'Artenise Tablets',
      nrn: 'B4-6460',
      active_ingredient: 'Artemether; Lumefantrine',
      strength: '80 mg; 480 mg',
      manufacturer_name: 'Fake Global Pharma Laboratories', // Counterfeit/unregistered manufacturer
      dosage_form: 'Tablet',
      expiry_date: '2026-09-27',
    },
  },
  {
    id: 'scenario-4',
    name: 'Scenario 4: Completely Unknown Product',
    category: 'Unknown Product',
    description: 'Product name and NRN that do not exist in the NAFDAC database at all.',
    isSynthetic: true,
    expectedClassification: 'NOT FOUND / UNVERIFIED',
    input: {
      product_name: 'Apex Super Cure Malaria Fort',
      nrn: 'X9-99999',
      active_ingredient: 'Unknown Chemical Complex',
      strength: '1000 mg',
      manufacturer_name: 'Apex Underground Remedies',
      dosage_form: 'Syrup',
      expiry_date: '2027-01-01',
    },
  },
  {
    id: 'scenario-5',
    name: 'Scenario 5: Expired Drug (Faith Chloroquine Syrup)',
    category: 'Expired Test',
    description: 'Expired NAFDAC product record whose validity date has passed (2023-07-30).',
    isSynthetic: false,
    expectedClassification: 'SUSPICIOUS / EXPIRED',
    input: {
      product_name: 'Faith Chloroquine Syrup',
      nrn: '04-3939',
      active_ingredient: 'Chloroquine (Chloroquine Phosphate)',
      strength: '50 mg/5 mL',
      manufacturer_name: 'Oak-Faith Pharmaceutical Resources Limited',
      dosage_form: 'Syrup',
      expiry_date: '2023-07-30',
    },
  },
  {
    id: 'scenario-6',
    name: 'Scenario 6: Strength Mismatch (SYNTHETIC)',
    category: 'Synthetic Suspicious',
    description: 'Valid product name & NRN but incorrect strength printed on package (500mg instead of 80/480mg).',
    isSynthetic: true,
    expectedClassification: 'SUSPICIOUS',
    input: {
      product_name: 'Duother Forte Tablets',
      nrn: 'B4-3300',
      active_ingredient: 'Artemether; Lumefantrine',
      strength: '500 mg; 1000 mg', // Inconsistent strength
      manufacturer_name: 'Innova Captab Pvt. Ltd',
      dosage_form: 'Tablet',
      expiry_date: '2026-09-27',
    },
  },
  {
    id: 'scenario-7',
    name: 'Scenario 7: Mixed Identity Cross-Contamination (SYNTHETIC)',
    category: 'Synthetic Suspicious',
    description: 'Product name from Emzor Diasunate combined with NRN from Quinine Sulphate.',
    isSynthetic: true,
    expectedClassification: 'SUSPICIOUS',
    input: {
      product_name: 'Diasunate Caplet',
      nrn: 'A4-9045', // NRN of Quinine Sulphate
      active_ingredient: 'Artesunate; Amodiaquine',
      strength: '100 mg; 270 mg',
      manufacturer_name: 'Emzor Pharmaceutical Industries Limited',
      dosage_form: 'Caplet',
      expiry_date: '2026-09-27',
    },
  },
];
