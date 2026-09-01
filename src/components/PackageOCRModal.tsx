import React, { useState } from 'react';
import { FileText, X, Check, Upload, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { analyzePackageWithAI } from '../utils/ocrParser';
import { VerificationInput } from '../types';

interface PackageOCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExtractedData: (data: Partial<VerificationInput>) => void;
}

export const PackageOCRModal: React.FC<PackageOCRModalProps> = ({
  isOpen,
  onClose,
  onApplyExtractedData,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [packageText, setPackageText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<Partial<VerificationInput> | null>(null);

  const samplePackageTexts = [
    {
      title: 'Lonart Package Label Text',
      text: `LONART TABLETS
Artemether 20 mg & Lumefantrine 120 mg
NAFDAC REG. NO: 04-8969
Manufactured by: Bliss GVS Pharma Limited, INDIA
Applicant: Greenlife Pharmaceutical Limited, NIGERIA
Batch No: LNT-2024-884
Expiry Date: 2028-04-25
Oral tablet. 1 x 24's`,
    },
    {
      title: 'Artenise Forte Package Text',
      text: `ARTENISE TABLETS 80/480MG
Each tablet contains Artemether 80mg, Lumefantrine 480mg
NAFDAC Reg No: B4-6460
Mfg by: Protech Biosystems Pvt. Ltd, INDIA
Exp: 2026-09-27
POM - Oral administration`,
    },
    {
      title: 'Suspicious / Inconsistent Package',
      text: `LONART DS FORTE
Artemether 500mg, Lumefantrine 1000mg
NAFDAC Reg No: 04-9999
Mfd By: Global Fake Laboratories Ltd
EXP: 2029-01-01
Batch: FK-001`,
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      processOCR(base64, packageText);
    };
    reader.readAsDataURL(file);
  };

  const processOCR = async (imgBase64?: string, rawText?: string) => {
    setIsLoading(true);
    try {
      const parsed = await analyzePackageWithAI(imgBase64, rawText);
      setExtractedData(parsed);
    } catch (err) {
      console.error('OCR processing error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (extractedData) {
      onApplyExtractedData(extractedData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Drug Package OCR & Text Extractor</h3>
              <p className="text-xs text-slate-500">Extract NRN, formulation, and drug details from packaging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Top Info Banner */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-600" />
            <span>
              Extracted fields can be freely edited and confirmed before performing the NAFDAC lookup to ensure optical character errors are rectified.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Image Upload & Text Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  1. Upload Drug Package Photo
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer transition relative bg-slate-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {imagePreview ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview}
                        alt="Package preview"
                        className="max-h-36 mx-auto rounded-lg object-contain border border-slate-200 bg-white"
                      />
                      <p className="text-[11px] text-emerald-700 font-bold">Image loaded • Click to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-1 py-3">
                      <Upload className="w-7 h-7 text-slate-400 mx-auto" />
                      <p className="text-xs text-slate-700 font-bold">Click or drag package image here</p>
                      <p className="text-[11px] text-slate-400">PNG, JPG, WEBP up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    2. Or Paste Raw Package Text
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">OCR transcript / manual text</span>
                </div>
                <textarea
                  value={packageText}
                  onChange={e => setPackageText(e.target.value)}
                  rows={4}
                  placeholder="Paste packaging label text (e.g. NAFDAC Reg No, Active Ingredient, Expiry)..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={() => processOCR(imagePreview || undefined, packageText)}
                  disabled={isLoading || (!imagePreview && !packageText.trim())}
                  className="mt-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition flex items-center justify-center space-x-2 shadow-xs"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Extracting Package Data...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Extract Fields from Text/Image</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sample Package Texts */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Sample Packaging Presets:</span>
                <div className="space-y-1.5">
                  {samplePackageTexts.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPackageText(s.text);
                        processOCR(undefined, s.text);
                      }}
                      className="w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
                    >
                      <p className="text-xs font-bold text-slate-700">{s.title}</p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{s.text.split('\n')[0]} - {s.text.split('\n')[1]}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Extracted & Editable Fields */}
            <div className="space-y-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center justify-between border-b border-slate-200 pb-2">
                <span>Extracted Package Fields</span>
                {extractedData && <span className="text-[11px] text-slate-500 font-medium">Editable</span>}
              </h4>

              {extractedData ? (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Product Name</label>
                    <input
                      type="text"
                      value={extractedData.product_name || ''}
                      onChange={e => setExtractedData({ ...extractedData, product_name: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">NAFDAC NRN</label>
                    <input
                      type="text"
                      value={extractedData.nrn || ''}
                      onChange={e => setExtractedData({ ...extractedData, nrn: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-emerald-700 font-mono font-bold text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Active Ingredient</label>
                    <input
                      type="text"
                      value={extractedData.active_ingredient || ''}
                      onChange={e => setExtractedData({ ...extractedData, active_ingredient: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Strength</label>
                      <input
                        type="text"
                        value={extractedData.strength || ''}
                        onChange={e => setExtractedData({ ...extractedData, strength: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Dosage Form</label>
                      <input
                        type="text"
                        value={extractedData.dosage_form || ''}
                        onChange={e => setExtractedData({ ...extractedData, dosage_form: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Manufacturer</label>
                    <input
                      type="text"
                      value={extractedData.manufacturer_name || ''}
                      onChange={e => setExtractedData({ ...extractedData, manufacturer_name: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Batch No.</label>
                      <input
                        type="text"
                        value={extractedData.batch_number || ''}
                        onChange={e => setExtractedData({ ...extractedData, batch_number: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-800 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Expiry Date</label>
                      <input
                        type="text"
                        value={extractedData.expiry_date || ''}
                        onChange={e => setExtractedData({ ...extractedData, expiry_date: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-md bg-white border border-slate-200 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 opacity-40" />
                  <p className="text-xs">Upload an image or paste package text to view extracted fields</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition border border-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!extractedData}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow-xs"
          >
            <Check className="w-4 h-4" />
            <span>Apply to Verification Checker</span>
          </button>
        </div>
      </div>
    </div>
  );
};
