import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle, XCircle, Users, BookOpen } from 'lucide-react';

export default function StaffDashboard() {
  const { user } = useAuth();
  
  const [interns, setInterns] = useState([
    { id: 1, name: 'Juan Dela Cruz', hours: 120, status: 'Pending' },
    { id: 2, name: 'Maria Santos', hours: 85, status: 'Approved' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text">Supervisor Dashboard</h1>
        <p className="text-sm text-muted mt-1">Review and sign off on intern hours for <span className="font-bold text-primary">{user?.company || 'your company'}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary"><Users size={24} /></div>
          <div><p className="text-xs text-muted font-semibold">Assigned Interns</p><p className="text-2xl font-extrabold text-text">{interns.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-warning"><BookOpen size={24} /></div>
          <div><p className="text-xs text-muted font-semibold">Pending Sign-offs</p><p className="text-2xl font-extrabold text-text">{interns.filter(i => i.status === 'Pending').length}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-card p-6">
        <h3 className="font-extrabold mb-4 text-text">My Assigned Interns</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-muted text-xs uppercase">
              <tr>
                <th className="px-6 py-4 rounded-l-xl">Intern Name</th>
                <th className="px-6 py-4">Total Hours</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 rounded-r-xl text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {interns.map((intern) => (
                <tr key={intern.id} className="hover:bg-background/50">
                  <td className="px-6 py-4 font-semibold text-text">{intern.name}</td>
                  <td className="px-6 py-4 text-muted">{intern.hours} hrs</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${intern.status === 'Approved' ? 'bg-green-100 text-success' : 'bg-amber-100 text-warning'}`}>
                      {intern.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-success hover:bg-green-100 transition">
                      <CheckCircle size={14} /> Sign Off
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-danger hover:bg-red-100 transition">
                      <XCircle size={14} /> Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}