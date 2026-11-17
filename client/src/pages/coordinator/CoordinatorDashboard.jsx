
import { useEffect, useState } from 'react';
import { Users, FileCheck, CheckCircle } from 'lucide-react';
import { api } from '../../api/axios';

export default function CoordinatorDashboard() {
  const [summary, setSummary] = useState({
    totalStudents: 0,
    pendingApprovals: 0,
    completedOjt: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardSummary = async () => {
      try {
        const response = await api.get('/coordinator/dashboard-summary');

        setSummary(response.data.summary);
        setError('');
      } catch (err) {
        console.error('Failed to load coordinator dashboard:', err);

        setError(
          err.response?.data?.message ||
          'Unable to load dashboard statistics.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardSummary();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text">
          Coordinator Dashboard
        </h1>
        <p className="text-sm text-muted mt-1">
          Monitor and approve student progress
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Total Students */}
        <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
            <Users size={24} />
          </div>

          <div>
            <p className="text-xs text-muted font-semibold">
              Total Students
            </p>
            <p className="text-2xl font-extrabold text-text">
              {loading ? '...' : summary.totalStudents}
            </p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-warning">
            <FileCheck size={24} />
          </div>

          <div>
            <p className="text-xs text-muted font-semibold">
              Pending Approvals
            </p>
            <p className="text-2xl font-extrabold text-text">
              {loading ? '...' : summary.pendingApprovals}
            </p>
          </div>
        </div>

        {/* Completed OJT */}
        <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-success">
            <CheckCircle size={24} />
          </div>

          <div>
            <p className="text-xs text-muted font-semibold">
              Completed OJT
            </p>
            <p className="text-2xl font-extrabold text-text">
              {loading ? '...' : summary.completedOjt}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
