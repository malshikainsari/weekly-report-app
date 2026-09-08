'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function ProjectsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'MANAGER') { router.push('/reports'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [projectsRes, usersRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/users'),
      ]);
      setProjects(projectsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.put(`/api/projects/${editingId}`, form);
      } else {
        await api.post('/api/projects', form);
      }
      setForm({ name: '', description: '' });
      setShowForm(false);
      setEditingId(null);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save project');
    }
  };

  const handleEdit = (project: any) => {
    setForm({ name: project.name, description: project.description || '' });
    setEditingId(project.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await api.delete(`/api/projects/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignUser = async (projectId: string, userId: string) => {
    try {
      await api.post(`/api/projects/${projectId}/assign/${userId}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveUser = async (projectId: string, userId: string) => {
    try {
      await api.delete(`/api/projects/${projectId}/remove/${userId}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 transition text-sm">
              ← Back
            </button>
            <span className="text-gray-300">|</span>
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">W</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">Projects & Categories</span>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', description: '' }); }}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Projects & Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Manage work categories and assign team members</p>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Project' : 'Create New Project'}
            </h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name</label>
                <input
                  type="text" required placeholder="e.g. Client A, Internal Tooling..."
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea rows={2} placeholder="Brief description..."
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition">
                  {editingId ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <p className="text-4xl mb-3">📁</p>
            <p className="text-gray-900 font-medium">No projects yet</p>
            <p className="text-gray-400 text-sm mt-1">Create your first project to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const assignedIds = project.userProjects?.map((up: any) => up.user?.id) || [];
              const unassigned = users.filter(u => u.role?.name === 'TEAM_MEMBER' && !assignedIds.includes(u.id));

              return (
                <div key={project.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-gray-500 mt-1">{project.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(project)}
                        className="text-sm text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="text-sm text-red-600 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Assigned Members */}
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Team Members</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {project.userProjects?.length === 0 ? (
                        <p className="text-xs text-gray-400">No members assigned</p>
                      ) : (
                        project.userProjects?.map((up: any) => (
                          <div key={up.user?.id} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                            <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">{up.user?.name?.charAt(0)}</span>
                            </div>
                            <span className="text-xs font-medium text-gray-700">{up.user?.name}</span>
                            <button
                              onClick={() => handleRemoveUser(project.id, up.user?.id)}
                              className="text-gray-400 hover:text-red-500 transition text-xs ml-1"
                            >
                              ×
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Assign dropdown */}
                    {unassigned.length > 0 && (
                      <select
                        onChange={(e) => { if (e.target.value) handleAssignUser(project.id, e.target.value); e.target.value = ''; }}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                        defaultValue=""
                      >
                        <option value="">+ Assign member...</option>
                        {unassigned.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}