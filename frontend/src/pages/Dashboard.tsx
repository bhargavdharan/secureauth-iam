import { useEffect, useState } from 'react';
import { HiOutlineUsers, HiOutlineShieldCheck, HiOutlineKey, HiOutlineClock } from 'react-icons/hi';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getStats } from '../api/dashboard';
import type { DashboardStats } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStats()
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: HiOutlineUsers, color: 'blue' },
    { label: 'Active Users', value: stats?.activeUsers ?? 0, icon: HiOutlineShieldCheck, color: 'green' },
    { label: 'Total Roles', value: stats?.totalRoles ?? 0, icon: HiOutlineKey, color: 'yellow' },
    { label: 'Recent Logins (24h)', value: stats?.recentLogins ?? 0, icon: HiOutlineClock, color: 'purple' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-600/10 text-blue-500 border-blue-600/20',
    green: 'bg-green-600/10 text-green-500 border-green-600/20',
    yellow: 'bg-yellow-600/10 text-yellow-500 border-yellow-600/20',
    purple: 'bg-purple-600/10 text-purple-500 border-purple-600/20',
  };

  const pieData = stats?.roleDistribution
    ? Object.entries(stats.roleDistribution).map(([name, value]) => ({ name, value }))
    : [];

  const barData = stats?.recentActivity?.reduce<Record<string, number>>((acc, a) => {
    const hour = new Date(a.timestamp).getHours();
    const key = `${hour}:00`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {}) ?? {};

  const barChartData = Object.entries(barData).map(([time, count]) => ({ time, count }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`rounded-xl border p-6 ${colorMap[card.color]}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
              <card.icon className="text-3xl opacity-50" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-white font-semibold mb-4">Role Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h3 className="text-white font-semibold mb-4">Activity Timeline</h3>
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData}>
                <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="text-white font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {stats?.recentActivity?.length ? (
            stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <span className="text-sm font-medium text-white">{activity.action}</span>
                  <span className="text-gray-500 text-sm ml-2">{activity.details}</span>
                </div>
                <span className="text-gray-600 text-xs">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
