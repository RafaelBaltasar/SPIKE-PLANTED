
import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Info,
  Mail,
  GraduationCap,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/axios';

export default function StaffInterns() {
  const { user } = useAuth();

  const [students, setStudents] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInterns = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/assignments/company-interns');

      setStudents(response.data.students || []);
      setCompany(response.data.company || null);
    } catch (err) {
      console.error('Failed to fetch company interns:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load your assigned interns. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'staff') {
      fetchInterns();
    }
  }, [user?.role, fetchInterns]);

  if (user?.role !== 'staff') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-text">
          My Interns
        </h1>
        <p className="text-sm text-muted mt-1">
          View the students assigned to your company.
        </p>
      </div>

      {/* Company Information */}
      <div className="bg-white rounded-3xl shadow-card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
            <Building2 size={24} />
          </div>

          <div>
            <p className="text-xs text-muted font-semibold">
              Company
            </p>
            <p className="text-lg font-extrabold text-text">
              {company?.name || user?.company || 'Company not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Intern Count and Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text">
            Assigned Students
          </h2>

          <p className="text-sm text-muted mt-1">
            {loading
              ? 'Loading student records...'
              : `${students.length} intern(s) assigned to your company`}
          </p>
        </div>

        <button
          onClick={fetchInterns}
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

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-3xl shadow-card p-12 text-center">
          <RefreshCw
            size={30}
            className="mx-auto text-primary animate-spin"
          />
          <p className="text-sm text-muted mt-4">
            Loading your interns...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-white rounded-3xl shadow-card p-8 text-center">
          <AlertCircle
            size={36}
            className="mx-auto text-red-500"
          />

          <h2 className="text-lg font-bold text-text mt-4">
            Unable to Load Interns
          </h2>

          <p className="text-sm text-muted mt-2">
            {error}
          </p>

          <button
            onClick={fetchInterns}
            className="mt-5 px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && students.length === 0 && (
        <div className="bg-white rounded-3xl shadow-card p-10 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
            <Users size={30} />
          </div>

          <h2 className="text-xl font-extrabold text-text mt-5">
            No Interns Assigned Yet
          </h2>

          <p className="text-sm text-muted max-w-lg mx-auto mt-2">
            There are currently no students assigned to your company.
            Contact the OJT Coordinator for assistance.
          </p>
        </div>
      )}

      {/* Intern List */}
      {!loading && !error && students.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {students.map((student) => (
            <div
              key={student._id}
              className="bg-white rounded-3xl shadow-card p-6 space-y-5"
            >
              {/* Student Information */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary font-bold text-lg shrink-0">
                    {student.firstName?.charAt(0) || ''}
                    {student.lastName?.charAt(0) || ''}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-text break-words">
                      {student.firstName} {student.lastName}
                    </h3>

                    <p className="text-xs text-muted">
                      {student.studentNumber || 'No student number'}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${
                    student.status === 'Active'
                      ? 'bg-green-100 text-green-700'
                      : student.status === 'Completed'
                      ? 'bg-blue-100 text-blue-700'
                      : student.status === 'Inactive'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                >
                  {student.status || 'Pending'}
                </span>
              </div>

              {/* Student Details */}
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <div className="flex items-center gap-3 text-sm text-muted">
                  <GraduationCap
                    size={17}
                    className="text-primary shrink-0"
                  />
                  <span>
                    {student.program || 'Program not specified'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-muted">
                  <Info
                    size={17}
                    className="text-primary shrink-0"
                  />
                  <span>
                    {student.yearLevel || 'Year level not specified'}
                    {student.section ? ` - ${student.section}` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-muted break-all">
                  <Mail
                    size={17}
                    className="text-primary shrink-0"
                  />
                  <span>
                    {student.email || 'Email not available'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
