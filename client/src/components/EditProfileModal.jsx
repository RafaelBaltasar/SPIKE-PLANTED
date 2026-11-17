import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { api } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function EditProfileModal({ initialData, onClose, onSuccess }) {
  const { login } = useAuth();
  const [form, setForm] = useState({
    fullName: initialData?.fullName || '',
    email: initialData?.email || '',
    contactNumber: initialData?.contactNumber || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/profile', form);
      
      // Update the global auth context so the topbar name updates instantly
      const token = localStorage.getItem('spikeToken');
      if (data.user) {
        login(token, { ...data.user, role: initialData.role }); 
      }
      
      onSuccess(); // Tell parent to refresh data
      onClose();   // Close modal
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-extrabold text-text">Edit Profile</h2>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted mb-1">Full Name</label>
            <input 
              type="text" 
              value={form.fullName} 
              onChange={e => setForm({...form, fullName: e.target.value})}
              className="w-full h-11 px-4 rounded-xl bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1">Email Address</label>
            <input 
              type="email" 
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full h-11 px-4 rounded-xl bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted mb-1">Contact Number</label>
            <input 
              type="text" 
              value={form.contactNumber} 
              onChange={e => setForm({...form, contactNumber: e.target.value})}
              className="w-full h-11 px-4 rounded-xl bg-background border border-border text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-11 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition flex items-center justify-center gap-2 mt-2"
          >
            <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}