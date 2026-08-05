import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MapPreview from './MapPreview';
import CancellationPolicyModal from './CancellationPolicyModal';
import { supabase } from '../lib/supabaseClient';
import { submitShopApplication } from '../lib/gpRepository';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MessageSquare, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronRight,
  Plus,
 
  Languages,
  Store,
  MapPin,
  Compass,
  Edit2,
  Check,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Building2,
  Globe,
  FileText,
  Lock,
  ShieldCheck,
  Scissors,

  Info,
  AlertTriangle,
  Eye,
  FileBadge,
  Award
} from 'lucide-react';
import { createId } from '../utils/id';

// Monotonic counter for toast ids - avoids Date.now() collisions when two
// toasts are triggered inside the same millisecond.
let docToastSeq = 0;

export type GovtDocType = 'aadhaar_front' | 'aadhaar_back' | 'pan_card' | 'voter_id' | 'shop_front' | 'other';

export interface UploadedDocRecord {
  id: string;
  type: GovtDocType | string;
  typeLabel: string;
  fileName: string;
  fileSize: string;
  fileSizeBytes: number;
  previewUrl: string | null;
  isImage: boolean;
  uploadedAt: string;
}

export interface SocialLinks {
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  twitter: string;
  snapchat: string;
  googleBusiness: string;
}

export interface GovtDocSlotInfo {
  type: GovtDocType;
  label: string;
  shortLabel: string;
  required: boolean;
  description: string;
}

const GOVT_DOC_SLOTS: GovtDocSlotInfo[] = [
  {
    type: 'aadhaar_front',
    label: 'Aadhaar Card - Front',
    shortLabel: 'Aadhaar Front',
    required: true,
    description: 'Front side with photo, full name & date of birth'
  },
  {
    type: 'aadhaar_back',
    label: 'Aadhaar Card - Back',
    shortLabel: 'Aadhaar Back',
    required: false,
    description: 'Back side showing full address & barcode'
  },
  {
    type: 'pan_card',
    label: 'PAN Card',
    shortLabel: 'PAN Card',
    required: true,
    description: 'Permanent Account Number identity card'
  },
  {
    type: 'voter_id',
    label: 'Voter ID / Election Card',
    shortLabel: 'Voter ID',
    required: false,
    description: 'Electoral Photo Identity Card (EPIC)'
  },
  {
    type: 'shop_front',
    label: 'Shop Front Photo',
    shortLabel: 'Shop Front',
    required: true,
    description: 'Clear exterior photo showing shop name signage'
  }
];

const FORM_STEPS = [
  { id: 1, name: 'Owner', icon: User, label: 'Owner Details' },
  { id: 2, name: 'Shop', icon: Store, label: 'Shop & Location' },
  { id: 3, name: 'Business', icon: Building2, label: 'Business Details' },
  { id: 4, name: 'Website', icon: Globe, label: 'Online Presence' },
  { id: 5, name: 'Docs', icon: FileText, label: 'Verification Docs' },
  { id: 6, name: 'Review', icon: CheckCircle2, label: 'Review & Submit' },
];

/**
 * Reads the persisted "Add Shop" draft exactly once per component mount.
 * Used for lazy `useState` initialisation so restored values are present on
 * the very first render instead of being written in later from an effect
 * (which made every field visibly flash from its default to the saved value).
 */
function readShopDraft(): Record<string, any> {
  try {
    const raw = localStorage.getItem('add_shop_form_draft');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.error('Failed to restore draft from localStorage:', err);
    return {};
  }
}

