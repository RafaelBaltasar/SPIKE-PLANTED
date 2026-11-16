import { useEffect, useState } from 'react';
import { Building, Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [pendingAccounts, setPendingAccounts] = useState([]);

  const loadPending = () => {
    const users = JSON.parse(localStorage.getItem('spikeUsers') || '[]');
    const pending = users.filter(u => u.status === 'Pending');
    setPendingAccounts(pending);
  };

  useEffect(() => { loadPending(); }, []);

  const handleApprove = (email) => {
    const users = JSON.parse(localStorage.getItem('spikeUsers') || '[]');
    const updatedUsers = users.map(u => 
      u.email === email ? { ...u, status: 'Active' } : u
    );
    localStorage.setItem('spikeUsers', JSON.stringify(updatedUsers));
    loadPending(); // Refresh list
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text">Admin Overview</h1>
        <p className="text-sm text-muted mt-1">System-wide OJT management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary"><Users size={24} /></div>
          <div><p className="text-xs text-muted font-semibold">Total Students</p><p className="text-2xl font-extrabold text-text">45</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary"><Building size={24} /></div>
          <div><p className="text-xs text-muted font-semibold">Partner Companies</p><p className="text-2xl font-extrabold text-text">12</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary"><TrendingUp size={24} /></div>
          <div><p className="text-xs text-muted font-semibold">Total OJT Hours</p><p className="text-2xl font-extrabold text-text">12,450</p></div>
        </div>
      </div>

      {/* PENDING ACCOUNTS SECTION */}
      <div className="bg-white rounded-3xl shadow-card p-6">
        <h3 className="font-extrabold text-text mb-4">Pending Account Approvals</h3>
        {pendingAccounts.length === 0 ? (
          <p className="text-sm text-muted">No pending accounts to review.</p>
        ) : (
          <div className="space-y-3">
            {pendingAccounts.map((acc) => (
              <div key={acc.email} className="flex items-center justify-between p-4 rounded-2xl bg-background border border-border">
                <div>
                  <p className="font-bold text-text">{acc.fullName}</p>
                  <p className="text-xs text-muted">{acc.email} • Requesting to be <span className="font-semibold text-primary capitalize">{acc.role}</span></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(acc.email)} className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-green-50 text-success hover:bg-green-100 transition">
                    <CheckCircle size={14} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}