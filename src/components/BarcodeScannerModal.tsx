import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Check, Barcode as BarcodeIcon, AlertCircle, RefreshCw } from 'lucide-react';
import jsQR from 'jsqr';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBarcodeDetected: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onBarcodeDetected,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const sampleBarcodes = [
    { label: 'Sample EAN-13 (Lonart)', code: '6151100293847' },
    { label: 'Sample GTIN-14 (Artemether)', code: '18901234567890' },
    { label: 'Sample GS1 DataBar', code: '0106151100293847' },
    { label: 'Sample Code-128', code: 'MED-NAFDAC-048969' },
  ];

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setCameraActive(true);
        scanFrame();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        'Unable to access device camera. Please check camera permissions or use manual entry below.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const scanFrame = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (qrCode && qrCode.data) {
            handleSelectBarcode(qrCode.data);
            return;
          }
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(scanFrame);
  };

  const handleSelectBarcode = (code: string) => {
    if (!code.trim()) return;
    onBarcodeDetected(code.trim());
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <BarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Scan / Enter Drug Barcode</h3>
              <p className="text-xs text-slate-500">GS1 / EAN-13 / Code-128 package scanner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Important Regulatory Barcode Notice */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900">Regulatory Barcode Advisory</p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Barcode detected, but this barcode could not be independently verified against the available NAFDAC reference data. A barcode by itself is not proof of authenticity.
              </p>
            </div>
          </div>

          {/* Camera Scanner Viewport */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200 aspect-video flex items-center justify-center">
            {cameraActive ? (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                {/* Laser Overlay Guide */}
                <div className="absolute inset-0 border-2 border-emerald-500/40 pointer-events-none flex items-center justify-center">
                  <div className="w-4/5 h-24 border border-dashed border-emerald-400 rounded-lg relative">
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse"></div>
                  </div>
                </div>
                <span className="absolute bottom-2 left-3 text-[11px] bg-slate-900/80 px-2.5 py-0.5 rounded text-white font-medium">
                  Align barcode inside target
                </span>
              </>
            ) : (
              <div className="text-center p-6 space-y-2">
                <Camera className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-xs text-slate-400 max-w-xs">
                  {cameraError || 'Camera inactive. You can enter or select a test barcode below.'}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition font-medium"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Camera</span>
                </button>
              </div>
            )}
          </div>

          {/* Manual Barcode Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Manual Barcode / GTIN Entry
            </label>
            <div className="flex space-x-2">
              <input
                id="manual-barcode-input"
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                placeholder="e.g. 6151100293847"
                className="flex-1 px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
              />
              <button
                type="button"
                onClick={() => handleSelectBarcode(manualCode)}
                disabled={!manualCode.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition flex items-center space-x-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Apply</span>
              </button>
            </div>
          </div>

          {/* Preset Test Barcodes */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quick Test Barcode Samples:</span>
            <div className="grid grid-cols-2 gap-2">
              {sampleBarcodes.map(b => (
                <button
                  key={b.code}
                  type="button"
                  onClick={() => handleSelectBarcode(b.code)}
                  className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition"
                >
                  <p className="text-xs font-bold text-slate-700">{b.label}</p>
                  <p className="text-[11px] font-mono text-emerald-700 font-bold mt-0.5">{b.code}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition border border-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
