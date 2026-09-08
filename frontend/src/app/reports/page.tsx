'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function ReportsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ weekStart: '', weekEnd: '', projectId: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [reportsRes, projectsRes] = await Promise.all([
        api.get('/api/reports/my'),
        api.get('/api/projects'),
      ]);
      setReports(reportsRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/api/reports', form);
      router.push(`/reports/${data.id}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create report');
    }
  };

  const getStatusStyle = (status: string) => {
    const styles: any = {
      DRAFT: 'bg-gray-100 text-gray-600',
      SUBMITTED: 'bg-blue-100 text-blue-700',
      NEEDS_CORRECTION: 'bg-amber-100 text-amber-700',
      APPROVED: 'bg-emerald-100 text-emerald-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  const getStatusIcon = (status: string) => {
    const icons: any = {
      DRAFT: '📝',
      SUBMITTED: '📤',
      NEEDS_CORRECTION: '⚠️',
      APPROVED: '✅',
    };
    return icons[status] || '📋';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">W</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">WeeklyReport</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">My Reports</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">{user?.name?.charAt(0)}</span>
              </div>
              <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
            </div>
            <button
              onClick={() => { logout(); router.push('/login'); }}
              className="text-sm text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Weekly Reports</h1>
            <p className="text-gray-500 text-sm mt-1">Create and manage your weekly work reports</p>
          </div>
          <button
            onClick={() => setCreating(!creating)}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            {creating ? 'Cancel' : '+ New Report'}
          </button>
        </div>

        {/* Create Form */}
        {creating && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Create New Report</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Week Start</label>
                <input
                  type="date"
                  required
                  value={form.weekStart}
                  onChange={(e) => setForm({ ...form, weekStart: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Week End</label>
                <input
                  type="date"
                  required
                  value={form.weekEnd}
                  onChange={(e) => setForm({ ...form, weekEnd: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                >
                  Create & Edit Report →
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-900 font-medium">No reports yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first weekly report to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-lg">
                      {getStatusIcon(report.status)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Week of {new Date(report.weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(report.status)}`}>
                          {report.status.replace(/_/g, ' ')}
                        </span>
                        {report.project && (
                          <span className="text-xs text-gray-400">• {report.project.name}</span>
                        )}
                        {report.versions?.length > 0 && (
                          <span className="text-xs text-gray-400">• v{report.versions[0]?.versionNumber || 1}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {['DRAFT', 'NEEDS_CORRECTION'].includes(report.status) && (
                      <button
                        onClick={() => router.push(`/reports/${report.id}/edit`)}
                        className="text-sm font-medium text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/reports/${report.id}`)}
                      className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition"
                    >
                      View →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}