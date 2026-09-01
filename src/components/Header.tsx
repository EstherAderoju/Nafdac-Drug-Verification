import React from 'react';
import { ShieldCheck, Database, BarChart3, FileSearch, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  activeTab: 'checker' | 'database' | 'quality' | 'evaluation';
  setActiveTab: (tab: 'checker' | 'database' | 'quality' | 'evaluation') => void;
  datasetCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, datasetCount }) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs">
      {/* Top Banner Notice */}
      <div className="bg-amber-50 border-b border-amber-200/70 px-4 py-1.5 text-xs text-amber-900 text-center flex items-center justify-center gap-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>
          <strong>NAFDAC Screening Tool:</strong> For preliminary verification only. Does not replace official regulatory confirmation or licensed pharmaceutical consultation.
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between py-3.5 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-800 uppercase">
                  DrugVerify Pro
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  NAFDAC Reference
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                NAFDAC Reference Screening System
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 text-xs font-bold uppercase tracking-wider">
            <button
              id="tab-checker"
              onClick={() => setActiveTab('checker')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'checker'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileSearch className="w-4 h-4 text-emerald-600" />
              <span>Verification</span>
            </button>

            <button
              id="tab-database"
              onClick={() => setActiveTab('database')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'database'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Registry ({datasetCount})</span>
            </button>

            <button
              id="tab-quality"
              onClick={() => setActiveTab('quality')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'quality'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Data Quality</span>
            </button>

            <button
              id="tab-evaluation"
              onClick={() => setActiveTab('evaluation')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'evaluation'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>ML & Metrics</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
