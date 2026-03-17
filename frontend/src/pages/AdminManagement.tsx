import { useEffect, useState } from 'react';
import {
  HiOutlineShieldCheck, HiOutlineShieldExclamation, HiOutlinePlus, HiOutlineX,
  HiOutlineSearch, HiOutlineArrowUp, HiOutlineArrowDown,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getUsers, assignRoles, createUser } from '../api/users';
import { getRoles } from '../api/roles';
import { getAttributesByFormType } from '../api/attributes';
import type { User, Role, FormAttribute } from '../types';

export default function AdminManagement() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create admin
  const [showCreate, setShowCreate] = useState(false);
  const [createFields, setCreateFields] = useState<FormAttribute[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedAdminRole, setSelectedAdminRole] = useState<string>('ADMIN');

  // Promote non-admin
  const [showPromote, setShowPromote] = useState(false);
  const [promoteSearch, setPromoteSearch] = useState('');
  const [promoteTarget, setPromoteTarget] = useState<User | null>(null);
  const [promoteRole, setPromoteRole] = useState<string>('ADMIN');

  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [regularUsers, setRegularUsers] = useState<User[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adminRes, allRes, rolesRes] = await Promise.all([
        getUsers(0, 100, search || undefined, 'admin'),
        getUsers(0, 100, undefined),
        getRoles(),
      ]);
      setAdminUsers(adminRes.data.content);
      setAllUsers(allRes.data.content);
      setRoles(rolesRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegularUsers = async () => {
    try {
      const res = await getUsers(0, 100, promoteSearch || undefined, 'regular');
      setRegularUsers(res.data.content);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchData(); }, [search]);
  useEffect(() => {
    getAttributesByFormType('USER_CREATE').then((res) => setCreateFields(res.data));
  }, []);
  useEffect(() => {
    if (showPromote) fetchRegularUsers();
  }, [showPromote, promoteSearch]);

  const handleDemote = async (user: User, roleName: string) => {
    const role = roles.find((r) => r.name === roleName);
    if (!role) return;
    const currentRoleIds = roles.filter((r) => user.roles.includes(r.name)).map((r) => r.id);
    const newRoleIds = currentRoleIds.filter((id) => id !== role.id);
    if (newRoleIds.length === 0) {
      const userRole = roles.find((r) => r.name === 'USER');
      if (userRole) newRoleIds.push(userRole.id);
    }
    try {
      await assignRoles(user.id, newRoleIds);
      toast.success(`${roleName} removed from ${user.firstName}`);
      fetchData();
    } catch { toast.error('Failed to demote'); }
  };

  const handlePromote = async () => {
    if (!promoteTarget) return;
    const role = roles.find((r) => r.name === promoteRole);
    if (!role) return;
    const currentRoleIds = roles.filter((r) => promoteTarget.roles.includes(r.name)).map((r) => r.id);
    const newRoleIds = [...new Set([...currentRoleIds, role.id])];
    try {
      await assignRoles(promoteTarget.id, newRoleIds);
      toast.success(`${promoteTarget.firstName} promoted to ${promoteRole}`);
      setShowPromote(false);
      setPromoteTarget(null);
      fetchData();
    } catch { toast.error('Failed to promote'); }
  };

  const handleCreateAdmin = async () => {
    for (const field of createFields) {
      if (field.required && !formValues[field.fieldName]?.trim()) {
        toast.error(`${field.label} is required`);
        return;
      }
    }
    const adminRole = roles.find((r) => r.name === selectedAdminRole);
    if (!adminRole) { toast.error('Role not found'); return; }

    try {
      await createUser({
        firstName: formValues.firstName || '',
        lastName: formValues.lastName || '',
        email: formValues.email || '',
        password: formValues.password || '',
      }, [adminRole.id]);
      toast.success(`Admin user created with ${selectedAdminRole} role`);
      setShowCreate(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    }
  };

  const openCreateAdmin = () => {
    const defaults: Record<string, string> = {};
    createFields.forEach((f) => { defaults[f.fieldName] = f.defaultValue || ''; });
    setFormValues(defaults);
    setSelectedAdminRole('ADMIN');
    setShowCreate(true);
  };

  const highestRole = (user: User) => {
    if (user.roles.includes('SUPER_ADMIN')) return 'SUPER_ADMIN';
    if (user.roles.includes('ADMIN')) return 'ADMIN';
    return user.roles[0] || 'USER';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Management</h1>
          <p className="text-gray-500 text-sm mt-1">Create admin users, promote and demote access levels</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setShowPromote(true); setPromoteTarget(null); setPromoteSearch(''); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
            <HiOutlineArrowUp /> Promote User
          </button>
          <button onClick={openCreateAdmin}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <HiOutlinePlus /> Create Admin
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-600/10 flex items-center justify-center">
              <HiOutlineShieldCheck className="text-amber-400 text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {allUsers.filter((u) => u.roles.includes('SUPER_ADMIN')).length}
              </p>
              <p className="text-gray-500 text-xs">Super Admins</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600/10 flex items-center justify-center">
              <HiOutlineShieldCheck className="text-purple-400 text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {allUsers.filter((u) => u.roles.includes('ADMIN') && !u.roles.includes('SUPER_ADMIN')).length}
              </p>
              <p className="text-gray-500 text-xs">Admins</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center">
              <HiOutlineShieldExclamation className="text-blue-400 text-xl" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {allUsers.filter((u) => !u.roles.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN')).length}
              </p>
              <p className="text-gray-500 text-xs">Regular Users</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-64">
        <HiOutlineSearch className="absolute left-3 top-3 text-gray-500" />
        <input type="text" value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search admins..."
          className="pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition w-full" />
      </div>

      {/* Admin Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="grid gap-3">
          {adminUsers.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-600">
              No admin users found
            </div>
          )}
          {adminUsers.map((user) => (
            <div key={user.id} className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                  user.roles.includes('SUPER_ADMIN') ? 'bg-amber-600' : 'bg-purple-600'
                }`}>
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                      highestRole(user) === 'SUPER_ADMIN'
                        ? 'bg-amber-600/10 text-amber-400 border-amber-600/20'
                        : 'bg-purple-600/10 text-purple-400 border-purple-600/20'
                    }`}>
                      {highestRole(user)}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${user.enabled ? 'text-green-400' : 'text-red-400'}`}>
                  {user.enabled ? 'Active' : 'Inactive'}
                </span>
                {!user.roles.includes('SUPER_ADMIN') && (
                  <button onClick={() => handleDemote(user, 'ADMIN')}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 text-gray-400 rounded-lg hover:text-red-400 hover:bg-red-600/10 transition">
                    <HiOutlineArrowDown className="text-sm" /> Demote
                  </button>
                )}
                {user.roles.includes('ADMIN') && !user.roles.includes('SUPER_ADMIN') && (
                  <button onClick={() => {
                    const saRole = roles.find((r) => r.name === 'SUPER_ADMIN');
                    if (!saRole) return;
                    const ids = roles.filter((r) => user.roles.includes(r.name)).map((r) => r.id);
                    assignRoles(user.id, [...new Set([...ids, saRole.id])]).then(() => {
                      toast.success('Upgraded to SUPER_ADMIN');
                      fetchData();
                    });
                  }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-800 text-gray-400 rounded-lg hover:text-amber-400 hover:bg-amber-600/10 transition">
                    <HiOutlineArrowUp className="text-sm" /> Upgrade
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Promote User Modal */}
      {showPromote && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Promote User to Admin</h2>
              <button onClick={() => setShowPromote(false)} className="text-gray-400 hover:text-white">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {!promoteTarget ? (
                <>
                  <div className="relative">
                    <HiOutlineSearch className="absolute left-3 top-3 text-gray-500" />
                    <input type="text" value={promoteSearch}
                      onChange={(e) => setPromoteSearch(e.target.value)}
                      placeholder="Search non-admin users..."
                      className="pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition w-full" />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1">
                    {regularUsers.map((user) => (
                      <button key={user.id} onClick={() => setPromoteTarget(user)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition text-left">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="text-white text-sm">{user.firstName} {user.lastName}</p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                      </button>
                    ))}
                    {regularUsers.length === 0 && (
                      <p className="text-gray-600 text-sm text-center py-4">No regular users found</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                      {promoteTarget.firstName[0]}{promoteTarget.lastName[0]}
                    </div>
                    <div>
                      <p className="text-white font-medium">{promoteTarget.firstName} {promoteTarget.lastName}</p>
                      <p className="text-gray-500 text-sm">{promoteTarget.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Select Admin Role</label>
                    <div className="space-y-2">
                      {['ADMIN', 'SUPER_ADMIN'].map((rn) => (
                        <label key={rn}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition ${
                            promoteRole === rn ? 'border-blue-500 bg-blue-600/5' : 'border-gray-700 hover:bg-gray-800'
                          }`}>
                          <input type="radio" name="promoteRole" value={rn}
                            checked={promoteRole === rn}
                            onChange={() => setPromoteRole(rn)}
                            className="accent-blue-600" />
                          <div>
                            <span className={`text-sm font-medium ${
                              rn === 'SUPER_ADMIN' ? 'text-amber-400' : 'text-purple-400'
                            }`}>{rn}</span>
                            <p className="text-gray-500 text-xs">
                              {rn === 'ADMIN' ? 'User & role management, audit access' : 'Full system access — all permissions'}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setPromoteTarget(null)}
                      className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition">
                      Back
                    </button>
                    <button onClick={handlePromote}
                      className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
                      Promote
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Create Admin User</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {createFields.map((field) => {
                const value = formValues[field.fieldName] || '';
                return (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      {field.label} {field.required && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type={field.fieldType === 'PASSWORD' ? 'password' : field.fieldType === 'EMAIL' ? 'email' : 'text'}
                      value={value}
                      onChange={(e) => setFormValues({ ...formValues, [field.fieldName]: e.target.value })}
                      placeholder={field.placeholder || ''}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition" />
                  </div>
                );
              })}
              <div className="border-t border-gray-800 pt-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Admin Role</label>
                <div className="space-y-2">
                  {['ADMIN', 'SUPER_ADMIN'].map((rn) => (
                    <label key={rn}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition ${
                        selectedAdminRole === rn ? 'border-blue-500 bg-blue-600/5' : 'border-gray-700 hover:bg-gray-800'
                      }`}>
                      <input type="radio" name="adminRole" value={rn}
                        checked={selectedAdminRole === rn}
                        onChange={() => setSelectedAdminRole(rn)}
                        className="accent-blue-600" />
                      <span className={`text-sm font-medium ${
                        rn === 'SUPER_ADMIN' ? 'text-amber-400' : 'text-purple-400'
                      }`}>{rn}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-800">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleCreateAdmin}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Create Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
