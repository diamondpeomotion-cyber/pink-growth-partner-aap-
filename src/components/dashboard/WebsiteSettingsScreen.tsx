import React, { useState } from 'react';
import { ArrowLeft, Globe, Palette, Store, CheckCircle2, Share2, QrCode, Sparkles, Eye, Save } from 'lucide-react';

export default function WebsiteSettingsScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate?: (page: string) => void }) {
  const [subdomain, setSubdomain] = useState('glowbeauty');
  const [customDomain, setCustomDomain] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('modern-salon');
  const [primaryColor, setPrimaryColor] = useState('#b90064');
  const [isPublished, setIsPublished] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcf9f8] text-[#1b1c1b] pb-28">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm h-16 flex items-center justify-between px-5 md:px-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-pink-50 text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-primary">Website Settings</h1>
            <p className="text-xs text-gray-500">Glow Beauty Parlour • Online Storefront</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Save size={16} /> Save Changes
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-5 pt-8 space-y-6">
        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
            <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Website settings updated successfully!</p>
              <p className="text-xs text-emerald-700">Your changes are now live on your customer storefront.</p>
            </div>
          </div>
        )}

        {/* Status & Preview Banner */}
        <div className="bg-gradient-to-r from-primary to-pink-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
              {isPublished ? '● Live Storefront' : '○ Unpublished (Draft)'}
            </span>
            <h2 className="text-2xl font-bold">https://{subdomain}.nexora.shop</h2>
            <p className="text-white/80 text-xs mt-1">Share this link with your customers on WhatsApp and Instagram.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => onNavigate?.('website-preview')}
              className="flex-1 md:flex-initial bg-white text-primary px-5 py-3 rounded-xl font-bold text-sm hover:bg-pink-50 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Eye size={16} /> Preview Store
            </button>
            <button 
              onClick={() => alert(`Store link copied: https://${subdomain}.nexora.shop`)}
              className="bg-white/10 text-white hover:bg-white/20 p-3 rounded-xl transition-colors flex items-center justify-center cursor-pointer"
              title="Copy Link"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>

        {/* Domain & URL Settings */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <Globe size={18} className="text-primary" /> Domain & Subdomain Configuration
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store Subdomain</label>
              <div className="flex items-center">
                <input 
                  type="text" 
                  value={subdomain} 
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-l-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium"
                />
                <span className="bg-gray-100 border border-l-0 border-gray-200 rounded-r-xl px-4 py-3 text-xs text-gray-500 font-semibold">
                  .nexora.shop
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Domain (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. glowbeautyjaipur.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Template & Branding */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <Palette size={18} className="text-primary" /> Template & Theme Styling
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'royal-luxe', name: 'Royal Luxe', desc: 'Gold accents & premium velvet dark style' },
              { id: 'modern-salon', name: 'Modern Salon', desc: 'Clean minimalist white & pink aesthetic' },
              { id: 'professional', name: 'Professional Beauty', desc: 'Clinical organized trust layout' },
            ].map((tmpl) => (
              <div 
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl.id)}
                className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${selectedTemplate === tmpl.id ? 'border-primary bg-pink-50/50 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-sm text-gray-900">{tmpl.name}</h4>
                  {selectedTemplate === tmpl.id && <CheckCircle2 size={18} className="text-primary" />}
                </div>
                <p className="text-xs text-gray-600">{tmpl.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-gray-700 mb-2">Brand Accent Color</label>
            <div className="flex items-center gap-3">
              {['#b90064', '#2563eb', '#0d9488', '#d97706', '#7c3aed'].map((color) => (
                <button
                  key={color}
                  onClick={() => setPrimaryColor(color)}
                  className={`w-9 h-9 rounded-full border-2 transition-transform ${primaryColor === color ? 'scale-110 border-gray-900 shadow-md' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                ></button>
              ))}
            </div>
          </div>
        </div>

        {/* Store Status Toggle */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Store Publish Status</h3>
            <p className="text-xs text-gray-500 mt-0.5">When published, your website is instantly accessible to customers for booking and orders.</p>
          </div>
          <button 
            onClick={() => setIsPublished(!isPublished)}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${isPublished ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}`}
          >
            <div className="bg-white w-6 h-6 rounded-full shadow-md transform transition-transform"></div>
          </button>
        </div>
      </main>
    </div>
  );
}
