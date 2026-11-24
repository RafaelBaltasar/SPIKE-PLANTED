
import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Building2,
  Users,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/axios';

export default function StaffDashboard() {
  const { user } = useAuth();

  const [internCount, setInternCount] = useState(0);
  const [pendingSignoffs, setPendingSignoffs] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signoffError, setSignoffError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setSignoffError('');

      // Fetch assigned interns.
      const internsResponse = await api.get(
        '/assignments/company-interns'
      );

      setInternCount(
        internsResponse.data.count ??
        internsResponse.data.students?.length ??
        0
      );

      setCompany(internsResponse.data.company || null);

      // Fetch attendance and weekly journal sign-offs.
      const [attendanceResult, journalResult] = await Promise.allSettled([
        api.get('/ojt/company-pending'),
        api.get('/weekly-journals/company-pending')
      ]);

      if (
        attendanceResult.status === 'fulfilled' &&
        journalResult.status === 'fulfilled'
      ) {
        const attendanceCount =
          attendanceResult.value.data.count ??
          attendanceResult.value.data.attendance?.length ??
          0;

        const journalCount =
          journalResult.value.data.count ??
          journalResult.value.data.journals?.length ??
          0;

        setPendingSignoffs(attendanceCount + journalCount);
      } else {
        setPendingSignoffs(null);

        setSignoffError(
          'Unable to load pending sign-offs. Please try again.'
        );

        console.error('Failed to fetch supervisor sign-offs:', {
          attendance: attendanceResult,
          journals: journalResult
        });
      }
    } catch (err) {
      console.error('Failed to fetch supervisor dashboard:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load dashboard information.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'staff') {
      fetchDashboardData();
    }
  }, [user?.role, fetchDashboardData]);

  return (
    <div className="space-y-6">

      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-text">
            Supervisor Dashboard
          </h1>

          <p className="text-sm text-muted mt-1">
            Welcome, {user?.fullName || 'Supervisor'}.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Company Information */}
      <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
          <Building2 size={24} />
        </div>

        <div>
          <p className="text-xs text-muted font-semibold">
            Company
          </p>

          <p className="text-xl font-extrabold text-text">
            {company?.name || user?.company || 'Company not specified'}
          </p>
        </div>
      </div>

      {/* Dashboard Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0" />

          <div>
            <p className="text-sm font-bold text-red-700">
              Dashboard data unavailable
            </p>

            <p className="text-sm text-red-600 mt-1">
              {error}
            </p>

            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="text-sm font-bold text-red-700 underline mt-2 disabled:opacity-50"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Dashboard Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Assigned Interns */}
        <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
            <Users size={24} />
          </div>

          <div>
            <p className="text-xs text-muted font-semibold">
              Assigned Interns
            </p>

            <p className="text-2xl font-extrabold text-text">
              {loading ? (
                <RefreshCw
                  size={20}
                  className="animate-spin text-primary"
                />
              ) : error ? (
                '--'
              ) : (
                internCount
              )}
            </p>

            <p className="text-xs text-muted mt-1">
              Students assigned to your company
            </p>
          </div>
        </div>

        {/* Pending Sign-offs */}
        <div className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-warning">
            <BookOpen size={24} />
          </div>

          <div>
            <p className="text-xs text-muted font-semibold">
              Pending Sign-offs
            </p>

            <p className="text-2xl font-extrabold text-text">
              {loading ? (
                <RefreshCw
                  size={20}
                  className="animate-spin text-primary"
                />
              ) : pendingSignoffs === null ? (
                '--'
              ) : (
                pendingSignoffs
              )}
            </p>

            <p className="text-xs text-muted mt-1">
              Attendance and journals awaiting review
            </p>
          </div>
        </div>

      </div>

      {/* Sign-off Error */}
      {signoffError && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-orange-500 shrink-0" />

          <div>
            <p className="text-sm font-bold text-orange-700">
              Sign-off information unavailable
            </p>

            <p className="text-sm text-orange-600 mt-1">
              {signoffError}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
