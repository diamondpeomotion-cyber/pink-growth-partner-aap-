import React from 'react';
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

export default function Dashboard({ onLogout, onNavigate }: { onLogout: () => void, onNavigate: (page: string) => void }) {
  const currentShops = 250; // Mock current value
  const totalShops = 250; // Target value
  
  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative pb-24">
      <DashboardHeader onLogout={onLogout} onNavigate={onNavigate} />
      <main className="pt-8 px-5 md:px-10 max-w-7xl mx-auto space-y-8 w-full">
        {/* Partner Header - Placeholder */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">Growth Partner</p>
                <h2 className="text-3xl md:text-4xl font-bold">Rahul Verma</h2>
            </div>
        </section>

        <QuickActionsGrid onNavigate={onNavigate} />

        {/* Existing components structured according to new layout */}
        <EarningsCard currentShops={currentShops} totalShops={totalShops} onNavigate={onNavigate} />
        
        <DetailedAnalytics />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ShopsNeedingAction onNavigate={onNavigate} />
            <PerformanceChart />
        </div>
        
        <TaskCalendar />

        <QuickActions onNavigate={onNavigate} />
        <CompletedRewards onNavigate={onNavigate} />
      </main>
      
      <button 
        onClick={() => onNavigate('add-shop')}
        className="fixed bottom-24 right-5 md:right-10 z-40 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-all active:scale-95">
        <Plus size={24} />
      </button>

      <BottomNav onNavigate={onNavigate} currentPage="dashboard" />
    </div>
  );
}
