'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import ChatWidget from '@/components/dashboard/ChatWidget';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
const [teamStatus, setTeamStatus] = useState<any[]>([]);
const [selectedSection, setSelectedSection] = useState('blockers');
const [sectionData, setSectionData] = useState([]);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (user.role !== 'MANAGER') { router.push('/reports'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, reportsRes, projectsRes] = await Promise.all([
        api.get('/api/reports/dashboard'),
        api.get('/api/reports/all'),
        api.get('/api/projects'),
      ]);
      setStats(statsRes.data);
      setReports(reportsRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); router.push('/login'); };

  const getStatusStyle = (status: string) => {
    const styles: any = {
      DRAFT: 'bg-gray-100 text-gray-600',
      SUBMITTED: 'bg-blue-100 text-blue-700',
      NEEDS_CORRECTION: 'bg-amber-100 text-amber-700',
      APPROVED: 'bg-emerald-100 text-emerald-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-600';
  };

  const filteredReports = reports.filter(r => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterUser && !r.user?.name.toLowerCase().includes(filterUser.toLowerCase())) return false;
    if (filterProject && r.projectId !== filterProject) return false;
    if (filterStartDate && new Date(r.weekStart) < new Date(filterStartDate)) return false;
    if (filterEndDate && new Date(r.weekEnd) > new Date(filterEndDate)) return false;
    return true;
  });

  // Chart data
  const statusChartData = [
    { name: 'Submitted', value: stats?.totalSubmitted || 0, color: '#3b82f6' },
    { name: 'Needs Correction', value: stats?.needsCorrection || 0, color: '#f59e0b' },
    { name: 'Approved', value: stats?.approved || 0, color: '#10b981' },
  ];

  const memberChartData = Object.values(
    reports.reduce((acc: any, r) => {
      const name = r.user?.name?.split(' ')[0] || 'Unknown';
      if (!acc[name]) acc[name] = { name, total: 0, approved: 0 };
      acc[name].total++;
      if (r.status === 'APPROVED') acc[name].approved++;
      return acc;
    }, {})
  );

  const fetchTeamStatus = async (weekStart: string) => {
  if (!weekStart) return;
  try {
    const { data } = await api.get(`/api/reports/team-status?weekStart=${weekStart}`);
    setTeamStatus(data);
  } catch (err) {
    console.error(err);
  }
};

const fetchSectionData = async (weekStart: string, section: string) => {
  try {
    const { data } = await api.get(`/api/reports/team-section?weekStart=${weekStart}&section=${section}`);
    setSectionData(data);
  } catch (err) {
    console.error(err);
  }
};

useEffect(() => {
  if (selectedWeek) {
    fetchTeamStatus(selectedWeek);
    fetchSectionData(selectedWeek, selectedSection);
  }
}, [selectedWeek]);

useEffect(() => {
  if (selectedWeek) fetchSectionData(selectedWeek, selectedSection);
}, [selectedSection]);


  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">W</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">WeeklyReport</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">Manager Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/projects')}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              Projects
            </button>
            <button
              onClick={() => router.push('/users')}
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              Users
            </button>
            <div className="w-px h-5 bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">{user?.name?.charAt(0)}</span>
              </div>
              <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Team Overview</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor your team's weekly reports and progress</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Submitted', value: stats?.totalSubmitted || 0, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: '📋' },
            { label: 'Needs Correction', value: stats?.needsCorrection || 0, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: '⚠️' },
            { label: 'Approved', value: stats?.approved || 0, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: '✅' },
            { label: 'Open Blockers', value: stats?.openBlockers || 0, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100', icon: '🚧' },
          ].map((stat) => (
            <div key={stat.label} className={`bg-white rounded-xl border ${stat.border} p-5`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                <span className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center text-sm`}>{stat.icon}</span>
              </div>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Report Status Distribution</h3>
            {statusChartData.every(d => d.value === 0) ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {statusChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Reports by Team Member</h3>
            {memberChartData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={memberChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#111827" radius={[4, 4, 0, 0]} name="Total" />
                  <Bar dataKey="approved" fill="#10b981" radius={[4, 4, 0, 0]} name="Approved" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* New Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Time by Task Type */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Time Spent by Task Type</h3>
            {(!stats?.timeByTaskType || stats.timeByTaskType.length === 0) ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.timeByTaskType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="taskType" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Workload by Project */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Workload by Project</h3>
            {(!stats?.workloadByProject || stats.workloadByProject.length === 0) ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.workloadByProject}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="project" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Reports" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Compliance Rate */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Submission Compliance</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500">Submitted</p>
              <p className="text-2xl font-bold text-emerald-600">{stats?.compliance?.submitted ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.compliance?.pending ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Late</p>
              <p className="text-2xl font-bold text-red-600">{stats?.compliance?.late ?? 0}</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Compliance rate: {stats?.compliance?.rate ?? 0}%</p>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(!stats?.activityFeed || stats.activityFeed.length === 0) ? (
              <p className="px-6 py-8 text-center text-gray-400 text-sm">No recent activity</p>
            ) : (
              stats.activityFeed.map((a: any) => (
                <div key={a.id} className="px-6 py-3 text-sm text-gray-600">
                  <span className="font-medium text-gray-900">{a.actorName}</span>{' '}
                  {a.status === 'APPROVED' ? 'approved' : a.status === 'NEEDS_CORRECTION' ? 'requested changes on' : 'updated'}{' '}
                  <span className="font-medium">{a.reportOwner}'s</span> report ({a.project})
                  <span className="text-gray-400 text-xs ml-2">
                    {new Date(a.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>


        {/* Team Status by Week */}
<div className="bg-white rounded-xl border border-gray-200 mb-8">
  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
    <h2 className="text-sm font-semibold text-gray-900">Team Status by Week</h2>
    <input
      type="date"
      value={selectedWeek}
      onChange={(e) => setSelectedWeek(e.target.value)}
      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
    />
  </div>
  {!selectedWeek ? (
    <p className="px-6 py-8 text-center text-gray-400 text-sm">Select a week's start date to view status</p>
  ) : teamStatus.length === 0 ? (
    <p className="px-6 py-8 text-center text-gray-400 text-sm">No team members found</p>
  ) : (
    <div className="divide-y divide-gray-50">
      {teamStatus.map((m: any) => (
        <div key={m.userId} className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{m.name?.charAt(0)}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{m.name}</p>
              <p className="text-xs text-gray-400">{m.project || 'No project'}</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            m.status === 'NOT_STARTED' ? 'bg-gray-100 text-gray-500' : getStatusStyle(m.status)
          }`}>
            {m.status === 'NOT_STARTED' ? 'NOT STARTED' : m.status.replace(/_/g, ' ')}
          </span>
        </div>
      ))}
    </div>
  )}
