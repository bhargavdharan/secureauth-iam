import { useEffect, useState } from 'react';
import { HiOutlinePlus, HiOutlineClipboardCopy, HiOutlineTrash } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getApiKeys, createApiKey, revokeApiKey } from '../api/apikeys';
import type { ApiKey } from '../types';

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const fetchKeys = () => {
    setLoading(true);
    getApiKeys()
      .then((res) => setKeys(res.data))
      .catch(() => toast.error('Failed to load API keys'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    try {
      const { data } = await createApiKey({ name: newKeyName });
      setCreatedKey(data.key ?? null);
      setNewKeyName('');
      fetchKeys();
      toast.success('API key created');
    } catch { toast.error('Failed to create API key'); }
  };

  const handleRevoke = async (id: number) => {
    try {
      await revokeApiKey(id);
      toast.success('API key revoked');
      fetchKeys();
    } catch { toast.error('Failed to revoke API key'); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">API Keys</h1>
        <button onClick={() => { setShowCreate(true); setCreatedKey(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <HiOutlinePlus /> Generate Key
        </button>
      </div>

      {createdKey && (
        <div className="bg-green-600/10 border border-green-600/20 rounded-xl p-4">
          <p className="text-green-400 text-sm font-medium mb-2">New API Key Created — Copy it now, it won't be shown again!</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-800 px-4 py-2 rounded-lg text-green-300 text-sm font-mono break-all">{createdKey}</code>
            <button onClick={() => copyToClipboard(createdKey)}
              className="p-2 text-green-400 hover:bg-gray-800 rounded-lg transition">
              <HiOutlineClipboardCopy className="text-xl" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Name</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Prefix</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Created</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Expires</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No API keys yet</td></tr>
            ) : (
              keys.map((key) => (
                <tr key={key.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-6 py-4 text-white text-sm font-medium">{key.name}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm font-mono">sa_{key.prefix}...</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${key.active ? 'bg-green-600/10 text-green-400' : 'bg-red-600/10 text-red-400'}`}>
                      {key.active ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{new Date(key.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : 'Never'}</td>
                  <td className="px-6 py-4 text-right">
                    {key.active && (
                      <button onClick={() => handleRevoke(key.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition" title="Revoke">
                        <HiOutlineTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Generate API Key</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Key Name</label>
                <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                  placeholder="e.g., Production API" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition">Cancel</button>
                <button onClick={() => { handleCreate(); setShowCreate(false); }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Generate</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
