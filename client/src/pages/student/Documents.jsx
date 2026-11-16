import { useEffect, useState, useRef } from 'react';
import { FileText, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../api/axios';

const DOC_TYPES = ['MOA', 'Insurance', 'Endorsement Letter', 'Medical Certificate', 'Other'];

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('MOA');
  const fileRef = useRef(null);

  const fetchDocs = async () => {
    try {
      const { data } = await api.get('/documents/my-documents');
      setDocuments(data.documents || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files[0];
    if (!file) return alert('Please select a file.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', selectedType);

    setUploading(true);
    try {
      await api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      fileRef.current.value = '';
      await fetchDocs();
    } catch (err) { alert(err.response?.data?.message || 'Upload failed'); } finally { setUploading(false); }
  };

  if (loading) return <div className="p-10 text-center text-primary">Loading documents...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text">Documents</h1>
        <p className="text-sm text-muted mt-1">Upload your OJT requirements</p>
      </div>

      <form onSubmit={handleUpload} className="bg-white rounded-3xl shadow-card p-6 flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold mb-1">Document Type</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full h-11 px-3 rounded-xl bg-background text-sm outline-none border-none">
            {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-semibold mb-1">File (PDF/JPG/PNG)</label>
          <input type="file" ref={fileRef} accept=".pdf,.jpg,.jpeg,.png" className="w-full h-11 px-3 py-2 rounded-xl bg-background text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-primary" />
        </div>
        <button type="submit" disabled={uploading} className="h-11 px-6 rounded-xl bg-primary text-white font-semibold text-sm flex items-center gap-2 hover:bg-primary-dark transition disabled:opacity-50">
          <Upload size={16} /> {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div key={doc._id} className="bg-white rounded-3xl shadow-card p-5">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary"><FileText size={18} /></div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${doc.status === 'Approved' ? 'bg-green-100 text-success' : doc.status === 'Rejected' ? 'bg-red-100 text-danger' : 'bg-amber-100 text-warning'}`}>{doc.status}</span>
            </div>
            <h3 className="font-bold text-sm mb-1">{doc.documentType}</h3>
            <p className="text-xs text-muted truncate">{doc.fileName}</p>
            <p className="text-[10px] text-muted mt-2">Uploaded {format(new Date(doc.createdAt), 'MMM d, yyyy')}</p>
            <a href={`http://localhost:5000${doc.filePath}`} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-bold text-primary hover:underline">View File →</a>
          </div>
        ))}
      </div>
    </div>
  );
}