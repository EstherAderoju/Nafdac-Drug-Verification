/**
 * Similarity and Fuzzy Matching Algorithms
 * Includes Levenshtein distance, Token Set Ratio, and Jaro-Winkler for pharmaceutical text.
 */

export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
}

export function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(s1, s2);
  const ratio = 1 - distance / maxLen;

  // Also calculate token overlap similarity
  const tokens1 = new Set(s1.split(/\s+/).filter(t => t.length > 0));
  const tokens2 = new Set(s2.split(/\s+/).filter(t => t.length > 0));

  let intersection = 0;
  tokens1.forEach(t => {
    if (tokens2.has(t)) intersection++;
  });
  const union = new Set([...tokens1, ...tokens2]).size;
  const jaccard = union > 0 ? intersection / union : 0;

  // Weighted combination: 60% Levenshtein, 40% Token Overlap
  return Math.max(0, Math.min(1, 0.6 * ratio + 0.4 * jaccard));
}

export function tokenSetRatio(str1: string, str2: string): number {
  const s1 = str1.trim().toLowerCase();
  const s2 = str2.trim().toLowerCase();
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const t1 = s1.split(/\s+/).filter(Boolean);
  const t2 = s2.split(/\s+/).filter(Boolean);

  const set1 = new Set(t1);
  const set2 = new Set(t2);

  const intersection = Array.from(set1).filter(x => set2.has(x)).sort().join(' ');
  const diff1to2 = Array.from(set1).filter(x => !set2.has(x)).sort().join(' ');
  const diff2to1 = Array.from(set2).filter(x => !set1.has(x)).sort().join(' ');

  const combined1 = [intersection, diff1to2].filter(Boolean).join(' ');
  const combined2 = [intersection, diff2to1].filter(Boolean).join(' ');

  const sim1 = stringSimilarity(intersection, combined1);
  const sim2 = stringSimilarity(intersection, combined2);
  const sim3 = stringSimilarity(combined1, combined2);

  return Math.max(sim1, sim2, sim3);
}

export function strengthSimilarity(str1: string, str2: string): number {
  const norm1 = str1.toLowerCase().replace(/\s+/g, '').replace(/;/g, ',');
  const norm2 = str2.toLowerCase().replace(/\s+/g, '').replace(/;/g, ',');

  if (norm1 === norm2) return 1.0;

  // Extract all numbers + units
  const regex = /(\d+(?:\.\d+)?)\s*(mg|g|mcg|ml|l|%|iu)/gi;
  const matches1 = Array.from(str1.toLowerCase().matchAll(regex)).map(m => `${m[1]}${m[2]}`);
  const matches2 = Array.from(str2.toLowerCase().matchAll(regex)).map(m => `${m[1]}${m[2]}`);

  if (matches1.length > 0 && matches2.length > 0) {
    const s1 = new Set(matches1);
    const s2 = new Set(matches2);
    let common = 0;
    s1.forEach(item => { if (s2.has(item)) common++; });
    const union = new Set([...s1, ...s2]).size;
    return common / union;
  }

  return stringSimilarity(norm1, norm2);
}
