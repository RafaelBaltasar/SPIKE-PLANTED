import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { api } from '../../api/axios';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/coordinator/students')
      .then(({ data }) => setStudents(data.students || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    `${s.firstName} ${s.lastName} ${s.studentNumber} ${s.program}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center text-primary">Loading students...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text">Students</h1>
          <p className="text-sm text-muted mt-1">Monitor all intern placements</p>
        </div>
        <div className="bg-primary-light text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2">
          <Users size={18} /> {students.length} Total Interns
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input placeholder="Search by name, ID, or program…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-12 pl-12 pr-4 rounded-2xl bg-background text-sm outline-none focus:ring-2 focus:ring-primary-light border-none" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-muted text-xs uppercase">
              <tr>
                <th className="px-6 py-4 rounded-l-xl">Student Name</th>
                <th className="px-6 py-4">Student ID</th>
                <th className="px-6 py-4">Program</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s._id} className="hover:bg-background/50 transition">
                  <td className="px-6 py-4 font-semibold text-text">{s.firstName} {s.lastName}</td>
                  <td className="px-6 py-4 text-muted">{s.studentNumber}</td>
                  <td className="px-6 py-4 text-muted">{s.program}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-100 text-success">{s.status}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="4" className="px-6 py-10 text-center text-muted">No students found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}