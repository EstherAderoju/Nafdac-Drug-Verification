import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  HelpCircle,
  CheckCircle2,
  MinusCircle,
  Info,
  Calendar,
  Building,
  Globe,
  Tag,
  Package,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { NafdacProduct, VerificationResult as ResultType } from '../types';

interface VerificationResultProps {
  result: ResultType;
  onSelectCandidate: (product: NafdacProduct) => void;
}

export const VerificationResult: React.FC<VerificationResultProps> = ({
  result,
  onSelectCandidate,
}) => {
  const [showMLDetails, setShowMLDetails] = useState(false);
  const [showPointsTable, setShowPointsTable] = useState(false);

  const {
    classification,
    confidence_score,
    matched_product,
    candidates,
    field_comparisons,
    scoring_breakdown,
    reasons,
    recommendation,
    disclaimer,
    barcode_note,
    ml_prediction,
  } = result;

  // Theme styling based on classification
  const getBadgeStyle = () => {
    switch (classification) {
      case 'LIKELY GENUINE':
        return {
          bannerBg: 'bg-emerald-50 border border-emerald-100',
          circleBg: 'bg-emerald-600',
          titleColor: 'text-emerald-900',
          descColor: 'text-emerald-700',
          scoreColor: 'text-emerald-600',
          icon: ShieldCheck,
        };
      case 'SUSPICIOUS':
      case 'SUSPICIOUS / EXPIRED':
        return {
          bannerBg: 'bg-amber-50 border border-amber-200',
          circleBg: 'bg-amber-500',
          titleColor: 'text-amber-900',
          descColor: 'text-amber-700',
          scoreColor: 'text-amber-600',
          icon: AlertTriangle,
        };
      case 'NOT FOUND / UNVERIFIED':
      default:
        return {
          bannerBg: 'bg-rose-50 border border-rose-200',
          circleBg: 'bg-rose-600',
          titleColor: 'text-rose-900',
          descColor: 'text-rose-700',
          scoreColor: 'text-rose-600',
          icon: XCircle,
        };
    }
  };

  const theme = getBadgeStyle();
  const Icon = theme.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-7 text-slate-900 animate-in fade-in duration-200">
      {/* Top Screening Header & Confidence Score */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-1">
            Screening Result
          </h2>
          <p className="text-slate-500 max-w-lg text-xs sm:text-sm">
            Cross-examination of package parameters against the authoritative NAFDAC registered product registry.
          </p>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <div className={`text-4xl sm:text-5xl font-black ${theme.scoreColor} leading-none`}>
            {confidence_score}
            <span className="text-lg sm:text-xl text-slate-400 font-normal">/100</span>
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
            Confidence Score
          </div>
        </div>
      </div>

      {/* Hero Classification Banner */}
      <div className={`${theme.bannerBg} rounded-xl p-5 sm:p-6 flex items-center gap-5`}>
        <div className={`w-14 h-14 ${theme.circleBg} rounded-full flex items-center justify-center shrink-0 text-white shadow-xs`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className={`font-bold text-lg sm:text-xl ${theme.titleColor}`}>
              {classification}
            </h3>
            {matched_product && (
              <span className="text-xs font-mono bg-white/80 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                NRN: {matched_product.nrn}
              </span>
            )}
          </div>
          <p className={`${theme.descColor} text-xs sm:text-sm mt-0.5`}>
            {recommendation}
          </p>
        </div>
      </div>

      {/* Barcode Notice If Present */}
      {barcode_note && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{barcode_note}</p>
        </div>
      )}

      {/* Multi-Candidate Selection */}
      {candidates.length > 1 && (
        <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multiple Registry Candidates ({candidates.length} Found)</span>
            </span>
            <span className="text-[11px] text-slate-500">Select candidate to inspect</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {candidates.map((c, i) => {
              const isSelected = matched_product?.id === c.product.id;
              return (
                <button
                  key={c.product.id || i}
                  type="button"
                  onClick={() => onSelectCandidate(c.product)}
                  className={`p-2.5 rounded-lg text-left border transition ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-400 text-slate-900 shadow-xs'
                      : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                      {c.product.product_name}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-700 font-bold">
                      {c.product.nrn}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-1">
                    {c.product.manufacturer_name}
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">{c.product.dosage_form}</span>
                    <span className="text-emerald-600 font-bold">
                      Match: {Math.round(c.name_similarity * 100)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Match Explanation & Official Record Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Match Explanation */}
        <section>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Match Explanation
          </h4>
          <ul className="space-y-2.5">
            {reasons.map((reason, idx) => {
              const isNegative =
                reason.toLowerCase().includes('mismatch') ||
                reason.toLowerCase().includes('not registered') ||
                reason.toLowerCase().includes('expired') ||
                reason.toLowerCase().includes('inactive') ||
                reason.toLowerCase().includes('does not');
              return (
                <li
                  key={idx}
                  className="flex items-center gap-3 text-xs sm:text-sm font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100"
                >
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isNegative ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  ></div>
                  <span className="flex-1">{reason}</span>
                  <span
                    className={`font-mono font-bold text-xs shrink-0 ${
                      isNegative ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {isNegative ? 'Penalty' : 'Verified'}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Official Reference Record Details Card */}
        <section className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Official Record Details
            </h4>
            {matched_product && (
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  matched_product.status.toLowerCase() === 'active'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {matched_product.status}
              </span>
            )}
          </div>

          {matched_product ? (
            <div className="space-y-3.5 text-xs">
              <div>
                <p className="text-slate-400 font-medium mb-0.5">Product Brand Name</p>
                <p className="text-slate-900 font-bold text-sm">{matched_product.product_name}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium mb-0.5">Active Ingredient</p>
                <p className="text-slate-800 font-semibold">{matched_product.active_ingredient}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium mb-0.5">Applicant / Distributor</p>
                <p className="text-slate-800 font-semibold">{matched_product.applicant_name}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium mb-0.5">Manufacturer & Country</p>
                <p className="text-slate-800 font-semibold">
                  {matched_product.manufacturer_name} ({matched_product.manufacturer_country})
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <p className="text-slate-400 font-medium mb-0.5">Approval Date</p>
                  <p className="text-slate-800 font-mono font-bold">{matched_product.approval_date}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium mb-0.5">Expiry Date</p>
                  <p className="text-slate-800 font-mono font-bold">{matched_product.expiry_date}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 font-medium mb-0.5">Strength</p>
                  <p className="text-slate-800 font-medium">{matched_product.strength}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium mb-0.5">Dosage Form</p>
                  <p className="text-slate-800 font-medium">{matched_product.dosage_form}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No direct registered record match was found for the supplied registration key.
            </div>
          )}
        </section>
      </div>

      {/* Field-by-Field Comparison Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Field-by-Field Comparison Matrix
          </h4>
          <button
            type="button"
            onClick={() => setShowPointsTable(!showPointsTable)}
            className="text-[11px] text-emerald-600 font-bold hover:underline flex items-center space-x-1"
          >
            <span>{showPointsTable ? 'Hide Scoring Logic' : 'View Scoring Weight Logic'}</span>
            {showPointsTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Field</th>
                <th className="px-4 py-3">Submitted Value</th>
                <th className="px-4 py-3">NAFDAC Reference Value</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {field_comparisons.map((fc, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-semibold text-slate-800">{fc.field}</td>
                  <td className="px-4 py-3 text-slate-700 font-mono text-[11px]">
                    {fc.submitted}
                  </td>
                  <td className="px-4 py-3 text-slate-900 font-mono text-[11px] font-medium">
                    {fc.reference}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        fc.matched
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {fc.matched ? 'MATCH' : 'MISMATCH'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">
                    <span className={fc.score >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      {fc.score > 0 ? `+${fc.score}` : fc.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Point Weight Breakdown Drawer */}
      {showPointsTable && (
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
          <h5 className="text-xs font-bold uppercase tracking-widest text-slate-600">
            Explainable Suspicion Scoring Rules
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {scoring_breakdown.map((rule, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between shadow-xs"
              >
                <div>
                  <p className="font-bold text-slate-800">{rule.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{rule.explanation}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <span
                    className={`font-mono font-bold text-sm ${
                      rule.points >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {rule.points > 0 ? `+${rule.points}` : rule.points}
                  </span>
                  <p className="text-[10px] text-slate-400">
                    [{rule.minPoints} to +{rule.maxPoints}]
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Machine Learning Baseline Section */}
      {ml_prediction && (
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold uppercase tracking-widest text-purple-900">
                Machine Learning Baseline Screening
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowMLDetails(!showMLDetails)}
              className="text-[11px] text-purple-700 font-bold hover:underline flex items-center space-x-1"
            >
              <span>{showMLDetails ? 'Hide Log-Odds' : 'Inspect Feature Contributions'}</span>
              {showMLDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Model Prediction</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{ml_prediction.predicted_label}</p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Genuine Probability</span>
              <p className="text-sm font-mono font-bold text-emerald-600 mt-0.5">
                {Math.round(ml_prediction.genuine_probability * 100)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Suspicious Probability</span>
              <p className="text-sm font-mono font-bold text-amber-600 mt-0.5">
                {Math.round(ml_prediction.suspicious_probability * 100)}%
              </p>
            </div>
          </div>

          {showMLDetails && (
            <div className="space-y-2 pt-3 border-t border-slate-200 animate-in fade-in duration-150">
              <span className="text-[11px] font-semibold text-slate-600">
                Feature Log-Odds Contribution Matrix:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {ml_prediction.feature_importances.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-700 font-medium">{f.feature}</span>
                    <span className="font-mono font-bold text-purple-700">
                      {f.contribution >= 0 ? `+${f.contribution}` : f.contribution}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mandatory Regulatory Disclaimer */}
      <div className="pt-6 border-t border-slate-100">
        <p className="text-[11px] leading-relaxed text-slate-400 italic text-center">
          <strong>DISCLAIMER:</strong> {disclaimer}
        </p>
      </div>
    </div>
  );
};
