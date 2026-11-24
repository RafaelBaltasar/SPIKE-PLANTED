
import { useEffect, useState } from 'react';
import {
  CheckCircle,
  XCircle,
  FileText,
  BookOpen,
  Clock,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { api, getFileUrl } from '../../api/axios';

export default function ReviewSubmissions() {
  const [documents, setDocuments] = useState([]);
  const [journals, setJournals] = useState([]);
  const [attendance, setAttendance] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('documents');
  const [reviewingId, setReviewingId] = useState(null);

  // Fetch all pending submissions
  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [docRes, journalRes, attendanceRes] = await Promise.all([
        api.get('/documents'),
        api.get('/weekly-journals/all'),
        api.get('/coordinator/attendance')
      ]);

      setDocuments(
        (docRes.data.documents || []).filter(
          doc => doc.status === 'Pending'
        )
      );

      setJournals(journalRes.data.journals || []);
      setAttendance(attendanceRes.data.attendance || []);

    } catch (err) {
      console.error('Failed to fetch submissions:', err);

      setError(
        err.response?.data?.message ||
        'Unable to load submissions. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format dates safely
  const formatDate = (date) => {
    if (!date) return 'N/A';

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'N/A';
    }

    return format(parsedDate, 'MMM dd, yyyy');
  };

  // Format time safely
  const formatTime = (time) => {
    if (!time) return 'N/A';

    const parsedDate = new Date(time);

    if (Number.isNaN(parsedDate.getTime())) {
      return 'N/A';
    }

    return format(parsedDate, 'hh:mm a');
  };

  // Review document
  const handleReviewDoc = async (id, status) => {
    let remarks = '';

    if (status === 'Rejected') {
      remarks = window.prompt(
        'Enter the reason for rejecting this document:'
      );

      if (remarks === null) return;

      if (!remarks.trim()) {
        alert('Remarks are required when rejecting a document.');
        return;
      }
    } else {
      remarks = 'Document approved.';
    }

    try {
      setReviewingId(id);

      await api.patch(`/documents/${id}/review`, {
        status,
        remarks
      });

      alert(`Document ${status.toLowerCase()} successfully!`);

      await fetchData();

    } catch (err) {
      console.error('Document review error:', err);

      alert(
        err.response?.data?.message ||
        'Failed to review document.'
      );
    } finally {
      setReviewingId(null);
    }
  };

  // Review weekly journal
  const handleReviewJournal = async (id, status) => {
    let feedback = '';

    if (status === 'Rejected') {
      feedback = window.prompt(
        'Enter feedback explaining why this journal was rejected:'
      );

      if (feedback === null) return;

      if (!feedback.trim()) {
        alert('Feedback is required when rejecting a journal.');
        return;
      }
    } else {
      feedback = 'Journal approved.';
    }

    try {
      setReviewingId(id);

      await api.patch(`/weekly-journals/${id}/review`, {
        status,
        feedback
      });

      alert(`Journal ${status.toLowerCase()} successfully!`);

      await fetchData();

    } catch (err) {
      console.error('Journal review error:', err);

      alert(
        err.response?.data?.message ||
        'Failed to review journal.'
      );
    } finally {
      setReviewingId(null);
    }
  };

  // Review attendance
  const handleReviewAttendance = async (id, status) => {
    let remarks = '';

    if (status === 'Rejected') {
      remarks = window.prompt(
        'Enter the reason for rejecting this attendance:'
      );

      if (remarks === null) return;

      if (!remarks.trim()) {
        alert('Remarks are required when rejecting attendance.');
        return;
      }
    } else {
      remarks = 'Attendance approved.';
    }

    try {
      setReviewingId(id);

      await api.patch(`/coordinator/attendance/${id}/review`, {
        status,
        remarks
      });

      alert(`Attendance ${status.toLowerCase()} successfully!`);

      await fetchData();

    } catch (err) {
      console.error('Attendance review error:', err);

      alert(
        err.response?.data?.message ||
        'Failed to review attendance.'
      );
    } finally {
      setReviewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-primary">
        Loading submissions...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text">
            Approvals
          </h1>

          <p className="text-sm text-muted mt-1">
            Review student documents, weekly journals, and attendance
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white shadow-card text-primary hover:bg-primary-light disabled:opacity-50"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border overflow-x-auto">

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 whitespace-nowrap font-semibold text-sm flex items-center gap-2 ${
            activeTab === 'documents'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted'
          }`}
        >
          <FileText size={16} />
          Documents ({documents.length})
        </button>

        <button
          onClick={() => setActiveTab('journals')}
          className={`pb-3 whitespace-nowrap font-semibold text-sm flex items-center gap-2 ${
            activeTab === 'journals'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted'
          }`}
        >
          <BookOpen size={16} />
          Journals ({journals.length})
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 whitespace-nowrap font-semibold text-sm flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted'
          }`}
        >
          <Clock size={16} />
          Attendance ({attendance.length})
        </button>

      </div>

      {/* DOCUMENTS TAB */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 gap-4">

          {documents.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl shadow-card text-center">
              <FileText
                size={36}
                className="mx-auto mb-3 text-muted"
              />

              <p className="font-semibold text-text">
                No pending documents
              </p>

              <p className="text-sm text-muted mt-1">
                All submitted documents have been reviewed.
              </p>
            </div>
          ) : (
            documents.map(doc => (
              <div
                key={doc._id}
                className="bg-white p-6 rounded-3xl shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-5"
              >
                <div className="space-y-2">
                  <h3 className="font-bold text-text text-lg">
                    {doc.documentType}
                  </h3>

                  <p className="text-sm text-muted">
                    Student: {doc.student?.firstName}{' '}
                    {doc.student?.lastName}
                  </p>

                  <p className="text-sm text-muted">
                    Student ID: {doc.student?.studentNumber || 'N/A'}
                  </p>

                  <p className="text-xs text-muted">
                    Uploaded: {formatDate(doc.createdAt)}
                  </p>

                  <a
                    href={getFileUrl(doc.filePath)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-xs text-primary font-bold hover:underline"
                  >
                    View Uploaded File
                  </a>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={() => handleReviewDoc(doc._id, 'Rejected')}
                    disabled={reviewingId === doc._id}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-danger hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>

                  <button
                    onClick={() => handleReviewDoc(doc._id, 'Approved')}
                    disabled={reviewingId === doc._id}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-green-50 text-success hover:bg-green-100 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}

        </div>
      )}

      {/* JOURNALS TAB */}
      {activeTab === 'journals' && (
        <div className="grid grid-cols-1 gap-4">

          {journals.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl shadow-card text-center">
              <BookOpen
                size={36}
                className="mx-auto mb-3 text-muted"
              />

              <p className="font-semibold text-text">
                No submitted journals
              </p>

              <p className="text-sm text-muted mt-1">
                Submitted weekly journals will appear here.
              </p>
            </div>
          ) : (
            journals.map(journal => (
              <div
                key={journal._id}
                className="bg-white p-6 rounded-3xl shadow-card space-y-5"
              >
                {/* Journal Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-text text-lg">
                      Week {journal.weekNumber} Journal
                    </h3>

                    <p className="text-sm text-muted mt-1">
                      Student: {journal.student?.firstName}{' '}
                      {journal.student?.lastName}
                    </p>

                    <p className="text-sm text-muted">
                      Student ID: {journal.student?.studentNumber || 'N/A'}
                    </p>

                    <p className="text-xs text-muted mt-2">
                      {formatDate(journal.startDate)} -{' '}
                      {formatDate(journal.endDate)}
                    </p>
                  </div>

                  <span className="h-fit w-fit px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    {journal.status}
                  </span>
                </div>

                {/* Activities */}
                <div>
                  <h4 className="font-semibold text-text text-sm mb-1">
                    Activities Performed
                  </h4>

                  <p className="text-sm text-muted whitespace-pre-wrap">
                    {journal.activities}
                  </p>
                </div>

                {/* Learnings */}
                <div>
                  <h4 className="font-semibold text-text text-sm mb-1">
                    Learnings
                  </h4>

                  <p className="text-sm text-muted whitespace-pre-wrap">
                    {journal.learnings}
                  </p>
                </div>

                {/* Challenges */}
                <div>
                  <h4 className="font-semibold text-text text-sm mb-1">
                    Challenges
                  </h4>

                  <p className="text-sm text-muted whitespace-pre-wrap">
                    {journal.challenges || 'No challenges reported.'}
                  </p>
                </div>

                {/* Review Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 border-t border-border pt-4">
                  <button
                    onClick={() => handleReviewJournal(journal._id, 'Rejected')}
                    disabled={reviewingId === journal._id}
                    className="flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-danger hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Reject Journal
                  </button>

                  <button
                    onClick={() => handleReviewJournal(journal._id, 'Approved')}
                    disabled={reviewingId === journal._id}
                    className="flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-green-50 text-success hover:bg-green-100 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    Approve Journal
                  </button>
                </div>

              </div>
            ))
          )}

        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 gap-4">

          {attendance.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl shadow-card text-center">
              <Clock
                size={36}
                className="mx-auto mb-3 text-muted"
              />

              <p className="font-semibold text-text">
                No pending attendance
              </p>

              <p className="text-sm text-muted mt-1">
                Completed attendance records will appear here.
              </p>
            </div>
          ) : (
            attendance.map(record => (
              <div
                key={record._id}
                className="bg-white p-6 rounded-3xl shadow-card space-y-4"
              >

                {/* Student Information */}
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-text text-lg">
                      {record.student?.firstName}{' '}
                      {record.student?.lastName}
                    </h3>

                    <p className="text-sm text-muted">
                      Student ID: {record.student?.studentNumber || 'N/A'}
                    </p>

                    <p className="text-sm text-muted">
                      Program: {record.student?.program || 'N/A'}
                    </p>

                    <p className="text-xs text-muted mt-2">
                      Attendance Date:{' '}
                      {formatDate(record.attendanceDate || record.date)}
                    </p>
                  </div>

                  <span className="h-fit w-fit px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                    {record.status}
                  </span>
                </div>

                {/* Attendance Details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                  <div className="bg-background rounded-xl p-4">
                    <p className="text-xs text-muted mb-1">
                      Time In
                    </p>

                    <p className="font-bold text-text">
                      {formatTime(record.timeIn)}
                    </p>
                  </div>

                  <div className="bg-background rounded-xl p-4">
                    <p className="text-xs text-muted mb-1">
                      Time Out
                    </p>

                    <p className="font-bold text-text">
                      {formatTime(record.timeOut)}
                    </p>
                  </div>

                  <div className="bg-background rounded-xl p-4">
                    <p className="text-xs text-muted mb-1">
                      Total Hours
                    </p>

                    <p className="font-bold text-primary">
                      {Number(record.totalHours || 0).toFixed(2)} hrs
                    </p>
                  </div>

                </div>

                {/* Review Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-2 border-t border-border pt-4">

                  <button
                    onClick={() => handleReviewAttendance(record._id, 'Rejected')}
                    disabled={reviewingId === record._id}
                    className="flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-danger hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Reject Attendance
                  </button>

                  <button
                    onClick={() => handleReviewAttendance(record._id, 'Approved')}
                    disabled={reviewingId === record._id}
                    className="flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-green-50 text-success hover:bg-green-100 disabled:opacity-50"
                  >
                    <CheckCircle size={16} />
                    Approve Attendance
                  </button>

                </div>

              </div>
            ))
          )}

        </div>
      )}

    </div>
  );
}
