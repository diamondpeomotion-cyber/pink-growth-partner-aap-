
import React from 'react';

export default function Hero() {
  return (
    <div className="w-full aspect-[4/3] rounded-[18px] overflow-hidden mb-6 relative shadow-sm">
      <img 
        alt="Business partner" 
        className="w-full h-full object-cover" 
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6HbURdbRjOyGn3MKK-ph3mzio_nucBM2tU-fWc_kSgGZJF0x2xTKspjVkoBKOv5UKUzD7RoiCPS24iBtSew-XJQh-T83xcIUd_ugDe5afoxRVhuvj8etjvWZmM3DJZ_HhBLa8Sdb3q9WAxpajPW2IaQ1OOkhXnbnzYf7AgnwNxMhLs17LEJu7Y_Tvg6yNyPD2Uta-YuAXGUXE74TkP4gar9dINSwIlzJQonI0VTR-VR5nEIR0izDB"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
    </div>
  );
}
