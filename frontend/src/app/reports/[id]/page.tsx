'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function ReportDetailPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { id } = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeVersion, setActiveVersion] = useState(0);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    fetchReport();
  }, [user]);

  const fetchReport = async () => {
    try {
      const { data } = await api.get(`/api/reports/${id}`);
      setReport(data);
      setActiveVersion(data.versions?.length - 1 || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action: string) => {
    if (action === 'REQUEST_CHANGES' && !comment.trim()) {
      alert('Please add a comment explaining what needs to change.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/api/reports/${id}/review`, { action, comment });
      await fetchReport();
      setReviewing(false);
      setComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
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

  const getPriorityStyle = (priority: string) => {
    const styles: any = {
      HIGH: 'bg-red-100 text-red-700',
      MEDIUM: 'bg-yellow-100 text-yellow-700',
      LOW: 'bg-green-100 text-green-700',
    };
    return styles[priority] || 'bg-gray-100 text-gray-600';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!report) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Report not found</p>
    </div>
  );

  const currentVersion = report.versions?.[activeVersion];
  const isManager = user?.role === 'MANAGER';
  const canReview = isManager && report.status === 'SUBMITTED';
  const canEdit = !isManager && ['DRAFT', 'NEEDS_CORRECTION'].includes(report.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(isManager ? '/dashboard' : '/reports')}
              className="text-gray-400 hover:text-gray-600 transition text-sm"
            >
              ← Back
            </button>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-semibold text-gray-900">Report Detail</span>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                onClick={() => router.push(`/reports/${id}/edit`)}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
              >
                Edit Report
              </button>
            )}
            {canReview && !reviewing && (
              <button
                onClick={() => setReviewing(true)}
                className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
              >
                Review Report
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Report Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Week of {new Date(report.weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(report.status)}`}>
                  {report.status.replace(/_/g, ' ')}
                </span>
                {report.project && (
                  <span className="text-sm text-gray-500">📁 {report.project.name}</span>
                )}
                {isManager && (
                  <span className="text-sm text-gray-500">👤 {report.user?.name}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Versions: {report.versions?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Manager Comment Banner */}
        {report.status === 'NEEDS_CORRECTION' && currentVersion?.reviewComments?.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm font-semibold text-amber-800 mb-2">⚠️ Manager requested changes</p>
            {currentVersion.reviewComments.map((c: any, i: number) => (
              <div key={i} className="text-sm text-amber-700">
                <p>"{c.comment}"</p>
                <p className="text-xs text-amber-500 mt-1">— {c.manager?.name} · {new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* Review Panel */}
        {reviewing && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Review This Report</h2>
            <textarea
              rows={3}
              placeholder="Add a comment (required if requesting changes)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleReview('APPROVE')}
                disabled={submitting}
                className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => handleReview('REQUEST_CHANGES')}
                disabled={submitting}
                className="bg-amber-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition disabled:opacity-50"
              >
                ⚠️ Request Changes
              </button>
              <button
                onClick={() => { setReviewing(false); setComment(''); }}
                className="text-gray-500 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Version Tabs */}
        {report.versions?.length > 1 && (
          <div className="flex gap-2 mb-4">
            {report.versions.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setActiveVersion(i)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  activeVersion === i ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                Version {i + 1} {i === report.versions.length - 1 ? '(Latest)' : ''}
              </button>
            ))}
          </div>
        )}

        {currentVersion ? (
          <div className="space-y-6">
            {/* Tasks */}
            {currentVersion.tasks?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">✅ Tasks Completed</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 rounded-lg">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Task</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Priority</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Planned%</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Actual%</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Time P/S</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Deliverable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {currentVersion.tasks.map((task: any, i: number) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-3 text-sm text-gray-900">{task.name}</td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityStyle(task.priority)}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-600">{task.plannedPct}%</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{task.actualPct}%</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{task.status}</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{task.timePlanned}h / {task.timeSpent}h</td>
                          <td className="px-3 py-3 text-sm text-gray-600">{task.deliverable || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Planned Tasks */}
            {currentVersion.plannedTasks?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">📅 Tasks Planned for Next Week</h2>
                <div className="space-y-3">
                  {currentVersion.plannedTasks.map((task: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${getPriorityStyle(task.priority)}`}>
                        {task.priority}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{task.taskName}</p>
                        {task.description && <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blockers */}
            {currentVersion.blockers?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">🚧 Blockers & Challenges</h2>
                <div className="space-y-3">
                  {currentVersion.blockers.map((blocker: any, i: number) => (
                    <div key={i} className={`p-4 rounded-xl border ${blocker.isKeyIssue ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                      <p className="text-sm text-gray-800">{blocker.description}</p>
                      {blocker.isKeyIssue && (
                        <span className="text-xs font-semibold text-red-600 mt-1 block">🔑 Key Issue of the Week</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {currentVersion.achievements?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">🏆 Achievements & Highlights</h2>
                <div className="space-y-3">
                  {currentVersion.achievements.map((achievement: any, i: number) => (
                    <div key={i} className={`p-4 rounded-xl border ${achievement.isKeyAchievement ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                      <p className="text-sm text-gray-800">{achievement.description}</p>
                      {achievement.isKeyAchievement && (
                        <span className="text-xs font-semibold text-emerald-600 mt-1 block">⭐ Key Achievement of the Week</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hours Breakdown */}
            {currentVersion.hoursBreakdown?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">⏱ Hours Breakdown</h2>
                <div className="space-y-3">
                  {currentVersion.hoursBreakdown.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <p className="text-sm text-gray-700 w-32">{item.taskType}</p>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-gray-900 h-2 rounded-full"
                          style={{ width: `${Math.min((item.hours / 40) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-sm font-medium text-gray-900 w-16 text-right">{item.hours}h</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {(currentVersion.notes || currentVersion.links) && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">📝 Notes & Links</h2>
                {currentVersion.notes && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentVersion.notes}</p>
                  </div>
                )}
                {currentVersion.links && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Links</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentVersion.links}</p>
                  </div>
                )}
              </div>
            )}

            {/* Review History */}
            {currentVersion.reviewComments?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-4">💬 Review Comments</h2>
                <div className="space-y-3">
                  {currentVersion.reviewComments.map((c: any, i: number) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-sm text-gray-800">"{c.comment}"</p>
                      <p className="text-xs text-gray-400 mt-1">
                        — {c.manager?.name} · {new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <p className="text-gray-400 text-sm">No content submitted yet.</p>
            {canEdit && (
              <button
                onClick={() => router.push(`/reports/${id}/edit`)}
                className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
              >
                Start Editing →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}