import { NAFDAC_PRODUCTS } from '../data/nafdacData';
import { DataQualityReport } from '../types';
import { isDateExpired } from './scoring';

export function generateDataQualityReport(): DataQualityReport {
  const products = NAFDAC_PRODUCTS;
  const total = products.length;

  const missingValues: Record<string, number> = {
    smpc: 0,
    composition: 0,
    packsize: 0,
    product_description: 0,
    nrn: 0,
    active_ingredient: 0,
    strength: 0,
    manufacturer_name: 0,
    manufacturer_country: 0,
    approval_date: 0,
    expiry_date: 0,
  };

  const nrnSet = new Set<string>();
  const duplicateNrns = new Set<string>();
  const statusDist: Record<string, number> = {};
  const dosageForms: Record<string, number> = {};
  const manufacturers: Record<string, number> = {};
  const countries: Record<string, number> = {};

  let expiredCount = 0;
  let activeCount = 0;
  let inactiveCount = 0;
  let invalidDateCount = 0;
  let inconsistentStrengthCount = 0;

  for (const p of products) {
    // Missing values
    if (!p.smpc) missingValues.smpc++;
    if (!p.composition) missingValues.composition++;
    if (!p.packsize) missingValues.packsize++;
    if (!p.product_description) missingValues.product_description++;
    if (!p.nrn) missingValues.nrn++;
    if (!p.active_ingredient) missingValues.active_ingredient++;
    if (!p.strength) missingValues.strength++;
    if (!p.manufacturer_name) missingValues.manufacturer_name++;
    if (!p.manufacturer_country) missingValues.manufacturer_country++;
    if (!p.approval_date || p.approval_date === '0000-00-00') missingValues.approval_date++;
    if (!p.expiry_date || p.expiry_date === '0000-00-00') missingValues.expiry_date++;

    // NRN Duplicates
    if (p.normalized_nrn) {
      if (nrnSet.has(p.normalized_nrn)) {
        duplicateNrns.add(p.normalized_nrn);
      } else {
        nrnSet.add(p.normalized_nrn);
      }
    }

    // Status
    const st = p.status || 'Unspecified';
    statusDist[st] = (statusDist[st] || 0) + 1;
    if (st.toLowerCase() === 'active') activeCount++;
    else if (st.toLowerCase() === 'inactive') inactiveCount++;

    // Expiry
    if (isDateExpired(p.expiry_date) || st.toLowerCase() === 'expired') {
      expiredCount++;
    }

    // Invalid dates (e.g. 0000-00-00 or unparseable)
    if (p.expiry_date === '0000-00-00' || p.approval_date === '0000-00-00') {
      invalidDateCount++;
    }

    // Inconsistent strength
    if (p.strength && (p.strength.includes('+') || p.strength.includes('/') || p.strength.includes('base') || !p.strength.includes('mg'))) {
      inconsistentStrengthCount++;
    }

    // Dosage Forms
    const form = p.dosage_form || 'Unknown';
    dosageForms[form] = (dosageForms[form] || 0) + 1;

    // Manufacturers
    const mfg = p.manufacturer_name || 'Unknown';
    manufacturers[mfg] = (manufacturers[mfg] || 0) + 1;

    // Countries
    const c = p.manufacturer_country || 'Unknown';
    countries[c] = (countries[c] || 0) + 1;
  }

  return {
    total_records: total,
    unique_nrns: nrnSet.size,
    duplicate_nrn_count: duplicateNrns.size,
    missing_values: missingValues,
    status_distribution: statusDist,
    dosage_forms: dosageForms,
    top_manufacturers: manufacturers,
    top_countries: countries,
    expired_count: expiredCount,
    active_count: activeCount,
    inactive_count: inactiveCount,
    invalid_date_count: invalidDateCount,
    inconsistent_strength_count: inconsistentStrengthCount,
  };
}
