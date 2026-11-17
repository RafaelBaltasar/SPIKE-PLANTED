import { useState, useRef } from 'react';
import { X, Save, Upload, User } from 'lucide-react';
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
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(initialData?.avatar || '');
  
  const fileRef = useRef(null);

  // Handle text fields submit
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

  // Handle profile picture upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview instantly
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('avatar', file);

    setUploading(true);
    try {
      const { data } = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Update global user state so the top bar picture changes immediately
      const token = localStorage.getItem('spikeToken');
      login(token, { ...initialData, avatar: data.avatar }); 
      
      onSuccess(); 
    } catch (err) {
      alert('Failed to upload image.');
      setAvatarPreview(initialData?.avatar || ''); // Revert preview on failure
    } finally {
      setUploading(false);
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
          
          {/* PROFILE PICTURE UPLOAD */}
          <div className="flex flex-col items-center mb-4">
            <div className="relative w-24 h-24 rounded-full bg-primary-light flex items-center justify-center text-primary text-3xl font-bold overflow-hidden border-4 border-white shadow-sm mb-2">
              {avatarPreview ? (
                <img 
                  src={avatarPreview.startsWith('data:') || avatarPreview.startsWith('http') ? avatarPreview : `http://localhost:5000${avatarPreview}`} 
                  alt="avatar" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <User size={40} className="text-primary/50" />
              )}
              
              {/* Upload overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleAvatarUpload} 
            />
            
            <button 
              type="button" 
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
            >
              <Upload size={12} /> {uploading ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>

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
            disabled={loading || uploading}
            className="w-full h-11 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}