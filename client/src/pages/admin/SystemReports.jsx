import { Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function SystemReports() {
  const chartData = [
    { name: 'Week 1', hours: 120 }, { name: 'Week 2', hours: 250 },
    { name: 'Week 3', hours: 380 }, { name: 'Week 4', hours: 510 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text">System Reports</h1>
          <p className="text-sm text-muted mt-1">Overview of all OJT activities</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark">
          <Download size={16} /> Export CSV
        </button>
      </div>
      <div className="bg-white rounded-3xl shadow-card p-6 h-96">
        <h3 className="font-extrabold text-text mb-6">Hours Logged (All Students)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
            <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
            <Bar dataKey="hours" fill="#14532d" radius={[8, 8, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}