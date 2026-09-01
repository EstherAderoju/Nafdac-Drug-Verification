import React from 'react';
import {
  Search,
  RotateCcw,
  Camera,
  FileText,
  Sparkles,
  Barcode,
  Layers,
  FlaskConical,
  Building2,
  Calendar,
  KeyRound,
  Pill,
} from 'lucide-react';
import { VerificationInput } from '../types';
import { TEST_CASE_PRESETS, TestCasePreset } from '../utils/classifier';

interface VerificationFormProps {
  formData: VerificationInput;
  setFormData: React.Dispatch<React.SetStateAction<VerificationInput>>;
  onVerify: () => void;
  onReset: () => void;
  onOpenBarcodeScanner: () => void;
  onOpenOCRModal: () => void;
  isLoading: boolean;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({
  formData,
  setFormData,
  onVerify,
  onReset,
  onOpenBarcodeScanner,
  onOpenOCRModal,
  isLoading,
}) => {
  const handleSelectPreset = (preset: TestCasePreset) => {
    setFormData({
      ...preset.input,
      dosage_form: preset.input.dosage_form || 'Tablet',
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6 text-slate-800">
      {/* Product Input Section Header */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          Product Input
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          Enter package parameters to cross-reference against authoritative NAFDAC records
        </p>
      </div>

      {/* Smart Capture Section */}
      <div className="pt-2 border-t border-slate-100">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Smart Capture
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            id="btn-extract-ocr"
            onClick={onOpenOCRModal}
            className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors text-slate-600 hover:text-emerald-700"
          >
            <Sparkles className="w-5 h-5 text-emerald-600 mb-1" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Scan OCR</span>
          </button>

          <button
            type="button"
            id="btn-scan-barcode"
            onClick={onOpenBarcodeScanner}
            className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors text-slate-600 hover:text-emerald-700"
          >
            <Barcode className="w-5 h-5 text-emerald-600 mb-1" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Barcode</span>
          </button>
        </div>
      </div>

      {/* Preset Test Scenarios Section */}
      <div className="pt-2 border-t border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Test Scenarios
          </span>
          <span className="text-[10px] text-slate-400 font-medium uppercase">1-Click Presets</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TEST_CASE_PRESETS.map(preset => {
            const isSynthetic = preset.isSynthetic;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border text-left transition flex items-center space-x-1.5 font-medium ${
                  isSynthetic
                    ? 'bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title={preset.description}
              >
                <span>{preset.name.split(':')[0]}</span>
                {isSynthetic && (
                  <span className="text-[9px] uppercase px-1 py-0.2 bg-purple-200/80 text-purple-900 rounded font-bold">
                    Synthetic
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Fields */}
      <form
        onSubmit={e => {
          e.preventDefault();
          onVerify();
        }}
        className="space-y-4 pt-2 border-t border-slate-100"
      >
        <div className="space-y-3.5">
          {/* NRN (Highest Priority Key) */}
          <div className="flex flex-col gap-1 bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="input-nrn"
                className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center space-x-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>NAFDAC Registration No. (NRN) *</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                Primary Key
              </span>
            </div>
            <input
              id="input-nrn"
              type="text"
              value={formData.nrn}
              onChange={e => setFormData({ ...formData, nrn: e.target.value })}
              placeholder="e.g. 04-8969, B4-6460, A4-1234"
              className="bg-white border border-emerald-300 rounded-lg p-2.5 text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          {/* Product Name */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="input-product-name"
              className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5"
            >
              <Pill className="w-3.5 h-3.5 text-slate-400" />
              <span>Product Brand Name *</span>
            </label>
            <input
              id="input-product-name"
              type="text"
              value={formData.product_name}
              onChange={e => setFormData({ ...formData, product_name: e.target.value })}
              placeholder="e.g. Lonart Tablets, Artenise"
              className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          {/* Active Ingredient */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="input-ingredient"
              className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5 text-slate-400" />
              <span>Active Ingredient(s)</span>
            </label>
            <input
              id="input-ingredient"
              type="text"
              value={formData.active_ingredient}
              onChange={e => setFormData({ ...formData, active_ingredient: e.target.value })}
              placeholder="e.g. Artemether; Lumefantrine"
              className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          {/* Strength & Dosage Form Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="input-strength"
                className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Strength</span>
              </label>
              <input
                id="input-strength"
                type="text"
                value={formData.strength}
                onChange={e => setFormData({ ...formData, strength: e.target.value })}
                placeholder="e.g. 20 mg; 120 mg"
                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="input-dosage-form" className="text-xs font-semibold text-slate-700">
                Dosage Form
              </label>
              <select
                id="input-dosage-form"
                value={formData.dosage_form || 'Tablet'}
                onChange={e => setFormData({ ...formData, dosage_form: e.target.value })}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
              >
                <option value="Tablet">Tablet / Film Coated</option>
                <option value="Dispersible tablet">Dispersible Tablet</option>
                <option value="Caplet">Caplet</option>
                <option value="Capsule">Capsule</option>
                <option value="Injection">Injection</option>
                <option value="Syrup">Syrup / Drops</option>
                <option value="Suspension">Suspension</option>
                <option value="Granules">Granules / Powder</option>
              </select>
            </div>
          </div>

          {/* Manufacturer Name */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="input-manufacturer"
              className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Manufacturer Name</span>
            </label>
            <input
              id="input-manufacturer"
              type="text"
              value={formData.manufacturer_name}
              onChange={e => setFormData({ ...formData, manufacturer_name: e.target.value })}
              placeholder="e.g. Bliss GVS Pharma Limited, Emzor"
              className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
          </div>

          {/* Barcode & Expiry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="input-barcode"
                className="text-xs font-semibold text-slate-700 flex items-center justify-between"
              >
                <span className="flex items-center space-x-1.5">
                  <Barcode className="w-3.5 h-3.5 text-slate-400" />
                  <span>Barcode (Optional)</span>
                </span>
              </label>
              <input
                id="input-barcode"
                type="text"
                value={formData.barcode || ''}
                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="e.g. 6151100293847"
                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="input-expiry"
                className="text-xs font-semibold text-slate-700 flex items-center space-x-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Printed Expiry Date</span>
              </label>
              <input
                id="input-expiry"
                type="text"
                value={formData.expiry_date || ''}
                onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                placeholder="e.g. 2028-05-24"
                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <button
            type="submit"
            id="btn-verify-product"
            disabled={isLoading || (!formData.product_name && !formData.nrn)}
            className="w-full bg-slate-900 text-white py-3.5 rounded-lg font-bold text-sm tracking-widest uppercase hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? 'RUNNING VERIFICATION...' : 'RUN VERIFICATION'}</span>
          </button>

          <button
            type="button"
            id="btn-reset-form"
            onClick={onReset}
            className="w-full py-2 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};
