import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  PieChart as PieIcon,
  FileSpreadsheet,
  Layers,
  Database,
  Calendar,
  Building,
  Globe,
} from 'lucide-react';
import { generateDataQualityReport } from '../utils/dataQuality';
import { DataQualityReport } from '../types';

export const DataQualityAuditView: React.FC = () => {
  const [report, setReport] = useState<DataQualityReport | null>(null);

  useEffect(() => {
    const rep = generateDataQualityReport();
    setReport(rep);
  }, []);

  if (!report) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center space-x-2.5">
            <ShieldAlert className="w-6 h-6 text-emerald-600" />
            <span>NAFDAC Dataset Quality & Hygiene Audit</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Systematic inspection of completeness, anomalies, missing attributes, and duplicate records
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg font-mono font-bold">
          {report.total_records} Records Audited
        </span>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Records</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{report.total_records}</p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">100% Ingested</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Unique NRNs</span>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{report.unique_nrns}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Primary Regulatory Key</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duplicate NRNs</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{report.duplicate_nrn_count}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">Resolved via multi-pack</span>
        </div>

        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expired Products</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">{report.expired_count}</p>
          <span className="text-[10px] text-rose-600 font-semibold mt-1 block">Registration lapsed</span>
        </div>
      </div>

      {/* Missing Values Breakdown Matrix */}
      <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center space-x-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Field Missing-Value Analysis (Attribute Completeness)</span>
          </h4>
          <span className="text-[11px] text-slate-400">Benchmark across {report.total_records} rows</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {Object.entries(report.missing_values).map(([field, missingCountVal]) => {
            const missingCount = Number(missingCountVal);
            const pct = Math.round((missingCount / report.total_records) * 100);
            const isHigh = pct > 20;
            return (
              <div
                key={field}
                className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 font-mono text-[11px]">{field}</span>
                  <span className={`font-mono text-xs font-bold ${isHigh ? 'text-amber-600' : 'text-slate-500'}`}>
                    {missingCount} missing ({pct}%)
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isHigh ? 'bg-amber-500' : 'bg-emerald-600'}`}
                    style={{ width: `${100 - pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Completeness: {100 - pct}%</span>
                  <span>{report.total_records - missingCount} populated</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dataset Distributions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Distribution */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Regulatory Status</span>
          </h4>
          <div className="space-y-2 text-xs">
            {Object.entries(report.status_distribution).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-slate-700 font-medium">{status}</span>
                <span className="font-mono font-bold text-slate-900">{String(count)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Manufacturing Countries */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Top Manufacturer Origins</span>
          </h4>
          <div className="space-y-1.5 text-xs max-h-44 overflow-y-auto">
            {Object.entries(report.top_countries)
              .sort((a, b) => Number(b[1]) - Number(a[1]))
              .slice(0, 5)
              .map(([country, count]) => (
                <div key={country} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-700 font-medium truncate max-w-[140px]">{country}</span>
                  <span className="font-mono font-bold text-emerald-600">{String(count)}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Dosage Forms */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600 flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Top Dosage Formats</span>
          </h4>
          <div className="space-y-1.5 text-xs max-h-44 overflow-y-auto">
            {Object.entries(report.dosage_forms)
              .sort((a, b) => Number(b[1]) - Number(a[1]))
              .slice(0, 5)
              .map(([form, count]) => (
                <div key={form} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200">
                  <span className="text-slate-700 font-medium truncate max-w-[140px]">{form}</span>
                  <span className="font-mono font-bold text-purple-600">{String(count)}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};
