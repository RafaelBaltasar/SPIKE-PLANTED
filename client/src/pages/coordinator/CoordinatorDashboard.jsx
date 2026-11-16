import { Users, FileCheck, CheckCircle } from 'lucide-react';

export default function CoordinatorDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text">Coordinator Dashboard</h1>
        <p className="text-sm text-muted mt-1">Monitor and approve student progress</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary"><Users size={24} /></div>
          <div><p className="text-xs text-muted font-semibold">Assigned Students</p><p className="text-2xl font-extrabold text-text">0</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-warning"><FileCheck size={24} /></div>
          <div><p className="text-xs text-muted font-semibold">Pending Approvals</p><p className="text-2xl font-extrabold text-text">0</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-success"><CheckCircle size={24} /></div>
          <div><p className="text-xs text-muted font-semibold">Completed OJT</p><p className="text-2xl font-extrabold text-text">0</p></div>
        </div>
      </div>
    </div>
  );
}