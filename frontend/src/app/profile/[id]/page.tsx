'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'MANAGER') { router.push('/reports'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [usersRes, reportsRes] = await Promise.all([
        api.get('/api/users'),
        api.get(`/api/reports/all?userId=${id}`),
      ]);
      const found = usersRes.data.find((u: any) => u.id === id);
      setProfile(found);
      setReports(reportsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

  const stats = {
    total: reports.length,
    approved: reports.filter(r => r.status === 'APPROVED').length,
    submitted: reports.filter(r => r.status === 'SUBMITTED').length,
    needsCorrection: reports.filter(r => r.status === 'NEEDS_CORRECTION').length,
    draft: reports.filter(r => r.status === 'DRAFT').length,
  };

  const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">User not found</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/users')} className="text-gray-400 hover:text-gray-600 transition text-sm">
              ← Back
            </button>
            <span className="text-gray-300">|</span>
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">W</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">Member Profile</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{profile.name?.charAt(0)}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{profile.name}</h1>
              <p className="text-gray-500 text-sm">{profile.email}</p>
              <span className="mt-1 inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                Team Member
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Total Reports', value: stats.total, color: 'text-gray-900' },
            { label: 'Approved', value: stats.approved, color: 'text-emerald-600' },
            { label: 'Submitted', value: stats.submitted, color: 'text-blue-600' },
            { label: 'Needs Correction', value: stats.needsCorrection, color: 'text-amber-600' },
            { label: 'Approval Rate', value: `${approvalRate}%`, color: approvalRate >= 70 ? 'text-emerald-600' : 'text-amber-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Reports History */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Report History</h2>
            <p className="text-xs text-gray-400 mt-0.5">{reports.length} total reports</p>
          </div>
          <div className="divide-y divide-gray-50">
            {reports.length === 0 ? (
              <p className="px-6 py-12 text-center text-gray-400 text-sm">No reports submitted yet</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-base">
                      {report.status === 'APPROVED' ? '✅' : report.status === 'NEEDS_CORRECTION' ? '⚠️' : report.status === 'SUBMITTED' ? '📤' : '📝'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Week of {new Date(report.weekStart).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(report.status)}`}>
                          {report.status.replace(/_/g, ' ')}
                        </span>
                        {report.project && (
                          <span className="text-xs text-gray-400">• {report.project.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/reports/${report.id}`)}
                    className="text-sm text-gray-500 hover:text-gray-900 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  >
                    View →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}