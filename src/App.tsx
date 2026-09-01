import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { VerificationForm } from './components/VerificationForm';
import { VerificationResult } from './components/VerificationResult';
import { DatabaseExplorer } from './components/DatabaseExplorer';
import { DataQualityAuditView } from './components/DataQualityAuditView';
import { MLEvaluationView } from './components/MLEvaluationView';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { PackageOCRModal } from './components/PackageOCRModal';
import { NAFDAC_PRODUCTS } from './data/nafdacData';
import { evaluateVerification } from './utils/scoring';
import { NafdacProduct, VerificationInput, VerificationResult as ResultType } from './types';
import { TEST_CASE_PRESETS } from './utils/classifier';

export function App() {
  const [activeTab, setActiveTab] = useState<'checker' | 'database' | 'quality' | 'evaluation'>('checker');
  const [formData, setFormData] = useState<VerificationInput>({
    product_name: 'Lonart Tablets',
    nrn: '04-8969',
    active_ingredient: 'Artemether; Lumefantrine',
    strength: '20 mg; 120 mg',
    manufacturer_name: 'Bliss GVS Pharma Limited',
    dosage_form: 'Tablet',
    barcode: '6151100293847',
    expiry_date: '2028-04-25',
  });

  const [verificationResult, setVerificationResult] = useState<ResultType | null>(() => {
    return evaluateVerification(TEST_CASE_PRESETS[0].input);
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);

  const handleVerify = (customInput?: VerificationInput, selectedCandidate?: NafdacProduct | null) => {
    setIsLoading(true);
    const inputToVerify = customInput || formData;

    setTimeout(() => {
      const result = evaluateVerification(inputToVerify, selectedCandidate);
      setVerificationResult(result);
      setIsLoading(false);

      if (result.classification === 'LIKELY GENUINE') {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#10b981', '#34d399', '#059669'],
          });
        } catch {
          // ignore if canvas not supported
        }
      }
    }, 150);
  };

  const handleReset = () => {
    setFormData({
      product_name: '',
      nrn: '',
      active_ingredient: '',
      strength: '',
      manufacturer_name: '',
      dosage_form: 'Tablet',
      barcode: '',
      expiry_date: '',
      batch_number: '',
      extracted_package_text: '',
    });
    setVerificationResult(null);
  };

  const handleBarcodeDetected = (code: string) => {
    setFormData(prev => ({ ...prev, barcode: code }));
  };

  const handleApplyExtractedData = (extracted: Partial<VerificationInput>) => {
    setFormData(prev => ({
      ...prev,
      ...extracted,
      product_name: extracted.product_name || prev.product_name,
      nrn: extracted.nrn || prev.nrn,
      active_ingredient: extracted.active_ingredient || prev.active_ingredient,
      strength: extracted.strength || prev.strength,
      manufacturer_name: extracted.manufacturer_name || prev.manufacturer_name,
      dosage_form: extracted.dosage_form || prev.dosage_form,
      expiry_date: extracted.expiry_date || prev.expiry_date,
      batch_number: extracted.batch_number || prev.batch_number,
    }));
    // Switch to checker tab and verify
    setActiveTab('checker');
  };

  const handleSelectFromDatabase = (input: VerificationInput) => {
    setFormData(input);
    setActiveTab('checker');
    handleVerify(input);
  };

  const handleSelectCandidate = (candidate: NafdacProduct) => {
    handleVerify(formData, candidate);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datasetCount={NAFDAC_PRODUCTS.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {activeTab === 'checker' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Column */}
            <div className="lg:col-span-5 space-y-6">
              <VerificationForm
                formData={formData}
                setFormData={setFormData}
                onVerify={() => handleVerify()}
                onReset={handleReset}
                onOpenBarcodeScanner={() => setIsBarcodeModalOpen(true)}
                onOpenOCRModal={() => setIsOCRModalOpen(true)}
                isLoading={isLoading}
              />
            </div>

            {/* Result Column */}
            <div className="lg:col-span-7 space-y-6">
              {verificationResult ? (
                <VerificationResult
                  result={verificationResult}
                  onSelectCandidate={handleSelectCandidate}
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                    <span className="text-xl font-bold">?</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Awaiting Product Submission</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Enter product information on the left or select a Quick Test Preset to screen against the NAFDAC reference database.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <DatabaseExplorer onSelectForVerification={handleSelectFromDatabase} />
        )}

        {activeTab === 'quality' && <DataQualityAuditView />}

        {activeTab === 'evaluation' && <MLEvaluationView />}
      </main>

      {/* Modals */}
      <BarcodeScannerModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        onBarcodeDetected={handleBarcodeDetected}
      />

      <PackageOCRModal
        isOpen={isOCRModalOpen}
        onClose={() => setIsOCRModalOpen(false)}
        onApplyExtractedData={handleApplyExtractedData}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-bold tracking-tight text-slate-700 uppercase">
            NAFDAC Pharmaceutical Product Authenticity & Suspicion Screening System
          </p>
          <p className="text-[11px] text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Screening tool powered by authoritative NAFDAC registered product records. This tool is designed to identify inconsistencies and should not be used as the sole determinant of drug authenticity.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
