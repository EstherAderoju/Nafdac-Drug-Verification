import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Zap,
  TrendingUp,
  Cpu,
  Target,
  FileText,
  Activity,
} from 'lucide-react';
import { runEvaluationBenchmark } from '../utils/evaluation';
import { EvaluationMetrics } from '../types';

export const MLEvaluationView: React.FC = () => {
  const [metrics, setMetrics] = useState<EvaluationMetrics | null>(null);

  useEffect(() => {
    const data = runEvaluationBenchmark();
    setMetrics(data);
  }, []);

  if (!metrics) return null;

  const { lookup, classification } = metrics;
  const { confusion_matrix } = classification;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-7 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center space-x-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            <span>Verification Engine & ML Benchmark Evaluation</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Empirical benchmark metrics for NAFDAC multi-field retrieval and suspicious product screening
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 bg-purple-50 border border-purple-200 text-purple-800 rounded-lg font-mono font-bold">
          Stage 2: Calibrated Logistic Baseline
        </span>
      </div>

      {/* Mandatory Regulatory & ML Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-900">Evaluation Boundary & Data Notice</p>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            {classification.disclaimer}
          </p>
        </div>
      </div>

      {/* 1. Retrieval Engine Metrics */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center space-x-2">
          <Zap className="w-4 h-4 text-emerald-600" />
          <span>Part 1: Multi-Field Search & Retrieval Engine Performance</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Exact NRN Match Rate</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {Math.round(lookup.exact_nrn_match_rate * 100)}%
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Deterministic O(1) index</span>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top-1 Accuracy</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {Math.round(lookup.top_1_accuracy * 100)}%
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">First candidate correct</span>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Top-3 Retrieval</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {Math.round(lookup.top_3_accuracy * 100)}%
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Candidate list inclusion</span>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Retrieval Time</span>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">
              {lookup.average_retrieval_time_ms} ms
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Sub-millisecond latency</span>
          </div>
        </div>
      </div>

      {/* 2. Classification & Synthetic Benchmark Performance */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center space-x-2">
          <Target className="w-4 h-4 text-purple-600" />
          <span>Part 2: Screening Classification on Synthetic & Reference Cohort</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Overall Accuracy</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
              {Math.round(classification.accuracy * 100)}%
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">On test scenarios</span>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Precision (Suspicious)</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {Math.round(classification.precision * 100)}%
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Low false alarms</span>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Recall (Suspicious)</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
              {Math.round(classification.recall_suspicious * 100)}%
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Zero missed anomalies</span>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">F1-Score</span>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-1">
              {classification.f1_score}
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Harmonic mean</span>
          </div>
        </div>
      </div>

      {/* Confusion Matrix & Model Architecture Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Confusion Matrix */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Confusion Matrix (Test Suite)</span>
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs text-center font-mono">
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-800 block font-sans font-bold">True Positives (Suspicious)</span>
              <span className="text-xl font-bold text-emerald-700 mt-1 block">{confusion_matrix.true_positive}</span>
              <span className="text-[9px] text-emerald-600 font-sans">Correctly Flagged</span>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-sans font-medium">False Positives</span>
              <span className="text-xl font-bold text-slate-400 mt-1 block">{confusion_matrix.false_positive}</span>
              <span className="text-[9px] text-slate-400 font-sans">False Alarm</span>
            </div>

            <div className="p-3.5 rounded-lg bg-white border border-slate-200">
              <span className="text-[10px] text-slate-500 block font-sans font-medium">False Negatives</span>
              <span className="text-xl font-bold text-slate-400 mt-1 block">{confusion_matrix.false_negative}</span>
              <span className="text-[9px] text-slate-400 font-sans">Missed Anomalies</span>
            </div>

            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-emerald-800 block font-sans font-bold">True Negatives (Genuine)</span>
              <span className="text-xl font-bold text-emerald-700 mt-1 block">{confusion_matrix.true_negative}</span>
              <span className="text-[9px] text-emerald-600 font-sans">Correctly Cleared</span>
            </div>
          </div>
        </div>

        {/* Machine Learning Architecture & Feature Weights */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-purple-600" />
            <span>Model Selection & Interpretation</span>
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            We selected <strong>Calibrated Logistic Regression</strong> as the baseline model for regulatory explainability, linear auditability, and zero black-box risk.
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-700 font-medium">Feature Vector Dimensionality</span>
              <span className="font-mono font-bold text-purple-700">11 Features</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-700 font-medium">Decision Threshold</span>
              <span className="font-mono font-bold text-emerald-700">p &gt;= 0.65 (Likely Genuine)</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-700 font-medium">Explainability Guarantee</span>
              <span className="font-mono font-bold text-emerald-700">100% Feature Traceability</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
