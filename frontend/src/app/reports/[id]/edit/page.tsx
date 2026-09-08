'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const TASK_TYPES = ['Development', 'Testing', 'Meetings', 'Documentation', 'Design', 'Other'];
const STATUSES = ['Not Started', 'In Progress', 'Completed', 'Blocked'];

export default function EditReportPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setLoading2] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');

  const [formData, setFormData] = useState({
    notes: '',
    links: '',
    tasks: [] as any[],
    plannedTasks: [] as any[],
    blockers: [] as any[],
    achievements: [] as any[],
    hoursBreakdown: [] as any[],
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchReport();
  }, [user]);

  const fetchReport = async () => {
    try {
      const { data } = await api.get(`/api/reports/${id}`);
      setReport(data);
      if (data.versions?.length > 0) {
        const latest = data.versions[data.versions.length - 1];
        setFormData({
          notes: latest.notes || '',
          links: latest.links || '',
          tasks: latest.tasks || [],
          plannedTasks: latest.plannedTasks || [],
          blockers: latest.blockers || [],
          achievements: latest.achievements || [],
          hoursBreakdown: latest.hoursBreakdown?.length > 0 ? latest.hoursBreakdown : TASK_TYPES.map(t => ({ taskType: t, hours: 0 })),
        });
      } else {
        setFormData(prev => ({
          ...prev,
          hoursBreakdown: TASK_TYPES.map(t => ({ taskType: t, hours: 0 })),
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTask = () => {
    setFormData(prev => ({
      ...prev,
      tasks: [...prev.tasks, { name: '', priority: 'MEDIUM', plannedPct: 0, actualPct: 0, status: 'In Progress', timePlanned: 0, timeSpent: 0, deliverable: '' }],
    }));
  };

  const updateTask = (i: number, field: string, value: any) => {
    setFormData(prev => {
      const tasks = [...prev.tasks];
      tasks[i] = { ...tasks[i], [field]: value };
      return { ...prev, tasks };
    });
  };

  const removeTask = (i: number) => {
    setFormData(prev => ({ ...prev, tasks: prev.tasks.filter((_, idx) => idx !== i) }));
  };

  const addPlannedTask = () => {
    setFormData(prev => ({ ...prev, plannedTasks: [...prev.plannedTasks, { taskName: '', priority: 'MEDIUM', description: '' }] }));
  };

  const updatePlannedTask = (i: number, field: string, value: any) => {
    setFormData(prev => {
      const plannedTasks = [...prev.plannedTasks];
      plannedTasks[i] = { ...plannedTasks[i], [field]: value };
      return { ...prev, plannedTasks };
    });
  };

  const removePlannedTask = (i: number) => {
    setFormData(prev => ({ ...prev, plannedTasks: prev.plannedTasks.filter((_, idx) => idx !== i) }));
  };

  const addBlocker = () => {
    setFormData(prev => ({ ...prev, blockers: [...prev.blockers, { description: '', isKeyIssue: false }] }));
  };

  const updateBlocker = (i: number, field: string, value: any) => {
    setFormData(prev => {
      const blockers = [...prev.blockers];
      if (field === 'isKeyIssue' && value === true) {
        blockers.forEach((b, idx) => { if (idx !== i) b.isKeyIssue = false; });
      }
      blockers[i] = { ...blockers[i], [field]: value };
      return { ...prev, blockers };
    });
  };

  const removeBlocker = (i: number) => {
    setFormData(prev => ({ ...prev, blockers: prev.blockers.filter((_, idx) => idx !== i) }));
  };

  const addAchievement = () => {
    setFormData(prev => ({ ...prev, achievements: [...prev.achievements, { description: '', isKeyAchievement: false }] }));
  };

  const updateAchievement = (i: number, field: string, value: any) => {
    setFormData(prev => {
      const achievements = [...prev.achievements];
      if (field === 'isKeyAchievement' && value === true) {
        achievements.forEach((a, idx) => { if (idx !== i) a.isKeyAchievement = false; });
      }
      achievements[i] = { ...achievements[i], [field]: value };
      return { ...prev, achievements };
    });
  };

  const removeAchievement = (i: number) => {
    setFormData(prev => ({ ...prev, achievements: prev.achievements.filter((_, idx) => idx !== i) }));
  };

  const updateHours = (i: number, hours: number) => {
    setFormData(prev => {
      const hoursBreakdown = [...prev.hoursBreakdown];
      hoursBreakdown[i] = { ...hoursBreakdown[i], hours };
      return { ...prev, hoursBreakdown };
    });
  };

  const handleSaveDraft = async () => {
    setLoading2(true);
    setError('');
    try {
      await api.post(`/api/reports/${id}/submit`, {
        ...formData,
        tasks: formData.tasks.map(t => ({ ...t, plannedPct: Number(t.plannedPct), actualPct: Number(t.actualPct), timePlanned: Number(t.timePlanned), timeSpent: Number(t.timeSpent) })),
        hoursBreakdown: formData.hoursBreakdown.filter(h => h.hours > 0),
      });
      router.push('/reports');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading2(false);
    }
  };

  const tabs = [
    { id: 'tasks', label: '✅ Tasks Completed' },
    { id: 'planned', label: '📅 Next Week' },
    { id: 'blockers', label: '🚧 Blockers' },
    { id: 'achievements', label: '🏆 Achievements' },
    { id: 'hours', label: '⏱ Hours' },
    { id: 'notes', label: '📝 Notes' },
  ];

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
            <button onClick={() => router.push('/reports')} className="text-gray-400 hover:text-gray-600 transition">
              ← Back
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-900">Edit Report</span>
            {report && (
              <span className="text-xs text-gray-400">
                Week of {new Date(report.weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {error && <p className="text-red-600 text-xs">{error}</p>}
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Submit for Review →'}
            </button>
          </div>
        </div>
      </nav>

      {/* Manager Comment (if needs correction) */}
      {report?.status === 'NEEDS_CORRECTION' && report?.versions?.length > 0 && (
        <div className="max-w-5xl mx-auto px-6 pt-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Manager requested changes</p>
            {report.versions[report.versions.length - 1]?.reviewComments?.map((c: any, i: number) => (
              <p key={i} className="text-sm text-amber-700">{c.comment}</p>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tasks Completed */}
        {activeTab === 'tasks' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Tasks Completed This Week</h2>
              <button onClick={addTask} className="text-sm text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                + Add Task
              </button>
            </div>
            {formData.tasks.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No tasks yet. Click "Add Task" to get started.</p>
            ) : (
              <div className="space-y-4">
                {formData.tasks.map((task, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Task Name</label>
                        <input
                          type="text" placeholder="Task description..."
                          value={task.name} onChange={(e) => updateTask(i, 'name', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                        <select value={task.priority} onChange={(e) => updateTask(i, 'priority', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Planned %</label>
                        <input type="number" min="0" max="100"
                          value={task.plannedPct} onChange={(e) => updateTask(i, 'plannedPct', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Actual %</label>
                        <input type="number" min="0" max="100"
                          value={task.actualPct} onChange={(e) => updateTask(i, 'actualPct', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Time Planned (h)</label>
                        <input type="number" min="0"
                          value={task.timePlanned} onChange={(e) => updateTask(i, 'timePlanned', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Time Spent (h)</label>
                        <input type="number" min="0"
                          value={task.timeSpent} onChange={(e) => updateTask(i, 'timeSpent', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                        <select value={task.status} onChange={(e) => updateTask(i, 'status', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                          {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Deliverable / Output</label>
                        <input type="text" placeholder="What was produced?"
                          value={task.deliverable} onChange={(e) => updateTask(i, 'deliverable', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <button onClick={() => removeTask(i)} className="text-xs text-red-500 hover:text-red-700 transition">
                        Remove task
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Planned Tasks */}
        {activeTab === 'planned' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Tasks Planned for Next Week</h2>
              <button onClick={addPlannedTask} className="text-sm text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                + Add Task
              </button>
            </div>
            {formData.plannedTasks.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No planned tasks yet.</p>
            ) : (
              <div className="space-y-3">
                {formData.plannedTasks.map((task, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Task Name</label>
                        <input type="text" placeholder="Task name..."
                          value={task.taskName} onChange={(e) => updatePlannedTask(i, 'taskName', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                        <select value={task.priority} onChange={(e) => updatePlannedTask(i, 'priority', e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                          {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                      <textarea rows={2} placeholder="Brief description..."
                        value={task.description} onChange={(e) => updatePlannedTask(i, 'description', e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
                    </div>
                    <div className="flex justify-end mt-2">
                      <button onClick={() => removePlannedTask(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Blockers */}
        {activeTab === 'blockers' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Blockers & Challenges</h2>
              <button onClick={addBlocker} className="text-sm text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                + Add Blocker
              </button>
            </div>
            {formData.blockers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No blockers this week. 🎉</p>
            ) : (
              <div className="space-y-3">
                {formData.blockers.map((blocker, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <textarea rows={2} placeholder="Describe the blocker..."
                      value={blocker.description} onChange={(e) => updateBlocker(i, 'description', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none mb-3" />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={blocker.isKeyIssue}
                          onChange={(e) => updateBlocker(i, 'isKeyIssue', e.target.checked)}
                          className="rounded" />
                        <span className="text-xs font-medium text-gray-600">🔑 Flag as key issue of the week</span>
                      </label>
                      <button onClick={() => removeBlocker(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Achievements */}
        {activeTab === 'achievements' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Achievements & Highlights</h2>
              <button onClick={addAchievement} className="text-sm text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition">
                + Add Achievement
              </button>
            </div>
            {formData.achievements.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No achievements added yet.</p>
            ) : (
              <div className="space-y-3">
                {formData.achievements.map((achievement, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <textarea rows={2} placeholder="Describe the achievement..."
                      value={achievement.description} onChange={(e) => updateAchievement(i, 'description', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none mb-3" />
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={achievement.isKeyAchievement}
                          onChange={(e) => updateAchievement(i, 'isKeyAchievement', e.target.checked)}
                          className="rounded" />
                        <span className="text-xs font-medium text-gray-600">⭐ Flag as key achievement of the week</span>
                      </label>
                      <button onClick={() => removeAchievement(i)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hours Breakdown */}
        {activeTab === 'hours' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Hours Worked by Task Type</h2>
            <div className="space-y-3">
              {formData.hoursBreakdown.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-36">
                    <p className="text-sm font-medium text-gray-700">{item.taskType}</p>
                  </div>
                  <input type="number" min="0" step="0.5"
                    value={item.hours} onChange={(e) => updateHours(i, Number(e.target.value))}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
                  <span className="text-sm text-gray-400">hours</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-gray-900 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((item.hours / 40) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm font-semibold text-gray-900">
                  Total: {formData.hoursBreakdown.reduce((sum, h) => sum + Number(h.hours), 0).toFixed(1)} hours
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {activeTab === 'notes' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Notes & Links</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
                <textarea rows={5} placeholder="Any additional notes or context..."
                  value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Links / References</label>
                <textarea rows={3} placeholder="Paste any relevant links..."
                  value={formData.links} onChange={(e) => setFormData(prev => ({ ...prev, links: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}