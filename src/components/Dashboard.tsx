import React, { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/db';

import DashboardHeader from './dashboard/DashboardHeader';
import EarningsCard from './dashboard/EarningsCard';
import ShopsNeedingAction from './dashboard/ShopsNeedingAction';
import QuickActions from './dashboard/QuickActions';
import QuickActionsGrid from './dashboard/QuickActionsGrid';
import CompletedRewards from './dashboard/CompletedRewards';
import PerformanceChart from './dashboard/PerformanceChart';
import BottomNav from './dashboard/BottomNav';
import TaskCalendar from './dashboard/TaskCalendar';
import DetailedAnalytics from './dashboard/DetailedAnalytics';
import { Plus } from 'lucide-react';

import GrowthTip from './dashboard/GrowthTip';

export default function Dashboard({ onLogout, onNavigate, isOnline = true, isSyncing = false }: { onLogout: () => void, onNavigate: (page: string) => void, isOnline?: boolean, isSyncing?: boolean }) {
  const [currentShops, setCurrentShops] = useState(250);
  const totalShops = 250;
  const [availableAmount, setAvailableAmount] = useState(8400);
  const [partnerName, setPartnerName] = useState('Rahul Verma');

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedProfile = localStorage.getItem('nexora_partner_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed.name) {
            setPartnerName(parsed.name);
          }
        }

        // 1. Try reading from nexora_dashboard_cache in localStorage first
        const savedDashboardCache = localStorage.getItem('nexora_dashboard_cache');
        if (savedDashboardCache) {
          const parsedCache = JSON.parse(savedDashboardCache);
          if (parsedCache.availableAmount !== undefined) {
            setAvailableAmount(parsedCache.availableAmount);
          }
          if (parsedCache.qualifyingShopsCount !== undefined) {
            setCurrentShops(parsedCache.qualifyingShopsCount);
          }
        }

        // 2. Read IndexedDB items if present
        const cachedEarnings = await getItem<any>('earnings_data');
        if (cachedEarnings && cachedEarnings.availableAmount !== undefined) {
          setAvailableAmount(cachedEarnings.availableAmount);
        }
        
        const cachedShopsData = await getItem<any[]>('myshops_data');
        if (cachedShopsData) {
          const qualifying = cachedShopsData.filter(s => s.status === 'Qualifying').length;
          if (qualifying > 0) {
            setCurrentShops(qualifying);
          }
        }
      } catch (err) {
        console.error('Failed to load cached dashboard data:', err);
      }
    };
    loadData();
  }, []);
  
  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative overflow-x-hidden pb-24 font-sans w-full shadow-lg border-x border-gray-100 overflow-x-hidden">
      <DashboardHeader onLogout={onLogout} onNavigate={onNavigate} isOnline={isOnline} isSyncing={isSyncing} />
      <main className="flex-1 w-full pt-4 pb-16 px-[--page-margin] max-w-screen-xl mx-auto space-y-5">
        {/* Partner Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4 sm:px-6 py-1">
            <div className="flex flex-col">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">Growth Partner</p>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{partnerName}</h2>
            </div>
        </section>

        <GrowthTip />

        <QuickActionsGrid onNavigate={onNavigate} />

        {/* Existing components structured according to new layout */}
        <EarningsCard currentShops={currentShops} totalShops={totalShops} availableAmount={availableAmount} onNavigate={onNavigate} />
        
        <DetailedAnalytics />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ShopsNeedingAction onNavigate={onNavigate} />
            <PerformanceChart />
        </div>
        
        <TaskCalendar />

        <QuickActions onNavigate={onNavigate} />
        <CompletedRewards onNavigate={onNavigate} />
      </main>
      
      <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-full pointer-events-none flex justify-end px-5 z-40 max-w-screen-xl mx-auto">
        <button 
          onClick={() => onNavigate('add-shop')}
          className="pointer-events-auto bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center">
          <Plus size={24} />
        </button>
      </div>

      <BottomNav onNavigate={onNavigate} currentPage="dashboard" />
    </div>
  );
}
