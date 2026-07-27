import React from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

const tasks = [
  { id: 1, title: 'Visit Glow Beauty Parlour', date: 'Today, 2:00 PM', priority: 'high' },
  { id: 2, title: 'Follow-up with Royal Cut', date: 'Tomorrow, 10:00 AM', priority: 'medium' },
  { id: 3, title: 'Audit QR Payment Setup', date: 'Jul 29, 3:00 PM', priority: 'low' },
];

export default function TaskCalendar() {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="text-primary" size={20} />
        Task Calendar & Follow-ups
      </h3>
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
            <div className={`p-2 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-600' : task.priority === 'medium' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
              <Clock size={16} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">{task.title}</p>
              <p className="text-sm text-gray-500">{task.date}</p>
            </div>
            {task.priority === 'high' && <AlertCircle size={16} className="text-red-500" />}
          </div>
        ))}
      </div>
    </section>
  );
}
