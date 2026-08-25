import React from 'react';
import { BarChart3, DollarSign, Store } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatINR } from '../../lib/gpRepository';

export default function DetailedAnalytics({
  lifetimeAmount = 0,
  weekAmount = 0,
  shopCount = 0,
  topShopName = null,
}: {
  lifetimeAmount?: number;
  weekAmount?: number;
  shopCount?: number;
  topShopName?: string | null;
}) {
  const data = [
    { name: '7d', earnings: weekAmount },
    { name: 'Held+', earnings: lifetimeAmount },
  ];
  const empty = lifetimeAmount === 0 && weekAmount === 0;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="text-primary" size={20} />
        Earnings snapshot
      </h3>

      {empty ? (
        <p className="text-sm text-gray-500">No commission rows have been posted for this partner yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <DollarSign size={16} />
                <span className="text-xs font-semibold uppercase">Lifetime</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatINR(lifetimeAmount)}</p>
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Store size={16} />
                <span className="text-xs font-semibold uppercase">Attributed shops</span>
              </div>
              <p className="text-2xl font-bold text-primary">{shopCount}</p>
            </div>
          </div>

          <div className="h-48 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="earnings" fill="#b90064" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Last 7 days</span>
              <span className="font-semibold text-gray-900">{formatINR(weekAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Top attributed shop</span>
              <span className="font-semibold text-gray-900 truncate ml-2">{topShopName || '—'}</span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
