import { useState, useEffect } from 'react';
import { Building, Plus, MapPin, Phone } from 'lucide-react';
import { api } from '../../api/axios';

export default function ManageCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', contactPerson: '', contactEmail: '' });

  const fetchCompanies = async () => {
    try {
      // Assuming you have or will create a /companies route
      const { data } = await api.get('/companies').catch(() => ({ data: { companies: [] } }));
      setCompanies(data.companies || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/companies', form);
      setIsAdding(false);
      setForm({ name: '', address: '', contactPerson: '', contactEmail: '' });
      fetchCompanies();
    } catch (err) { alert('Failed to add company'); }
  };

  if (loading) return <div className="p-10 text-center text-primary">Loading companies...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-text">Partner Companies</h1>
          <p className="text-sm text-muted mt-1">Manage OJT placement partners</p>
        </div>
        <button onClick={() => setIsAdding(!isAdding)} className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl font-semibold text-sm hover:bg-primary-dark transition">
          <Plus size={16} /> Add Company
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white rounded-3xl shadow-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Company Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full h-11 px-4 rounded-xl bg-background text-sm outline-none border-none" />
            <input required placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="w-full h-11 px-4 rounded-xl bg-background text-sm outline-none border-none" />
            <input required placeholder="Contact Person" value={form.contactPerson} onChange={e => setForm({...form, contactPerson: e.target.value})} className="w-full h-11 px-4 rounded-xl bg-background text-sm outline-none border-none" />
            <input required type="email" placeholder="Contact Email" value={form.contactEmail} onChange={e => setForm({...form, contactEmail: e.target.value})} className="w-full h-11 px-4 rounded-xl bg-background text-sm outline-none border-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setIsAdding(false)} className="px-5 py-2.5 text-sm font-semibold text-muted hover:bg-background rounded-xl">Cancel</button>
            <button type="submit" className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold">Save</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-3xl shadow-card text-center text-muted">No companies added yet.</div>
        ) : companies.map(c => (
          <div key={c._id} className="bg-white p-6 rounded-3xl shadow-card">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-3">
              <Building size={20} />
            </div>
            <h3 className="font-bold text-text mb-1">{c.name}</h3>
            <div className="space-y-1 text-xs text-muted">
              <p className="flex items-center gap-1"><MapPin size={12}/> {c.address}</p>
              <p className="flex items-center gap-1"><Phone size={12}/> {c.contactPerson}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}