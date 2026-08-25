import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  resolveGrowthPartner,
  fetchMyAttributions,
  fetchCommissionSummary,
  fetchMyProposals,
  paiseToRupees,
  emptyCommissionSummary,
} from '../lib/gpRepository';

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
  const [currentShops, setCurrentShops] = useState(0);
  const [totalShops, setTotalShops] = useState(0);
  const [availableAmount, setAvailableAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [weekAmount, setWeekAmount] = useState(0);
  const [lifetimeAmount, setLifetimeAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [nextPayoutDate, setNextPayoutDate] = useState<string | null>(null);
  const [draftCount, setDraftCount] = useState(0);
  const [topShopName, setTopShopName] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState('Growth Partner');

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      if (!supabase) return;
      try {
        const { data } = await supabase.auth.getUser();
        const user = data.user;
        if (!user || cancelled) return;

        const partner = await resolveGrowthPartner(supabase, user.id);
        if (cancelled) return;
        if (partner) {
          const name = (partner.full_name ?? partner.name ?? user.user_metadata?.full_name) as
            | string
            | undefined;
          if (name) setPartnerName(String(name));

          const [attributions, summary, proposals] = await Promise.all([
            fetchMyAttributions(supabase, String(partner.id)),
            fetchCommissionSummary(supabase, String(partner.id)),
            fetchMyProposals(supabase, String(partner.id)),
          ]);
          if (cancelled) return;
          const active = attributions.filter((a) => a.status === 'active');
          setCurrentShops(active.length);
          setTotalShops(attributions.length);
          setAvailableAmount(paiseToRupees(summary.payablePaise));
          setPendingAmount(paiseToRupees(summary.heldPaise));
          setWeekAmount(paiseToRupees(summary.weekPaise));
          setLifetimeAmount(paiseToRupees(summary.lifetimePaise));
          setPaidAmount(paiseToRupees(summary.paidPaise));
          setNextPayoutDate(summary.nextReleaseDate);
          setDraftCount(proposals.filter((p) => p.status === 'draft' || p.status === 'changes_requested').length);
          setTopShopName(active[0]?.salon_name ?? attributions[0]?.salon_name ?? null);
          return;
        }

        const metaName = user.user_metadata?.full_name;
        if (metaName) setPartnerName(String(metaName));
        const empty = emptyCommissionSummary();
        setAvailableAmount(paiseToRupees(empty.payablePaise));
      } catch (err) {
        console.warn('Failed to load live dashboard data:', err);
      }
    };
    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-[#fcf9f8] text-[#1b1c1b] antialiased min-h-screen flex flex-col relative overflow-x-hidden pb-24 font-sans w-full shadow-lg border-x border-gray-100 overflow-x-hidden">
      <DashboardHeader partnerName={partnerName} onLogout={onLogout} onNavigate={onNavigate} isOnline={isOnline} isSyncing={isSyncing} />
      <main className="flex-1 w-full pt-4 pb-16 px-[var(--page-margin)] max-w-screen-xl mx-auto space-y-5">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4 sm:px-6 py-1">
            <div className="flex flex-col">
                <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">Growth Partner</p>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{partnerName}</h2>
            </div>
        </section>

        <GrowthTip />

        <QuickActionsGrid onNavigate={onNavigate} />

        <EarningsCard
          currentShops={currentShops}
          totalShops={totalShops}
          availableAmount={availableAmount}
          pendingAmount={pendingAmount}
          weekAmount={weekAmount}
          lifetimeAmount={lifetimeAmount}
          nextPayoutDate={nextPayoutDate}
          onNavigate={onNavigate}
        />

        <DetailedAnalytics
          lifetimeAmount={lifetimeAmount}
          weekAmount={weekAmount}
          shopCount={totalShops}
          topShopName={topShopName}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ShopsNeedingAction onNavigate={onNavigate} />
            <PerformanceChart
              payableAmount={availableAmount}
              heldAmount={pendingAmount}
              paidAmount={paidAmount}
            />
        </div>

        <TaskCalendar draftCount={draftCount} />

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
