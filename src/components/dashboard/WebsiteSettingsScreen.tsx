import React, { useState } from 'react';
import { ArrowLeft, Globe, Palette, CheckCircle2, Share2, Eye, Save, X, Check, Smartphone, Monitor } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard';

const PRESET_COLORS = [
  { hex: '#b90064', name: 'Magenta Pink' },
  { hex: '#2563eb', name: 'Royal Blue' },
  { hex: '#0d9488', name: 'Emerald Teal' },
  { hex: '#d97706', name: 'Amber Gold' },
  { hex: '#7c3aed', name: 'Vivid Purple' },
  { hex: '#dc2626', name: 'Ruby Red' },
  { hex: '#059669', name: 'Jade Green' },
  { hex: '#111827', name: 'Obsidian Black' },
];

export default function WebsiteSettingsScreen({ onBack, onNavigate }: { onBack: () => void, onNavigate?: (page: string) => void }) {
  const [subdomain, setSubdomain] = useState('glowbeauty');
  const [customDomain, setCustomDomain] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('modern-salon');
  const [primaryColor, setPrimaryColor] = useState('#b90064');
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [colorToast, setColorToast] = useState<string | null>(null);

  const [isPublished, setIsPublished] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('store_is_published');
      if (saved !== null) return JSON.parse(saved);
      const draft = localStorage.getItem('add_shop_form_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        if (parsed.isPublished !== undefined) return parsed.isPublished;
      }
    } catch (err) {
      console.warn('Unable to read published flag:', err);
    }
    return true;
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const handleShareStorefront = async () => {
    const url = `https://${subdomain}.nexora.shop`;
    const shareData = {
      title: 'Glow Beauty Parlour',
      text: 'Visit our official online storefront for bookings and beauty services!',
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareToast('Storefront link shared successfully!');
        setTimeout(() => setShareToast(null), 3500);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    const copied = await copyToClipboard(url);
    setShareToast(copied ? 'Storefront link copied to clipboard!' : `Storefront link: ${url}`);
    setTimeout(() => setShareToast(null), 3500);
  };

  const handleColorSelect = (hex: string, name?: string) => {
    setPrimaryColor(hex);
    const colorObj = PRESET_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
    const label = name || (colorObj ? colorObj.name : hex);
    setColorToast(`Accent color updated to ${label} (${hex})`);
    setTimeout(() => setColorToast(null), 3500);
  };

  const togglePublishStatus = () => {
    const next = !isPublished;
    setIsPublished(next);
    try {
      localStorage.setItem('store_is_published', JSON.stringify(next));
      const draft = localStorage.getItem('add_shop_form_draft');
      if (draft) {
        const parsed = JSON.parse(draft);
        parsed.isPublished = next;
        localStorage.setItem('add_shop_form_draft', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error(e);
    }
    const msg = next ? 'Store is now live!' : 'Store is currently hidden from public.';
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 4000);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('store_is_published', JSON.stringify(isPublished));
    } catch (err) {
      console.warn('Unable to persist published flag:', err);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcf9f8] text-[#1b1c1b] pb-28 w-full shadow-lg border-x border-gray-100">
      {/* Header */}
      <header className="sticky top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-screen-xl mx-auto w-full flex items-center justify-between px-[var(--page-margin)] h-16">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-pink-50 text-primary transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-sm font-bold text-primary">Website Settings</h1>
              <p className="text-[10px] text-gray-500">Online Storefront</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Save size={14} /> Save
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-[var(--page-margin)] pt-6 space-y-6">
        {savedSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
            <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Website settings updated successfully!</p>
              <p className="text-xs text-emerald-700">Your changes are now live on your customer storefront.</p>
            </div>
          </div>
        )}

        {statusToast && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
            <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">{statusToast}</p>
              <p className="text-xs text-emerald-700">Status updated successfully in real time.</p>
            </div>
          </div>
        )}

        {shareToast && (
          <div className="bg-pink-50 border border-pink-200 text-pink-900 p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-fade-in">
            <CheckCircle2 size={22} className="text-primary shrink-0" />
            <div>
              <p className="font-bold text-sm">{shareToast}</p>
              <p className="text-xs text-pink-700">Link: https://{subdomain}.nexora.shop</p>
            </div>
          </div>
        )}

        {/* Status & Preview Banner */}
        <div className="bg-gradient-to-r from-primary to-pink-700 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-5 overflow-hidden">
          <div className="min-w-0 max-w-full flex-1">
            <span className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 mb-2.5 ${
              isPublished ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-400/30' : 'bg-amber-500/20 text-amber-100 border border-amber-400/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              {isPublished ? '● Live Storefront' : '○ Unpublished (Draft)'}
            </span>
            <div>
              <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-tight break-all font-mono bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 inline-block max-w-full truncate" title={`https://${subdomain}.nexora.shop`}>
                https://{subdomain}.nexora.shop
              </h2>
            </div>
            <p className="text-white/80 text-xs mt-2 truncate">
              {isPublished ? 'Share this link with your customers on WhatsApp and Instagram.' : 'Store is currently hidden from public access.'}
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
            <button 
              onClick={() => {
                if (isPublished) {
                  onNavigate?.('website-preview');
                } else {
                  alert('Store is currently hidden from public access (Unpublished/Draft). Toggle Publish Status below to make it live!');
                }
              }}
              className="flex-1 md:flex-initial bg-white text-primary px-5 py-3 rounded-xl font-bold text-xs sm:text-sm hover:bg-pink-50 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer whitespace-nowrap"
            >
              <Eye size={16} /> Preview Store
            </button>
            <button 
              onClick={handleShareStorefront}
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition-all flex items-center justify-center cursor-pointer border border-white/20 hover:scale-105 active:scale-95 shadow-xs shrink-0"
              title="Share Storefront Link"
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
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Palette size={18} className="text-primary" /> Template & Theme Styling
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Select a visual storefront layout for your website. Click any theme card to apply.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { 
                id: 'royal-luxe', 
                name: 'Royal Luxe', 
                desc: 'Gold accents & premium velvet dark style with VIP luxury feel.',
                tag: 'Dark Luxury',
                img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=500&auto=format&fit=crop',
                renderPreview: () => (
                  <div className="w-full h-full bg-[#111318] p-3 text-white flex flex-col justify-between border-2 border-[#D4AF37]/80 rounded-t-xl relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent pointer-events-none"></div>
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-[#D4AF37]/30 pb-2 z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
                        <span className="text-[10px] font-black tracking-widest text-[#D4AF37] uppercase">ROYAL LUXE</span>
                      </div>
                      <span className="text-[9px] bg-[#D4AF37]/20 text-[#F59E0B] px-1.5 py-0.5 rounded border border-[#D4AF37]/40 font-bold">VIP</span>
                    </div>
                    {/* Content */}
                    <div className="my-1.5 space-y-1.5 z-10">
                      <div className="h-2.5 w-3/4 bg-gradient-to-r from-[#D4AF37] to-amber-200 rounded"></div>
                      <div className="h-2 w-1/2 bg-gray-700/80 rounded"></div>
                      <div className="mt-1.5 p-1.5 bg-black/60 border border-[#D4AF37]/40 rounded-md flex justify-between items-center">
                        <span className="text-[9px] text-amber-200 font-serif italic">Gold Spa Service</span>
                        <span className="text-[8px] bg-[#D4AF37] text-black font-extrabold px-1.5 py-0.5 rounded">BOOK</span>
                      </div>
                    </div>
                    {/* Footer Badge */}
                    <div className="text-[9px] text-[#D4AF37] font-semibold flex items-center justify-between border-t border-gray-800 pt-1 z-10">
                      <span>Gold Borders & Accents</span>
                      <span className="text-[8px] text-gray-400">★ 4.9 Premium</span>
                    </div>
                  </div>
                )
              },
              { 
                id: 'modern-salon', 
                name: 'Modern Salon', 
                desc: 'Clean minimalist white & pink aesthetic for effortless online booking.',
                tag: 'Minimalist Light',
                img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=500&auto=format&fit=crop',
                renderPreview: () => (
                  <div className="w-full h-full bg-gradient-to-br from-pink-50 via-white to-pink-50/30 p-3 text-gray-900 flex flex-col justify-between border border-pink-200 rounded-t-xl relative overflow-hidden shadow-inner">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-pink-100 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                        <span className="text-[10px] font-extrabold tracking-tight text-gray-900">GLOW SALON</span>
                      </div>
                      <span className="text-[9px] bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded-full font-bold">MINIMAL</span>
                    </div>
                    {/* Content */}
                    <div className="my-1.5 space-y-1.5">
                      <div className="h-2.5 w-2/3 bg-gray-900 rounded-full"></div>
                      <div className="h-2 w-1/3 bg-pink-300/60 rounded-full"></div>
                      <div className="mt-1.5 p-1.5 bg-white border border-pink-100 shadow-xs rounded-lg flex justify-between items-center">
                        <span className="text-[9px] text-gray-700 font-medium">Hair & Facial Care</span>
                        <span className="text-[8px] bg-pink-600 text-white font-bold px-2 py-0.5 rounded-full">Reserve</span>
                      </div>
                    </div>
                    {/* Footer Badge */}
                    <div className="text-[9px] text-gray-500 font-medium flex items-center justify-between border-t border-pink-100/80 pt-1">
                      <span>Light Pink Aesthetic</span>
                      <span className="text-[8px] text-pink-600 font-bold">Popular</span>
                    </div>
                  </div>
                )
              },
              { 
                id: 'professional', 
                name: 'Professional Beauty', 
                desc: 'Clinical organized trust layout displaying structured service offerings.',
                tag: 'Clinical Layout',
                img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=500&auto=format&fit=crop',
                renderPreview: () => (
                  <div className="w-full h-full bg-slate-900 p-3 text-slate-100 flex flex-col justify-between border border-teal-500/40 rounded-t-xl relative overflow-hidden shadow-inner">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                        <span className="text-[10px] font-bold tracking-wide text-teal-300 uppercase">CLINICAL BEAUTY</span>
                      </div>
                      <span className="text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded border border-teal-500/30 font-bold">VERIFIED</span>
                    </div>
                    {/* Content */}
                    <div className="my-1.5 space-y-1.5">
                      <div className="h-2.5 w-4/5 bg-slate-100 rounded"></div>
                      <div className="h-2 w-1/2 bg-teal-500/50 rounded"></div>
                      <div className="mt-1.5 p-1.5 bg-slate-800/90 border border-slate-700 rounded flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="text-[8px] text-teal-400">✓</span>
                          <span className="text-[9px] text-slate-200 font-mono">Dermatology Consult</span>
                        </div>
                        <span className="text-[8px] bg-teal-500 text-slate-950 font-bold px-1.5 py-0.5 rounded">SELECT</span>
                      </div>
                    </div>
                    {/* Footer Badge */}
                    <div className="text-[9px] text-slate-400 font-mono flex items-center justify-between border-t border-slate-800 pt-1">
                      <span>Structured Services</span>
                      <span className="text-[8px] text-teal-400">Certified</span>
                    </div>
                  </div>
                )
              },
            ].map((tmpl) => {
              const isSelected = selectedTemplate === tmpl.id;
              return (
                <div 
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl flex flex-col bg-white border-2 ${
                    isSelected 
                      ? 'border-primary shadow-lg ring-2 ring-primary/20 scale-[1.01]' 
                      : 'border-gray-200 hover:border-gray-300 hover:-translate-y-0.5'
                  }`}
                >
                  {/* Top Part: Screenshot / Visual Theme Preview */}
                  <div className="h-44 w-full relative bg-gray-900 overflow-hidden">
                    {/* Background image preview with slight opacity */}
                    <img 
                      src={tmpl.img} 
                      alt={tmpl.name} 
                      className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300 group-hover:scale-105" 
                    />
                    {/* Overlay UI Mockup Screenshot */}
                    <div className="absolute inset-0 p-2.5 flex items-center justify-center">
                      <div className="w-full h-full">
                        {tmpl.renderPreview()}
                      </div>
                    </div>

                    {/* Selection Checkmark Icon in top right corner */}
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center shadow-lg z-20 animate-fade-in ring-2 ring-white">
                        <CheckCircle2 size={18} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Bottom Part: Text Content (Title & Description) */}
                  <div className="p-4 flex flex-col flex-grow bg-white justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-bold text-sm transition-colors ${isSelected ? 'text-primary' : 'text-gray-900 group-hover:text-primary'}`}>
                          {tmpl.name}
                        </h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSelected 
                            ? 'bg-pink-100 text-primary border border-pink-200' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {tmpl.tag}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{tmpl.desc}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-semibold">
                      <span className={isSelected ? 'text-primary font-bold' : 'text-gray-500'}>
                        {isSelected ? '✓ Active Theme' : 'Click to Select'}
                      </span>
                      <span className={`text-[11px] underline transition-colors ${isSelected ? 'text-primary font-bold' : 'text-gray-400 group-hover:text-gray-700'}`}>
                        {isSelected ? 'Selected' : 'Select Theme →'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="block text-sm font-bold text-gray-900">Brand Accent Color</label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select a preset swatch or pick a custom hex color to brand your storefront buttons, headers, and highlights.
                </p>
              </div>

              {/* Active Color Tag */}
              <div className="flex items-center gap-2 self-start sm:self-auto bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <span className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs" style={{ backgroundColor: primaryColor }}></span>
                <span className="text-xs font-mono font-bold text-gray-800">
                  {PRESET_COLORS.find(c => c.hex.toLowerCase() === primaryColor.toLowerCase())?.name || primaryColor}
                </span>
              </div>
            </div>

            {/* Instant Color Update Toast Feedback */}
            {colorToast && (
              <div className="p-3 bg-pink-50/80 border border-pink-200 text-pink-900 rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: primaryColor }}></span>
                  <span>{colorToast}</span>
                </div>
                <button 
                  onClick={() => setIsPreviewModalOpen(true)} 
                  className="text-[11px] underline font-bold text-primary hover:text-pink-700 cursor-pointer flex items-center gap-1"
                >
                  <Eye size={12} /> Live Preview →
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              {/* Preset Swatches */}
              {PRESET_COLORS.map((c) => {
                const isSelected = primaryColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    type="button"
                    key={c.hex}
                    onClick={() => handleColorSelect(c.hex, c.name)}
                    title={`${c.name} (${c.hex})`}
                    className={`group relative w-10 h-10 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center ${
                      isSelected 
                        ? 'scale-110 border-gray-900 shadow-md ring-2 ring-primary/20' 
                        : 'border-white hover:scale-105 shadow-sm hover:shadow'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && (
                      <Check size={16} className="text-white drop-shadow-md stroke-[3]" />
                    )}
                  </button>
                );
              })}

              {/* Custom Color Picker Input */}
              <div className="flex items-center gap-2.5 p-1.5 bg-gray-50 rounded-2xl border border-gray-200 hover:border-gray-300 transition-colors shadow-2xs cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => handleColorSelect(e.target.value, `Custom (${e.target.value})`)}
                    className="w-8 h-8 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                    title="Pick Custom Hex Color"
                  />
                </div>
                <div className="flex flex-col pr-2">
                  <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider">Custom Hex</span>
                  <span className="text-xs font-mono font-bold text-gray-800 group-hover:text-primary transition-colors">{primaryColor}</span>
                </div>
              </div>
            </div>

            {/* Prominent Interactive Color Preview Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-xs text-white shadow-lg flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer group"
                style={{ backgroundColor: primaryColor }}
              >
                <Eye size={18} className="group-hover:scale-110 transition-transform" />
                <span>👁️ Preview Storefront with Selected Theme & Color</span>
              </button>
            </div>
          </div>
        </div>

        {/* Store Status Toggle */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-base">Store Publish Status</h3>
              {isPublished ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  DRAFT
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isPublished 
                ? 'Store is active and accessible online for booking and orders.' 
                : 'Store is hidden from public access. Toggle to publish live!'}
            </p>
          </div>
          <button 
            type="button"
            role="switch"
            aria-checked={isPublished}
            onClick={togglePublishStatus}
            className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isPublished ? 'bg-emerald-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isPublished ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </main>

      {/* ================= STOREFRONT LIVE STYLE PREVIEW MODAL ================= */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
            {/* Modal Header & Controls Bar */}
            <div className="p-4 sm:p-5 bg-gray-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-inner" style={{ backgroundColor: primaryColor }}>
                  <Eye size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">Storefront Style Preview</h3>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-white/10 text-pink-300 border border-white/20">
                      Live Accent Sync
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Testing <span className="text-white font-bold capitalize">{selectedTemplate.replace('-', ' ')}</span> theme with accent <span className="font-mono font-bold" style={{ color: primaryColor }}>{primaryColor}</span>
                  </p>
                </div>
              </div>

              {/* Modal Interactive Control Toolbar */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
                {/* Theme Switcher inside Modal */}
                <div className="flex items-center bg-gray-800 p-1 rounded-xl border border-gray-700 text-xs">
                  {[
                    { id: 'royal-luxe', label: 'Royal Luxe' },
                    { id: 'modern-salon', label: 'Modern' },
                    { id: 'professional', label: 'Clinical' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] cursor-pointer ${
                        selectedTemplate === t.id 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Live Color Swatch & Picker inside Modal Toolbar */}
                <div className="flex items-center gap-1.5 bg-gray-800 px-2.5 py-1 rounded-xl border border-gray-700">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => handleColorSelect(e.target.value)}
                    className="w-6 h-6 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    title="Change Color Live"
                  />
                  <span className="text-xs font-mono font-bold text-gray-200">{primaryColor}</span>
                </div>

                {/* Device Selector */}
                <div className="flex items-center bg-gray-800 p-1 rounded-xl border border-gray-700">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${previewDevice === 'desktop' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                    title="Desktop Viewport"
                  >
                    <Monitor size={16} />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${previewDevice === 'mobile' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                    title="Mobile Viewport"
                  >
                    <Smartphone size={16} />
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors border border-gray-700 cursor-pointer ml-1"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: Rendered Live Store Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 flex justify-center items-start min-h-[450px]">
              <div 
                className={`transition-all duration-300 bg-white rounded-3xl shadow-xl border overflow-hidden w-full ${
                  previewDevice === 'mobile' ? 'max-w-[380px] border-gray-300 ring-8 ring-gray-900/10' : 'max-w-full'
                }`}
              >
                {/* Store Front Header */}
                <div 
                  className={`p-4 border-b flex items-center justify-between transition-colors ${
                    selectedTemplate === 'royal-luxe' 
                      ? 'bg-[#111318] text-white border-amber-500/30' 
                      : selectedTemplate === 'professional' 
                      ? 'bg-slate-900 text-slate-100 border-slate-800' 
                      : 'bg-white text-gray-900 border-pink-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-base shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      G
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm tracking-tight">Glow Beauty Parlour</h4>
                      <p className="text-[10px] opacity-70 flex items-center gap-1">
                        <Globe size={10} /> {subdomain}.nexora.shop
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span 
                      className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border flex items-center gap-1"
                      style={{ 
                        backgroundColor: `${primaryColor}18`, 
                        color: primaryColor, 
                        borderColor: `${primaryColor}40` 
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }}></span>
                      ● Active Accent
                    </span>
                    <button 
                      className="text-xs font-bold px-3 py-1.5 rounded-xl text-white transition-opacity hover:opacity-90 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>

                {/* Store Front Hero Section */}
                <div 
                  className={`p-6 sm:p-8 relative overflow-hidden flex flex-col justify-center ${
                    selectedTemplate === 'royal-luxe' 
                      ? 'bg-gradient-to-br from-[#111318] via-[#1a1d26] to-[#0c0e12] text-white border-b border-[#D4AF37]/30' 
                      : selectedTemplate === 'professional' 
                      ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white border-b border-slate-800' 
                      : 'bg-gradient-to-br from-pink-50/80 via-white to-pink-50/40 text-gray-900 border-b border-pink-100'
                  }`}
                >
                  <div className="max-w-xl space-y-3 relative z-10">
                    <span 
                      className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border inline-block"
                      style={{ 
                        backgroundColor: `${primaryColor}18`, 
                        color: selectedTemplate === 'royal-luxe' ? '#D4AF37' : primaryColor, 
                        borderColor: selectedTemplate === 'royal-luxe' ? '#D4AF3740' : `${primaryColor}40` 
                      }}
                    >
                      ✨ Premium Salon & Wellness
                    </span>

                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                      Experience Luxury Care Tailored for You
                    </h2>

                    <p className="text-xs sm:text-sm opacity-80 leading-relaxed">
                      Discover expert hair styling, revitalizing facials, and bridal makeuppackages with instant online reservation.
                    </p>

                    {/* Action Triggers using Primary Color */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button 
                        className="px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <span>Explore Services</span>
                        <span className="text-sm">→</span>
                      </button>

                      <button 
                        className="px-4 py-2.5 rounded-xl font-bold text-xs border transition-colors cursor-pointer"
                        style={{ 
                          borderColor: primaryColor, 
                          color: selectedTemplate === 'royal-luxe' || selectedTemplate === 'professional' ? '#fff' : primaryColor 
                        }}
                      >
                        Contact Studio
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sample Services Grid with Brand Accent Colors */}
                <div className="p-6 bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-gray-900">Featured Services</h3>
                      <p className="text-xs text-gray-500">Live preview of service cards styled with your selected accent color</p>
                    </div>
                    <span 
                      className="text-xs font-bold underline cursor-pointer"
                      style={{ color: primaryColor }}
                    >
                      View All (12)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: 'Bridal Makeup Package', duration: '120 mins', price: '₹4,999', badge: 'Best Seller' },
                      { title: 'Hydra-Facial Glow Care', duration: '60 mins', price: '₹1,899', badge: 'Trending' },
                    ].map((item, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 rounded-2xl border border-gray-200/80 bg-gray-50/50 hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span 
                              className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border inline-block mb-1"
                              style={{ 
                                backgroundColor: `${primaryColor}15`, 
                                color: primaryColor, 
                                borderColor: `${primaryColor}30` 
                              }}
                            >
                              {item.badge}
                            </span>
                            <h4 className="font-bold text-sm text-gray-900 group-hover:text-primary transition-colors">{item.title}</h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">⏱ {item.duration}</p>
                          </div>
                          <span className="text-sm font-black text-gray-900">{item.price}</span>
                        </div>

                        <button 
                          className="w-full py-2 rounded-xl text-white font-bold text-xs transition-opacity hover:opacity-90 shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <span>Reserve Spot</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer preview */}
                <div className="p-4 bg-gray-900 text-gray-400 text-xs flex items-center justify-between border-t border-gray-800">
                  <span className="text-[11px]">Powered by Nexora Storefront Engine</span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                    COLOR: {primaryColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Bar */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>All storefront buttons, links, badges, and headers will reflect <strong style={{ color: primaryColor }}>{primaryColor}</strong> when saved.</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
                <button
                  onClick={() => {
                    handleSave();
                    setIsPreviewModalOpen(false);
                  }}
                  className="px-5 py-2 text-white rounded-xl text-xs font-extrabold shadow-md transition-opacity hover:opacity-90 cursor-pointer flex items-center gap-1.5"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Save size={14} />
                  <span>Apply & Save Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