</div>


{/* Side-by-side Section View */}
{selectedWeek && (
  <div className="bg-white rounded-xl border border-gray-200 mb-8">
    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-gray-900">Team Section View</h2>
      <select
        value={selectedSection}
        onChange={(e) => setSelectedSection(e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      >
        <option value="blockers">Blockers</option>
        <option value="achievements">Achievements</option>
        <option value="nextWeekTasks">Next Week Tasks</option>
      </select>
    </div>

    {sectionData.length === 0 ? (
      <p className="px-6 py-8 text-center text-gray-400 text-sm">No submitted reports for this week</p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {sectionData.map((item: any) => (
          <div key={item.userId} className="border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-gray-900 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-semibold">{item.name?.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400">{item.project || 'No project'}</p>
              </div>
            </div>

            {selectedSection === 'blockers' && (
              <div className="space-y-2">
                {item.blockers?.length > 0 ? item.blockers.map((b: any, i: number) => (
                  <div key={i} className={`p-2.5 rounded-lg text-xs ${b.isKeyIssue ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                    {b.isKeyIssue && <span className="text-red-500 font-semibold text-xs block mb-1">⚠ Key Issue</span>}
                    <p className="text-gray-700">{b.description}</p>
                  </div>
                )) : <p className="text-xs text-gray-400 italic">No blockers</p>}
              </div>
            )}

            {selectedSection === 'achievements' && (
              <div className="space-y-2">
                {item.achievements?.length > 0 ? item.achievements.map((a: any, i: number) => (
                  <div key={i} className={`p-2.5 rounded-lg text-xs ${a.isKeyAchievement ? 'bg-green-50 border border-green-100' : 'bg-gray-50'}`}>
                    {a.isKeyAchievement && <span className="text-green-600 font-semibold text-xs block mb-1">★ Key Achievement</span>}
                    <p className="text-gray-700">{a.description}</p>
                  </div>
                )) : <p className="text-xs text-gray-400 italic">No achievements</p>}
              </div>
            )}

            {selectedSection === 'nextWeekTasks' && (
              <div className="space-y-2">
                {item.nextWeekTasks?.length > 0 ? item.nextWeekTasks.map((t: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg text-xs bg-gray-50">
                    <p className="text-gray-700">{t.description || t}</p>
                  </div>
                )) : <p className="text-xs text-gray-400 italic">No tasks planned</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}


        {/* Reports Table */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">All Reports</h2>
              <p className="text-xs text-gray-500 mt-0.5">{filteredReports.length} reports</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Search by name..."
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-40"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="NEEDS_CORRECTION">Needs Correction</option>
                <option value="APPROVED">Approved</option>
              </select>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">All Projects</option>
                {projects.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                title="From week starting"
              />
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                title="To week ending"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Member</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Week</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <p className="text-gray-400 text-sm">No reports found</p>
                      <p className="text-gray-300 text-xs mt-1">Reports will appear here once team members submit them</p>
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">{report.user?.name?.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{report.user?.name}</p>
                            <p className="text-xs text-gray-400">{report.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(report.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
                        {new Date(report.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{report.project?.name || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyle(report.status)}`}>
                          {report.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/reports/${report.id}`)}
                          className="text-sm font-medium text-gray-900 hover:underline"
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <ChatWidget />
    </div>
  );
}