
import { useCallback, useEffect, useState } from 'react';
import {
  ClipboardCheck,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  User,
  CalendarDays,
  MessageSquare
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/axios';

export default function StaffReviews() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('attendance');
  const [attendance, setAttendance] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewingId, setReviewingId] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('');
  const [remarks, setRemarks] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [attendanceResponse, journalResponse] = await Promise.all([
        api.get('/ojt/company-pending'),
        api.get('/weekly-journals/company-pending')
      ]);

      setAttendance(attendanceResponse.data.attendance || []);
      setJournals(journalResponse.data.journals || []);
    } catch (err) {
      console.error('Failed to fetch supervisor reviews:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load pending reviews. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'staff') {
      fetchReviews();
    }
  }, [user?.role, fetchReviews]);

  const openReview = (item, status, type) => {
    setSelectedReview({ ...item, reviewType: type });
    setReviewStatus(status);
    setRemarks('');
    setError('');
    setSuccess('');
  };

  const closeReview = () => {
    setSelectedReview(null);
    setReviewStatus('');
    setRemarks('');
  };

  const submitReview = async () => {
    if (!selectedReview || !reviewStatus) return;

    if (reviewStatus === 'Rejected' && !remarks.trim()) {
      setError('Please provide remarks when rejecting a submission.');
      return;
    }

    try {
      setReviewingId(selectedReview._id);
      setError('');
      setSuccess('');

      const isAttendance = selectedReview.reviewType === 'attendance';
      const endpoint = isAttendance
        ? `/ojt/${selectedReview._id}/supervisor-review`
        : `/weekly-journals/${selectedReview._id}/supervisor-review`;

      await api.patch(endpoint, {
        status: reviewStatus,
        remarks: remarks.trim()
      });

      setSuccess(
        `${isAttendance ? 'Attendance' : 'Weekly journal'} ${reviewStatus.toLowerCase()} successfully.`
      );

      closeReview();
      await fetchReviews();
    } catch (err) {
      console.error('Supervisor review failed:', err);

      setError(
        err.response?.data?.message ||
        'Unable to submit your review. Please try again.'
      );
    } finally {
      setReviewingId('');
    }
  };

  const formatDate = (value) => {
    if (!value) return 'Not available';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return 'Not available';

    return date.toLocaleDateString();
  };

  const getStudentName = (student) => {
    if (!student) return 'Unknown student';

    return `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
      'Unknown student';
  };

  if (user?.role !== 'staff') {
    return (
      <div className="bg-white rounded-3xl shadow-card p-8 text-center">
        <AlertCircle size={36} className="mx-auto text-red-500" />
        <h2 className="text-lg font-bold text-text mt-3">
          Access Denied
        </h2>
        <p className="text-sm text-muted mt-2">
          This page is only available to company supervisors.
        </p>
      </div>
    );
  }

  const pendingCount = attendance.length + journals.length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-text">
            Supervisor Reviews
          </h1>
          <p className="text-sm text-muted mt-1">
            Review and sign off your assigned interns' attendance and weekly journals.
          </p>
        </div>

        <button
          onClick={fetchReviews}
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

      {/* Summary */}
      <div className="bg-white rounded-3xl shadow-card p-6 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-warning">
          <ClipboardCheck size={24} />
        </div>

        <div>
          <p className="text-xs text-muted font-semibold">
            Total Pending Reviews
          </p>
          <p className="text-2xl font-extrabold text-text">
            {loading ? '--' : pendingCount}
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle size={20} className="text-green-600 shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-card p-2 flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
            activeTab === 'attendance'
              ? 'bg-primary text-white'
              : 'text-muted hover:bg-gray-50'
          }`}
        >
          <Clock size={17} />
          Attendance ({attendance.length})
        </button>

        <button
          onClick={() => setActiveTab('journals')}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
            activeTab === 'journals'
              ? 'bg-primary text-white'
              : 'text-muted hover:bg-gray-50'
          }`}
        >
          <BookOpen size={17} />
          Weekly Journals ({journals.length})
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
            Loading pending reviews...
          </p>
        </div>
      )}

      {/* Attendance List */}
      {!loading && !error && activeTab === 'attendance' && (
        attendance.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card p-10 text-center">
            <CheckCircle size={40} className="mx-auto text-green-500" />
            <h2 className="text-xl font-extrabold text-text mt-4">
              All Attendance Reviewed
            </h2>
            <p className="text-sm text-muted mt-2">
              There are no completed attendance records waiting for your approval.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {attendance.map((record) => (
              <div
                key={record._id}
                className="bg-white rounded-3xl shadow-card p-6 space-y-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center">
                      <User size={21} />
                    </div>

                    <div>
                      <h3 className="font-extrabold text-text">
                        {getStudentName(record.student)}
                      </h3>
                      <p className="text-xs text-muted">
                        {record.student?.studentNumber || 'No student number'}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                    Pending
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-muted">Attendance Date</p>
                    <p className="text-sm font-bold text-text mt-1">
                      {formatDate(record.attendanceDate || record.date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted">Total Hours</p>
                    <p className="text-sm font-bold text-text mt-1">
                      {Number(record.totalHours || 0).toFixed(2)} hours
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted">Time In</p>
                    <p className="text-sm font-bold text-text mt-1">
                      {record.timeIn
                        ? new Date(record.timeIn).toLocaleTimeString()
                        : '--'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted">Time Out</p>
                    <p className="text-sm font-bold text-text mt-1">
                      {record.timeOut
                        ? new Date(record.timeOut).toLocaleTimeString()
                        : '--'}
                    </p>
                  </div>
                </div>

                {record.remarks && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-muted font-semibold">
                      Student Remarks
                    </p>
                    <p className="text-sm text-text mt-1">
                      {record.remarks}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => openReview(record, 'Approved', 'attendance')}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-green-700"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>

                  <button
                    onClick={() => openReview(record, 'Rejected', 'attendance')}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-xl py-2.5 text-sm font-bold hover:bg-red-100"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Weekly Journals List */}
      {!loading && !error && activeTab === 'journals' && (
        journals.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-card p-10 text-center">
            <CheckCircle size={40} className="mx-auto text-green-500" />
            <h2 className="text-xl font-extrabold text-text mt-4">
              All Journals Reviewed
            </h2>
            <p className="text-sm text-muted mt-2">
              There are no weekly journals waiting for your approval.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {journals.map((journal) => (
              <div
                key={journal._id}
                className="bg-white rounded-3xl shadow-card p-6 space-y-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary-light text-primary flex items-center justify-center">
                      <BookOpen size={21} />
                    </div>

                    <div>
                      <h3 className="font-extrabold text-text">
                        {getStudentName(journal.student)}
                      </h3>
                      <p className="text-xs text-muted">
                        {journal.student?.studentNumber || 'No student number'}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                    Pending
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted">
                  <CalendarDays size={17} className="text-primary" />
                  Week {journal.weekNumber}
                  <span className="text-xs">
                    ({formatDate(journal.startDate)} – {formatDate(journal.endDate)})
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-muted">
                      Activities
                    </p>
                    <p className="text-sm text-text mt-1 whitespace-pre-wrap">
                      {journal.activities || 'No activities provided.'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-muted">
                      Learnings
                    </p>
                    <p className="text-sm text-text mt-1 whitespace-pre-wrap">
                      {journal.learnings || 'No learnings provided.'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-muted">
                      Challenges
                    </p>
                    <p className="text-sm text-text mt-1 whitespace-pre-wrap">
                      {journal.challenges || 'No challenges provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => openReview(journal, 'Approved', 'journal')}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-green-700"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>

                  <button
                    onClick={() => openReview(journal, 'Rejected', 'journal')}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-red-50 text-red-600 rounded-xl py-2.5 text-sm font-bold hover:bg-red-100"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Review Confirmation Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-text">
                  {reviewStatus === 'Approved'
                    ? 'Approve Submission'
                    : 'Reject Submission'}
                </h2>

                <p className="text-sm text-muted mt-1">
                  {getStudentName(selectedReview.student)}
                </p>
              </div>

              <button
                onClick={closeReview}
                disabled={!!reviewingId}
                className="text-muted hover:text-text text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-text">
                {reviewStatus === 'Approved'
                  ? 'Are you sure you want to approve this submission? It will be forwarded to the OJT Coordinator for final review.'
                  : 'Are you sure you want to reject this submission? Please explain the reason so the appropriate action can be taken.'}
              </p>
            </div>

            <div>
              <label className="text-sm font-bold text-text flex items-center gap-2 mb-2">
                <MessageSquare size={16} />
                Supervisor Remarks
                {reviewStatus === 'Rejected' && (
                  <span className="text-red-500">*</span>
                )}
              </label>

              <textarea
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={
                  reviewStatus === 'Rejected'
                    ? 'Explain why this submission is being rejected...'
                    : 'Optional remarks...'
                }
                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-primary resize-none"
              />

              <p className="text-xs text-muted text-right mt-1">
                {remarks.length}/2000 characters
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={closeReview}
                disabled={!!reviewingId}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-text hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={submitReview}
                disabled={
                  !!reviewingId ||
                  (reviewStatus === 'Rejected' && !remarks.trim())
                }
                className={`flex-1 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-50 ${
                  reviewStatus === 'Approved'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {reviewingId ? (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw size={15} className="animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  `Confirm ${reviewStatus}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
