import { useEffect, useState } from 'react';
import { Play, Circle, CheckCircle2, Clock, Calendar, FileText, Star, Square } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState({ summary: null, records: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const REQUIRED_HOURS = 486;

  // Load data from localStorage
  const fetchAll = () => {
    const localData = localStorage.getItem('spikeAttendance');
    const records = localData ? JSON.parse(localData) : [];

    const completedRecords = records.filter(r => r.timeOut);
    const totalHours = completedRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);

    setAttendance({
      summary: { totalHours: Number(totalHours.toFixed(2)) },
      records: records
    });
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const activeSession = attendance.records.find(r => r.timeOut === null);

  const handleTime = async (action) => {
    setBusy(true);
    const now = new Date();
    let records = attendance.records;

    if (action === 'time-in') {
      const newRecord = {
        _id: Date.now().toString(),
        date: now.toISOString(),
        attendanceDate: format(now, 'yyyy-MM-dd'),
        timeIn: now.toISOString(),
        timeOut: null,
        totalHours: 0,
        status: 'Pending'
      };
      records = [newRecord, ...records];
    } else if (action === 'time-out') {
      records = records.map(r => {
        if (r.timeOut === null) {
          const diffMs = now - new Date(r.timeIn);
          const hours = diffMs / (1000 * 60 * 60);
          return { ...r, timeOut: now.toISOString(), totalHours: hours };
        }
        return r;
      });
    }

    localStorage.setItem('spikeAttendance', JSON.stringify(records));
    setAttendance(prev => ({ ...prev, records }));
    setBusy(false);
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = format(d, 'yyyy-MM-dd');
    const record = attendance.records.find(r => r.attendanceDate === dateStr);
    return { day: format(d, 'EEE'), hours: record?.totalHours || 0 };
  });

  const totalHours = attendance.summary?.totalHours || 0;
  const percent = Math.min(100, Math.round((totalHours / REQUIRED_HOURS) * 100));
  
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayRecords = attendance.records.filter(r => r.attendanceDate === todayStr);
  const todayHours = todayRecords.reduce((s, r) => s + (r.totalHours || 0), 0);

  if (loading) return <div className="p-10 text-center text-primary font-bold">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text">Hello, {user?.fullName?.split(' ')[0] || 'Student'}</h1>
        <p className="text-sm text-muted mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Banner */}
        <div className="lg:col-span-2 rounded-3xl bg-primary-light p-8 relative overflow-hidden min-h-[220px] flex flex-col justify-between shadow-card">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/40 px-3 py-1.5 rounded-full text-primary">
              <Star size={14} /> OJT Progress
            </span>
            <h2 className="text-2xl lg:text-3xl font-extrabold mt-4 max-w-xs leading-tight text-primary-dark">
              {totalHours >= REQUIRED_HOURS ? "You've completed your required hours!" : `Keep going — ${REQUIRED_HOURS - totalHours} hrs to go`}
            </h2>
          </div>
          <div className="relative z-10 flex items-center gap-3 mt-6">
            <button
              onClick={() => handleTime(activeSession ? 'time-out' : 'time-in')}
              disabled={busy}
              className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl font-semibold text-sm shadow-card hover:shadow-lg transition disabled:opacity-50"
            >
              <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center">
                {activeSession ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
              </span>
              {busy ? 'Please wait…' : activeSession ? 'Time Out' : 'Time In'}
            </button>
            {activeSession && (
              <p className="text-xs font-medium text-primary-dark">
                Timer started at {format(new Date(activeSession.timeIn), 'h:mm a')}
              </p>
            )}
          </div>
          <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-white/20" />
          <div className="absolute right-12 top-4 w-24 h-24 rounded-full bg-white/30" />
        </div>

        {/* Today's Activity */}
        <div className="rounded-3xl bg-white shadow-card p-6">
          <h3 className="font-extrabold mb-4 text-text">Today's Activity</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-primary-light p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-1"><Clock size={12} /> Hours</div>
              <p className="text-xl font-extrabold text-primary-dark">{todayHours.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-green-50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-1"><FileText size={12} /> Docs</div>
              <p className="text-xl font-extrabold text-success">0/0</p>
            </div>
            <div className="rounded-2xl bg-orange-50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-1"><Circle size={12} /> Pending</div>
              <p className="text-xl font-extrabold text-warning">0</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted mb-1"><Calendar size={12} /> Journals</div>
              <p className="text-xl font-extrabold text-text">0</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Ring */}
        <div className="rounded-3xl bg-white shadow-card p-6">
          <h3 className="font-extrabold mb-4 text-text">Total Hours</h3>
          <div className="flex items-center justify-center py-4">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="#14532d" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(percent / 100) * 264} 264`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-primary-dark">{totalHours.toFixed(1)}</span>
                <span className="text-xs text-muted">{percent}% of {REQUIRED_HOURS}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="rounded-3xl bg-white shadow-card p-6">
          <h3 className="font-extrabold mb-4 text-text">This Week's Hours</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={last7Days}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis hide />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }} />
              <Line type="monotone" dataKey="hours" stroke="#15803d" strokeWidth={3} dot={{ r: 4, fill: '#15803d' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Documents Checklist */}
        <div className="rounded-3xl bg-white shadow-card p-6">
          <h3 className="font-extrabold mb-4 text-text">Required Documents</h3>
          <div className="space-y-2">
            {['MOA', 'Insurance', 'Endorsement Letter', 'Medical Certificate'].map((type) => (
              <div key={type} className="flex items-center justify-between p-3 rounded-2xl bg-background">
                <div className="flex items-center gap-2">
                  <Circle size={16} className="text-muted" />
                  <span className="text-xs font-medium text-text">{type}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-muted">Missing</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}