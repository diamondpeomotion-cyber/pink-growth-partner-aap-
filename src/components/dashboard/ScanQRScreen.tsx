import React, { useState } from 'react';
import { QrCode, ArrowLeft, Camera, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export default function ScanQRScreen({ onBack }: { onBack: () => void }) {
  const [scanning, setScanning] = useState(true);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');

  const handleSimulateScan = (code: string) => {
    setScanning(false);
    setScannedCode(code);
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1b1c1b] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm h-16 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-pink-50 text-primary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-primary">Scan Shop QR Code</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 pt-8 space-y-6">
        {scanning ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-64 h-64 bg-gray-900 rounded-2xl relative overflow-hidden flex items-center justify-center shadow-inner mb-6">
              <div className="absolute inset-0 border-2 border-primary/50 animate-pulse rounded-2xl m-4"></div>
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 animate-bounce"></div>
              <Camera size={48} className="text-white/40 mb-2" />
              <p className="text-xs text-white/70 absolute bottom-4">Align QR code within frame</p>
            </div>

            <p className="text-sm text-gray-600 mb-4">Point your camera at the merchant QR code to verify or register.</p>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => handleSimulateScan('SHOP-JAIPUR-8842')}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-md text-sm"
              >
                Simulate Successful Scan
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-green-100 text-success rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">QR Code Verified!</h2>
            <p className="text-sm text-gray-500 mb-6 font-mono bg-gray-50 px-3 py-1 rounded-lg">{scannedCode}</p>

            <div className="bg-pink-50 rounded-2xl p-4 w-full text-left mb-6">
              <h3 className="font-semibold text-primary text-sm mb-1">Glow Beauty Parlour</h3>
              <p className="text-xs text-gray-600">Mansarovar, Jaipur • Status: Active Partner</p>
            </div>

            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setScanning(true)}
                className="flex-1 border border-gray-200 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <RefreshCw size={16} /> Scan Another
              </button>
              <button 
                onClick={onBack}
                className="flex-1 bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-md text-sm"
              >
                Done / Back
              </button>
            </div>
          </div>
        )}

        {/* Manual Code Input */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-2 text-sm">Or Enter Shop Code Manually</h3>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. SHOP-1024"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
            />
            <button 
              onClick={() => {
                if (manualCode) handleSimulateScan(manualCode);
              }}
              className="bg-primary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Verify
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
