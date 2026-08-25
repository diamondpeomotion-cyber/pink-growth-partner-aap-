import React from 'react';
import { Calendar } from 'lucide-react';

export default function TaskCalendar({ draftCount = 0 }: { draftCount?: number }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="text-primary" size={20} />
        Follow-ups
      </h3>
      {draftCount > 0 ? (
        <p className="text-sm text-gray-700">
          {draftCount} website proposal{draftCount === 1 ? '' : 's'} still in draft. Continue them from My Shops.
        </p>
      ) : (
        <p className="text-sm text-gray-500">No scheduled follow-ups. Draft website proposals will appear here.</p>
      )}
    </section>
  );
}
