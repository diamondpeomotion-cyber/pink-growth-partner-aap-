import React from 'react';
import { BarChart3, DollarSign, QrCode } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', earnings: 1200 },
  { name: 'Tue', earnings: 1900 },
  { name: 'Wed', earnings: 1500 },
  { name: 'Thu', earnings: 2800 },
  { name: 'Fri', earnings: 2100 },
  { name: 'Sat', earnings: 3200 },
  { name: 'Sun', earnings: 2500 },
];

export default function DetailedAnalytics() {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="text-primary" size={20} />
        Detailed Analytics & Earnings
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <DollarSign size={16} />
            <span className="text-xs font-semibold uppercase">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹72,450</p>
        </div>
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2 text-primary mb-1">
            <QrCode size={16} />
            <span className="text-xs font-semibold uppercase">QR Performance</span>
          </div>
          <p className="text-2xl font-bold text-primary">94%</p>
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
          <span className="text-gray-600">Avg. Daily Earnings</span>
          <span className="font-semibold text-gray-900">₹2,450</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full" style={{ width: '75%' }}></div>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">Top Performing Shop</span>
          <span className="font-semibold text-gray-900 truncate ml-2">Royal Cut Parlour</span>
        </div>
      </div>
    </section>
  );
}
