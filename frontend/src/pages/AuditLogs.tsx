import { useEffect, useState } from 'react';
import { HiOutlineFilter, HiOutlineDocumentDownload } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getAuditLogs } from '../api/audit';
import type { AuditLog } from '../types';

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN: 'bg-blue-600/10 text-blue-400',
  USER_REGISTERED: 'bg-green-600/10 text-green-400',
  USER_UPDATED: 'bg-yellow-600/10 text-yellow-400',
  USER_ENABLED: 'bg-green-600/10 text-green-400',
  USER_DISABLED: 'bg-red-600/10 text-red-400',
  ROLES_ASSIGNED: 'bg-purple-600/10 text-purple-400',
  PASSWORD_CHANGED: 'bg-orange-600/10 text-orange-400',
  MFA_ENABLED: 'bg-green-600/10 text-green-400',
  MFA_DISABLED: 'bg-red-600/10 text-red-400',
  API_KEY_CREATED: 'bg-cyan-600/10 text-cyan-400',
  API_KEY_REVOKED: 'bg-red-600/10 text-red-400',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    getAuditLogs({ page, size: 15, action: actionFilter || undefined })
      .then((res) => {
        setLogs(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => toast.error('Failed to load audit logs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [page, actionFilter]);

  const exportLogs = () => {
    const csv = [
      'ID,User ID,Action,Resource,Details,IP Address,Timestamp',
      ...logs.map((l) => `${l.id},${l.userId},${l.action},${l.resource},"${l.details}",${l.ipAddress},${l.timestamp}`),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <HiOutlineFilter className="absolute left-3 top-3 text-gray-500" />
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
              className="pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition appearance-none"
            >
              <option value="">All Actions</option>
              <option value="USER_LOGIN">Login</option>
              <option value="USER_REGISTERED">Registration</option>
              <option value="USER_UPDATED">User Update</option>
              <option value="ROLES_ASSIGNED">Role Assignment</option>
              <option value="PASSWORD_CHANGED">Password Change</option>
              <option value="MFA_ENABLED">MFA Enabled</option>
              <option value="API_KEY_CREATED">API Key Created</option>
              <option value="API_KEY_REVOKED">API Key Revoked</option>
            </select>
          </div>
          <button onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-gray-400 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-white transition">
            <HiOutlineDocumentDownload />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Timestamp</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Action</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Resource</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Details</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">IP Address</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">User ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No audit logs found</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-6 py-4 text-gray-400 text-sm whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-600/10 text-gray-400'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{log.resource}</td>
                  <td className="px-6 py-4 text-gray-300 text-sm max-w-xs truncate">{log.details}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm font-mono">{log.ipAddress}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{log.userId}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-800">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">Previous</button>
            <span className="text-gray-500 text-sm">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
