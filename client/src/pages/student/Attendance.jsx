
import { useEffect, useState } from 'react';
import { Play, Square, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../api/axios';

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const fetchAttendance = async () => {
    try {
      const { data } = await api.get('/ojt/my-attendance');
      setRecords(data.attendance || []);
      setSummary(data.summary);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const activeSession = records.find(r => !r.timeOut);

  const handleTime = async (action) => {
    setBusy(true);

    try {
      await api.post(`/ojt/${action}`);
      await fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const getDisplayStatus = (record) => {
    if (record.supervisorStatus === 'Rejected') {
      return 'Rejected';
    }

    if (record.status === 'Approved') {
      return 'Approved';
    }

    if (record.supervisorStatus === 'Approved') {
      return 'Awaiting Coordinator';
    }

    return record.status || 'Pending';
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-700';

      case 'Rejected':
        return 'bg-red-100 text-red-700';

      case 'Awaiting Coordinator':
        return 'bg-blue-100 text-blue-700';

      default:
        return 'bg-amber-100 text-amber-700';
    }
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-primary">
        Loading attendance...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text">
          Attendance
        </h1>
        <p className="text-sm text-muted mt-1">
          Log your daily OJT hours
        </p>
      </div>

      <div className="rounded-3xl bg-primary-light p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-card">
        <div>
          <h2 className="text-xl font-extrabold mb-1 text-primary-dark">
            {activeSession
              ? 'You are currently timed in'
              : 'Ready to start your day?'}
          </h2>

          <p className="text-sm text-primary/80">
            {activeSession
              ? `Started at ${format(new Date(activeSession.timeIn), 'h:mm a')}`
              : 'Make sure to time out when you leave.'}
          </p>
        </div>

        <button
          onClick={() => handleTime(activeSession ? 'time-out' : 'time-in')}
          disabled={busy}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white shadow-card transition ${
            activeSession
              ? 'bg-danger hover:bg-red-700'
              : 'bg-primary hover:bg-primary-dark'
          } disabled:opacity-50`}
        >
          {activeSession
            ? <Square size={18} fill="currentColor" />
            : <Play size={18} fill="currentColor" />}

          {busy
            ? 'Please wait…'
            : activeSession
              ? 'Time Out'
              : 'Time In'}
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-card">
            <p className="text-xs text-muted font-semibold mb-1">
              Total Days
            </p>
            <p className="text-3xl font-extrabold text-text">
              {summary.totalDays}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-card">
            <p className="text-xs text-muted font-semibold mb-1">
              Completed
            </p>
            <p className="text-3xl font-extrabold text-text">
              {summary.completedDays}
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-card">
            <p className="text-xs text-muted font-semibold mb-1">
              Total Hours
            </p>
            <p className="text-3xl font-extrabold text-primary">
              {summary.totalHours}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-extrabold text-text">
            Attendance History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-muted text-xs uppercase">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Time In</th>
                <th className="px-6 py-3">Time Out</th>
                <th className="px-6 py-3">Hours</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {records.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-muted"
                  >
                    No records yet.
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const displayStatus = getDisplayStatus(record);

                  return (
                    <tr
                      key={record._id}
                      className="hover:bg-background/50"
                    >
                      <td className="px-6 py-4 font-medium">
                        {format(new Date(record.date), 'MMM d, yyyy')}
                      </td>

                      <td className="px-6 py-4 text-muted">
                        {format(new Date(record.timeIn), 'h:mm a')}
                      </td>

                      <td className="px-6 py-4 text-muted">
                        {record.timeOut
                          ? format(new Date(record.timeOut), 'h:mm a')
                          : '—'}
                      </td>

                      <td className="px-6 py-4 font-semibold text-primary">
                        {Number(record.totalHours || 0).toFixed(2)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(displayStatus)}`}
                        >
                          {displayStatus}
                        </span>

                        {record.supervisorStatus === 'Rejected' &&
                          record.supervisorRemarks && (
                            <div className="mt-2 flex gap-2 max-w-xs text-xs text-red-700">
                              <AlertCircle
                                size={15}
                                className="shrink-0 mt-0.5"
                              />
                              <span>
                                Supervisor: {record.supervisorRemarks}
                              </span>
                            </div>
                          )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
