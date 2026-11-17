
import { useEffect, useState } from 'react';

import {
  Download,
  Users,
  UserCheck,
  UserX,
  Clock,
  Award,
  RefreshCw
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

import { api } from '../../api/axios';

export default function SystemReports() {
  const [summary, setSummary] = useState({
    totalStudents: 0,
    activeStudents: 0,
    inactiveStudents: 0,
    completedStudents: 0,
    totalOjtHours: 0,
    requiredHours: 486
  });

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // ============================================
  // LOAD SYSTEM REPORTS
  // ============================================
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      const { data } = await api.get('/admin/reports');

      if (data.success) {
        setSummary(data.summary);
        setStudents(data.students || []);
      }

    } catch (err) {
      console.error('System reports error:', err);

      setError(
        err.response?.data?.message ||
        'Failed to load system reports.'
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // ============================================
  // FILTER STUDENTS
  // ============================================
  const filteredStudents = students.filter(student => {
    const searchText = [
      student.firstName,
      student.lastName,
      student.studentNumber,
      student.email,
      student.program
    ]
      .join(' ')
      .toLowerCase();

    return searchText.includes(search.toLowerCase());
  });

  // ============================================
  // EXPORT CSV
  // ============================================
  const exportCSV = () => {
    if (!students.length) {
      alert('There are no student records to export.');
      return;
    }

    const headers = [
      'Student Name',
      'Student ID',
      'Email',
      'Program',
      'Status',
      'Approved OJT Hours',
      'Progress (%)',
      'Completed'
    ];

    const rows = students.map(student => [
      `${student.firstName || ''} ${student.lastName || ''}`,
      student.studentNumber || '',
      student.email || '',
      student.program || '',
      student.status || '',
      student.totalHours,
      student.progress,
      student.completed ? 'Yes' : 'No'
    ]);

    const escapeCSV = value =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    const csvContent = [
      headers,
      ...rows
    ]
      .map(row => row.map(escapeCSV).join(','))
      .join('\n');

    const blob = new Blob(
      ['\uFEFF' + csvContent],
      { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'SPIKE_PLANTED_OJT_Reports.csv';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ============================================
  // STATISTICS CARDS
  // ============================================
  const statCards = [
    {
      title: 'Total Students',
      value: summary.totalStudents,
      icon: Users
    },
    {
      title: 'Active Students',
      value: summary.activeStudents,
      icon: UserCheck
    },
    {
      title: 'Inactive Students',
      value: summary.inactiveStudents,
      icon: UserX
    },
    {
      title: 'Completed OJT',
      value: summary.completedStudents,
      icon: Award
    },
    {
      title: 'Total Approved Hours',
      value: summary.totalOjtHours.toLocaleString(),
      icon: Clock
    }
  ];

  const completionRate = summary.totalStudents
    ? (summary.completedStudents / summary.totalStudents) * 100
    : 0;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <h1 className="text-3xl font-extrabold text-text">
            System Reports
          </h1>

          <p className="text-sm text-muted mt-1">
            Overview of all OJT activities and student progress
          </p>
        </div>

        <div className="flex gap-2">

          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-2 bg-white text-primary px-4 py-3 rounded-xl font-semibold text-sm shadow-card disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />

            Refresh
          </button>

          <button
            onClick={exportCSV}
            disabled={loading || students.length === 0}
            className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-primary-dark disabled:opacity-50"
          >
            <Download size={16} />

            Export CSV
          </button>

        </div>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* STATISTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">

        {statCards.map(card => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white p-6 rounded-3xl shadow-card flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary-light flex items-center justify-center text-primary">
                <Icon size={24} />
              </div>

              <div>
                <p className="text-xs text-muted font-semibold">
                  {card.title}
                </p>

                <p className="text-2xl font-extrabold text-text">
                  {loading ? '...' : card.value}
                </p>
              </div>
            </div>
          );
        })}

      </div>

      {/* COMPLETION OVERVIEW */}
      <div className="bg-white rounded-3xl shadow-card p-6">

        <h3 className="font-extrabold text-text mb-2">
          OJT Completion Overview
        </h3>

        <p className="text-sm text-muted mb-5">
          Students who have completed the 486-hour OJT requirement.
        </p>

        <div className="flex items-center justify-between text-sm mb-2">

          <span className="font-semibold text-text">
            Completed Students
          </span>

          <span className="font-bold text-primary">
            {loading
              ? '...'
              : `${summary.completedStudents} / ${summary.totalStudents}`}
          </span>

        </div>

        <div className="w-full h-3 bg-background rounded-full overflow-hidden">

          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{
              width: `${completionRate}%`
            }}
          />

        </div>

        <p className="text-xs text-muted mt-2">
          {loading ? 'Loading...' : `${completionRate.toFixed(1)}% of students completed their OJT.`}
        </p>

      </div>

      {/* OJT HOURS CHART */}
      <div className="bg-white rounded-3xl shadow-card p-6">

        <h3 className="font-extrabold text-text mb-6">
          Approved OJT Hours per Student
        </h3>

        <div className="h-80">

          {loading ? (
            <div className="h-full flex items-center justify-center text-muted">
              Loading chart...
            </div>

          ) : students.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted">
              No student records available.
            </div>

          ) : (
            <ResponsiveContainer width="100%" height="100%">

              <BarChart
                data={students.map(student => ({
                  name: `${student.firstName} ${student.lastName}`,
                  hours: student.totalHours
                }))}

                margin={{
                  top: 10,
                  right: 20,
                  left: -15,
                  bottom: 10
                }}
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: '#6B7280'
                  }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 12,
                    fill: '#6B7280'
                  }}
                />

                <Tooltip
                  formatter={value => [
                    `${value} hours`,
                    'Approved OJT Hours'
                  ]}
                />

                <Bar
                  dataKey="hours"
                  fill="#14532d"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                />

              </BarChart>

            </ResponsiveContainer>
          )}

        </div>
      </div>

      {/* INDIVIDUAL STUDENT REPORTS */}
      <div className="bg-white rounded-3xl shadow-card p-6">

        <h3 className="font-extrabold text-text mb-4">
          Individual Student OJT Reports
        </h3>

        <input
          type="text"
          placeholder="Search by student name, ID, email, or program..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-12 px-4 mb-5 rounded-2xl bg-background text-sm outline-none focus:ring-2 focus:ring-primary-light"
        />

        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead className="bg-background text-muted text-xs uppercase">

              <tr>
                <th className="px-4 py-4">
                  Student
                </th>

                <th className="px-4 py-4">
                  Student ID
                </th>

                <th className="px-4 py-4">
                  Program
                </th>

                <th className="px-4 py-4">
                  Status
                </th>

                <th className="px-4 py-4">
                  OJT Hours
                </th>

                <th className="px-4 py-4">
                  Progress
                </th>

                <th className="px-4 py-4">
                  Completion
                </th>
              </tr>

            </thead>

            <tbody className="divide-y divide-border">

              {filteredStudents.map(student => (

                <tr
                  key={student._id}
                  className="hover:bg-background/50"
                >

                  <td className="px-4 py-4 font-semibold">
                    {student.firstName} {student.lastName}
                  </td>

                  <td className="px-4 py-4 text-muted">
                    {student.studentNumber}
                  </td>

                  <td className="px-4 py-4 text-muted">
                    {student.program}
                  </td>

                  <td className="px-4 py-4">
                    {student.status}
                  </td>

                  <td className="px-4 py-4 font-semibold">
                    {student.totalHours} hrs
                  </td>

                  <td className="px-4 py-4 min-w-36">

                    <div className="flex items-center gap-2">

                      <div className="w-20 h-2 bg-background rounded-full overflow-hidden">

                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: `${student.progress}%`
                          }}
                        />

                      </div>

                      <span className="text-xs text-muted">
                        {student.progress}%
                      </span>

                    </div>

                  </td>

                  <td className="px-4 py-4">

                    {student.completed ? (

                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                        Completed
                      </span>

                    ) : (

                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                        In Progress
                      </span>

                    )}

                  </td>

                </tr>

              ))}

              {!loading && filteredStudents.length === 0 && (

                <tr>
                  <td
                    colSpan="7"
                    className="px-4 py-10 text-center text-muted"
                  >
                    No student reports found.
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}
