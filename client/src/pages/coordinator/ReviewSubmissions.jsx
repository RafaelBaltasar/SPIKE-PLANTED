import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, FileText, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../api/axios';

export default function ReviewSubmissions() {
  const [documents, setDocuments] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' or 'journals'

  const fetchData = async () => {
    try {
      // Fetch all documents and all journals (we will need a backend route for journals)
      const docRes = await api.get('/documents'); 
      
      // Filter only pending ones for review
      setDocuments(docRes.data.documents.filter(d => d.status === 'Pending'));
      
      // *Note: You will need to add a route in the backend to get ALL journals for coordinators*
      // For now, let's assume it works or use mock data if backend isn't ready.
      // const jrnRes = await api.get('/weekly-journals/all');
      // setJournals(jrnRes.data.journals.filter(j => j.status === 'Submitted'));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReviewDoc = async (id, status) => {
    try {
      await api.patch(`/documents/${id}/review`, { status, remarks: status === 'Approved' ? 'Looks good.' : 'Please re-upload.' });
      fetchData(); // Refresh list
    } catch (err) { alert('Failed to review document'); }
  };

  if (loading) return <div className="p-10 text-center text-primary">Loading submissions...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-text">Approvals</h1>
        <p className="text-sm text-muted mt-1">Review student documents and journals</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button 
          onClick={() => setActiveTab('documents')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 ${activeTab === 'documents' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
        >
          <FileText size={16} /> Documents ({documents.length})
        </button>
        <button 
          onClick={() => setActiveTab('journals')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 ${activeTab === 'journals' ? 'text-primary border-b-2 border-primary' : 'text-muted'}`}
        >
          <BookOpen size={16} /> Journals ({journals.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 gap-4">
          {documents.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl shadow-card text-center text-muted">No pending documents to review.</div>
          ) : documents.map(doc => (
            <div key={doc._id} className="bg-white p-6 rounded-3xl shadow-card flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="font-bold text-text">{doc.documentType}</h3>
                <p className="text-sm text-muted">Student: {doc.student?.firstName} {doc.student?.lastName}</p>
                <a href={`http://localhost:5000${doc.filePath}`} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold hover:underline">View File</a>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleReviewDoc(doc._id, 'Rejected')} className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-red-50 text-danger hover:bg-red-100">
                  <XCircle size={16} /> Reject
                </button>
                <button onClick={() => handleReviewDoc(doc._id, 'Approved')} className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold bg-green-50 text-success hover:bg-green-100">
                  <CheckCircle size={16} /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}