
import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Plus,
  Send,
  Edit,
  X,
  MessageSquare,
  CalendarDays,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { api } from '../../api/axios';

const emptyForm = {
  weekNumber: '',
  startDate: '',
  endDate: '',
  activities: '',
  learnings: '',
  challenges: ''
};

export default function Journals() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submittingId, setSubmittingId] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const fetchJournals = useCallback(async () => {
    try {
      setError('');

      const { data } = await api.get('/weekly-journals/my-journals');
      setJournals(data.journals || []);
    } catch (err) {
      console.error('Fetch journals error:', err);

      setError(
        err.response?.data?.message ||
        'Failed to load your weekly journals.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  const resetForm = () => {
    setForm(emptyForm);
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await api.post('/weekly-journals', {
        ...form,
        weekNumber: Number.parseInt(form.weekNumber, 10)
      });

      resetForm();
      await fetchJournals();

    } catch (err) {
      alert(
        err.response?.data?.message ||
        'Failed to create weekly journal.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (journal) => {
    setForm({
      weekNumber: String(journal.weekNumber || ''),
      startDate: journal.startDate
        ? format(new Date(journal.startDate), 'yyyy-MM-dd')
        : '',
      endDate: journal.endDate
        ? format(new Date(journal.endDate), 'yyyy-MM-dd')
        : '',
      activities: journal.activities || '',
      learnings: journal.learnings || '',
      challenges: journal.challenges || ''
    });

    setEditingId(journal._id);
    setIsCreating(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editingId) return;

    try {
      setSaving(true);

      await api.put(`/weekly-journals/${editingId}`, {
        ...form,
        weekNumber: Number.parseInt(form.weekNumber, 10)
      });

      resetForm();
      await fetchJournals();

    } catch (err) {
      alert(
        err.response?.data?.message ||
        'Failed to update weekly journal.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (id) => {
    if (!window.confirm('Submit this journal for supervisor review?')) {
      return;
    }

    try {
      setSubmittingId(id);

      await api.patch(`/weekly-journals/${id}/submit`);

      await fetchJournals();

      alert('Weekly journal submitted successfully!');

    } catch (err) {
      alert(
        err.response?.data?.message ||
        'Failed to submit weekly journal.'
      );
    } finally {
      setSubmittingId(null);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-700';

      case 'Rejected':
        return 'bg-red-100 text-red-700';

      case 'Submitted':
        return 'bg-amber-100 text-amber-700';

      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getSupervisorStatus = (journal) => {
    if (journal.supervisorStatus === 'Approved') {
      return 'Approved by Supervisor';
    }

    if (journal.supervisorStatus === 'Rejected') {
      return 'Rejected by Supervisor';
    }

    if (journal.status === 'Submitted') {
      return 'Waiting for Supervisor';
    }

    return 'Not yet submitted';
  };

  const formatJournalDate = (date) => {
    if (!date) return 'Not specified';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return 'Invalid date';
    }

    return format(parsed, 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-primary">
        Loading journals...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-text">
            Weekly Journals
          </h1>

          <p className="text-sm text-muted mt-1">
            Submit your weekly internship activities and reflections
          </p>
        </div>

        {!isCreating && !editingId && (
          <button
            onClick={() => {
              setForm(emptyForm);
              setIsCreating(true);
            }}
            className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl font-semibold text-sm hover:bg-primary-dark transition"
          >
            <Plus size={16} />
            New Journal
          </button>
        )}
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle size={20} />

          <p className="text-sm flex-1">
            {error}
          </p>

          <button
            onClick={fetchJournals}
            className="text-sm font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* CREATE / EDIT FORM */}
      {(isCreating || editingId) && (
        <form
          onSubmit={editingId ? handleUpdate : handleCreate}
          className="bg-white rounded-3xl shadow-card p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-text">
                {editingId ? 'Edit Weekly Journal' : 'Create Weekly Journal'}
              </h2>

              <p className="text-xs text-muted mt-1">
                Complete your weekly internship report.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="p-2 rounded-xl hover:bg-background text-muted"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div>
              <label className="block text-xs font-semibold mb-1">
                Week Number
              </label>

              <input
                type="number"
                min="1"
                max="53"
                required
                value={form.weekNumber}
                onChange={(e) =>
                  setForm({ ...form, weekNumber: e.target.value })
                }
                className="w-full h-10 px-3 rounded-xl bg-background text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Start Date
              </label>

              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                className="w-full h-10 px-3 rounded-xl bg-background text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                End Date
              </label>

              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) =>
                  setForm({ ...form, endDate: e.target.value })
                }
                className="w-full h-10 px-3 rounded-xl bg-background text-sm outline-none"
              />
            </div>

          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Activities
            </label>

            <textarea
              required
              rows="3"
              placeholder="Describe the activities you performed this week..."
              value={form.activities}
              onChange={(e) =>
                setForm({ ...form, activities: e.target.value })
              }
              className="w-full p-3 rounded-xl bg-background text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Learnings
            </label>

            <textarea
              required
              rows="3"
              placeholder="What did you learn this week?"
              value={form.learnings}
              onChange={(e) =>
                setForm({ ...form, learnings: e.target.value })
              }
              className="w-full p-3 rounded-xl bg-background text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Challenges (Optional)
            </label>

            <textarea
              rows="2"
              placeholder="Describe any challenges you encountered..."
              value={form.challenges}
              onChange={(e) =>
                setForm({ ...form, challenges: e.target.value })
              }
              className="w-full p-3 rounded-xl bg-background text-sm outline-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-muted hover:bg-background"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : editingId
                  ? 'Save Changes'
                  : 'Save Draft'}
            </button>
          </div>
        </form>
      )}

      {/* JOURNAL LIST */}
      {journals.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-card p-10 text-center">
          <BookOpen
            size={42}
            className="mx-auto text-muted mb-3"
          />

          <h3 className="font-bold text-text">
            No Weekly Journals Yet
          </h3>

          <p className="text-sm text-muted mt-1">
            Create your first weekly journal to record your internship progress.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {journals.map((j) => (
            <div
              key={j._id}
              className="bg-white rounded-3xl shadow-card p-6 flex flex-col justify-between"
            >

              <div>

                {/* JOURNAL HEADER */}
                <div className="flex justify-between items-center mb-3 gap-3">
                  <div>
                    <h3 className="font-extrabold text-text">
                      Week {j.weekNumber}
                    </h3>

                    <p className="text-xs text-muted mt-1 flex items-center gap-1">
                      <CalendarDays size={13} />

                      {formatJournalDate(j.startDate)}
                      {' - '}
                      {formatJournalDate(j.endDate)}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStatusStyle(j.status)}`}
                  >
                    {j.status}
                  </span>
                </div>

                {/* SUPERVISOR STATUS */}
                <div className="bg-background rounded-xl p-3 mb-4">
                  <p className="text-xs text-muted">
                    Supervisor Review
                  </p>

                  <p className={`text-sm font-bold mt-1 ${
                    j.supervisorStatus === 'Approved'
                      ? 'text-green-700'
                      : j.supervisorStatus === 'Rejected'
                        ? 'text-red-600'
                        : 'text-amber-700'
                  }`}>
                    {getSupervisorStatus(j)}
                  </p>
                </div>

                {/* ACTIVITIES */}
                <div className="mb-3">
                  <p className="text-xs font-bold text-text mb-1">
                    Activities
                  </p>

                  <p className="text-sm text-muted whitespace-pre-wrap">
                    {j.activities}
                  </p>
                </div>

                {/* LEARNINGS */}
                <div className="mb-3">
                  <p className="text-xs font-bold text-text mb-1">
                    Learnings
                  </p>

                  <p className="text-sm text-muted whitespace-pre-wrap">
                    {j.learnings}
                  </p>
                </div>

                {/* CHALLENGES */}
                {j.challenges && (
                  <div className="mb-3">
                    <p className="text-xs font-bold text-text mb-1">
                      Challenges
                    </p>

                    <p className="text-sm text-muted whitespace-pre-wrap">
                      {j.challenges}
                    </p>
                  </div>
                )}

                {/* SUPERVISOR REJECTION REMARKS */}
                {j.supervisorStatus === 'Rejected' && j.supervisorRemarks && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                      <MessageSquare size={16} />

                      <p className="text-sm font-bold">
                        Supervisor Feedback
                      </p>
                    </div>

                    <p className="text-sm text-red-700 whitespace-pre-wrap">
                      {j.supervisorRemarks}
                    </p>

                    <p className="text-xs text-red-500 mt-3">
                      Please review the remarks, edit your journal, and submit it again.
                    </p>
                  </div>
                )}

                {/* COORDINATOR FEEDBACK */}
                {j.feedback && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <MessageSquare size={16} />

                      <p className="text-sm font-bold">
                        Coordinator Feedback
                      </p>
                    </div>

                    <p className="text-sm text-blue-700 whitespace-pre-wrap">
                      {j.feedback}
                    </p>
                  </div>
                )}

              </div>

              {/* ACTION BUTTONS */}
              {j.status === 'Draft' && (
                <div className="mt-5 flex flex-col sm:flex-row gap-2">

                  <button
                    onClick={() => handleEdit(j)}
                    disabled={saving || submittingId === j._id}
                    className="flex-1 flex items-center justify-center gap-2 bg-background text-text px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition disabled:opacity-50"
                  >
                    <Edit size={14} />
                    Edit
                  </button>

                  <button
                    onClick={() => handleSubmit(j._id)}
                    disabled={submittingId === j._id}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-light text-primary px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary hover:text-white transition disabled:opacity-50"
                  >
                    {submittingId === j._id ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Submit
                      </>
                    )}
                  </button>

                </div>
              )}

            </div>
          ))}

        </div>
      )}

    </div>
  );
}
