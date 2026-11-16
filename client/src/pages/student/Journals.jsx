import { useEffect, useState } from 'react';
import { BookOpen, Plus, Send } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../api/axios';

export default function Journals() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ weekNumber: '', startDate: '', endDate: '', activities: '', learnings: '', challenges: '' });

  const fetchJournals = async () => {
    try {
      const { data } = await api.get('/weekly-journals/my-journals');
      setJournals(data.journals || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchJournals(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/weekly-journals', { ...form, weekNumber: parseInt(form.weekNumber) });
      setIsCreating(false);
      setForm({ weekNumber: '', startDate: '', endDate: '', activities: '', learnings: '', challenges: '' });
      await fetchJournals();
    } catch (err) { alert(err.response?.data?.message || 'Failed to create'); }
  };

  const handleSubmit = async (id) => {
    if (!window.confirm('Submit this journal for review?')) return;
    try {
      await api.patch(`/weekly-journals/${id}/submit`);
      await fetchJournals();
    } catch (err) { alert(err.response?.data?.message || 'Failed to submit'); }
  };

  if (loading) return <div className="p-10 text-center text-primary">Loading journals...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text">Weekly Journals</h1>
          <p className="text-sm text-muted mt-1">Submit your reflections</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl font-semibold text-sm hover:bg-primary-dark transition">
          <Plus size={16} /> New Journal
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white rounded-3xl shadow-card p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">Week Number</label>
              <input type="number" min="1" max="53" required value={form.weekNumber} onChange={(e) => setForm({ ...form, weekNumber: e.target.value })} className="w-full h-10 px-3 rounded-xl bg-background text-sm outline-none border-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Start Date</label>
              <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="w-full h-10 px-3 rounded-xl bg-background text-sm outline-none border-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">End Date</label>
              <input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="w-full h-10 px-3 rounded-xl bg-background text-sm outline-none border-none" />
            </div>
          </div>
          <textarea required rows="3" placeholder="Activities" value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} className="w-full p-3 rounded-xl bg-background text-sm outline-none border-none" />
          <textarea required rows="3" placeholder="Learnings" value={form.learnings} onChange={(e) => setForm({ ...form, learnings: e.target.value })} className="w-full p-3 rounded-xl bg-background text-sm outline-none border-none" />
          <textarea rows="2" placeholder="Challenges (Optional)" value={form.challenges} onChange={(e) => setForm({ ...form, challenges: e.target.value })} className="w-full p-3 rounded-xl bg-background text-sm outline-none border-none" />
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setIsCreating(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-muted hover:bg-background">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold">Save Draft</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {journals.map((j) => (
          <div key={j._id} className="bg-white rounded-3xl shadow-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-extrabold text-text">Week {j.weekNumber}</h3>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${j.status === 'Approved' ? 'bg-green-100 text-success' : j.status === 'Draft' ? 'bg-gray-100 text-muted' : 'bg-amber-100 text-warning'}`}>{j.status}</span>
              </div>
              <p className="text-sm line-clamp-2"><strong className="text-text">Activities:</strong> {j.activities}</p>
            </div>
            {j.status === 'Draft' && (
              <button onClick={() => handleSubmit(j._id)} className="mt-4 flex items-center justify-center gap-2 bg-primary-light text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary hover:text-white transition">
                <Send size={14} /> Submit
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}