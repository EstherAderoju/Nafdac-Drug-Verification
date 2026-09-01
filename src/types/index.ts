export interface NafdacProduct {
  id: string;
  source_file: string;
  product_name: string;
  active_ingredient: string;
  strength: string;
  dosage_form: string;
  roa: string;
  applicant_name: string;
  nrn: string;
  status: 'Active' | 'Inactive' | 'Expired' | 'Pending' | string;
  smpc: string;
  composition: string;
  atc_code: string;
  product_category: string;
  marketing_category: string;
  packsize: string;
  product_description: string;
  manufacturer_name: string;
  manufacturer_country: string;
  approval_date: string;
  expiry_date: string;
  // Normalized searchable fields
  normalized_name?: string;
  normalized_nrn?: string;
  normalized_ingredient?: string;
  normalized_strength?: string;
  normalized_manufacturer?: string;
  normalized_dosage_form?: string;
}

export interface VerificationInput {
  product_name: string;
  nrn: string;
  active_ingredient: string;
  strength: string;
  manufacturer_name: string;
  dosage_form?: string;
  barcode?: string;
  extracted_package_text?: string;
  batch_number?: string;
  expiry_date?: string;
}

export interface FieldMatchResult {
  field: string;
  submitted: string;
  reference: string;
  matched: boolean;
  score: number;
  reason: string;
  similarity?: number;
}

export type VerificationClassification =
  | 'LIKELY GENUINE'
  | 'SUSPICIOUS'
  | 'NOT FOUND / UNVERIFIED'
  | 'SUSPICIOUS / EXPIRED';

export interface ScoringRuleItem {
  name: string;
  points: number;
  maxPoints: number;
  minPoints: number;
  status: 'positive' | 'negative' | 'neutral';
  explanation: string;
}

export interface VerificationResult {
  classification: VerificationClassification;
  confidence_score: number; // 0 to 100
  raw_score: number;
  matched_product: NafdacProduct | null;
  candidates: Array<{
    product: NafdacProduct;
    similarity_score: number;
    nrn_match: boolean;
    name_similarity: number;
  }>;
  field_comparisons: FieldMatchResult[];
  scoring_breakdown: ScoringRuleItem[];
  reasons: string[];
  recommendation: string;
  disclaimer: string;
  barcode_note?: string;
  ml_prediction?: MLPredictionResult;
  is_synthetic?: boolean;
  timestamp: string;
}

export interface MLFeatureVector {
  product_name_similarity: number;
  active_ingredient_match: number;
  strength_match: number;
  manufacturer_match: number;
  dosage_form_match: number;
  nrn_match: number;
  status_valid: number;
  expiry_valid: number;
  ingredient_similarity: number;
  manufacturer_similarity: number;
  number_of_matching_fields: number;
}

export interface MLPredictionResult {
  model_name: string;
  predicted_label: 'LIKELY GENUINE' | 'SUSPICIOUS';
  genuine_probability: number;
  suspicious_probability: number;
  feature_vector: MLFeatureVector;
  feature_importances: Array<{ feature: string; weight: number; contribution: number }>;
  note: string;
}

export interface DataQualityReport {
  total_records: number;
  unique_nrns: number;
  duplicate_nrn_count: number;
  missing_values: Record<string, number>;
  status_distribution: Record<string, number>;
  dosage_forms: Record<string, number>;
  top_manufacturers: Record<string, number>;
  top_countries: Record<string, number>;
  expired_count: number;
  active_count: number;
  inactive_count: number;
  invalid_date_count: number;
  inconsistent_strength_count: number;
}

export interface EvaluationMetrics {
  lookup: {
    total_test_queries: number;
    exact_nrn_match_rate: number;
    top_1_accuracy: number;
    top_3_accuracy: number;
    fuzzy_name_accuracy: number;
    average_retrieval_time_ms: number;
  };
  classification: {
    total_samples: number;
    genuine_samples: number;
    synthetic_suspicious_samples: number;
    accuracy: number;
    precision: number;
    recall_suspicious: number;
    f1_score: number;
    confusion_matrix: {
      true_positive: number; // Suspicious correctly flagged as Suspicious
      false_positive: number; // Genuine mistakenly flagged as Suspicious
      true_negative: number; // Genuine correctly flagged as Genuine
      false_negative: number; // Suspicious missed as Genuine
    };
    disclaimer: string;
  };
}