export default function AddShop({ onBack, onComplete }: { onBack: () => void, onComplete?: () => void }) {
  // Snapshot of the saved draft, read once during the first render.
  const [draft] = useState(readShopDraft);

  const [currentStep, setCurrentStep] = useState<number>(() => draft.currentStep ?? 1);
  const [showStepper, setShowStepper] = useState(true);

  // Step 1 State: Owner Details
  const [ownerName, setOwnerName] = useState(() => draft.ownerName ?? '');
  const [mobileNumber, setMobileNumber] = useState(() => draft.mobileNumber ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(() => draft.whatsappNumber ?? '');
  const [sameAsMobile, setSameAsMobile] = useState(() => draft.sameAsMobile ?? true);
  const [email, setEmail] = useState(() => draft.email ?? '');
  const [preferredLang, setPreferredLang] = useState(() => draft.preferredLang ?? 'hi');
  const [isVerified, setIsVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValues, setOtpValues] = useState(['1', '2', '3', '4', '5', '6']);
  const [dupCheckStatus, setDupCheckStatus] = useState<'none' | 'success' | 'warning'>('none');
  const [draftSaved, setDraftSaved] = useState(false);

  // Step 2 State: Shop & Location Details
  const [shopName, setShopName] = useState(() => draft.shopName ?? '');
  const [shopCategory, setShopCategory] = useState(() => draft.shopCategory ?? '');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  
  const [stateName, setStateName] = useState(() => draft.stateName ?? 'Rajasthan');
  const [districtName, setDistrictName] = useState(() => draft.districtName ?? 'Jaipur');
  const [cityName, setCityName] = useState(() => draft.cityName ?? 'Jaipur');
  const [localityName, setLocalityName] = useState(() => draft.localityName ?? 'Mansarovar');
  const [fullAddress, setFullAddress] = useState(() => draft.fullAddress ?? '72, Madhyam Marg, Mansarovar, Jaipur');
  const [pincode, setPincode] = useState(() => draft.pincode ?? '302020');
  const [landmark, setLandmark] = useState(() => draft.landmark ?? 'Near Metro Station');

  // Step 3 State: Business Details
  const [openingTime, setOpeningTime] = useState('10:00');
  const [closingTime, setClosingTime] = useState('20:00');
  const [weeklyOff, setWeeklyOff] = useState('Tuesday');
  const [staffCount, setStaffCount] = useState('6');
  const [startingPrice, setStartingPrice] = useState('300');
  const [yearsInBusiness, setYearsInBusiness] = useState('5');
  const [businessGenderType, setBusinessGenderType] = useState('Women');
  const [gstin, setGstin] = useState(() => draft.gstin ?? '08AAAAA0000A1Z5');
  const [businessType, setBusinessType] = useState(() => draft.businessType ?? 'proprietorship');
  const [annualTurnover, setAnnualTurnover] = useState(() => draft.annualTurnover ?? '10l_25l');
  const [services, setServices] = useState([
    { name: 'Haircut', price: '400', duration: '30 mins' },
    { name: 'Facial', price: '1,200', duration: '60 mins' },
    { name: 'Hair Colour', price: '2,500', duration: '90 mins' },
  ]);
  const [aboutShop, setAboutShop] = useState('');
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('');

  // Step 4 State: Website Setup & Branding
  const [websiteUrl, setWebsiteUrl] = useState(() => draft.websiteUrl ?? 'https://glowbeautyparlour.com');
  const [isPublished, setIsPublished] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('store_is_published');
      if (saved !== null) return JSON.parse(saved);
    } catch (err) {
      console.warn('Unable to read published flag:', err);
    }
    return draft.isPublished ?? true;
  });

  const handleTogglePublish = () => {
    const next = !isPublished;
    setIsPublished(next);
    try {
      localStorage.setItem('store_is_published', JSON.stringify(next));
      const savedDraft = localStorage.getItem('add_shop_form_draft');
      const parsedDraft = savedDraft ? JSON.parse(savedDraft) : {};
      parsedDraft.isPublished = next;
      localStorage.setItem('add_shop_form_draft', JSON.stringify(parsedDraft));
    } catch (e) {
      console.error(e);
    }
    if (next) {
      triggerDocToast('success', 'Store Published', 'Store is now live!');
    } else {
      triggerDocToast('info', 'Store Unpublished', 'Store is currently hidden from public.');
    }
  };
  const [instagramHandle, setInstagramHandle] = useState(() => draft.instagramHandle ?? '@glowbeauty_jaipur');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => draft.socialLinks ?? {
    facebook: 'https://facebook.com/glowbeautyjaipur',
    instagram: 'https://instagram.com/glowbeauty_jaipur',
    youtube: 'https://youtube.com/@glowbeautyjaipur',
    linkedin: 'https://linkedin.com/company/glowbeautyjaipur',
    twitter: 'https://x.com/glowbeautyjpr',
    snapchat: 'https://snapchat.com/add/glowbeautyjpr',
    googleBusiness: 'https://maps.app.goo.gl/glowbeautyjaipur',
  });
  const [customLinks, setCustomLinks] = useState<{ id: string; title: string; url: string }[]>(
    () => draft.customLinks ?? [
      { id: 'c1', title: 'Online Appointment Booking', url: 'https://booking.glowbeauty.com' }
    ]
  );
  const [socialErrors, setSocialErrors] = useState<Record<string, string>>({});

  const validateSocialUrl = (platform: string, value: string): string => {
    if (!value || !value.trim()) return '';
    const val = value.trim().toLowerCase();

    switch (platform) {
      case 'facebook':
        if (!val.includes('facebook.com') && !val.includes('fb.com') && !val.includes('fb.watch')) {
          return 'Facebook link must contain facebook.com or fb.com';
        }
        break;
      case 'instagram':
        if (!val.includes('instagram.com') && !val.includes('instagr.am')) {
          return 'Instagram link must contain instagram.com';
        }
        break;
      case 'youtube':
        if (!val.includes('youtube.com') && !val.includes('youtu.be')) {
          return 'YouTube link must contain youtube.com or youtu.be';
        }
        break;
      case 'linkedin':
        if (!val.includes('linkedin.com')) {
          return 'LinkedIn link must contain linkedin.com';
        }
        break;
      case 'twitter':
        if (!val.includes('x.com') && !val.includes('twitter.com')) {
          return 'X / Twitter link must contain x.com or twitter.com';
        }
        break;
      case 'snapchat':
        if (!val.includes('snapchat.com')) {
          return 'Snapchat link must contain snapchat.com';
        }
        break;
      case 'googleBusiness':
        if (!val.includes('google.com') && !val.includes('g.page') && !val.includes('goo.gl')) {
          return 'Google Business link must contain google.com/maps, g.page, or goo.gl';
        }
        break;
    }
    return '';
  };

  const handleSocialChange = (platform: keyof typeof socialLinks, value: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: value }));
    const err = validateSocialUrl(String(platform), value);
    setSocialErrors(prev => ({ ...prev, [platform]: err }));
  };

  const handleAddCustomLink = () => {
    const newId = 'c_' + Date.now();
    setCustomLinks(prev => [...prev, { id: newId, title: '', url: '' }]);
  };

  const handleRemoveCustomLink = (id: string) => {
    setCustomLinks(prev => prev.filter(link => link.id !== id));
  };

  const handleCustomLinkChange = (id: string, field: 'title' | 'url', value: string) => {
    setCustomLinks(prev => prev.map(link => link.id === id ? { ...link, [field]: value } : link));
  };

  const renderSocialIcon = (platform: string, className = "w-5 h-5") => {
    switch (platform) {
      case 'facebook':
        return (
          <svg className={`${className} text-[#1877F2] shrink-0`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'instagram':
        return (
          <svg className={`${className} shrink-0`} viewBox="0 0 24 24">
            <defs>
              <linearGradient id={`ig-icon-${className.replace(/[^a-zA-Z0-9]/g, '-')}`} x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fdf497" />
                <stop offset="5%" stopColor="#fdf497" />
                <stop offset="45%" stopColor="#fd5949" />
                <stop offset="60%" stopColor="#d6249f" />
                <stop offset="100%" stopColor="#285AEB" />
              </linearGradient>
            </defs>
            <path fill={`url(#ig-icon-${className.replace(/[^a-zA-Z0-9]/g, '-')})`} d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
      case 'youtube':
        return (
          <svg className={`${className} text-[#FF0000] shrink-0`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case 'linkedin':
        return (
          <svg className={`${className} text-[#0A66C2] shrink-0`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.47 1.47 0 1 0 0 2.94 1.47 1.47 0 0 0 0-2.94z"/>
          </svg>
        );
      case 'twitter':
        return (
          <svg className={`${className} text-gray-900 shrink-0`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      case 'snapchat':
        return (
          <svg className={`${className} text-[#FFFC00] bg-black p-0.5 rounded-md shrink-0`} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.162c-3.111 0-5.342 2.282-5.342 5.341 0 .783.181 1.543.518 2.227l-.626.241c-.496.192-.782.721-.684 1.255.093.504.509.882 1.018.927l.186.016a3.81 3.81 0 0 1-.72 1.206c-.521.603-1.258.986-2.036 1.058l-.208.019c-.394.037-.718.324-.78.718a.868.868 0 0 0 .341.876c.725.541 1.637.834 2.568.826.31 0 .622-.033.927-.099l.235.348c.552.818 1.42 1.385 2.42 1.58.552.108 1.118.163 1.685.163s1.133-.055 1.685-.163c1-.195 1.868-.762 2.42-1.58l.235-.348c.305.066.617.099.927.099.931.008 1.843-.285 2.568-.826a.868.868 0 0 0 .341-.876c-.062-.394-.386-.681-.78-.718l-.208-.019c-.778-.072-1.515-.455-2.036-1.058a3.81 3.81 0 0 1-.72-1.206l.186-.016c.509-.045.925-.423 1.018-.927.098-.534-.188-1.063-.684-1.255l-.626-.241c.337-.684.518-1.444.518-2.227 0-3.059-2.231-5.341-5.342-5.341z"/>
          </svg>
        );
      case 'googleBusiness':
        return (
          <svg className={`${className} shrink-0`} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
        );
      case 'custom':
      default:
        return (
          <svg className={`${className} text-indigo-600 shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        );
    }
  };

  const [selectedTemplate, setSelectedTemplate] = useState('modern-salon');
  const [devState, setDevState] = useState<'default' | 'empty' | 'uploading' | 'error'>('default');
  const [coverPhoto, setCoverPhoto] = useState<string | null>('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop');
  const [shopLogo, setShopLogo] = useState<string | null>('https://images.unsplash.com/photo-1556760544-74068565f05c?q=80&w=200&auto=format&fit=crop');
  const [interiorPhotos, setInteriorPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=400&auto=format&fit=crop'
  ]);
  const [previewTemplate, setPreviewTemplate] = useState<{ id: string, name: string, img: string, desc: string } | null>(null);

  // Step 5 State: Documents
  const [panNumber, setPanNumber] = useState(() => draft.panNumber ?? 'ABCDE1234F');
  const [panUploaded, setPanUploaded] = useState(true);
  const [addressProofUploaded, setAddressProofUploaded] = useState(true);
  const [ownerIdProofFile, setOwnerIdProofFile] = useState<string | null>('owner-id-proof.jpg');
  const [ownerIdProofSize, setOwnerIdProofSize] = useState<string>('1.2 MB');
  const [shopFrontFile, setShopFrontFile] = useState<string | null>('glow-shop-front.jpg');
  const [shopFrontPreview, setShopFrontPreview] = useState<string | null>('https://lh3.googleusercontent.com/aida-public/AB6AXuBQNNRMJrTd4yrU1ERtGLA59fMj94JhY_GnmUgH5xmlDwZOMqtSd-NJvOHh4FOsKs2T-psTq0sxdBpDjy3fBODZhUlbuWU7qSq3586FxjZ78RyYQMbmsNpRyv-xjkJO1-CA6RRFSIVmPJc4J25Xn0nJihno9c-Q9wmJvpASijmuiPCsdRi5gWbwMFV02r403xHiPJKRv-ecZZ-GG_A7AN82eVxiL_e4ubRN4-8QF-sqe9_uSWJkbnNk');

  // Enhanced Document Management State
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocRecord[]>([
    {
      id: 'doc_aadhaar_front',
      type: 'aadhaar_front',
      typeLabel: 'Aadhaar Card - Front',
      fileName: 'aadhaar-card-front.jpg',
      fileSize: '1.4 MB',
      fileSizeBytes: 1468006,
      previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
      isImage: true,
      uploadedAt: new Date().toLocaleDateString()
    },
    {
      id: 'doc_pan_card',
      type: 'pan_card',
      typeLabel: 'PAN Card',
      fileName: 'pan-card-owner.pdf',
      fileSize: '0.9 MB',
      fileSizeBytes: 943718,
      previewUrl: null,
      isImage: false,
      uploadedAt: new Date().toLocaleDateString()
    },
    {
      id: 'doc_shop_front',
      type: 'shop_front',
      typeLabel: 'Shop Front Photo',
      fileName: 'glow-shop-front.jpg',
      fileSize: '2.3 MB',
      fileSizeBytes: 2411724,
      previewUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQNNRMJrTd4yrU1ERtGLA59fMj94JhY_GnmUgH5xmlDwZOMqtSd-NJvOHh4FOsKs2T-psTq0sxdBpDjy3fBODZhUlbuWU7qSq3586FxjZ78RyYQMbmsNpRyv-xjkJO1-CA6RRFSIVmPJc4J25Xn0nJihno9c-Q9wmJvpASijmuiPCsdRi5gWbwMFV02r403xHiPJKRv-ecZZ-GG_A7AN82eVxiL_e4ubRN4-8QF-sqe9_uSWJkbnNk',
      isImage: true,
      uploadedAt: new Date().toLocaleDateString()
    }
  ]);

  const [selectedDocTypeForUpload, setSelectedDocTypeForUpload] = useState<GovtDocType | 'other'>('aadhaar_front');
  const [customDocTypeLabel, setCustomDocTypeLabel] = useState<string>('');

  // Toast alert state
  const [docToast, setDocToast] = useState<{
    id: number;
    type: 'warning' | 'error' | 'success' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const triggerDocToast = (type: 'warning' | 'error' | 'success' | 'info', title: string, message: string) => {
    const toastId = ++docToastSeq;
    setDocToast({ id: toastId, type, title, message });
    setTimeout(() => {
      setDocToast(prev => (prev?.id === toastId ? null : prev));
    }, 5000);
  };

  // Preview Modal state
  const [previewDocModal, setPreviewDocModal] = useState<UploadedDocRecord | null>(null);

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB Limit

  // File Upload Processor enforcing 5 MB size limit & duplicate checks
  const handleDocFileUpload = (
    targetType: string,
    targetTypeLabel: string,
    file: File,
    isReplacement: boolean = false
  ): boolean => {
    // 1. File Size Validation (Max 5 MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      triggerDocToast(
        'error',
        'File Size Exceeded (Max 5 MB)',
        `"${file.name}" is ${fileSizeMB} MB. Maximum allowed upload size is 5.0 MB per document.`
      );
      return false;
    }

    // 1b. Format Validation for Shop Front Photo (JPG, PNG, WEBP)
    if (targetType === 'shop_front') {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      const ext = file.name.split('.').pop()?.toLowerCase();
      const isValidExt = ext && ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
      
      if (!file.type.startsWith('image/') && !isValidExt) {
        triggerDocToast(
          'error',
          'Invalid Image Format',
          `"${file.name}" is not a supported image format. Please upload a valid JPG, PNG, or WEBP image for the Shop Front Photo.`
        );
        return false;
      }
    }

    // 2. Duplicate Document Type Check (unless replacing existing document)
    if (!isReplacement) {
      const existingDocByType = uploadedDocs.find(d => d.type === targetType);
      if (existingDocByType) {
        triggerDocToast(
          'warning',
          'Duplicate Document Type Alert',
          `A document for "${targetTypeLabel}" (${existingDocByType.fileName}) is already uploaded. Please remove or replace the existing document.`
        );
        return false;
      }
    }

    // 3. Duplicate File Name Check
    const existingDocByName = uploadedDocs.find(
      d => d.fileName.toLowerCase() === file.name.toLowerCase() && d.type !== targetType
    );
    if (existingDocByName) {
      triggerDocToast(
        'warning',
        'Duplicate File Name Detected',
        `The file "${file.name}" has already been uploaded for "${existingDocByName.typeLabel}".`
      );
      return false;
    }

    // 4. Create object URL preview if image file
    const isImageFile = file.type.startsWith('image/');
    let previewUrl: string | null = null;
    if (isImageFile) {
      try {
        previewUrl = URL.createObjectURL(file);
      } catch (err) {
        previewUrl = null;
      }
    }

    const formattedSize = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

    const newDocRecord: UploadedDocRecord = {
      id: createId('doc'),
      type: targetType,
      typeLabel: targetTypeLabel,
      fileName: file.name,
      fileSize: formattedSize,
      fileSizeBytes: file.size,
      previewUrl: previewUrl,
      isImage: isImageFile,
      uploadedAt: new Date().toLocaleDateString()
    };

    setUploadedDocs(prev => {
      const filtered = isReplacement ? prev.filter(d => d.type !== targetType) : prev;
      return [...filtered, newDocRecord];
    });

    // Synchronize legacy variables
    if (targetType === 'aadhaar_front' || targetType === 'pan_card' || targetType === 'voter_id') {
      setOwnerIdProofFile(file.name);
      setOwnerIdProofSize(formattedSize);
    }
    if (targetType === 'shop_front') {
      setShopFrontFile(file.name);
      if (previewUrl) setShopFrontPreview(previewUrl);
    }

    triggerDocToast(
      'success',
      'Document Uploaded Successfully',
      `"${targetTypeLabel}" (${file.name}) has been verified and added.`
    );

    return true;
  };

  // Sample Upload Generator for instant demo testing
  const handleDocSampleUpload = (targetType: string, targetTypeLabel: string) => {
    const sampleDocs: Record<string, { name: string; url: string; sizeBytes: number }> = {
      aadhaar_front: {
        name: 'aadhaar-card-front.jpg',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
        sizeBytes: 1468006
      },
      aadhaar_back: {
        name: 'aadhaar-card-back.jpg',
        url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=400&auto=format&fit=crop',
        sizeBytes: 1258291
      },
      pan_card: {
        name: 'pan-card-verified.jpg',
        url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=400&auto=format&fit=crop',
        sizeBytes: 985700
      },
      voter_id: {
        name: 'voter-id-card.jpg',
        url: 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?q=80&w=400&auto=format&fit=crop',
        sizeBytes: 1887436
      },
      shop_front: {
        name: 'glow-shop-front.jpg',
        url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQNNRMJrTd4yrU1ERtGLA59fMj94JhY_GnmUgH5xmlDwZOMqtSd-NJvOHh4FOsKs2T-psTq0sxdBpDjy3fBODZhUlbuWU7qSq3586FxjZ78RyYQMbmsNpRyv-xjkJO1-CA6RRFSIVmPJc4J25Xn0nJihno9c-Q9wmJvpASijmuiPCsdRi5gWbwMFV02r403xHiPJKRv-ecZZ-GG_A7AN82eVxiL_e4ubRN4-8QF-sqe9_uSWJkbnNk',
        sizeBytes: 2411724
      }
    };

    const sample = sampleDocs[targetType] || {
      name: `${targetTypeLabel.toLowerCase().replace(/[^a-z0-9]/g, '-')}-doc.jpg`,
      url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=400&auto=format&fit=crop',
      sizeBytes: 1572864
    };

    // Check duplicate
    const existing = uploadedDocs.find(d => d.type === targetType);
    if (existing) {
      triggerDocToast(
        'warning',
        'Duplicate Document Type Alert',
        `A document for "${targetTypeLabel}" (${existing.fileName}) is already uploaded. Please remove or replace the existing document.`
      );
      return;
    }

    const formattedSize = (sample.sizeBytes / (1024 * 1024)).toFixed(1) + ' MB';
    const newDocRecord: UploadedDocRecord = {
      id: createId('doc'),
      type: targetType,
      typeLabel: targetTypeLabel,
      fileName: sample.name,
      fileSize: formattedSize,
      fileSizeBytes: sample.sizeBytes,
      previewUrl: sample.url,
      isImage: true,
      uploadedAt: new Date().toLocaleDateString()
    };

    setUploadedDocs(prev => [...prev, newDocRecord]);

    if (targetType === 'aadhaar_front' || targetType === 'pan_card' || targetType === 'voter_id') {
      setOwnerIdProofFile(sample.name);
      setOwnerIdProofSize(formattedSize);
    }
    if (targetType === 'shop_front') {
      setShopFrontFile(sample.name);
      setShopFrontPreview(sample.url);
    }

    triggerDocToast(
      'success',
      'Sample Document Attached',
      `"${targetTypeLabel}" (${sample.name}) attached successfully.`
    );
  };

  const handleRemoveDoc = (docId: string, typeLabel: string, type: string) => {
    setUploadedDocs(prev => prev.filter(d => d.id !== docId));
    if (type === 'aadhaar_front' || type === 'pan_card' || type === 'voter_id') {
      setOwnerIdProofFile(null);
      setOwnerIdProofSize('');
    }
    if (type === 'shop_front') {
      setShopFrontFile(null);
      setShopFrontPreview(null);
    }
    triggerDocToast(
      'info',
      'Document Removed',
      `"${typeLabel}" has been removed.`
    );
  };
  const [confirmAccurate, setConfirmAccurate] = useState<boolean>(true);
  const [authorizeProfile, setAuthorizeProfile] = useState<boolean>(true);
  const [documentPrivacyConsent, setDocumentPrivacyConsent] = useState<boolean>(false);
  // Lets the Continue handler scroll the mandatory consent into view and flash
  // it, instead of silently refusing to advance.
  const privacyConsentRef = useRef<HTMLLabelElement>(null);
  // Anchor inside the form, used to locate the scrolling shell container.
  const formTopRef = useRef<HTMLDivElement>(null);
  const [highlightPrivacyConsent, setHighlightPrivacyConsent] = useState(false);
  const [submittingApp, setSubmittingApp] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step6Confirmed, setStep6Confirmed] = useState<boolean>(false);
  const [policyConfirmed, setPolicyConfirmed] = useState<boolean>(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);

  // Photo Capture State
  const [shopPhotos, setShopPhotos] = useState<string[]>(() => {
    if (draft.shopPhotos !== undefined) return draft.shopPhotos;
    // Legacy drafts stored a single photo under `shopPhoto`.
    if (draft.shopPhoto !== undefined) return [draft.shopPhoto];
    return ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop'];
  });
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const [isLogoGeneratorOpen, setIsLogoGeneratorOpen] = useState(false);
  const [isCoverHelperOpen, setIsCoverHelperOpen] = useState(false);
  const [interiorError, setInteriorError] = useState<string | null>(null);
  const [videoHighlights, setVideoHighlights] = useState<string[]>([]);
  const [isVideoHelperOpen, setIsVideoHelperOpen] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoSuccess, setVideoSuccess] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const interiorInputRef = useRef<HTMLInputElement | null>(null);
  const videoUploadRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleSameAsMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSameAsMobile(checked);
    if (checked) {
      setWhatsappNumber(mobileNumber);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setShopLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInteriorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileList = Array.from(files) as File[];
      const MAX_PHOTOS = 10;
      const MAX_SIZE_MB = 5;
      const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

      // Check total count
      if (interiorPhotos.length + fileList.length > MAX_PHOTOS) {
        setInteriorError(`Maximum ${MAX_PHOTOS} photos allowed. You already have ${interiorPhotos.length}.`);
        return;
      }

      // Check sizes
      const oversizedFiles = fileList.filter(file => file.size > MAX_SIZE_BYTES);
      if (oversizedFiles.length > 0) {
        setInteriorError(`Some files exceed the ${MAX_SIZE_MB}MB size limit.`);
        return;
      }

      setInteriorError(null);
      fileList.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setInteriorPhotos(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const MAX_VIDEOS = 5;
      const MAX_SIZE_MB = 20;
      const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
      const MAX_DURATION_SEC = 15;

      if (videoHighlights.length >= MAX_VIDEOS) {
        setVideoError(`Maximum ${MAX_VIDEOS} videos allowed.`);
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setVideoError(`Video file exceeds the ${MAX_SIZE_MB}MB size limit.`);
        return;
      }

      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoElement.src);
        if (videoElement.duration > MAX_DURATION_SEC) {
          setVideoError(`Video exceeds the ${MAX_DURATION_SEC} seconds limit.`);
        } else {
          setVideoError(null);
          const reader = new FileReader();
          reader.onloadend = () => {
            setVideoHighlights(prev => [...prev, reader.result as string]);
            setVideoSuccess("Video highlight uploaded successfully!");
            setTimeout(() => setVideoSuccess(null), 4000);
            setIsVideoHelperOpen(false);
          };
          reader.readAsDataURL(file);
        }
      };
      videoElement.src = URL.createObjectURL(file);
    }
  };

  const handleVideoLink = (url: string): boolean => {
    if (!url || !url.trim()) {
      setVideoError("Please enter a valid social media video link.");
      return false;
    }
    const MAX_VIDEOS = 5;
    if (videoHighlights.length >= MAX_VIDEOS) {
      setVideoError(`Maximum ${MAX_VIDEOS} videos allowed.`);
      return false;
    }

    // Basic URL validation for Instagram, YouTube, Facebook
    const isValid = /instagram\.com\/(reels|reel|p)\/|youtube\.com\/(shorts|watch\?v=)|youtu\.be\/|facebook\.com\/(reels|reel|videos|watch)/i.test(url);
    
    if (isValid) {
      // Parse for embeddable URL
      let embedUrl = url;
      const ytMatch = url.match(/(?:youtube\.com\/shorts\/|youtu\.be\/|v=)([^&?/\s]+)/);
      if (ytMatch) {
        embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
      } else {
        const igMatch = url.match(/instagram\.com\/(?:reels|reel|p)\/([^&?/\s]+)/);
        if (igMatch) {
          embedUrl = `https://www.instagram.com/reels/${igMatch[1]}/embed`;
        } else if (url.includes('facebook.com')) {
          embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
        }
      }

      // Check if duplicate link already exists in videoHighlights
      if (videoHighlights.includes(embedUrl) || videoHighlights.includes(url)) {
        setVideoError("This video link has already been added.");
        return false;
      }

      setVideoError(null);
      
      setVideoHighlights(prev => [...prev, embedUrl]);
      setVideoSuccess("Video highlight link added successfully!");
      setTimeout(() => setVideoSuccess(null), 4000);
      return true;
    } else {
      setVideoError("Invalid link format. Please paste a link from Instagram Reels, YouTube Shorts, or Facebook.");
      return false;
    }
  };

  const handleSaveVideoHighlight = () => {
    if (!videoUrlInput.trim()) {
      setVideoError("Please paste a social media video link or select a video file.");
      return;
    }
    const success = handleVideoLink(videoUrlInput.trim());
    if (success) {
      setVideoUrlInput('');
      setIsVideoHelperOpen(false);
    }
  };

  const handleMobileChange = (val: string) => {
    setMobileNumber(val);
    if (sameAsMobile) {
      setWhatsappNumber(val);
    }
    setIsVerified(false);
    setDupCheckStatus('none');
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const newOtp = [...otpValues];
    newOtp[index] = val;
    setOtpValues(newOtp);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const verifyOtp = () => {
    setShowOtpModal(false);
    setIsVerified(true);
    setDupCheckStatus('success');
  };

  // NOTE: the saved draft is now restored via lazy useState initialisation
  // above (see `readShopDraft`), so no restore effect is needed here.


  // Auto-save form field values to localStorage every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const draftPayload = {
        ownerName,
        mobileNumber,
        whatsappNumber,
        sameAsMobile,
        email,
        preferredLang,
        shopName,
        shopCategory,
        stateName,
        districtName,
        cityName,
        localityName,
        fullAddress,
        pincode,
        landmark,
        shopPhotos,
        gstin,
        businessType,
        annualTurnover,
        websiteUrl,
        isPublished,
        instagramHandle,
        socialLinks,
        customLinks,
        panNumber,
        currentStep,
        lastSaved: new Date().toISOString()
      };
      try {
        localStorage.setItem('add_shop_form_draft', JSON.stringify(draftPayload));
      } catch (e) {
        console.error('Failed to save draft to localStorage:', e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [
    ownerName,
    mobileNumber,
    whatsappNumber,
    sameAsMobile,
    email,
    preferredLang,
    shopName,
    shopCategory,
    stateName,
    districtName,
    cityName,
    localityName,
    fullAddress,
    pincode,
    landmark,
    shopPhotos,
    gstin,
    businessType,
    annualTurnover,
    websiteUrl,
    isPublished,
    instagramHandle,
    socialLinks,
    customLinks,
    panNumber,
    currentStep
  ]);

  const saveDraft = () => {
    const draftPayload = {
      ownerName,
      mobileNumber,
      whatsappNumber,
      sameAsMobile,
      email,
      preferredLang,
      shopName,
      shopCategory,
      stateName,
      districtName,
      cityName,
      localityName,
      fullAddress,
      pincode,
      landmark,
      shopPhotos,
      gstin,
      businessType,
      annualTurnover,
      websiteUrl,
      isPublished,
      instagramHandle,
      socialLinks,
      customLinks,
      panNumber,
      currentStep,
      lastSaved: new Date().toISOString()
    };
    try {
      localStorage.setItem('add_shop_form_draft', JSON.stringify(draftPayload));
    } catch (e) {
      console.error('Failed to manually save draft to localStorage:', e);
    }
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  const handleDetectLocation = () => {
    setIsDetectingLocation(true);
    setTimeout(() => {
      setIsDetectingLocation(false);
      setLocationDetected(true);
      setStateName('Rajasthan');
      setDistrictName('Jaipur');
      setCityName('Jaipur');
      setLocalityName('Mansarovar');
      setFullAddress('72, Madhyam Marg, Mansarovar, Jaipur');
      setPincode('302020');
      setLandmark('Near Metro Station');
    }, 1000);
  };

  // Live Camera API Handlers
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      setCameraError('Unable to access live camera stream. You can capture using your device camera or upload a photo.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setShopPhotos(prev => [...prev, dataUrl]);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setShopPhotos(prev => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Validation functions per step (always allow continue, auto-save in background)
  const isStepValid = (stepId: number): boolean => {
    if (stepId === 5) return documentPrivacyConsent;
    return true;
  };
  const canNavigateToStep = (targetStep: number): boolean => true;

  /**
   * The app shell scrolls an inner flex container, not the window, so
   * window.scrollTo and the default scrollIntoView behaviour are both no-ops
   * here. Walk up to the real scrolling ancestor and move that instead.
   */
  const getScrollContainer = (from: HTMLElement | null): HTMLElement | null => {
    let node = from?.parentElement ?? null;
    while (node) {
      const { overflowY } = window.getComputedStyle(node);
      if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) {
        return node;
      }
      node = node.parentElement;
    }
    return null;
  };

  const scrollShellToTop = () => {
    const container = getScrollContainer(formTopRef.current);
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleStepChange = (targetStep: number) => {
    if (currentStep === 5 && targetStep > 5) {
      if (!documentPrivacyConsent) {
        triggerDocToast(
          'error',
          'Document Privacy Consent Required',
          'Please tick the document privacy & security consent below to continue to Step 6.'
        );
        // The consent sits far down a long step, so Continue appeared to do
        // nothing. Bring it on screen and flash it so the blocker is obvious.
        const target = privacyConsentRef.current;
        const container = getScrollContainer(target);
        if (target && container) {
          const top =
            target.getBoundingClientRect().top -
            container.getBoundingClientRect().top +
            container.scrollTop -
            container.clientHeight / 2 +
            target.offsetHeight / 2;
          container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        } else {
          target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setHighlightPrivacyConsent(true);
        window.setTimeout(() => setHighlightPrivacyConsent(false), 2600);
        return;
      }
    }
    setCurrentStep(targetStep);
    scrollShellToTop();
  };

  return (
    <div ref={formTopRef} className="min-h-screen bg-[#FCF9F8] text-[#1b1c1b] pb-32 font-sans w-full overflow-x-hidden relative flex flex-col">
      {/* Toast Alert for Draft */}
      {draftSaved && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-fade-in w-[90%] max-w-sm">
          <CheckCircle2 size={18} className="text-emerald-400" />
          Draft saved successfully on this device!
        </div>
      )}

      {/* Hidden File & Native Camera Inputs */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden"
        multiple
      />
      <input 
        type="file" 
        ref={cameraInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
      />

      {/* Top App Bar */}
      <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm h-16">
        <div className="max-w-screen-xl mx-auto w-full flex items-center justify-between px-4 sm:px-6 md:px-8 h-16">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep(currentStep - 1);
                } else {
                  onBack();
                }
              }} 
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all"
              aria-label="Back"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <div>
              <h1 className="font-bold text-gray-900 text-lg">Add New Shop</h1>
              <p className="text-xs text-gray-500 font-medium">Step {currentStep} of 6</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-screen-xl mx-auto w-full px-4 sm:px-6 md:px-8 pt-6 pb-32 flex flex-col gap-6">
        {/* Progress Indicator */}
        {showStepper ? (
          <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative transition-all">
            <button 
              onClick={() => setShowStepper(false)} 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1 cursor-pointer transition-colors"
              title="Dismiss Progress Tracker"
            >
              <X size={14} />
            </button>
            <div className="flex justify-between items-center mb-2 pr-8">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Registration Progress</span>
              <span className="text-xs font-bold text-primary">{Math.round((currentStep / 6) * 100)}% Complete</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500" 
                style={{ width: `${(currentStep / 6) * 100}%` }}
              ></div>
            </div>

            {/* Breadcrumbs / Steps */}
            <div className="mt-4 flex items-center gap-1.5 overflow-x-auto pb-1 whitespace-nowrap text-xs no-scrollbar">
              {FORM_STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = isStepValid(step.id) && step.id < currentStep;
                const isAccessible = canNavigateToStep(step.id);

                return (
                  <React.Fragment key={step.id}>
                    {idx > 0 && (
                      <ChevronRight 
                        size={14} 
                        className={`shrink-0 transition-colors ${
                          step.id <= currentStep ? 'text-primary/60' : 'text-gray-300'
                        }`} 
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleStepChange(step.id)}
                      disabled={!isAccessible}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 select-none ${
                        isActive
                          ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20 scale-102'
                          : isCompleted
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : isAccessible
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                          : 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed opacity-60'
                      }`}
                    >
                      {isCompleted ? (
                        <Check size={13} className="text-emerald-600 shrink-0" />
                      ) : !isAccessible ? (
                        <Lock size={12} className="text-gray-300 shrink-0" />
                      ) : (
                        <StepIcon size={13} className="shrink-0" />
                      )}
                      <span>{step.name}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </section>
        ) : (
          <button 
            onClick={() => setShowStepper(true)}
            className="self-start bg-white border border-gray-200 shadow-sm rounded-full px-4 py-2 text-xs font-bold text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="w-4 h-4 rounded-full border-[2px] border-primary flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            </div>
            Show Progress: {Math.round((currentStep / 6) * 100)}%
          </button>
        )}

        {/* ================= STEP 1: OWNER DETAILS ================= */}
        {currentStep === 1 && (
          <>
            {/* Status Alert Banners */}
            {dupCheckStatus === 'success' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-emerald-900 text-sm">Clear to proceed</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">No existing active shop application found for +91 {mobileNumber}.</p>
                </div>
              </div>
            )}

            {dupCheckStatus === 'warning' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 text-sm">Application Exists</h4>
                    <p className="text-xs text-amber-700 mt-0.5">This mobile number is already linked to an existing application or shop.</p>
                  </div>
                </div>
                <button className="self-end px-3 py-1.5 bg-white text-amber-800 text-xs font-semibold rounded-lg shadow-sm border border-amber-200 hover:bg-amber-100/50">
                  View Existing Application
                </button>
              </div>
            )}

            {/* Form Card */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-primary"></div>
              
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <User className="text-primary" size={20} />
                Shop Owner Details
              </h2>

              <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
                {/* Owner Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Owner Full Name *</label>
                  <div className="relative flex items-center h-12 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 px-4 transition-all">
                    <User size={18} className="text-gray-400 mr-3 shrink-0" />
                    <input 
                      type="text" 
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Sunita Sharma"
                      className="w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-sm text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Mobile Number (Primary) *</label>
                  <div className="flex gap-2">
                    <div className="w-16 bg-gray-100 rounded-xl flex items-center justify-center font-semibold text-sm text-gray-700 shrink-0 border border-gray-200">
                      +91
                    </div>
                    <div className="relative flex-1 flex items-center h-12 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 px-4 transition-all">
                      <Phone size={18} className="text-gray-400 mr-3 shrink-0" />
                      <input 
                        type="tel" 
                        maxLength={10}
                        value={mobileNumber}
                        onChange={(e) => handleMobileChange(e.target.value)}
                        placeholder="98765 12345"
                        className="w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-sm text-gray-900 placeholder:text-gray-400 pr-20"
                      />
                      
                      {isVerified ? (
                        <div className="absolute right-3 flex items-center gap-1 text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg text-xs font-semibold">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          Verified
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => setShowOtpModal(true)}
                          className="absolute right-2 bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-gray-700">WhatsApp Number</label>
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 select-none">
                      <input 
                        type="checkbox"
                        checked={sameAsMobile}
                        onChange={handleSameAsMobileChange}
                        className="w-4 h-4 rounded text-primary border-gray-300 focus:ring-primary"
                      />
                      Same as mobile
                    </label>
                  </div>
                  <div className={`relative flex items-center h-12 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 px-4 transition-all ${sameAsMobile ? 'opacity-70 bg-gray-100' : ''}`}>
                    <MessageSquare size={18} className="text-gray-400 mr-3 shrink-0" />
                    <input 
                      type="tel" 
                      disabled={sameAsMobile}
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="Enter WhatsApp number"
                      className="w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-sm text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 flex justify-between">
                    Email Address <span className="text-gray-400 font-normal">Optional</span>
                  </label>
                  <div className="relative flex items-center h-12 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 px-4 transition-all">
                    <Mail size={18} className="text-gray-400 mr-3 shrink-0" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. sunita@example.com"
                      className="w-full bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-sm text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Preferred Language */}
                <div className="flex flex-col gap-2 pt-2">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Languages size={15} className="text-primary" />
                    Preferred Language for Communications
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { id: 'hi', label: 'हिंदी' },
                      { id: 'en', label: 'English' },
                      { id: 'hinglish', label: 'Hinglish' }
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setPreferredLang(lang.id)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                          preferredLang === lang.id
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </section>
          </>
        )}

        {/* ================= STEP 2: SHOP DETAILS ================= */}
        {currentStep === 2 && (
          <>
            {/* Verified Owner Summary Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 border-l-4 border-l-emerald-600 flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Verified Owner</p>
                <p className="text-base font-bold text-gray-900">{ownerName}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-gray-600 font-medium">+91 {mobileNumber}</span>
                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-600" /> Mobile Verified
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setCurrentStep(1)}
                className="text-primary text-xs font-bold hover:underline flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded-lg"
              >
                <Edit2 size={13} /> Edit
              </button>
            </div>

            {/* Shop Basic Info */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Tell Us About the Shop</h3>
              <p className="text-xs text-gray-500 mb-5">Enter the correct business name and location details.</p>

              <div className="space-y-4">
                {/* Shop Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Shop Name *</label>
                  <input 
                    type="text" 
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="Example: Glow Beauty Parlour"
                    className="h-12 bg-gray-50 rounded-xl px-4 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm font-medium text-gray-900"
                  />
                  <span className="text-[11px] text-gray-400">Use the shop name displayed on the shop board</span>
                </div>

                {/* Shop Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700">Shop Category *</label>
                  <select 
                    value={shopCategory}
                    onChange={(e) => setShopCategory(e.target.value)}
                    className="h-12 bg-gray-50 rounded-xl px-4 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-sm font-medium text-gray-900"
                  >
                    <option value="">Select Category</option>
                    <option value="Barber Shop">Barber Shop</option>
                    <option value="Beauty Parlour">Beauty Parlour</option>
                    <option value="Unisex Salon">Unisex Salon</option>
                    <option value="Nail Studio">Nail Studio</option>
                    <option value="Spa & Wellness">Spa & Wellness</option>
                    <option value="Tattoo & Piercing Studio">Tattoo & Piercing Studio</option>
                    <option value="Massage Parlour">Massage Parlour</option>
                    <option value="Hair & Makeup Studio">Hair & Makeup Studio</option>
                    <option value="Skin Care & Aesthetics Clinic">Skin Care & Aesthetics Clinic</option>
                    <option value="Bridal Studio">Bridal Studio</option>
                    <option value="Eyelash & Brow Bar">Eyelash & Brow Bar</option>
                    <option value="Retail & Cosmetic Store">Retail & Cosmetic Store</option>
                    <option value="Other Business">Other Business</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Storefront Photo Capture Card */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Camera className="text-primary" size={20} />
                  Shop Storefront Photos
                </h3>
                {shopPhotos.length > 0 && (
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <CheckCircle2 size={13} /> {shopPhotos.length} Photo{shopPhotos.length !== 1 ? 's' : ''} Captured
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Capture clear photos showing the front entrance and sign board of the shop.
              </p>

              {/* Photo Display / Action Box */}
              {shopPhotos.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {shopPhotos.map((photo, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100 group shadow-sm h-32 md:h-40">
                        <img 
                          src={photo} 
                          alt={`Shop Front ${idx + 1}`} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <button 
                          type="button"
                          onClick={() => setShopPhotos(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full transition-all cursor-pointer"
                          title="Remove Photo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {shopPhotos.length < 4 && (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="relative rounded-xl border-2 border-dashed border-gray-200 hover:border-primary/50 bg-gray-50/50 flex flex-col items-center justify-center text-center cursor-pointer transition-all h-32 md:h-40"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                          <Plus size={20} />
                        </div>
                        <span className="text-xs font-bold text-gray-600">Add More</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap justify-center gap-3 w-full">
                    <button 
                      type="button"
                      onClick={startCamera}
                      className="flex-1 min-w-[130px] h-10 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Camera size={16} /> Take Live Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 hover:border-primary/50 bg-gray-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Camera size={28} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">Upload Shop Front Photos</h4>
                  <p className="text-xs text-gray-500 max-w-sm mb-4">
                    Use your device camera to take live photos or select existing photos from gallery.
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 w-full max-w-xs">
                    <button 
                      type="button"
                      onClick={startCamera}
                      className="flex-1 min-w-[130px] h-10 bg-primary text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
                    >
                      <Camera size={16} /> Take Live Photo
                    </button>
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 min-w-[130px] h-10 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Upload size={16} /> Gallery
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Location Section */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Location Details</h3>

              {/* Detect Current Location Pink Action Banner */}
              <div className="flex flex-col gap-3 mb-6">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="w-full py-3.5 px-4 bg-[#FFEBF3] hover:bg-[#FFD6E7] text-[#D8006C] border border-[#FFC2DC] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs cursor-pointer"
                >
                  <Compass size={18} className={`text-[#D8006C] ${isDetectingLocation ? "animate-spin" : ""}`} />
                  {isDetectingLocation ? "Detecting GPS Location..." : "Detect Current Location"}
                </button>

                {/* Detected Location Card */}
                <div className="bg-[#F8F9FA] rounded-2xl p-3 border border-gray-200/80 flex items-center gap-3 shadow-2xs">
                  <div className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden shrink-0 border border-gray-300/60 relative">
                    <img 
                      src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=150&q=80" 
                      alt="Map Thumbnail" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <MapPin size={18} className="text-primary fill-primary/30" />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-wrap items-center justify-between gap-2 min-w-0">
                    <div>
                      <p className="text-xs font-bold text-gray-900 line-clamp-1">
                        Detected: {localityName || "Mansarovar"}, {cityName || "Jaipur"}, {stateName || "Rajasthan"}
                      </p>
                      <p className="text-[11px] text-gray-500 font-medium">GPS accuracy ±5m</p>
                    </div>
                    <span className="bg-[#E6F8EE] text-[#00A859] border border-[#B3EED0] px-3 py-1 rounded-full text-[11px] font-bold shrink-0">
                      Location Added
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Interactive Map Preview Component */}
              <div className="mb-6">
                <MapPreview 
                  fullAddress={fullAddress}
                  localityName={localityName}
                  cityName={cityName}
                  stateName={stateName}
                  pincode={pincode}
                  landmark={landmark}
                  onDetectLocation={handleDetectLocation}
                  isDetecting={isDetectingLocation}
                />
              </div>

              {/* Territory & Unique Shop Verification Badges */}
              <div className="flex flex-col gap-2.5 mb-6">
                <div className="bg-[#EBF9F1] border border-[#C6F0D6] rounded-2xl p-3.5 flex gap-2.5 items-center">
                  <CheckCircle2 size={18} className="text-[#00A859] shrink-0" />
                  <p className="text-xs text-[#008A48] font-semibold">This shop is inside your assigned Jaipur territory.</p>
                </div>
                <div className="bg-[#EBF9F1] border border-[#C6F0D6] rounded-2xl p-3.5 flex gap-2.5 items-center">
                  <CheckCircle2 size={18} className="text-[#00A859] shrink-0" />
                  <p className="text-xs text-[#008A48] font-semibold">No matching shop found. You can continue.</p>
                </div>
              </div>

              {/* Manual Address Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">State</label>
                  <input 
                    type="text" 
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="h-12 bg-[#F2F2F2] rounded-2xl px-4 border border-transparent focus:border-primary focus:bg-white focus:outline-none text-sm font-semibold text-gray-900 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">District</label>
                  <input 
                    type="text" 
                    value={districtName}
                    onChange={(e) => setDistrictName(e.target.value)}
                    className="h-12 bg-[#F2F2F2] rounded-2xl px-4 border border-transparent focus:border-primary focus:bg-white focus:outline-none text-sm font-semibold text-gray-900 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">City</label>
                  <input 
                    type="text" 
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    className="h-12 bg-[#F2F2F2] rounded-2xl px-4 border border-transparent focus:border-primary focus:bg-white focus:outline-none text-sm font-semibold text-gray-900 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Area or Locality</label>
                  <input 
                    type="text" 
                    value={localityName}
                    onChange={(e) => setLocalityName(e.target.value)}
                    className="h-12 bg-[#F2F2F2] rounded-2xl px-4 border border-transparent focus:border-primary focus:bg-white focus:outline-none text-sm font-semibold text-gray-900 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-gray-700">Full Address</label>
                  <textarea 
                    rows={2}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="bg-[#F2F2F2] rounded-2xl p-3.5 border border-transparent focus:border-primary focus:bg-white focus:outline-none text-sm font-semibold text-gray-900 resize-none transition-all"
                  ></textarea>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Pincode</label>
                  <input 
                    type="text" 
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="h-12 bg-[#F2F2F2] rounded-2xl px-4 border border-transparent focus:border-primary focus:bg-white focus:outline-none text-sm font-semibold text-gray-900 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">Landmark (Optional)</label>
                  <input 
                    type="text" 
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="h-12 bg-[#F2F2F2] rounded-2xl px-4 border border-transparent focus:border-primary focus:bg-white focus:outline-none text-sm font-semibold text-gray-900 transition-all"
                  />
                </div>
              </div>
            </section>
          </>
        )}

        {/* ================= STEP 3: BUSINESS DETAILS ================= */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Shop Summary Card */}
            <div className="bg-white border border-gray-200 rounded-[18px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex justify-between items-start">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
                  <Store className="text-primary" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">{shopName || 'Your salon'}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{shopCategory} • {localityName}, {cityName}</p>
                  <div className="flex items-center gap-1 mt-2 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full w-max text-xs font-medium">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Location Added</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setCurrentStep(2)} className="text-primary text-xs font-semibold hover:underline">Edit</button>
            </div>

            {/* Business Information Section */}
            <section className="bg-white rounded-[18px] border border-gray-200 p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">How Does This Shop Work?</h3>
                <p className="text-xs text-gray-500 mt-0.5">Add basic timing, staff and service details.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Timings */}
                <div className="grid grid-cols-2 gap-3 md:col-span-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Opening Time</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        value={openingTime}
                        onChange={(e) => setOpeningTime(e.target.value)}
                        className="w-full h-12 bg-gray-50 rounded-xl border border-gray-200 pl-4 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700 ml-1">Closing Time</label>
                    <div className="relative">
                      <input 
                        type="time" 
                        value={closingTime}
                        onChange={(e) => setClosingTime(e.target.value)}
                        className="w-full h-12 bg-gray-50 rounded-xl border border-gray-200 pl-4 pr-10 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Weekly Off */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 ml-1">Weekly Off</label>
                  <select 
                    value={weeklyOff}
                    onChange={(e) => setWeeklyOff(e.target.value)}
                    className="w-full h-12 bg-gray-50 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="None">None</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Sunday">Sunday</option>
                  </select>
                </div>

                {/* Staff Count */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 ml-1">Number of Staff</label>
                  <input 
                    type="number" 
                    value={staffCount}
                    onChange={(e) => setStaffCount(e.target.value)}
                    className="w-full h-12 bg-gray-50 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Starting Price */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 ml-1">Starting Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-semibold">₹</span>
                    <input 
                      type="number" 
                      value={startingPrice}
                      onChange={(e) => setStartingPrice(e.target.value)}
                      className="w-full h-12 bg-gray-50 rounded-xl border border-gray-200 pl-8 pr-4 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Years in Business */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 ml-1">Years in Business <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={yearsInBusiness}
                      onChange={(e) => setYearsInBusiness(e.target.value)}
                      className="w-full h-12 bg-gray-50 rounded-xl border border-gray-200 pl-4 pr-16 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-medium pointer-events-none">Years</span>
                  </div>
                </div>
              </div>

              {/* Business Type Chips */}
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-2">Business Type</label>
                <div className="flex flex-wrap gap-2">
                  {['Men', 'Women', 'Unisex'].map((type) => {
                    const active = businessGenderType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBusinessGenderType(type)}
                        className={`px-4 py-2 rounded-full text-xs font-semibold transition-all border ${
                          active 
                            ? 'bg-pink-50 border-primary text-primary shadow-xs ring-1 ring-primary/20' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Top Services Section */}
            <section className="bg-white rounded-[18px] border border-gray-200 p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Top Services</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Add the main services customers usually book.</p>
                </div>
              </div>

              <div className="space-y-3">
                {services.map((srv, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-3.5 flex justify-between items-center shadow-2xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-50 text-primary flex items-center justify-center">
                        <Scissors size={18} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900">{srv.name}</h4>
                        <p className="text-xs text-gray-500">₹{srv.price} • {srv.duration}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => alert(`Editing ${srv.name}`)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors" title="Edit Service">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setServices(services.filter((_, i) => i !== idx))} className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors" title="Delete Service">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {isAddingService && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 border border-primary/20 rounded-xl p-4 flex flex-col gap-3 shadow-sm"
                  >
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Service Name</label>
                      <input 
                        autoFocus
                        type="text" 
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        placeholder="e.g. Haircut, Facial"
                        className="h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm focus:border-primary focus:outline-none transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Price (₹)</label>
                        <input 
                          type="number" 
                          value={newServicePrice}
                          onChange={(e) => setNewServicePrice(e.target.value)}
                          placeholder="500"
                          className="h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm focus:border-primary focus:outline-none transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Duration</label>
                        <input 
                          type="text" 
                          value={newServiceDuration}
                          onChange={(e) => setNewServiceDuration(e.target.value)}
                          placeholder="30 mins"
                          className="h-10 bg-white border border-gray-200 rounded-lg px-3 text-sm focus:border-primary focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => {
                          if (newServiceName && newServicePrice) {
                            setServices([...services, { 
                              name: newServiceName, 
                              price: newServicePrice, 
                              duration: newServiceDuration || '30 mins' 
                            }]);
                            setNewServiceName('');
                            setNewServicePrice('');
                            setNewServiceDuration('');
                            setIsAddingService(false);
                          }
                        }}
                        className="flex-1 bg-primary text-white h-10 rounded-lg text-xs font-bold active:scale-95 transition-all"
                      >
                        Add Service
                      </button>
                      <button 
                        onClick={() => setIsAddingService(false)}
                        className="flex-1 bg-white border border-gray-200 text-gray-600 h-10 rounded-lg text-xs font-bold active:scale-95 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {!isAddingService && (
                <button 
                  type="button" 
                  onClick={() => setIsAddingService(true)}
                  className="w-full py-3.5 border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center gap-2 text-primary text-xs font-bold hover:bg-pink-50/50 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <Plus size={16} /> Add Another Service
                </button>
              )}
              <p className="text-[11px] text-gray-400 text-center">The shop owner can add more services later.</p>
            </section>

            {/* Business Description */}
            <section className="bg-white rounded-[18px] border border-gray-200 p-5 md:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 ml-1">About the Shop — Optional</label>
                <textarea 
                  rows={4}
                  value={aboutShop}
                  onChange={(e) => setAboutShop(e.target.value)}
                  placeholder="Describe the shop..."
                  className="w-full bg-gray-50 rounded-xl p-4 border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                ></textarea>
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-400">{aboutShop.length} / 300</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ================= STEP 4: WEBSITE SETUP ================= */}
        {currentStep === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Core Setup */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Shop Summary Card */}
              <div className="bg-white rounded-[18px] p-4 shadow-sm border border-[#E8E8E8] flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[18px]">{shopName || 'Your salon'}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span> {localityName || 'Mansarovar'}, {cityName || 'Jaipur'}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="bg-pink-100 text-primary px-2 py-1 rounded-full text-xs font-semibold">{shopCategory}</span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">3 Services Added</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setCurrentStep(2)} className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                </button>
              </div>

              {/* Template Selection Section */}
              <section>
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Choose a Website Template</h3>
                  <p className="text-sm text-gray-600">Select a professional design for your digital storefront.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'royal-luxe', name: 'Royal Luxe', desc: 'Elegant and premium design for high-end salons offering luxury services.', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=400&auto=format&fit=crop' },
                    { id: 'modern-salon', name: 'Modern Salon', desc: 'Clean, minimalist design focused on clarity and modern aesthetics.', img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop' },
                    { id: 'professional', name: 'Professional Beauty', desc: 'A structured and trustworthy layout ideal for diverse beauty services.', img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=400&auto=format&fit=crop' },
                  ].map((tmpl) => {
                    const isSelected = selectedTemplate === tmpl.id;
                    return (
                      <div key={tmpl.id} className={`bg-white rounded-[18px] overflow-hidden border ${isSelected ? 'border-2 border-primary shadow-lg ring-2 ring-primary/20 bg-pink-50/10' : 'border-[#E8E8E8] shadow-sm'} transition-transform group relative`}>
                        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary z-10"></div>}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center z-10 shadow-md">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                          </div>
                        )}
                        <div className="h-32 bg-gray-100 relative w-full">
                          <img src={tmpl.img} alt={tmpl.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="p-4 flex flex-col gap-2">
                          <h4 className={`font-semibold text-[18px] ${isSelected ? 'text-primary' : 'text-gray-900'}`}>{tmpl.name}</h4>
                          <p className="text-xs text-gray-600 line-clamp-2">{tmpl.desc}</p>
                          <div className="flex gap-2 mt-2">
                            <button 
                              type="button"
                              onClick={() => setPreviewTemplate(tmpl)} 
                              className="flex-1 border border-primary text-primary py-2 rounded-xl text-sm font-medium hover:bg-pink-50 transition-colors"
                            >
                              Preview
                            </button>
                            <button 
                              onClick={() => setSelectedTemplate(tmpl.id)}
                              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1 ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}
                            >
                              {isSelected ? <><span className="material-symbols-outlined text-[16px]">check_circle</span> Selected</> : 'Select'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Brand Identity Section */}
              <section className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Brand Identity</h3>
                    <p className="text-sm text-gray-600">Upload your logo and cover photo.</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">info</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Shop Logo Card */}
                  <div className="bg-white rounded-[18px] p-4 border border-[#E8E8E8] shadow-sm flex flex-col gap-3">
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">Shop Logo</span>
                      {shopLogo ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Uploaded
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">Missing</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center p-1 shrink-0">
                        {shopLogo ? (
                          <img src={shopLogo} alt="Logo" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <span className="material-symbols-outlined text-gray-400 text-3xl">store</span>
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm text-gray-900 truncate font-medium">{shopLogo ? 'logo-image.png' : 'No logo selected'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{shopLogo ? 'Custom Upload' : 'Upload shop branding'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button 
                        type="button"
                        onClick={() => logoInputRef.current?.click()} 
                        className="flex-1 bg-pink-50 text-primary py-2 rounded-xl text-sm font-bold flex justify-center items-center gap-1 hover:bg-pink-100 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload</span> {shopLogo ? 'Replace' : 'Upload'}
                      </button>
                      {shopLogo && (
                        <button 
                          type="button"
                          onClick={() => setShopLogo(null)} 
                          className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      )}
                    </div>
                    
                    <button 
                      type="button"
                      onClick={() => setIsLogoGeneratorOpen(true)}
                      className="mt-1 py-2 rounded-xl border border-dashed border-primary/30 flex items-center justify-center gap-2 text-primary text-[11px] font-bold hover:bg-pink-50 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      Don't have a logo? Use AI Helper
                    </button>
                  </div>

                  {/* Cover Photo Card */}
                  <div className="bg-white rounded-[18px] p-4 border border-[#E8E8E8] shadow-sm flex flex-col gap-3">
                    <input 
                      type="file" 
                      ref={coverInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleCoverUpload} 
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">Cover Photo</span>
                      {coverPhoto ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Uploaded
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">Missing</span>
                      )}
                    </div>
                    <div className="h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 relative">
                      {coverPhoto ? (
                        <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <span className="material-symbols-outlined text-3xl">image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-gray-900 truncate pr-2 font-medium">{coverPhoto ? 'cover-image.jpg' : 'No cover photo'}</p>
                      <div className="flex gap-2 flex-shrink-0">
                        <button 
                          type="button"
                          onClick={() => coverInputRef.current?.click()} 
                          className="text-primary text-xs font-bold hover:underline active:scale-95 transition-all"
                        >
                          {coverPhoto ? 'Replace' : 'Upload'}
                        </button>
                        {coverPhoto && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button 
                              type="button"
                              onClick={() => setCoverPhoto(null)} 
                              className="text-red-600 text-xs font-bold hover:underline active:scale-95 transition-all"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setIsCoverHelperOpen(true)}
                      className="mt-1 py-2 rounded-xl border border-dashed border-primary/30 flex items-center justify-center gap-2 text-primary text-[11px] font-bold hover:bg-pink-50 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                      Don't have a cover? Use Templates
                    </button>
                  </div>
                </div>
              </section>

              {/* Interior Photos Gallery */}
              <section className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Interior Photos</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm text-gray-600">Showcase your workspace to clients.</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${interiorPhotos.length >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                        {interiorPhotos.length} / 10 photos
                      </span>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={interiorInputRef} 
                    className="hidden" 
                    multiple 
                    accept="image/*" 
                    onChange={handleInteriorUpload} 
                  />
                  <button 
                    type="button"
                    onClick={() => interiorInputRef.current?.click()} 
                    disabled={interiorPhotos.length >= 10}
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 transition-all active:scale-95 ${
                      interiorPhotos.length >= 10 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-pink-50 text-primary hover:bg-pink-100 cursor-pointer'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">add_a_photo</span> Add Photo
                  </button>
                </div>

                {interiorError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 text-red-600 text-xs font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {interiorError}
                  </motion.div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {interiorPhotos.map((photo, idx) => (
                    <div key={idx} className="bg-white rounded-[18px] border border-[#E8E8E8] overflow-hidden group relative shadow-sm">
                      <div className="aspect-[4/3] bg-gray-100 relative w-full">
                        <img src={photo} alt={`Interior ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button 
                            type="button"
                            onClick={() => alert('Viewing photo')} 
                            className="w-9 h-9 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/40 transition-all active:scale-90"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button 
                            type="button"
                            onClick={() => setInteriorPhotos(interiorPhotos.filter((_, i) => i !== idx))} 
                            className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-all active:scale-90"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="p-3 bg-white border-t border-gray-50">
                        <p className="text-[11px] font-bold text-gray-900 truncate text-center uppercase tracking-wider">
                          {idx === 0 ? 'Reception Area' : idx === 1 ? 'Service Area' : idx === 2 ? 'Bridal Room' : `Workspace ${idx + 1}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => interiorInputRef.current?.click()} 
                    disabled={interiorPhotos.length >= 10}
                    className={`rounded-[18px] border-2 border-dashed aspect-[4/3] flex flex-col items-center justify-center gap-2 transition-all active:scale-95 group ${
                      interiorPhotos.length >= 10 
                      ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-60' 
                      : 'bg-gray-50 border-gray-200 hover:bg-pink-50/50 hover:border-primary/50 cursor-pointer'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      interiorPhotos.length >= 10 ? 'bg-gray-100 text-gray-300' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'
                    }`}>
                      <span className="material-symbols-outlined text-2xl">{interiorPhotos.length >= 10 ? 'block' : 'add'}</span>
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-tighter ${
                      interiorPhotos.length >= 10 ? 'text-gray-400' : 'text-gray-500 group-hover:text-primary'
                    }`}>
                      {interiorPhotos.length >= 10 ? 'Limit Reached' : 'Add More'}
                    </span>
                  </button>
                </div>
              </section>

              {/* Video Highlights Gallery */}
              <section className="bg-white rounded-[24px] p-6 border border-[#E8E8E8] shadow-sm">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Video Highlights</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-600 leading-relaxed max-w-lg">Supports Facebook Reels links, YouTube Shorts links, and Instagram Reels/Story links, or direct video uploads (max 15s, 20MB).</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${videoHighlights.length >= 5 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                        {videoHighlights.length} / 5 videos
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      ref={videoUploadRef} 
                      className="hidden" 
                      accept="video/*" 
                      onChange={handleVideoUpload} 
                    />
                    <button 
                      type="button"
                      onClick={() => setIsVideoHelperOpen(true)}
                      disabled={videoHighlights.length >= 5}
                      className={`px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1 transition-all active:scale-95 ${
                        videoHighlights.length >= 5 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">add_circle</span> Paste Link or Upload Video
                    </button>
                  </div>
                </div>

                {videoSuccess && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 bg-emerald-50 border border-emerald-100 p-3.5 rounded-xl flex items-center justify-between gap-2 text-emerald-800 text-xs font-semibold shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                      <span>{videoSuccess}</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setVideoSuccess(null)}
                      className="text-emerald-600 hover:text-emerald-800 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </motion.div>
                )}

                {videoError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-2 text-red-600 text-xs font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {videoError}
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videoHighlights.map((video, idx) => {
                    const isDataUrl = video.startsWith('data:video');
                    return (
                      <div key={idx} className="bg-white rounded-[20px] border border-[#E8E8E8] overflow-hidden group relative shadow-sm aspect-[9/16] max-h-[350px] mx-auto w-full">
                        {isDataUrl ? (
                          <video src={video} className="w-full h-full object-cover" controls={false} muted loop autoPlay />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                            <span className="material-symbols-outlined text-4xl text-gray-300">smart_display</span>
                            <iframe 
                              src={video.includes('youtube.com/embed') || video.includes('instagram.com/reels') ? video : undefined}
                              className="absolute inset-0 w-full h-full pointer-events-none"
                              title={`Video ${idx}`}
                            />
                            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px] text-white">link</span>
                              <span className="text-[10px] text-white font-bold uppercase">Social Link</span>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setVideoHighlights(videoHighlights.filter((_, i) => i !== idx))} 
                            className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-all active:scale-90"
                          >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {videoHighlights.length < 5 && (
                    <div className="bg-gray-50/80 rounded-[20px] border-2 border-dashed border-gray-200 aspect-[9/16] max-h-[350px] p-4 flex flex-col items-center justify-between text-center group hover:border-primary/50 transition-all">
                      <div className="flex flex-col items-center gap-2 my-auto">
                        <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-2xl text-primary">play_circle</span>
                        </div>
                        <span className="text-xs font-bold text-gray-800 group-hover:text-primary uppercase tracking-tight">
                          Paste Link or Upload Video
                        </span>
                        <p className="text-[10px] text-gray-500 leading-tight max-w-[170px]">
                          Paste Instagram, YouTube, or Facebook URL, or choose a file
                        </p>
                      </div>

                      <div className="w-full flex flex-col gap-2 my-auto">
                        <button 
                          type="button"
                          onClick={() => setIsVideoHelperOpen(true)}
                          className="w-full py-2.5 px-3 bg-primary text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">add_link</span>
                          Paste Link or Upload Video
                        </button>
                        <button 
                          type="button"
                          onClick={() => videoUploadRef.current?.click()}
                          className="w-full py-2 px-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-gray-100 transition-all active:scale-95 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">upload_file</span>
                          Select File (15s max)
                        </button>
                      </div>

                      <span className="text-[9px] font-medium text-gray-400">Max 5 videos • Up to 20MB</span>
                    </div>
                  )}
                </div>
              </section>

              {/* Social Media & Online Links Section */}
              <section className="bg-white rounded-[24px] p-6 border border-[#E8E8E8] shadow-sm flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">share</span>
                      <h3 className="text-xl font-bold text-gray-900">Social Media & Online Links</h3>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Add your official brand profiles and custom website links to showcase on your digital storefront.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      {(Object.values(socialLinks) as string[]).filter(v => v.trim().length > 0).length + customLinks.filter(c => c.url.trim().length > 0).length} Links Connected
                    </span>
                  </div>
                </div>

                {/* Standard Social Platforms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Facebook */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {renderSocialIcon('facebook', 'w-4 h-4')}
                        <span>Facebook (Profile / Page)</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">facebook.com/...</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 pointer-events-none flex items-center">
                        {renderSocialIcon('facebook', 'w-4 h-4')}
                      </div>
                      <input
                        type="text"
                        value={socialLinks.facebook}
                        onChange={(e) => handleSocialChange('facebook', e.target.value)}
                        placeholder="https://facebook.com/yourpage"
                        className={`w-full pl-10 pr-3 py-2.5 bg-gray-50/80 border ${socialErrors.facebook ? 'border-red-400 bg-red-50/30' : 'border-gray-200'} rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none`}
                      />
                    </div>
                    {socialErrors.facebook && (
                      <span className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">error</span> {socialErrors.facebook}
                      </span>
                    )}
                  </div>

                  {/* Instagram */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {renderSocialIcon('instagram', 'w-4 h-4')}
                        <span>Instagram</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">instagram.com/...</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 pointer-events-none flex items-center">
                        {renderSocialIcon('instagram', 'w-4 h-4')}
                      </div>
                      <input
                        type="text"
                        value={socialLinks.instagram}
                        onChange={(e) => handleSocialChange('instagram', e.target.value)}
                        placeholder="https://instagram.com/yourhandle"
                        className={`w-full pl-10 pr-3 py-2.5 bg-gray-50/80 border ${socialErrors.instagram ? 'border-red-400 bg-red-50/30' : 'border-gray-200'} rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none`}
                      />
                    </div>
                    {socialErrors.instagram && (
                      <span className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">error</span> {socialErrors.instagram}
                      </span>
                    )}
                  </div>

                  {/* YouTube */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {renderSocialIcon('youtube', 'w-4 h-4')}
                        <span>YouTube</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">youtube.com/...</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 pointer-events-none flex items-center">
                        {renderSocialIcon('youtube', 'w-4 h-4')}
                      </div>
                      <input
                        type="text"
                        value={socialLinks.youtube}
                        onChange={(e) => handleSocialChange('youtube', e.target.value)}
                        placeholder="https://youtube.com/@yourchannel"
                        className={`w-full pl-10 pr-3 py-2.5 bg-gray-50/80 border ${socialErrors.youtube ? 'border-red-400 bg-red-50/30' : 'border-gray-200'} rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none`}
                      />
                    </div>
                    {socialErrors.youtube && (
                      <span className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">error</span> {socialErrors.youtube}
                      </span>
                    )}
                  </div>

                  {/* LinkedIn */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {renderSocialIcon('linkedin', 'w-4 h-4')}
                        <span>LinkedIn</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">linkedin.com/...</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 pointer-events-none flex items-center">
                        {renderSocialIcon('linkedin', 'w-4 h-4')}
                      </div>
                      <input
                        type="text"
                        value={socialLinks.linkedin}
                        onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/company/yourcompany"
                        className={`w-full pl-10 pr-3 py-2.5 bg-gray-50/80 border ${socialErrors.linkedin ? 'border-red-400 bg-red-50/30' : 'border-gray-200'} rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none`}
                      />
                    </div>
                    {socialErrors.linkedin && (
                      <span className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">error</span> {socialErrors.linkedin}
                      </span>
                    )}
                  </div>

                  {/* X (formerly Twitter) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {renderSocialIcon('twitter', 'w-4 h-4')}
                        <span>X (formerly Twitter)</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">x.com/...</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 pointer-events-none flex items-center">
                        {renderSocialIcon('twitter', 'w-4 h-4')}
                      </div>
                      <input
                        type="text"
                        value={socialLinks.twitter}
                        onChange={(e) => handleSocialChange('twitter', e.target.value)}
                        placeholder="https://x.com/yourhandle"
                        className={`w-full pl-10 pr-3 py-2.5 bg-gray-50/80 border ${socialErrors.twitter ? 'border-red-400 bg-red-50/30' : 'border-gray-200'} rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none`}
                      />
                    </div>
                    {socialErrors.twitter && (
                      <span className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">error</span> {socialErrors.twitter}
                      </span>
                    )}
                  </div>

                  {/* Snapchat */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {renderSocialIcon('snapchat', 'w-4 h-4')}
                        <span>Snapchat</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">snapchat.com/...</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 pointer-events-none flex items-center">
                        {renderSocialIcon('snapchat', 'w-4 h-4')}
                      </div>
                      <input
                        type="text"
                        value={socialLinks.snapchat}
                        onChange={(e) => handleSocialChange('snapchat', e.target.value)}
                        placeholder="https://snapchat.com/add/yourusername"
                        className={`w-full pl-10 pr-3 py-2.5 bg-gray-50/80 border ${socialErrors.snapchat ? 'border-red-400 bg-red-50/30' : 'border-gray-200'} rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none`}
                      />
                    </div>
                    {socialErrors.snapchat && (
                      <span className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">error</span> {socialErrors.snapchat}
                      </span>
                    )}
                  </div>

                  {/* Google Business Profile */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {renderSocialIcon('googleBusiness', 'w-4 h-4')}
                        <span>Google Business Profile</span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-normal">maps.app.goo.gl/... or g.page/...</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 pointer-events-none flex items-center">
                        {renderSocialIcon('googleBusiness', 'w-4 h-4')}
                      </div>
                      <input
                        type="text"
                        value={socialLinks.googleBusiness}
                        onChange={(e) => handleSocialChange('googleBusiness', e.target.value)}
                        placeholder="https://maps.app.goo.gl/yourbusiness or https://g.page/yourbusiness"
                        className={`w-full pl-10 pr-3 py-2.5 bg-gray-50/80 border ${socialErrors.googleBusiness ? 'border-red-400 bg-red-50/30' : 'border-gray-200'} rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none`}
                      />
                    </div>
                    {socialErrors.googleBusiness && (
                      <span className="text-[11px] text-red-500 font-medium flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">error</span> {socialErrors.googleBusiness}
                      </span>
                    )}
                  </div>
                </div>

                {/* Other / Custom Website Links */}
                <div className="border-t border-gray-100 pt-5 mt-1">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {renderSocialIcon('custom', 'w-4 h-4')}
                        Other / Custom Website Links
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Add links to your online booking portal, digital menu, portfolio, blog, or external store.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomLink}
                      className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span> Add Custom Link
                    </button>
                  </div>

                  {customLinks.length === 0 ? (
                    <div className="p-4 bg-gray-50/80 rounded-xl border border-dashed border-gray-200 text-center text-xs text-gray-500">
                      No custom web links added yet. Click "+ Add Custom Link" above to add your own website or booking URL.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customLinks.map((item) => (
                        <div key={item.id} className="p-3 bg-gray-50/80 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row items-center gap-3">
                          <div className="flex-1 w-full flex flex-col sm:flex-row gap-2">
                            <div className="sm:w-1/3">
                              <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">Link Title</label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => handleCustomLinkChange(item.id, 'title', e.target.value)}
                                placeholder="e.g. Appointment Booking"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              />
                            </div>
                            <div className="sm:w-2/3">
                              <label className="text-[10px] font-bold text-gray-500 block mb-1 uppercase tracking-wider">URL Link</label>
                              <input
                                type="text"
                                value={item.url}
                                onChange={(e) => handleCustomLinkChange(item.id, 'url', e.target.value)}
                                placeholder="e.g. https://booking.yourbrand.com"
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomLink(item.id)}
                            className="self-end sm:self-center w-8 h-8 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center shrink-0 transition-all active:scale-90 cursor-pointer"
                            title="Remove custom link"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right Column: Contextual Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Website Settings & Store Publish Status */}
              <div className="bg-white rounded-[18px] p-5 border border-[#E8E8E8] shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">settings</span>
                    <h3 className="text-base font-bold text-gray-900">Website Settings</h3>
                  </div>
                  {/* Status Badge */}
                  {isPublished ? (
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      ● PUBLISHED (LIVE)
                    </span>
                  ) : (
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      ○ UNPUBLISHED (DRAFT)
                    </span>
                  )}
                </div>

                {/* Interactive Toggle Control */}
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-900">Store Publish Status</span>
                    <span className="text-[11px] text-gray-500 mt-0.5">
                      {isPublished ? 'Publicly accessible to clients' : 'Hidden from public access'}
                    </span>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPublished}
                    onClick={handleTogglePublish}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      isPublished ? 'bg-emerald-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isPublished ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Domain & Live Preview Link */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Live Store Address</label>
                  <div className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                    <span className="text-xs font-medium text-gray-700 truncate">{websiteUrl || 'https://glowbeautyparlour.com'}</span>
                    {isPublished ? (
                      <a
                        href={websiteUrl || 'https://glowbeautyparlour.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0 bg-pink-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        Preview Store
                      </a>
                    ) : (
                      <span
                        className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg cursor-not-allowed flex items-center gap-1 select-none"
                        title="Store is currently hidden from public"
                      >
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        Preview Store
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Notice Message */}
                {isPublished ? (
                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600 mt-0.5 shrink-0">check_circle</span>
                    <span>Store is now live! Customers can visit your storefront URL and book services online.</span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-amber-600 mt-0.5 shrink-0">info</span>
                    <span>Store is currently hidden from public.</span>
                  </div>
                )}
              </div>
              <div className="bg-white rounded-[18px] p-5 border border-[#E8E8E8] shadow-sm lg:sticky lg:top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">preview</span> Website Preview
                </h3>
                <div className="w-full bg-gray-100 rounded-3xl p-2 border-4 border-gray-200 shadow-inner mb-4 relative overflow-hidden h-[300px]">
                  <div className="bg-white w-full h-full rounded-2xl overflow-y-auto no-scrollbar relative shadow-sm">
                    <div className="h-32 bg-gray-200 relative">
                      <img src={coverPhoto || (shopPhotos.length > 0 ? shopPhotos[0] : '')} alt="Storefront" className="w-full h-full object-cover" />
                      <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden p-1">
                        <img src={shopLogo || ''} alt="Logo" className="w-full h-full object-contain rounded-full" />
                      </div>
                    </div>
                    <div className="pt-8 px-4 pb-4">
                      <h4 className="text-sm font-bold text-gray-900">{shopName || 'Your salon'}</h4>
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">location_on</span> {localityName || 'Mansarovar'}, {cityName || 'Jaipur'}</p>
                      <div className="mt-3 bg-pink-50 rounded-lg p-2 flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-primary">Starting Price</span>
                        <span className="text-[12px] font-bold text-primary">₹300</span>
                      </div>

                      {/* Connected Social Media Icons */}
                      {((Object.values(socialLinks) as string[]).some(url => url.trim().length > 0) || customLinks.some(c => c.url.trim().length > 0)) && (
                        <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                          {socialLinks.facebook.trim() && (
                            <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors" title="Facebook">
                              {renderSocialIcon('facebook', 'w-3.5 h-3.5')}
                            </a>
                          )}
                          {socialLinks.instagram.trim() && (
                            <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors" title="Instagram">
                              {renderSocialIcon('instagram', 'w-3.5 h-3.5')}
                            </a>
                          )}
                          {socialLinks.youtube.trim() && (
                            <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors" title="YouTube">
                              {renderSocialIcon('youtube', 'w-3.5 h-3.5')}
                            </a>
                          )}
                          {socialLinks.linkedin.trim() && (
                            <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors" title="LinkedIn">
                              {renderSocialIcon('linkedin', 'w-3.5 h-3.5')}
                            </a>
                          )}
                          {socialLinks.twitter.trim() && (
                            <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors" title="X / Twitter">
                              {renderSocialIcon('twitter', 'w-3.5 h-3.5')}
                            </a>
                          )}
                          {socialLinks.snapchat.trim() && (
                            <a href={socialLinks.snapchat} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors" title="Snapchat">
                              {renderSocialIcon('snapchat', 'w-3.5 h-3.5')}
                            </a>
                          )}
                          {socialLinks.googleBusiness.trim() && (
                            <a href={socialLinks.googleBusiness} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors" title="Google Business Profile">
                              {renderSocialIcon('googleBusiness', 'w-3.5 h-3.5')}
                            </a>
                          )}
                          {customLinks.filter(c => c.url.trim().length > 0).map(c => (
                            <a key={c.id} href={c.url.startsWith('http') ? c.url : `https://${c.url}`} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors" title={c.title || 'Custom Link'}>
                              {renderSocialIcon('custom', 'w-3.5 h-3.5')}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsFullPreviewOpen(true)} className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span> Full Preview
                </button>
              </div>

              {/* Photo Guidelines */}
              <div className="bg-pink-50 rounded-[18px] p-4 border border-pink-200">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary mt-0.5">lightbulb</span>
                  <div>
                    <h4 className="text-sm font-semibold text-primary">Photo Guidelines</h4>
                    <p className="text-xs text-gray-700 mt-1">Clear, well-lit photos increase client bookings by 40%. Ensure your space looks clean and bright.</p>
                    <ul className="list-disc list-inside mt-2 text-xs text-gray-600 space-y-1">
                      <li>Use natural light when possible</li>
                      <li>Keep areas tidy and organized</li>
                      <li>Landscape (horizontal) works best</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: DOCUMENTS ================= */}
        {currentStep === 5 && (
          <div className="space-y-6">
            {/* Shop Summary Snippet */}
            <section className="bg-white rounded-[18px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-200 relative overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
              <div className="flex justify-between items-start ml-2">
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">{shopName || 'Your salon'}</h3>
                  <p className="text-xs text-gray-500 flex flex-col gap-1">
                    <span className="flex items-center gap-1.5">
                      <User size={14} className="opacity-70 text-gray-500" />
                      <span>Owner: {ownerName || 'Owner'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="opacity-70 text-gray-500" />
                      <span>{localityName || 'Mansarovar'}, {cityName || 'Jaipur'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span>Website Images Added</span>
                    </span>
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  aria-label="Edit details" 
                  className="text-primary bg-pink-50 hover:bg-pink-100 rounded-full p-2 active:scale-95 transition-all"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </section>


            {/* Document Uploads Header */}
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    Upload Required Documents
                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-pink-50 text-primary border border-pink-200 rounded-full">
                      Step 5 of 6
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Upload Government ID proofs (Aadhaar, PAN, Voter ID) and shop exterior photo for verification.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200/80 flex items-center gap-1.5">
                    <Award size={14} className="text-amber-500" />
                    <span>
                      {uploadedDocs.length} of {GOVT_DOC_SLOTS.filter(s => s.required).length} Required Uploaded
                    </span>
                  </span>
                </div>
              </div>

              {/* Document Type Selector Bar */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                      <FileBadge size={18} className="text-pink-400" />
                      Document Selection & Universal File Uploader
                    </h3>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      Select document type first, then choose file (Maximum 5 MB limit enforced).
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30 shrink-0 self-start sm:self-auto flex items-center gap-1">
                    <ShieldCheck size={12} /> Duplicate Prevention Active
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                  <div className="flex-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                      Target Document Type:
                    </label>
                    <select
                      value={selectedDocTypeForUpload}
                      onChange={(e) => setSelectedDocTypeForUpload(e.target.value as any)}
                      className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer"
                    >
                      <option value="aadhaar_front">Aadhaar Card - Front (Required)</option>
                      <option value="aadhaar_back">Aadhaar Card - Back (Address Proof)</option>
                      <option value="pan_card">PAN Card (Required)</option>
                      <option value="voter_id">Voter ID / Election Card</option>
                      <option value="shop_front">Shop Front Photo (Required)</option>
                      <option value="other">Other Custom Document</option>
                    </select>
                  </div>

                  {selectedDocTypeForUpload === 'other' && (
                    <div className="flex-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                        Document Label / Title:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Trade License, GST Certificate"
                        value={customDocTypeLabel}
                        onChange={(e) => setCustomDocTypeLabel(e.target.value)}
                        className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="flex items-end gap-2 pt-2 sm:pt-0">
                    <label className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shadow-sm">
                      <Upload size={14} />
                      <span>Upload File</span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const slot = GOVT_DOC_SLOTS.find(s => s.type === selectedDocTypeForUpload);
                            const label = selectedDocTypeForUpload === 'other'
                              ? (customDocTypeLabel.trim() || 'Custom Document')
                              : (slot?.label || 'Government ID Proof');
                            
                            handleDocFileUpload(selectedDocTypeForUpload, label, e.target.files[0]);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const slot = GOVT_DOC_SLOTS.find(s => s.type === selectedDocTypeForUpload);
                        const label = selectedDocTypeForUpload === 'other'
                          ? (customDocTypeLabel.trim() || 'Custom Document')
                          : (slot?.label || 'Government ID Proof');
                        handleDocSampleUpload(selectedDocTypeForUpload, label);
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-gray-200 border border-slate-700 px-3 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 flex items-center gap-1"
                      title="Attach sample demo file"
                    >
                      <Sparkles size={13} className="text-amber-400" />
                      <span className="hidden sm:inline">Attach Demo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid of Dedicated Government ID & Shop Document Upload Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {GOVT_DOC_SLOTS.map((slot) => {
                  const existingDoc = uploadedDocs.find(d => d.type === slot.type);
                  const isShopFront = slot.type === 'shop_front';

                  return (
                    <div
                      key={slot.type}
                      className={`bg-white rounded-[18px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border flex flex-col justify-between transition-all ${
                        isShopFront ? 'border-pink-300 ring-2 ring-pink-500/10' : 'border-gray-200 hover:border-pink-200'
                      }`}
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                              {isShopFront && <Camera size={14} className="text-primary shrink-0" />}
                              {slot.label} {slot.required && <span className="text-red-500">*</span>}
                            </h4>
                            <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                              {slot.description}
                            </p>
                          </div>
                          {existingDoc ? (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0 flex items-center gap-1 shadow-2xs">
                              <CheckCircle2 size={12} className="text-emerald-600" /> Uploaded
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md border border-gray-200 shrink-0">
                              {slot.required ? 'Required' : 'Optional'}
                            </span>
                          )}
                        </div>

                        {/* Fixed Aspect Ratio Preview Box */}
                        <div className="relative w-full h-40 bg-slate-900/5 dark:bg-slate-800/40 rounded-xl overflow-hidden border border-gray-200/80 flex items-center justify-center p-1.5 my-2 group">
                          {existingDoc ? (
                            existingDoc.isImage && existingDoc.previewUrl ? (
                              <div className="w-full h-full relative overflow-hidden rounded-lg group">
                                <img
                                  src={existingDoc.previewUrl}
                                  alt={existingDoc.typeLabel}
                                  className="w-full h-full object-cover rounded-lg shadow-xs transition-transform duration-300 group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                  <button
                                    type="button"
                                    onClick={() => setPreviewDocModal(existingDoc)}
                                    className="bg-white/90 hover:bg-white text-gray-900 text-xs font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1 transition-transform active:scale-95"
                                  >
                                    <Eye size={13} /> Full View
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center p-3">
                                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs mb-1.5 shadow-xs">
                                  PDF
                                </div>
                                <p className="text-xs font-bold text-gray-900 truncate max-w-[170px]">
                                  {existingDoc.fileName}
                                </p>
                                <span className="text-[10px] text-gray-500 font-medium">
                                  {existingDoc.fileSize}
                                </span>
                              </div>
                            )
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                              {isShopFront ? (
                                <div className="flex flex-col items-center justify-center gap-1.5 w-full h-full">
                                  <div className="p-2.5 bg-pink-50 rounded-full text-primary">
                                    <Camera size={20} />
                                  </div>
                                  <span className="text-xs font-bold text-gray-800">Shop Exterior Photo</span>
                                  <span className="text-[10px] text-gray-400">JPG, PNG, WEBP (Max 5 MB)</span>
                                  
                                  <div className="flex items-center gap-1.5 mt-1 w-full max-w-[200px]">
                                    <label className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold text-[11px] py-1.5 px-2 rounded-lg text-center cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1">
                                      <Upload size={12} />
                                      <span>Upload</span>
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            handleDocFileUpload(slot.type, slot.label, e.target.files[0]);
                                            e.target.value = '';
                                          }
                                        }}
                                      />
                                    </label>
                                    <label className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] py-1.5 px-2 rounded-lg text-center cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1">
                                      <Camera size={12} className="text-pink-400" />
                                      <span>Camera</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => {
                                          if (e.target.files && e.target.files[0]) {
                                            handleDocFileUpload(slot.type, slot.label, e.target.files[0]);
                                            e.target.value = '';
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>
                              ) : (
                                <label className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-primary/50 bg-gray-50/50 hover:bg-pink-50/10 rounded-xl p-3 text-center cursor-pointer transition-all gap-1">
                                  <Upload size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
                                  <span className="text-xs font-bold text-gray-700">Upload {slot.shortLabel}</span>
                                  <span className="text-[10px] text-gray-400">PDF, JPG, PNG (Max 5 MB)</span>
                                  <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      if (e.target.files && e.target.files[0]) {
                                        handleDocFileUpload(slot.type, slot.label, e.target.files[0]);
                                        e.target.value = '';
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Quick Action Buttons */}
                      <div className="pt-1.5">
                        {existingDoc ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal(existingDoc)}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-2 rounded-xl transition-colors flex items-center justify-center gap-1"
                              title="View / Preview Full Size"
                            >
                              <Eye size={13} className="text-gray-600" />
                              <span>Preview</span>
                            </button>

                            <label className="flex-1 bg-pink-50 hover:bg-pink-100 text-primary font-bold text-xs py-2 rounded-xl text-center transition-colors cursor-pointer flex items-center justify-center gap-1">
                              <Upload size={13} />
                              <span>Replace</span>
                              <input
                                type="file"
                                accept={isShopFront ? "image/jpeg,image/png,image/webp,image/*" : "image/*,.pdf"}
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleDocFileUpload(slot.type, slot.label, e.target.files[0], true);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(existingDoc.id, existingDoc.typeLabel, existingDoc.type)}
                              className="px-2.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                              title="Remove Photo"
                            >
                              <Trash2 size={13} />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <label className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-2 rounded-xl text-center transition-colors cursor-pointer block">
                              Select File
                              <input
                                type="file"
                                accept={isShopFront ? "image/jpeg,image/png,image/webp,image/*" : "image/*,.pdf"}
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleDocFileUpload(slot.type, slot.label, e.target.files[0]);
                                    e.target.value = '';
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => handleDocSampleUpload(slot.type, slot.label)}
                              className="px-3 py-2 bg-pink-50 hover:bg-pink-100 text-primary font-bold text-xs rounded-xl transition-colors"
                              title="Attach sample demo file"
                            >
                              Demo File
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom / Additional Uploaded Documents Section */}
              {uploadedDocs.filter(d => !GOVT_DOC_SLOTS.some(s => s.type === d.type)).length > 0 && (
                <div className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={15} className="text-indigo-600" /> Additional Custom Uploaded Documents
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {uploadedDocs
                      .filter(d => !GOVT_DOC_SLOTS.some(s => s.type === d.type))
                      .map(doc => (
                        <div key={doc.id} className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-2 shadow-xs">
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-bold text-gray-900 truncate">{doc.typeLabel}</h5>
                            <p className="text-[10px] text-gray-500 truncate">{doc.fileName} • {doc.fileSize}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewDocModal(doc)}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(doc.id, doc.typeLabel, doc.type)}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </section>

            {/* Owner Consent */}
            <section className="space-y-4 pt-4 border-t border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Owner Consent</h2>
                <p className="text-xs text-gray-500 mt-0.5">Please confirm the following to proceed.</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 space-y-4 border border-gray-100/60">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center mt-0.5">
                    <input 
                      type="checkbox"
                      checked={confirmAccurate}
                      onChange={(e) => setConfirmAccurate(e.target.checked)}
                      className="h-5 w-5 rounded-full border-gray-300 bg-white text-primary focus:ring-primary/20 transition-all cursor-pointer appearance-none checked:border-primary checked:bg-primary"
                    />
                    {confirmAccurate && (
                      <Check size={14} className="text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none stroke-[3px]" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700 group-hover:text-primary transition-colors">
                    I confirm all details provided are accurate.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center mt-0.5">
                    <input 
                      type="checkbox"
                      checked={authorizeProfile}
                      onChange={(e) => setAuthorizeProfile(e.target.checked)}
                      className="h-5 w-5 rounded-full border-gray-300 bg-white text-primary focus:ring-primary/20 transition-all cursor-pointer appearance-none checked:border-primary checked:bg-primary"
                    />
                    {authorizeProfile && (
                      <Check size={14} className="text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none stroke-[3px]" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-700 group-hover:text-primary transition-colors">
                    I authorize the creation of a profile.
                  </span>
                </label>

                {/* Mandatory Document Privacy & Security Consent */}
                <label
                  ref={privacyConsentRef}
                  className={`flex items-start gap-3 cursor-pointer group pt-2 border-t transition-all rounded-xl ${
                    highlightPrivacyConsent
                      ? 'border-red-300 bg-red-50 ring-2 ring-red-300 p-3 -m-1'
                      : 'border-gray-200/60'
                  }`}
                >
                  <div className="relative flex items-center mt-0.5">
                    <input 
                      type="checkbox"
                      checked={documentPrivacyConsent}
                      onChange={(e) => setDocumentPrivacyConsent(e.target.checked)}
                      required
                      className="h-5 w-5 rounded-full border-gray-300 bg-white text-primary focus:ring-primary/20 transition-all cursor-pointer appearance-none checked:border-primary checked:bg-primary"
                    />
                    {documentPrivacyConsent && (
                      <Check size={14} className="text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none stroke-[3px]" />
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-800 group-hover:text-primary transition-colors leading-relaxed">
                    I acknowledge that all uploaded documents (Aadhaar, PAN, Voter ID, Shop Front Photo) will be used solely for identity and business verification purposes and will be handled securely without misuse. <span className="text-red-500 font-bold">*</span>
                  </span>
                </label>
              </div>
            </section>
          </div>
        )}

        {/* ================= STEP 6: REVIEW & SUBMIT ================= */}
        {currentStep === 6 && (
          <div className="space-y-6">
            {/* Progress Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-2 mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Review and Submit</h1>
                  <p className="text-sm text-gray-500 mt-1">Review the information carefully before submitting it for approval.</p>
                </div>
                <span className="self-start sm:self-auto text-xs text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full shadow-xs shrink-0">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  100% Complete
                </span>
              </div>
              
              {/* Step Path */}
              <div className="mt-4 flex flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 items-center">
                <span className="flex items-center text-emerald-600 font-medium cursor-pointer" onClick={() => setCurrentStep(1)}>Owner <Check size={12} className="ml-0.5" /></span>
                <ChevronRight size={12} className="text-gray-300" />
                <span className="flex items-center text-emerald-600 font-medium cursor-pointer" onClick={() => setCurrentStep(2)}>Shop <Check size={12} className="ml-0.5" /></span>
                <ChevronRight size={12} className="text-gray-300" />
                <span className="flex items-center text-emerald-600 font-medium cursor-pointer" onClick={() => setCurrentStep(3)}>Business <Check size={12} className="ml-0.5" /></span>
                <ChevronRight size={12} className="text-gray-300" />
                <span className="flex items-center text-emerald-600 font-medium cursor-pointer" onClick={() => setCurrentStep(4)}>Website <Check size={12} className="ml-0.5" /></span>
                <ChevronRight size={12} className="text-gray-300" />
                <span className="flex items-center text-emerald-600 font-medium cursor-pointer" onClick={() => setCurrentStep(5)}>Documents <Check size={12} className="ml-0.5" /></span>
                <ChevronRight size={12} className="text-gray-300" />
                <span className="font-bold text-gray-900">Review</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Details (lg:col-span-8) */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Section 1: Owner Details */}
                <section className="bg-white rounded-[18px] border border-gray-200 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] p-6 relative overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                  <div className="flex justify-between items-start mb-4 pl-2">
                    <div className="flex items-center gap-2">
                      <User size={18} className="text-gray-500" />
                      <h2 className="text-base font-bold text-gray-900">Owner Details</h2>
                    </div>
                    <button 
                      onClick={() => setCurrentStep(1)} 
                      className="text-xs font-bold text-primary bg-pink-50 hover:bg-pink-100 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Full Name</span>
                      <span className="text-sm font-bold text-gray-900">{ownerName || 'Owner'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Language</span>
                      <span className="text-sm font-bold text-gray-900">
                        {preferredLang === 'hi' ? 'हिंदी (Hindi)' : preferredLang === 'en' ? 'English' : preferredLang}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Mobile Number</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-bold text-gray-900">+91 {mobileNumber || '98765 12345'}</span>
                        <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center shrink-0">
                          <CheckCircle2 size={10} className="mr-0.5" /> Verified
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">WhatsApp & Email</span>
                      <span className="text-sm font-bold text-gray-900 block">+91 {whatsappNumber || '98765 12345'} (WA)</span>
                      <span className="text-xs text-gray-500">{email || 'sunita.sharma@example.com'}</span>
                    </div>
                  </div>
                </section>

                {/* Section 2: Shop Details */}
                <section className="bg-white rounded-[18px] border border-gray-200 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] p-6 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                  <div className="flex justify-between items-start mb-4 pl-2">
                    <div className="flex items-center gap-2">
                      <Store size={18} className="text-gray-500" />
                      <h2 className="text-base font-bold text-gray-900">Shop & Location Details</h2>
                    </div>
                    <button 
                      onClick={() => setCurrentStep(2)} 
                      className="text-xs font-bold text-primary bg-pink-50 hover:bg-pink-100 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Shop Name</span>
                      <span className="text-sm font-bold text-gray-900">{shopName || 'Your salon'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Category</span>
                      <span className="text-sm font-bold text-gray-900 capitalize">
                        {shopCategory}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Full Address</span>
                      <span className="text-sm font-bold text-gray-900 block">
                        {fullAddress || '123, MI Road, Near Raj Mandir Cinema, Jaipur, Rajasthan 302001'}
                      </span>
                      {landmark && <span className="text-xs text-gray-500">Landmark: {landmark}</span>}
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Location & Territory</span>
                      <div className="flex flex-col gap-1.5 mt-1">
                        <span className="bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg text-xs text-gray-700 flex items-center gap-1 w-fit font-medium">
                          <MapPin size={12} className="text-emerald-500" /> Location Pinned
                        </span>
                        <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-xs flex items-center gap-1 w-fit font-bold">
                          <Check size={12} /> Inside {cityName || 'Jaipur'} Territory
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-1 uppercase tracking-wider">Duplicate Check</span>
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-1.5 bg-emerald-50 border border-emerald-100 w-fit px-2.5 py-1 rounded-lg">
                        <CheckCircle2 size={12} className="text-emerald-500" /> Passed (No Duplicate Match Found)
                      </span>
                    </div>
                  </div>
                </section>

                {/* Section 3: Business Details */}
                <section className="bg-white rounded-[18px] border border-gray-200 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] p-6 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                  <div className="flex justify-between items-start mb-4 pl-2">
                    <div className="flex items-center gap-2">
                      <Building2 size={18} className="text-gray-500" />
                      <h2 className="text-base font-bold text-gray-900">Business Details</h2>
                    </div>
                    <button 
                      onClick={() => setCurrentStep(3)} 
                      className="text-xs font-bold text-primary bg-pink-50 hover:bg-pink-100 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pl-2">
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Hours</span>
                      <span className="text-xs font-bold text-gray-900">{openingTime} - {closingTime}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Weekly Off</span>
                      <span className="text-xs font-bold text-red-600">{weeklyOff || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Type & Staff</span>
                      <span className="text-xs font-bold text-gray-900">{businessGenderType} • {staffCount} Staff</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Experience</span>
                      <span className="text-xs font-bold text-gray-900">{yearsInBusiness} Years</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-4 pl-2">
                    <span className="text-[11px] font-semibold text-gray-400 block mb-3 uppercase tracking-wider">Key Services (Starting Price: ₹{startingPrice})</span>
                    <div className="flex flex-wrap gap-2">
                      {services.map((svc, idx) => (
                        <div key={idx} className="bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl flex justify-between items-center w-full md:w-auto md:min-w-[150px] gap-2">
                          <span className="text-xs text-gray-700 font-medium">{svc.name}</span>
                          <span className="text-xs font-bold text-gray-900">₹{svc.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Section 4: Website Setup */}
                <section className="bg-white rounded-[18px] border border-gray-200 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] p-6 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                  <div className="flex justify-between items-start mb-4 pl-2">
                    <div className="flex items-center gap-2">
                      <Globe size={18} className="text-gray-500" />
                      <h2 className="text-base font-bold text-gray-900">Website Setup</h2>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button"
                        onClick={() => setCurrentStep(4)} 
                        className="text-xs font-bold text-primary bg-pink-50 hover:bg-pink-100 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-6 items-start pl-2">
                    <div className="flex-1 w-full space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Selected Template</span>
                          <span className="text-sm font-bold text-gray-900 capitalize">
                            {selectedTemplate ? selectedTemplate.replace('-', ' ') : 'Modern Salon'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Store Publish Status</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {isPublished ? (
                              <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                ● PUBLISHED (LIVE)
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                ○ UNPUBLISHED (DRAFT)
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={handleTogglePublish}
                              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                            >
                              Toggle
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[11px] font-semibold text-gray-400 block mb-2 uppercase tracking-wider">Logo</span>
                          <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden">
                            {shopLogo ? (
                              <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <ImageIcon size={20} className="text-gray-300" />
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-gray-400 block mb-2 uppercase tracking-wider">Photos ({interiorPhotos.length + (coverPhoto ? 1 : 0)})</span>
                          <div className="flex -space-x-2">
                            {coverPhoto && (
                              <div className="w-10 h-10 rounded-lg bg-gray-50 border-2 border-white overflow-hidden shrink-0">
                                <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            )}
                            {interiorPhotos.slice(0, 2).map((img, idx) => (
                              <div key={idx} className="w-10 h-10 rounded-lg bg-gray-50 border-2 border-white overflow-hidden shrink-0">
                                <img src={img} alt="Interior" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            ))}
                            {interiorPhotos.length > 2 && (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 border-2 border-white overflow-hidden flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">
                                +{interiorPhotos.length - 2}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="text-[11px] font-semibold text-gray-400 block mb-1.5 uppercase tracking-wider">
                          Social Media & Online Links ({(Object.values(socialLinks) as string[]).filter(v => v.trim().length > 0).length + customLinks.filter(c => c.url.trim().length > 0).length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {socialLinks.facebook.trim() && (
                            <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                              {renderSocialIcon('facebook', 'w-3.5 h-3.5')} Facebook
                            </span>
                          )}
                          {socialLinks.instagram.trim() && (
                            <span className="px-2.5 py-1 bg-pink-50 border border-pink-100 text-pink-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                              {renderSocialIcon('instagram', 'w-3.5 h-3.5')} Instagram
                            </span>
                          )}
                          {socialLinks.youtube.trim() && (
                            <span className="px-2.5 py-1 bg-red-50 border border-red-100 text-red-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                              {renderSocialIcon('youtube', 'w-3.5 h-3.5')} YouTube
                            </span>
                          )}
                          {socialLinks.linkedin.trim() && (
                            <span className="px-2.5 py-1 bg-sky-50 border border-sky-100 text-sky-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                              {renderSocialIcon('linkedin', 'w-3.5 h-3.5')} LinkedIn
                            </span>
                          )}
                          {socialLinks.twitter.trim() && (
                            <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-800 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                              {renderSocialIcon('twitter', 'w-3.5 h-3.5')} X
                            </span>
                          )}
                          {socialLinks.snapchat.trim() && (
                            <span className="px-2.5 py-1 bg-amber-50 border border-amber-100 text-amber-800 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                              {renderSocialIcon('snapchat', 'w-3.5 h-3.5')} Snapchat
                            </span>
                          )}
                          {socialLinks.googleBusiness.trim() && (
                            <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                              {renderSocialIcon('googleBusiness', 'w-3.5 h-3.5')} Google Page
                            </span>
                          )}
                          {customLinks.filter(c => c.url.trim().length > 0).map(c => (
                            <span key={c.id} className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                              {renderSocialIcon('custom', 'w-3.5 h-3.5')} {c.title || 'Custom Link'}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-48 bg-gray-100 rounded-2xl p-2 border border-gray-200 aspect-[9/16] relative overflow-hidden flex-shrink-0 mx-auto md:mx-0 hidden md:block shadow-xs">
                      {/* Fake phone preview */}
                      <div className="w-full h-full bg-white rounded-xl shadow-xs overflow-hidden flex flex-col">
                        <div 
                          className="h-14 bg-cover bg-center" 
                          style={{ backgroundImage: `url(${coverPhoto || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop'})` }}
                        ></div>
                        <div className="p-2 flex-1">
                          <div className="w-8 h-8 rounded-full bg-pink-100 -mt-6 border-2 border-white mx-auto mb-2 flex items-center justify-center overflow-hidden">
                            {shopLogo ? (
                              <img src={shopLogo} alt="Logo preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-[8px] font-bold text-primary">GLOW</span>
                            )}
                          </div>
                          <div className="h-1.5 w-16 bg-gray-200 rounded mx-auto mb-1"></div>
                          <div className="h-1 w-10 bg-gray-100 rounded mx-auto mb-3"></div>
                          <div className="space-y-1">
                            <div className="h-3 w-full bg-gray-50 rounded"></div>
                            <div className="h-3 w-full bg-gray-50 rounded"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 5: Documents */}
                <section className="bg-white rounded-[18px] border border-gray-200 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] p-6 relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                  <div className="flex justify-between items-start mb-4 pl-2">
                    <div className="flex items-center gap-2">
                      <FileText size={18} className="text-gray-500" />
                      <h2 className="text-base font-bold text-gray-900">
                        Uploaded Verification Documents ({uploadedDocs.length})
                      </h2>
                    </div>
                    <button 
                      onClick={() => setCurrentStep(5)} 
                      className="text-xs font-bold text-primary bg-pink-50 hover:bg-pink-100 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      Edit Docs
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                    {uploadedDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-gray-900 block truncate">{doc.typeLabel}</span>
                          <span className="text-[10px] text-gray-500 truncate block">{doc.fileName} ({doc.fileSize})</span>
                        </div>
                        {doc.previewUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDocModal(doc)}
                            className="p-1 bg-white hover:bg-pink-50 text-gray-600 hover:text-primary rounded-lg border border-gray-200 transition-colors shrink-0"
                            title="Preview Document"
                          >
                            <Eye size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <CheckCircle2 size={16} className={confirmAccurate && authorizeProfile && documentPrivacyConsent ? "text-emerald-500 shrink-0" : "text-amber-500 shrink-0"} />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 block truncate">Owner & Privacy Consent</span>
                        <span className={`text-[10px] font-semibold block ${confirmAccurate && authorizeProfile && documentPrivacyConsent ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {confirmAccurate && authorizeProfile && documentPrivacyConsent ? 'Verified, Signed & Secured' : 'Pending Confirmation'}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column: Final Checks & Action (lg:col-span-4) */}
              <div className="lg:col-span-4 space-y-6">
                {/* Readiness Checklist */}
                <div className="bg-white rounded-[18px] border border-gray-200 shadow-xs p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Readiness Checklist</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-600">Mobile Number Verified</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-600">Location accurately pinned</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-600">Inside active territory limits</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-600">Passed duplicate shop check</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-600">All required documents uploaded</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className={documentPrivacyConsent ? "text-emerald-500 mt-0.5 shrink-0" : "text-amber-500 mt-0.5 shrink-0"} />
                      <span className="text-xs text-gray-600">Document Privacy & Security Consent Acknowledged</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-600">Website template selected</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className={isPublished ? "text-emerald-500 mt-0.5 shrink-0" : "text-amber-500 mt-0.5 shrink-0"} />
                      <span className="text-xs text-gray-600">
                        Store Publish Status: <strong className={isPublished ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>{isPublished ? 'Published (Live)' : 'Unpublished (Draft)'}</strong>
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Qualification Notice */}
                <div className="bg-pink-50/50 rounded-[18px] border border-pink-100 p-5">
                  <div className="flex items-start gap-3">
                    <Info size={18} className="text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 mb-1">Qualification Requirement</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">Submitting this shop does not automatically make it a qualifying shop for incentives.</p>
                      <p className="text-[11px] font-bold text-primary mt-2">Target: ₹1,000/day bookings for 15 consecutive days.</p>
                    </div>
                  </div>
                </div>

                {/* Final Confirmation Checkbox */}
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center mt-0.5">
                        <input 
                          type="checkbox"
                          checked={step6Confirmed}
                          onChange={(e) => setStep6Confirmed(e.target.checked)}
                          className="h-5 w-5 rounded-lg border-gray-300 bg-white text-primary focus:ring-primary/20 transition-all cursor-pointer appearance-none checked:border-primary checked:bg-primary"
                        />
                        {step6Confirmed && (
                          <Check size={14} className="text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none stroke-[3px]" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-700 group-hover:text-primary transition-colors leading-normal">
                        I confirm that I have reviewed all information and the submitted details are correct. I understand false information may lead to application rejection.
                      </span>
                    </label>
                  </div>

                  {/* Cancellation & Refund Policy Mandatory Checkbox */}
                  <div className="bg-pink-50/60 rounded-2xl p-4 border border-pink-100">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center mt-0.5">
                        <input 
                          type="checkbox"
                          checked={policyConfirmed}
                          onChange={(e) => setPolicyConfirmed(e.target.checked)}
                          required
                          className="h-5 w-5 rounded-lg border-gray-300 bg-white text-primary focus:ring-primary/20 transition-all cursor-pointer appearance-none checked:border-primary checked:bg-primary"
                        />
                        {policyConfirmed && (
                          <Check size={14} className="text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none stroke-[3px]" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-800 group-hover:text-primary transition-colors leading-normal">
                        “मैंने Cancellation & Refund Policy पढ़ ली है और मैं इससे सहमत हूँ।”{' '}
                        <button 
                          type="button" 
                          onClick={() => setIsPolicyModalOpen(true)}
                          className="text-primary font-bold underline hover:opacity-80 inline"
                        >
                          (Read Policy)
                        </button>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-50 shadow-2xl flex items-center justify-between gap-4">
        <div className="w-full max-w-screen-xl mx-auto flex items-center justify-between gap-4">
          <button 
            type="button"
            onClick={() => {
              if (currentStep > 1) {
                handleStepChange(currentStep - 1);
              } else {
                onBack();
              }
            }}
            className="px-6 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-2xl active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            Back
          </button>

          {currentStep < 6 ? (
            <button 
              type="button"
              onClick={() => handleStepChange(currentStep + 1)}
              title={
                currentStep === 5 && !documentPrivacyConsent
                  ? 'Tick the document privacy consent to continue'
                  : undefined
              }
              className={`flex-1 h-12 font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl active:scale-98 cursor-pointer border border-white/20 ${
                currentStep === 5 && !documentPrivacyConsent
                  ? 'bg-primary/60 text-white/90 hover:bg-primary/70'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              Continue
              <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              type="button"
              disabled={!step6Confirmed || !policyConfirmed || submittingApp}
              onClick={async () => {
                setSubmittingApp(true);
                setSubmitError(null);
                try {
                  await submitShopApplication(supabase!, {
                    ownerEmail: email,
                    ownerPhone: mobileNumber,
                    shopName,
                    city: cityName,
                    locality: localityName,
                    fullAddress: fullAddress,
                    openingTime,
                    closingTime,
                    aboutShop: '',
                    websiteTemplate: 'classic',
                  });
                  if (onComplete) {
                    onComplete();
                  } else {
                    onBack();
                  }
                } catch (err: any) {
                  setSubmitError(err?.message || 'Submission failed. Please try again.');
                } finally {
                  setSubmittingApp(false);
                }
              }}
              className={`flex-1 h-12 font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                (step6Confirmed && policyConfirmed)
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-98 cursor-pointer" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
              }`}
            >
              {submittingApp ? 'Submitting…' : 'Submit & Onboard'}
              <CheckCircle2 size={20} />
            </button>
          )}
        </div>
      </div>

      {submitError && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] w-[calc(100%-2rem)] max-w-md bg-red-50 border border-red-200 text-red-900 text-xs font-semibold p-4 rounded-2xl shadow-2xl">
          Submission blocked by the server: {submitError}
        </div>
      )}

      {/* Toast alerts. Rendered as a fixed overlay: it used to live inside the
          Step 5 markup, so a message triggered from the sticky footer appeared
          thousands of pixels down the page and the user never saw it. */}
      <AnimatePresence>
        {docToast && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.98 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-2rem)] max-w-md p-4 rounded-2xl border shadow-2xl flex items-start gap-3 overflow-hidden ${
              docToast.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : docToast.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : docToast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {docToast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {docToast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {docToast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {docToast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
            </div>
            <div className="flex-1 pr-6">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">{docToast.title}</h4>
              <p className="text-xs leading-relaxed font-medium">{docToast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setDocToast(null)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancellation Policy Modal */}
      <CancellationPolicyModal isOpen={isPolicyModalOpen} onClose={() => setIsPolicyModalOpen(false)} />

      <AnimatePresence>
        {previewTemplate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewTemplate(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">web</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{previewTemplate.name}</h3>
                    <p className="text-xs text-gray-500">Live Preview</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewTemplate(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body: The Mock Website */}
              <div className="flex-grow overflow-y-auto no-scrollbar p-6 bg-gray-50">
                <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                  {/* Website Header */}
                  <div className="h-48 bg-gray-200 relative">
                    <img src={previewTemplate.img} alt={previewTemplate.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-6 flex items-end gap-4">
                      <div className="w-16 h-16 rounded-full bg-white p-1 shadow-lg">
                        <img src={shopLogo || ''} alt="Logo" className="w-full h-full object-contain rounded-full" />
                      </div>
                      <div className="pb-1">
                        <h4 className="text-xl font-bold text-white">{shopName}</h4>
                        <p className="text-xs text-white/80">{shopCategory} • {localityName}, {cityName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Website Content */}
                  <div className="p-8">
                    <div className="mb-8">
                      <h5 className="text-lg font-bold text-gray-900 mb-2">Welcome to {shopName}</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">{previewTemplate.desc}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 mb-8">
                      <h5 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Our Services</h5>
                      {services.map((service, idx) => (
                        <div key={idx} className="flex justify-between items-center p-4 rounded-xl border border-gray-100 hover:border-primary/20 transition-colors">
                          <div>
                            <p className="font-bold text-gray-900">{service.name}</p>
                            <p className="text-xs text-gray-500">{service.duration}</p>
                          </div>
                          <p className="font-bold text-primary">₹{service.price}</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-primary/5 rounded-2xl p-6 text-center border border-primary/10">
                      <h5 className="font-bold text-gray-900 mb-1">Ready to book?</h5>
                      <p className="text-xs text-gray-600 mb-4">Book your appointment in just a few clicks.</p>
                      <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md shadow-primary/20">Book Now</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setPreviewTemplate(null)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setSelectedTemplate(previewTemplate.id);
                    setPreviewTemplate(null);
                  }}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-primary/10"
                >
                  Apply Template
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Cover Photo Helper Modal */}
      <AnimatePresence>
        {isCoverHelperOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCoverHelperOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Cover Photo Helper</h3>
                    <p className="text-xs text-gray-500">Choose a professional banner for your profile</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCoverHelperOpen(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh] no-scrollbar">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-primary text-sm">collections</span>
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Premium Templates (16:9)</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {[
                        { id: 'hair', label: 'Hair Salon & Barber', url: '/src/assets/images/hair_salon_cover_1785213611217.jpg', desc: 'Modern styling imagery with bold typography' },
                        { id: 'beauty', label: 'Beauty Parlour', url: '/src/assets/images/beauty_parlour_cover_1785213627567.jpg', desc: 'Elegant makeup and skincare aesthetics' },
                        { id: 'spa', label: 'Spa & Wellness', url: '/src/assets/images/spa_wellness_cover_1785213647098.jpg', desc: 'Calming visuals for relaxation services' },
                        { id: 'tattoo', label: 'Tattoo & Piercing', url: '/src/assets/images/tattoo_studio_cover_1785213662029.jpg', desc: 'Edgy, stylized professional studio shots' },
                        { id: 'nail', label: 'Nail Studio', url: '/src/assets/images/nail_studio_cover_1785213674923.jpg', desc: 'Vibrant and artistic manicure displays' }
                      ].map((template) => (
                        <button 
                          key={template.id}
                          onClick={() => {
                            setCoverPhoto(template.url);
                            setIsCoverHelperOpen(false);
                          }}
                          className="group flex flex-col rounded-2xl border border-gray-100 overflow-hidden hover:border-primary transition-all shadow-sm bg-gray-50/30"
                        >
                          <div className="aspect-video w-full relative">
                            <img src={template.url} alt={template.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="px-4 py-2 bg-primary text-white rounded-full text-xs font-bold shadow-lg">Use This Template</span>
                            </div>
                          </div>
                          <div className="p-3 flex justify-between items-center bg-white">
                            <div className="text-left">
                              <p className="text-sm font-bold text-gray-900">{template.label}</p>
                              <p className="text-[11px] text-gray-500">{template.desc}</p>
                            </div>
                            <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">check_circle</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-amber-600 text-lg">info</span>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        <span className="font-bold">Safe Zone Design:</span> These templates are designed with a central safe zone. Key information will remain visible even when cropped for mobile or tablet views.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50">
                <button 
                  onClick={() => setIsCoverHelperOpen(false)}
                  className="w-full py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 active:scale-95 transition-all hover:bg-gray-100"
                >
                  Close Helper
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Logo Generator Modal */}
      <AnimatePresence>
        {isLogoGeneratorOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLogoGeneratorOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">auto_awesome</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Logo Design Helper</h3>
                    <p className="text-xs text-gray-500">Generate or create your shop logo</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsLogoGeneratorOpen(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh] no-scrollbar">
                {/* AI Suggestions */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-sm">stars</span>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">AI Generated Concepts</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 1, url: '/src/assets/images/logo_variation_1_1785212529747.jpg', label: 'Minimalist' },
                      { id: 2, url: '/src/assets/images/logo_variation_2_1785212596463.jpg', label: 'Professional' },
                      { id: 3, url: '/src/assets/images/logo_variation_3_1785212612276.jpg', label: 'Elegant' }
                    ].map((logo) => (
                      <button 
                        key={logo.id}
                        onClick={() => {
                          setShopLogo(logo.url);
                          setIsLogoGeneratorOpen(false);
                        }}
                        className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-primary transition-all shadow-sm"
                      >
                        <img src={logo.url} alt={logo.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="text-[10px] font-bold text-white bg-primary px-2 py-1 rounded-full">Apply</span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-3 italic text-center">Click a concept above to use it instantly for your shop.</p>
                </div>

                {/* Free Design Tools */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary text-sm">construction</span>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Free Logo Makers</h4>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { name: 'Canva Logo Maker', url: 'https://www.canva.com/create/logos/', icon: 'brush', desc: 'User-friendly drag & drop editor with 1000s of templates.' },
                      { name: 'Looka AI', url: 'https://looka.com/', icon: 'bolt', desc: 'AI-powered logo generator that learns your style preferences.' },
                      { name: 'Hatchful by Shopify', url: 'https://hatchful.shopify.com/', icon: 'shopping_bag', desc: 'Professional logos tailored for retail and beauty businesses.' }
                    ].map((tool) => (
                      <a 
                        key={tool.name}
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-primary/20 hover:bg-pink-50/30 transition-all group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined">{tool.icon}</span>
                        </div>
                        <div className="flex-grow">
                          <h5 className="text-sm font-bold text-gray-900">{tool.name}</h5>
                          <p className="text-[11px] text-gray-500">{tool.desc}</p>
                        </div>
                        <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">open_in_new</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
                <p className="text-[11px] text-gray-500 text-center px-4">
                  These tools are third-party services. Once you create a logo, download it and use the <span className="font-bold">Upload</span> button in the registration form.
                </p>
                <button 
                  onClick={() => setIsLogoGeneratorOpen(false)}
                  className="w-full py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 active:scale-95 transition-all"
                >
                  Close Helper
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Video Highlights Helper Modal */}
      <AnimatePresence>
        {isVideoHelperOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVideoHelperOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">play_circle</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Add Video Highlight</h3>
                    <p className="text-xs text-gray-500">Showcase your shop in action</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsVideoHelperOpen(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {videoError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{videoError}</span>
                  </div>
                )}

                {/* Method 1: Paste Link */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary text-sm">link</span>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Social Media Link</h4>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <p className="text-[11px] text-gray-500">Supported: Facebook Reels, YouTube Shorts, Instagram Reels/Stories</p>
                    <div className="relative">
                      <input 
                        type="text"
                        value={videoUrlInput}
                        onChange={(e) => {
                          setVideoUrlInput(e.target.value);
                          if (videoError) setVideoError(null);
                        }}
                        placeholder="Paste video URL here (e.g. https://instagram.com/reel/...)"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveVideoHighlight();
                          }
                        }}
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">add_link</span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold text-gray-400">
                    <span className="bg-white px-4">Or</span>
                  </div>
                </div>

                {/* Method 2: Direct Upload */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary text-sm">cloud_upload</span>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Direct Video Upload</h4>
                  </div>
                  <button 
                    type="button"
                    onClick={() => {
                      videoUploadRef.current?.click();
                    }}
                    className="w-full py-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 flex flex-col items-center justify-center gap-2 group hover:bg-primary/5 hover:border-primary/30 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-xl">video_file</span>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900">Choose Video File</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Max 15s duration • Max 20MB file size • MP4, MOV</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => {
                    setIsVideoHelperOpen(false);
                    setVideoError(null);
                    setVideoUrlInput('');
                  }}
                  className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 active:scale-95 transition-all hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleSaveVideoHighlight}
                  className="px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md hover:bg-primary/90 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">play_circle</span>
                  Save Video Highlight
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Website Full Preview Modal */}
      <AnimatePresence>
        {isFullPreviewOpen && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex flex-col animate-fade-in">
            {/* Top Control Bar */}
            <div className="bg-gray-900 border-b border-gray-800 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[20px]">public</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">{shopName || 'Your salon'}</h3>
                    {isPublished ? (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        ● PUBLISHED (LIVE)
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        ○ UNPUBLISHED (DRAFT)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">link</span>
                    {websiteUrl || 'https://glowbeautyparlour.com'}
                  </p>
                </div>
              </div>

              {/* Device Selector */}
              <div className="flex items-center bg-gray-800/80 p-1 rounded-xl border border-gray-700 mx-auto sm:mx-0">
                <button 
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewDevice === 'mobile' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">smartphone</span>
                  Mobile View
                </button>
                <button 
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    previewDevice === 'desktop' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">desktop_windows</span>
                  Desktop View
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => window.open(websiteUrl || 'https://glowbeautyparlour.com', '_blank')}
                  className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-gray-700 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span className="hidden sm:inline">Open in Tab</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsFullPreviewOpen(false)}
                  className="w-9 h-9 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white flex items-center justify-center transition-colors border border-gray-700 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Preview Frame Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 flex items-center justify-center bg-gray-950/50">
              <div className={`bg-white transition-all duration-300 overflow-hidden flex flex-col ${
                previewDevice === 'mobile'
                  ? 'w-full max-w-[400px] rounded-[38px] border-[10px] border-gray-900 shadow-2xl relative my-auto min-h-[720px] max-h-[85vh]'
                  : 'w-full max-w-5xl rounded-2xl border border-gray-200 shadow-2xl my-auto min-h-[650px] max-h-[85vh]'
              }`}>
                {/* Mobile Phone Top Notch */}
                {previewDevice === 'mobile' && (
                  <div className="bg-gray-900 py-1.5 flex justify-center items-center shrink-0">
                    <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-800"></div>
                      <div className="w-8 h-1 bg-gray-800 rounded-full"></div>
                    </div>
                  </div>
                )}

                {/* Scrollable Website Body */}
                <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                  {/* Shop Header / Hero */}
                  <div className="relative bg-gray-900 text-white">
                    <div className="h-44 sm:h-52 w-full relative overflow-hidden">
                      <img 
                        src={coverPhoto || (shopPhotos.length > 0 ? shopPhotos[0] : 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop')} 
                        alt="Cover" 
                        className="w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                      
                      {/* Rating & Verified Badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        <span className="bg-white/90 backdrop-blur text-gray-900 text-[11px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-amber-500 fill-1">star</span> 4.9 (128)
                        </span>
                      </div>
                    </div>

                    {/* Logo & Main Info */}
                    <div className="px-5 pb-5 -mt-10 relative z-10 flex flex-col gap-3">
                      <div className="flex justify-between items-end">
                        <div className="w-20 h-20 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden p-1 flex items-center justify-center">
                          <img 
                            src={shopLogo || 'https://images.unsplash.com/photo-1556760544-74068565f05c?q=80&w=200&auto=format&fit=crop'} 
                            alt="Logo" 
                            className="w-full h-full object-contain rounded-xl"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3.5 py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow hover:bg-primary/90 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">calendar_today</span> Book
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-xl font-extrabold text-white">{shopName || 'Your salon'}</h1>
                          <span className="material-symbols-outlined text-primary text-[18px]" title="Verified Merchant">verified</span>
                        </div>
                        <p className="text-xs text-gray-300 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-primary">location_on</span>
                          {localityName || 'Mansarovar'}, {cityName || 'Jaipur'}, {stateName || 'Rajasthan'}
                        </p>
                      </div>

                      {/* Tag Pills */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="bg-white/10 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur border border-white/10">
                          {shopCategory || 'Beauty Parlour'}
                        </span>
                        <span className="bg-pink-500/20 text-pink-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-pink-500/30">
                          For {businessGenderType || 'Women'}
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                          {yearsInBusiness || '5'}+ Yrs Established
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Bar */}
                  <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-50/50 p-2 text-center text-xs">
                    <button className="flex flex-col items-center py-2 text-gray-700 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px] text-primary mb-0.5">call</span>
                      <span className="text-[10px] font-bold">Call</span>
                    </button>
                    <button className="flex flex-col items-center py-2 text-gray-700 hover:text-emerald-600 transition-colors">
                      <span className="material-symbols-outlined text-[20px] text-emerald-600 mb-0.5">chat</span>
                      <span className="text-[10px] font-bold">WhatsApp</span>
                    </button>
                    <button className="flex flex-col items-center py-2 text-gray-700 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px] text-blue-600 mb-0.5">near_me</span>
                      <span className="text-[10px] font-bold">Directions</span>
                    </button>
                    <button className="flex flex-col items-center py-2 text-gray-700 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px] text-purple-600 mb-0.5">share</span>
                      <span className="text-[10px] font-bold">Share</span>
                    </button>
                  </div>

                  {/* Main Preview Sections */}
                  <div className="p-5 space-y-6">
                    {/* About Section */}
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">info</span> About Us
                      </h2>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {aboutShop || 'Welcome to our shop! We offer top quality beauty, hair care, and wellness services with certified staff and premium products.'}
                      </p>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-500 font-medium block">Starting Price</span>
                          <span className="text-sm font-bold text-primary">₹{startingPrice || '300'}</span>
                        </div>
                        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          <span className="text-[10px] text-gray-500 font-medium block">Expert Staff</span>
                          <span className="text-sm font-bold text-gray-800">{staffCount || '6'} Stylists</span>
                        </div>
                      </div>
                    </div>

                    {/* Services & Price List */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[18px]">spa</span> Popular Services
                        </h2>
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {services.length} Services
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {services.map((svc, idx) => (
                          <div key={idx} className="p-3 bg-white border border-gray-150 rounded-xl flex items-center justify-between shadow-2xs hover:border-primary/40 transition-all">
                            <div>
                              <h3 className="text-xs font-bold text-gray-900">{svc.name}</h3>
                              <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-[12px]">schedule</span> {svc.duration}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-extrabold text-primary">₹{svc.price}</span>
                              <button className="px-2.5 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-[11px] font-bold transition-all">
                                Book
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Photo Gallery */}
                    {(shopPhotos.length > 0 || interiorPhotos.length > 0) && (
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[18px]">photo_library</span> Photos Gallery
                        </h2>
                        <div className="grid grid-cols-3 gap-2">
                          {[...shopPhotos, ...interiorPhotos].slice(0, 6).map((img, idx) => (
                            <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                              <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Video Highlights Gallery */}
                    {videoHighlights.length > 0 && (
                      <div>
                        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[18px]">smart_display</span> Video Highlights
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                          {videoHighlights.map((vid, idx) => (
                            <div key={idx} className="aspect-[9/16] rounded-xl overflow-hidden bg-black border border-gray-200 relative">
                              {vid.startsWith('data:video') ? (
                                <video src={vid} controls={false} autoPlay muted loop className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-white">
                                  <span className="material-symbols-outlined text-3xl">play_circle</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Business Hours & Location */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
                      <div>
                        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1">
                          <span className="material-symbols-outlined text-primary text-[16px]">schedule</span> Opening Hours
                        </h3>
                        <p className="text-xs text-gray-700 mt-1 font-semibold">
                          {openingTime || '10:00'} AM - {closingTime || '20:00'} PM
                        </p>
                        <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                          Closed on: <span className="font-bold">{weeklyOff || 'Tuesday'}</span>
                        </p>
                      </div>

                      <div className="border-t border-gray-200 pt-2.5">
                        <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1">
                          <span className="material-symbols-outlined text-primary text-[16px]">place</span> Location & Address
                        </h3>
                        <p className="text-xs text-gray-700 mt-1">
                          {fullAddress || '72, Madhyam Marg, Mansarovar, Jaipur'}
                        </p>
                        {landmark && (
                          <p className="text-[11px] text-gray-500 mt-0.5">Landmark: {landmark}</p>
                        )}
                      </div>
                    </div>

                    {/* Social Media & Online Links Section */}
                    {((Object.values(socialLinks) as string[]).some(url => url.trim().length > 0) || customLinks.some(c => c.url.trim().length > 0)) && (
                      <div className="bg-slate-900 text-white p-4.5 rounded-2xl shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-[16px]">share</span> Social Media & Online Links
                          </h3>
                          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Verified
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {socialLinks.facebook.trim() && (
                            <a 
                              href={socialLinks.facebook} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-800/90 hover:bg-[#1877F2]/20 border border-slate-700/80 hover:border-[#1877F2] text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
                            >
                              {renderSocialIcon('facebook', 'w-4 h-4')}
                              <span>Facebook</span>
                            </a>
                          )}
                          {socialLinks.instagram.trim() && (
                            <a 
                              href={socialLinks.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-800/90 hover:bg-pink-500/20 border border-slate-700/80 hover:border-pink-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
                            >
                              {renderSocialIcon('instagram', 'w-4 h-4')}
                              <span>Instagram</span>
                            </a>
                          )}
                          {socialLinks.youtube.trim() && (
                            <a 
                              href={socialLinks.youtube} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-800/90 hover:bg-red-500/20 border border-slate-700/80 hover:border-red-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
                            >
                              {renderSocialIcon('youtube', 'w-4 h-4')}
                              <span>YouTube</span>
                            </a>
                          )}
                          {socialLinks.linkedin.trim() && (
                            <a 
                              href={socialLinks.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-800/90 hover:bg-blue-600/20 border border-slate-700/80 hover:border-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
                            >
                              {renderSocialIcon('linkedin', 'w-4 h-4')}
                              <span>LinkedIn</span>
                            </a>
                          )}
                          {socialLinks.twitter.trim() && (
                            <a 
                              href={socialLinks.twitter} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
                            >
                              {renderSocialIcon('twitter', 'w-4 h-4')}
                              <span>X (Twitter)</span>
                            </a>
                          )}
                          {socialLinks.snapchat.trim() && (
                            <a 
                              href={socialLinks.snapchat} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-800/90 hover:bg-amber-400/20 border border-slate-700/80 hover:border-amber-400 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
                            >
                              {renderSocialIcon('snapchat', 'w-4 h-4')}
                              <span>Snapchat</span>
                            </a>
                          )}
                          {socialLinks.googleBusiness.trim() && (
                            <a 
                              href={socialLinks.googleBusiness} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-slate-800/90 hover:bg-emerald-500/20 border border-slate-700/80 hover:border-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
                            >
                              {renderSocialIcon('googleBusiness', 'w-4 h-4')}
                              <span>Google Page</span>
                            </a>
                          )}
                          {customLinks.filter(c => c.url.trim().length > 0).map(c => (
                            <a 
                              key={c.id}
                              href={c.url.startsWith('http') ? c.url : `https://${c.url}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all active:scale-95"
                            >
                              {renderSocialIcon('custom', 'w-4 h-4')}
                              <span>{c.title || 'Custom Web Link'}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Website Footer */}
                  <div className="p-4 bg-gray-900 text-center text-white text-[11px] border-t border-gray-800">
                    <p className="font-semibold">{shopName || 'Your salon'} © 2026</p>
                    <p className="text-gray-400 text-[10px] mt-0.5">Powered by Local Merchant Digital Engine</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-between p-4 animate-fade-in">
          <div className="w-full max-w-lg flex justify-between items-center text-white pt-2">
            <span className="font-bold text-sm flex items-center gap-2">
              <Camera size={18} className="text-primary" /> Camera Viewfinder
            </span>
            <button 
              onClick={stopCamera}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <div className="w-full max-w-lg aspect-[4/3] bg-black rounded-2xl overflow-hidden relative border border-white/10 my-auto flex items-center justify-center">
            {cameraError ? (
              <div className="p-6 text-center text-white flex flex-col items-center">
                <AlertCircle size={36} className="text-amber-400 mb-2" />
                <p className="text-xs text-gray-300 max-w-xs mb-4">{cameraError}</p>
                <button 
                  onClick={() => {
                    stopCamera();
                    cameraInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl flex items-center gap-2"
                >
                  <Camera size={16} /> Use Device Camera App
                </button>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                {/* Frame Guide overlay */}
                <div className="absolute inset-8 border-2 border-dashed border-white/60 rounded-xl pointer-events-none flex items-center justify-center">
                  <p className="text-[11px] text-white/80 bg-black/50 px-3 py-1 rounded-full backdrop-blur-xs font-medium">
                    Center Shop Sign Board Here
                  </p>
                </div>
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="w-full max-w-lg pb-6 flex items-center justify-center gap-6">
            {!cameraError && (
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 rounded-full bg-white border-4 border-primary p-1 flex items-center justify-center active:scale-90 transition-all shadow-xl"
                title="Capture Photo"
              >
                <div className="w-full h-full bg-primary rounded-full"></div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* OTP Bottom Sheet Overlay Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full sm:w-[420px] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl relative">
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden"></div>
            
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Verify Mobile</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Enter 6-digit code sent to <span className="font-bold text-gray-800">+91 {mobileNumber}</span>
                </p>
              </div>
              <button 
                onClick={() => setShowOtpModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-between gap-2 my-6">
              {otpValues.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className="w-11 h-12 text-center font-bold text-lg bg-gray-50 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white focus:outline-none transition-all"
                />
              ))}
            </div>

            <button 
              type="button"
              onClick={verifyOtp}
              className="w-full h-12 bg-primary text-white font-bold text-sm rounded-xl shadow-md hover:bg-primary/90 active:scale-95 transition-all mb-4"
            >
              Verify OTP
            </button>

            <div className="flex justify-between text-xs font-semibold">
              <button 
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                Change Number
              </button>
              <span className="text-primary">Resend code (00:45)</span>
            </div>
          </div>
        </div>
      )}

      {/* Document Expanded Preview Modal */}
      <AnimatePresence>
        {previewDocModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 bg-gray-900 text-white flex justify-between items-center shrink-0">
                <div className="min-w-0 pr-4">
                  <h3 className="text-sm font-bold truncate">{previewDocModal.typeLabel}</h3>
                  <p className="text-[11px] text-gray-300 truncate">{previewDocModal.fileName} • {previewDocModal.fileSize}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewDocModal(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 bg-gray-950 flex-1 overflow-auto flex items-center justify-center min-h-[300px]">
                {previewDocModal.isImage && previewDocModal.previewUrl ? (
                  <img
                    src={previewDocModal.previewUrl}
                    alt={previewDocModal.typeLabel}
                    className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-lg border border-gray-800"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-8 bg-gray-900 rounded-2xl border border-gray-800 text-gray-200 space-y-3">
                    <FileText size={48} className="mx-auto text-pink-400" />
                    <h4 className="text-sm font-bold">{previewDocModal.fileName}</h4>
                    <p className="text-xs text-gray-400">PDF Document Verified ({previewDocModal.fileSize})</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500 shrink-0">
                <span>Uploaded: {previewDocModal.uploadedAt}</span>
                <button
                  type="button"
                  onClick={() => setPreviewDocModal(null)}
                  className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
