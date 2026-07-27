import React, { useState, useRef, useEffect } from 'react';
import MapPreview from './MapPreview';
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
  RefreshCw,
  Sparkles,
  Building2,
  Globe,
  FileText,
  Lock,
  ShieldCheck,
  Briefcase,
  Save,
  Scissors,
  Plus,
  IdCard,
  Info
} from 'lucide-react';

const FORM_STEPS = [
  { id: 1, name: 'Owner', icon: User, label: 'Owner Details' },
  { id: 2, name: 'Shop', icon: Store, label: 'Shop & Location' },
  { id: 3, name: 'Business', icon: Building2, label: 'Business Details' },
  { id: 4, name: 'Website', icon: Globe, label: 'Online Presence' },
  { id: 5, name: 'Docs', icon: FileText, label: 'Verification Docs' },
  { id: 6, name: 'Review', icon: CheckCircle2, label: 'Review & Submit' },
];

export default function AddShop({ onBack, onComplete }: { onBack: () => void, onComplete?: () => void }) {
  const [currentStep, setCurrentStep] = useState<number>(2);

  // Step 1 State: Owner Details
  const [ownerName, setOwnerName] = useState('Sunita Sharma');
  const [mobileNumber, setMobileNumber] = useState('9876512345');
  const [whatsappNumber, setWhatsappNumber] = useState('9876512345');
  const [sameAsMobile, setSameAsMobile] = useState(true);
  const [email, setEmail] = useState('sunita@glowbeauty.com');
  const [preferredLang, setPreferredLang] = useState('hi');
  const [isVerified, setIsVerified] = useState(true);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValues, setOtpValues] = useState(['1', '2', '3', '4', '5', '6']);
  const [dupCheckStatus, setDupCheckStatus] = useState<'none' | 'success' | 'warning'>('success');
  const [draftSaved, setDraftSaved] = useState(false);

  // Step 2 State: Shop & Location Details
  const [shopName, setShopName] = useState('Glow Beauty Parlour');
  const [shopCategory, setShopCategory] = useState('beauty_parlour');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(true);
  
  const [stateName, setStateName] = useState('Rajasthan');
  const [districtName, setDistrictName] = useState('Jaipur');
  const [cityName, setCityName] = useState('Jaipur');
  const [localityName, setLocalityName] = useState('Mansarovar');
  const [fullAddress, setFullAddress] = useState('72, Madhyam Marg, Mansarovar, Jaipur');
  const [pincode, setPincode] = useState('302020');
  const [landmark, setLandmark] = useState('Near Metro Station');

  // Step 3 State: Business Details
  const [openingTime, setOpeningTime] = useState('10:00');
  const [closingTime, setClosingTime] = useState('20:00');
  const [weeklyOff, setWeeklyOff] = useState('Tuesday');
  const [staffCount, setStaffCount] = useState('6');
  const [startingPrice, setStartingPrice] = useState('300');
  const [yearsInBusiness, setYearsInBusiness] = useState('5');
  const [businessGenderType, setBusinessGenderType] = useState('Women');
  const [gstin, setGstin] = useState('08AAAAA0000A1Z5');
  const [businessType, setBusinessType] = useState('proprietorship');
  const [annualTurnover, setAnnualTurnover] = useState('10l_25l');
  const [services, setServices] = useState([
    { name: 'Haircut', price: '400', duration: '30 mins' },
    { name: 'Facial', price: '1,200', duration: '60 mins' },
    { name: 'Hair Colour', price: '2,500', duration: '90 mins' },
  ]);
  const [aboutShop, setAboutShop] = useState('Glow Beauty Parlour offers professional beauty, hair and bridal services in Mansarovar, Jaipur.');

  // Step 4 State: Website Setup & Branding
  const [websiteUrl, setWebsiteUrl] = useState('https://glowbeautyparlour.com');
  const [instagramHandle, setInstagramHandle] = useState('@glowbeauty_jaipur');
  const [selectedTemplate, setSelectedTemplate] = useState('modern-salon');
  const [devState, setDevState] = useState<'default' | 'empty' | 'uploading' | 'error'>('default');
  const [coverPhoto, setCoverPhoto] = useState<string | null>('https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop');
  const [shopLogo, setShopLogo] = useState<string | null>('https://images.unsplash.com/photo-1556760544-74068565f05c?q=80&w=200&auto=format&fit=crop');
  const [interiorPhotos, setInteriorPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=400&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1519699047748-de8e457a634e?q=80&w=400&auto=format&fit=crop'
  ]);

  // Step 5 State: Documents
  const [panNumber, setPanNumber] = useState('ABCDE1234F');
  const [panUploaded, setPanUploaded] = useState(true);
  const [addressProofUploaded, setAddressProofUploaded] = useState(true);
  const [ownerIdProofFile, setOwnerIdProofFile] = useState<string | null>('owner-id-proof.jpg');
  const [ownerIdProofSize, setOwnerIdProofSize] = useState<string>('1.2 MB');
  const [shopFrontFile, setShopFrontFile] = useState<string | null>('glow-shop-front.jpg');
  const [shopFrontPreview, setShopFrontPreview] = useState<string | null>('https://lh3.googleusercontent.com/aida-public/AB6AXuBQNNRMJrTd4yrU1ERtGLA59fMj94JhY_GnmUgH5xmlDwZOMqtSd-NJvOHh4FOsKs2T-psTq0sxdBpDjy3fBODZhUlbuWU7qSq3586FxjZ78RyYQMbmsNpRyv-xjkJO1-CA6RRFSIVmPJc4J25Xn0nJihno9c-Q9wmJvpASijmuiPCsdRi5gWbwMFV02r403xHiPJKRv-ecZZ-GG_A7AN82eVxiL_e4ubRN4-8QF-sqe9_uSWJkbnNk');
  const [confirmAccurate, setConfirmAccurate] = useState<boolean>(true);
  const [authorizeProfile, setAuthorizeProfile] = useState<boolean>(true);
  const [step6Confirmed, setStep6Confirmed] = useState<boolean>(false);

  // Photo Capture State
  const [shopPhoto, setShopPhoto] = useState<string | null>(
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=800&auto=format&fit=crop'
  );
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
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

  // Restore saved draft on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('add_shop_form_draft');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.ownerName !== undefined) setOwnerName(parsed.ownerName);
        if (parsed.mobileNumber !== undefined) setMobileNumber(parsed.mobileNumber);
        if (parsed.whatsappNumber !== undefined) setWhatsappNumber(parsed.whatsappNumber);
        if (parsed.sameAsMobile !== undefined) setSameAsMobile(parsed.sameAsMobile);
        if (parsed.email !== undefined) setEmail(parsed.email);
        if (parsed.preferredLang !== undefined) setPreferredLang(parsed.preferredLang);
        if (parsed.shopName !== undefined) setShopName(parsed.shopName);
        if (parsed.shopCategory !== undefined) setShopCategory(parsed.shopCategory);
        if (parsed.stateName !== undefined) setStateName(parsed.stateName);
        if (parsed.districtName !== undefined) setDistrictName(parsed.districtName);
        if (parsed.cityName !== undefined) setCityName(parsed.cityName);
        if (parsed.localityName !== undefined) setLocalityName(parsed.localityName);
        if (parsed.fullAddress !== undefined) setFullAddress(parsed.fullAddress);
        if (parsed.pincode !== undefined) setPincode(parsed.pincode);
        if (parsed.landmark !== undefined) setLandmark(parsed.landmark);
        if (parsed.shopPhoto !== undefined) setShopPhoto(parsed.shopPhoto);
        if (parsed.gstin !== undefined) setGstin(parsed.gstin);
        if (parsed.businessType !== undefined) setBusinessType(parsed.businessType);
        if (parsed.annualTurnover !== undefined) setAnnualTurnover(parsed.annualTurnover);
        if (parsed.websiteUrl !== undefined) setWebsiteUrl(parsed.websiteUrl);
        if (parsed.instagramHandle !== undefined) setInstagramHandle(parsed.instagramHandle);
        if (parsed.panNumber !== undefined) setPanNumber(parsed.panNumber);
        if (parsed.currentStep !== undefined) setCurrentStep(parsed.currentStep);
      }
    } catch (e) {
      console.error('Failed to restore draft from localStorage:', e);
    }
  }, []);

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
        shopPhoto,
        gstin,
        businessType,
        annualTurnover,
        websiteUrl,
        instagramHandle,
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
    shopPhoto,
    gstin,
    businessType,
    annualTurnover,
    websiteUrl,
    instagramHandle,
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
      shopPhoto,
      gstin,
      businessType,
      annualTurnover,
      websiteUrl,
      instagramHandle,
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
        setShopPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setShopPhoto(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Validation functions per step (always allow continue, auto-save in background)
  const isStepValid = (stepId: number): boolean => true;
  const canNavigateToStep = (targetStep: number): boolean => true;

  const handleStepChange = (targetStep: number) => {
    setCurrentStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FCF9F8] text-[#1b1c1b] pb-32 font-sans">
      {/* Toast Alert for Draft */}
      {draftSaved && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-fade-in">
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
      <header className="sticky top-0 w-full z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm flex items-center justify-between px-4 md:px-8 h-16">
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
            <h1 className="font-bold text-gray-900 text-lg md:text-xl">Add New Shop</h1>
            <p className="text-xs text-gray-500 font-medium">Step {currentStep} of 6</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="px-4 md:px-8 max-w-3xl mx-auto pt-6 pb-32 flex flex-col gap-6">
        {/* Progress Indicator */}
        <section className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Progress</span>
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
                    <option value="beauty_parlour">Beauty Parlour</option>
                    <option value="salon">Unisex Salon</option>
                    <option value="spa">Spa & Wellness</option>
                    <option value="retail">Retail Store</option>
                    <option value="barber">Barber Shop</option>
                    <option value="other">Other Business</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Storefront Photo Capture Card */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 md:p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Camera className="text-primary" size={20} />
                  Shop Storefront Photo
                </h3>
                {shopPhoto && (
                  <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <CheckCircle2 size={13} /> Photo Captured
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Capture a clear photo showing the front entrance and sign board of the shop.
              </p>

              {/* Photo Display / Action Box */}
              {shopPhoto ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 group shadow-sm">
                  <img 
                    src={shopPhoto} 
                    alt="Shop Front" 
                    className="w-full h-56 md:h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                    <div className="flex items-center justify-between text-white">
                      <div>
                        <p className="font-bold text-sm">{shopName || "Shop Storefront"}</p>
                        <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">
                          <MapPin size={12} className="text-primary" /> {localityName}, {cityName}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={startCamera}
                          className="px-3 py-1.5 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all"
                        >
                          <RefreshCw size={14} /> Retake
                        </button>
                        <button 
                          type="button"
                          onClick={() => setShopPhoto(null)}
                          className="p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-all"
                          title="Remove Photo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 hover:border-primary/50 bg-gray-50/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all">
                  <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Camera size={28} />
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">Upload Shop Front Photo</h4>
                  <p className="text-xs text-gray-500 max-w-sm mb-4">
                    Use your device camera to take a live photo or select an existing photo from gallery.
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
                  <h3 className="font-semibold text-gray-900 text-base">{shopName || 'Glow Beauty Parlour'}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Beauty Parlour • {localityName}, {cityName}</p>
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
              </div>

              <button 
                type="button" 
                onClick={() => {
                  const name = prompt('Enter service name (e.g. Facial):');
                  if (!name) return;
                  const price = prompt('Enter price in ₹:', '500');
                  const duration = prompt('Enter duration (e.g. 45 mins):', '45 mins');
                  setServices([...services, { name, price: price || '500', duration: duration || '30 mins' }]);
                }}
                className="w-full py-3.5 border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center gap-2 text-primary text-xs font-semibold hover:bg-pink-50/50 transition-colors cursor-pointer"
              >
                <Plus size={16} /> Add Another Service
              </button>
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
                    <h3 className="font-semibold text-gray-900 text-[18px]">{shopName || 'Glow Beauty Parlour'}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span> {localityName || 'Mansarovar'}, {cityName || 'Jaipur'}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <span className="bg-pink-100 text-primary px-2 py-1 rounded-full text-xs font-semibold">Beauty Parlour</span>
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
                            <button onClick={() => alert(`Previewing ${tmpl.name}`)} className="flex-1 border border-primary text-primary py-2 rounded-xl text-sm font-medium hover:bg-pink-50 transition-colors">Preview</button>
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
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">Shop Logo</span>
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Uploaded
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full border border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center p-1 shrink-0">
                        <img src={shopLogo || 'https://images.unsplash.com/photo-1556760544-74068565f05c?q=80&w=200&auto=format&fit=crop'} alt="Logo" className="w-full h-full object-cover rounded-full" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm text-gray-900 truncate font-medium">glow-logo.png</p>
                        <p className="text-xs text-gray-500 mt-0.5">1.2 MB</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => setShopLogo('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=200&auto=format&fit=crop')} className="flex-1 bg-pink-50 text-primary py-2 rounded-xl text-sm font-medium flex justify-center items-center gap-1 hover:bg-pink-100 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">sync</span> Replace
                      </button>
                      <button onClick={() => setShopLogo(null)} className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Cover Photo Card */}
                  <div className="bg-white rounded-[18px] p-4 border border-[#E8E8E8] shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-900">Cover Photo</span>
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span> Uploaded
                      </span>
                    </div>
                    <div className="h-20 rounded-lg border border-gray-200 overflow-hidden bg-gray-100 relative">
                      <img src={coverPhoto || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop'} alt="Cover" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-gray-900 truncate pr-2 font-medium">glow-cover.jpg</p>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => setCoverPhoto('https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop')} className="text-primary text-xs font-semibold hover:underline">Replace</button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => setCoverPhoto(null)} className="text-red-600 text-xs font-semibold hover:underline">Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Interior Photos Gallery */}
              <section className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Interior Photos</h3>
                    <p className="text-sm text-gray-600">Showcase your workspace to clients.</p>
                  </div>
                  <button onClick={() => setInteriorPhotos([...interiorPhotos, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=400&auto=format&fit=crop'])} className="bg-pink-50 text-primary px-3 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-pink-100 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">add_a_photo</span> Add Photo
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {interiorPhotos.map((photo, idx) => (
                    <div key={idx} className="bg-white rounded-[14px] border border-[#E8E8E8] overflow-hidden group relative">
                      <div className="h-28 bg-gray-100 relative w-full">
                        <img src={photo} alt={`Interior ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button onClick={() => alert('Viewing photo')} className="w-8 h-8 rounded-full bg-white/20 backdrop-blur text-white flex items-center justify-center hover:bg-white/40"><span className="material-symbols-outlined text-[16px]">visibility</span></button>
                          <button onClick={() => setInteriorPhotos(interiorPhotos.filter((_, i) => i !== idx))} className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700"><span className="material-symbols-outlined text-[16px]">delete</span></button>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-900 truncate text-center">
                          {idx === 0 ? 'Reception Area' : idx === 1 ? 'Service Area' : idx === 2 ? 'Bridal Room' : `Workspace ${idx + 1}`}
                        </p>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setInteriorPhotos([...interiorPhotos, 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop'])} className="bg-gray-50 rounded-[14px] border-2 border-dashed border-gray-300 h-[142px] flex flex-col items-center justify-center gap-2 hover:bg-pink-50/50 hover:border-primary/50 transition-colors group">
                    <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center text-gray-600 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">add</span>
                    </div>
                    <span className="text-xs font-medium text-gray-600 group-hover:text-primary">Add More</span>
                  </button>
                </div>
              </section>
            </div>

            {/* Right Column: Contextual Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-white rounded-[18px] p-5 border border-[#E8E8E8] shadow-sm lg:sticky lg:top-24">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">preview</span> Website Preview
                </h3>
                <div className="w-full bg-gray-100 rounded-3xl p-2 border-4 border-gray-200 shadow-inner mb-4 relative overflow-hidden h-[300px]">
                  <div className="bg-white w-full h-full rounded-2xl overflow-y-auto no-scrollbar relative shadow-sm">
                    <div className="h-32 bg-gray-200 relative">
                      <img src={coverPhoto || shopPhoto || ''} alt="Storefront" className="w-full h-full object-cover" />
                      <div className="absolute -bottom-6 left-4 w-12 h-12 rounded-full border-2 border-white bg-white shadow-sm overflow-hidden p-1">
                        <img src={shopLogo || ''} alt="Logo" className="w-full h-full object-contain rounded-full" />
                      </div>
                    </div>
                    <div className="pt-8 px-4 pb-4">
                      <h4 className="text-sm font-bold text-gray-900">{shopName || 'Glow Beauty Parlour'}</h4>
                      <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">location_on</span> {localityName || 'Mansarovar'}, {cityName || 'Jaipur'}</p>
                      <div className="mt-3 bg-pink-50 rounded-lg p-2 flex justify-between items-center">
                        <span className="text-[10px] font-semibold text-primary">Starting Price</span>
                        <span className="text-[12px] font-bold text-primary">₹300</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => alert(`Opening Full Preview for ${shopName}`)} className="w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md flex items-center justify-center gap-2">
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
                  <h3 className="font-bold text-gray-900 text-base mb-1">{shopName || 'Glow Beauty Parlour'}</h3>
                  <p className="text-xs text-gray-500 flex flex-col gap-1">
                    <span className="flex items-center gap-1.5">
                      <User size={14} className="opacity-70 text-gray-500" />
                      <span>Owner: {ownerName || 'Sunita Sharma'}</span>
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

            {/* Document Uploads */}
            <section className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Upload Required Documents</h2>
                <p className="text-xs text-gray-500 mt-0.5">Add clear and valid documents for shop verification.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Owner ID */}
                <div className="bg-white rounded-[18px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-200 flex flex-col min-h-[220px]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        Owner ID Proof <span className="text-red-500">*</span>
                      </h4>
                      {ownerIdProofFile ? (
                        <span className="text-emerald-600 text-xs flex items-center gap-1 mt-1 font-semibold">
                          <CheckCircle2 size={13} className="text-emerald-500" /> Upload completed
                        </span>
                      ) : (
                        <span className="text-red-500 text-xs flex items-center gap-1 mt-1 font-semibold">
                          <AlertCircle size={13} className="text-red-400" /> No document uploaded
                        </span>
                      )}
                    </div>
                  </div>

                  {ownerIdProofFile ? (
                    <>
                      <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 mb-4 border border-gray-100">
                        <div className="bg-pink-50 w-10 h-10 rounded-lg flex items-center justify-center text-primary shrink-0">
                          <IdCard size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{ownerIdProofFile}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{ownerIdProofSize}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <button 
                          type="button"
                          onClick={() => {
                            const name = prompt("Enter file name for Owner ID proof:", "owner-id-proof.jpg");
                            if (name) setOwnerIdProofFile(name);
                          }}
                          className="flex-1 bg-pink-50 hover:bg-pink-100 text-primary font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                        >
                          Replace
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setOwnerIdProofFile(null);
                            setOwnerIdProofSize('');
                          }}
                          className="flex-1 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-600 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <div 
                      onClick={() => {
                        setOwnerIdProofFile('owner-id-proof.jpg');
                        setOwnerIdProofSize('1.2 MB');
                      }}
                      className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-primary/40 bg-gray-50/50 hover:bg-pink-50/5 rounded-xl p-4 text-center cursor-pointer transition-all gap-1.5 mt-auto min-h-[110px]"
                    >
                      <Upload size={18} className="text-gray-400" />
                      <p className="text-xs font-bold text-gray-700">Click to upload document</p>
                      <p className="text-[10px] text-gray-400">PDF, JPG, PNG up to 5MB</p>
                    </div>
                  )}
                </div>

                {/* Shop Front Photo */}
                <div className="bg-white rounded-[18px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-200 flex flex-col min-h-[220px]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                        Shop Front Photo <span className="text-red-500">*</span>
                      </h4>
                      {!shopFrontFile && (
                        <span className="text-red-500 text-xs flex items-center gap-1 mt-1 font-semibold">
                          <AlertCircle size={13} className="text-red-400" /> Photo required
                        </span>
                      )}
                    </div>
                  </div>

                  {shopFrontFile ? (
                    <>
                      <div className="relative w-full h-32 rounded-xl overflow-hidden mb-4 bg-gray-100 group border border-gray-100">
                        <img 
                          alt="Shop front preview" 
                          className="w-full h-full object-cover" 
                          src={shopFrontPreview || "https://lh3.googleusercontent.com/aida-public/AB6AXuBQNNRMJrTd4yrU1ERtGLA59fMj94JhY_GnmUgH5xmlDwZOMqtSd-NJvOHh4FOsKs2T-psTq0sxdBpDjy3fBODZhUlbuWU7qSq3586FxjZ78RyYQMbmsNpRyv-xjkJO1-CA6RRFSIVmPJc4J25Xn0nJihno9c-Q9wmJvpASijmuiPCsdRi5gWbwMFV02r403xHiPJKRv-ecZZ-GG_A7AN82eVxiL_e4ubRN4-8QF-sqe9_uSWJkbnNk"} 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2.5">
                          <span className="text-white text-[11px] font-semibold flex items-center gap-1.5 truncate">
                            <ImageIcon size={12} className="text-white/90" /> {shopFrontFile}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <button 
                          type="button"
                          onClick={() => {
                            const customUrl = prompt("Enter custom Unsplash/Image URL for Shop Front Photo preview:", shopFrontPreview || "");
                            if (customUrl) {
                              setShopFrontPreview(customUrl);
                              setShopFrontFile("custom-shop-front.jpg");
                            }
                          }}
                          className="flex-1 bg-pink-50 hover:bg-pink-100 text-primary font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                        >
                          Replace
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setShopFrontFile(null);
                            setShopFrontPreview(null);
                          }}
                          className="flex-1 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-600 font-bold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <div 
                      onClick={() => {
                        setShopFrontFile('glow-shop-front.jpg');
                        setShopFrontPreview('https://lh3.googleusercontent.com/aida-public/AB6AXuBQNNRMJrTd4yrU1ERtGLA59fMj94JhY_GnmUgH5xmlDwZOMqtSd-NJvOHh4FOsKs2T-psTq0sxdBpDjy3fBODZhUlbuWU7qSq3586FxjZ78RyYQMbmsNpRyv-xjkJO1-CA6RRFSIVmPJc4J25Xn0nJihno9c-Q9wmJvpASijmuiPCsdRi5gWbwMFV02r403xHiPJKRv-ecZZ-GG_A7AN82eVxiL_e4ubRN4-8QF-sqe9_uSWJkbnNk');
                      }}
                      className="flex-grow flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-primary/40 bg-gray-50/50 hover:bg-pink-50/5 rounded-xl p-4 text-center cursor-pointer transition-all gap-1.5 mt-auto min-h-[110px]"
                    >
                      <Camera size={18} className="text-gray-400" />
                      <p className="text-xs font-bold text-gray-700">Click to capture / upload front photo</p>
                      <p className="text-[10px] text-gray-400">Ensure signage is clearly visible</p>
                    </div>
                  )}
                </div>
              </div>
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
                      <span className="text-sm font-bold text-gray-900">{ownerName || 'Sunita Sharma'}</span>
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
                      <span className="text-sm font-bold text-gray-900">{shopName || 'Glow Beauty Parlour'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Category</span>
                      <span className="text-sm font-bold text-gray-900 capitalize">
                        {shopCategory ? shopCategory.replace('_', ' ') : 'Beauty Parlour'}
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
                      <div>
                        <span className="text-[11px] font-semibold text-gray-400 block mb-0.5 uppercase tracking-wider">Selected Template</span>
                        <span className="text-sm font-bold text-gray-900 capitalize">
                          {selectedTemplate ? selectedTemplate.replace('-', ' ') : 'Modern Salon'}
                        </span>
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
                      <h2 className="text-base font-bold text-gray-900">Documents & Consent</h2>
                    </div>
                    <button 
                      onClick={() => setCurrentStep(5)} 
                      className="text-xs font-bold text-primary bg-pink-50 hover:bg-pink-100 px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-2">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 block truncate">Owner ID Proof</span>
                        <span className="text-[10px] text-gray-500 truncate block">{ownerIdProofFile || 'owner-id-proof.jpg'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 block truncate">Shop Front Photo</span>
                        <span className="text-[10px] text-gray-500 truncate block">{shopFrontFile || 'glow-shop-front.jpg'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 block truncate">Business Proof</span>
                        <span className="text-[10px] text-gray-500 block">GSTIN & PAN Details</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 block truncate">Owner Consent</span>
                        <span className="text-[10px] text-gray-500 block">
                          {confirmAccurate && authorizeProfile ? 'Completed' : 'Pending'}
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
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-gray-600">Website template selected</span>
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
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Footer Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 px-6 py-4 z-50 shadow-2xl flex items-center justify-between gap-4">
        <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-4">
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
              className="flex-1 h-12 font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl bg-primary text-white hover:bg-primary/90 active:scale-98 cursor-pointer border border-white/20"
            >
              Continue
              <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              type="button"
              disabled={!step6Confirmed}
              onClick={() => {
                alert(`Shop registration details for "${shopName}" submitted successfully!`);
                if (onComplete) {
                  onComplete();
                } else {
                  onBack();
                }
              }}
              className={`flex-1 h-12 font-bold text-base rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg ${
                step6Confirmed 
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-98 cursor-pointer" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
              }`}
            >
              Submit & Onboard
              <CheckCircle2 size={20} />
            </button>
          )}
        </div>
      </div>

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
    </div>
  );
}
