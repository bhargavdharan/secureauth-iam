import { useEffect, useState } from 'react';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineX,
  HiOutlineShieldCheck, HiOutlineLockClosed,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getRoles, createRole, updateRole, deleteRole, getPermissions } from '../api/roles';
import type { Role, Permission } from '../types';

interface PermissionGroup {
  [category: string]: Permission[];
}

export default function Roles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<PermissionGroup>({});
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState<number | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([getRoles(), getPermissions()]);
      setRoles(rolesRes.data);
      setPermissions(permsRes.data);
    } catch {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingRole(null);
    setFormName('');
    setFormDescription('');
    setSelectedPermissions([]);
    setShowModal(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description);
    setSelectedPermissions(role.permissions.map((p) => p.id));
    setShowModal(true);
  };

  const togglePermission = (id: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleCategory = (category: string) => {
    const catPermIds = permissions[category].map((p) => p.id);
    const allSelected = catPermIds.every((id) => selectedPermissions.includes(id));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((id) => !catPermIds.includes(id)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...catPermIds])]);
    }
  };

  const handleSave = async () => {
    if (!formName.trim() || !formDescription.trim()) {
      toast.error('Name and description are required');
      return;
    }
    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: formName, description: formDescription, permissionIds: selectedPermissions,
        });
        toast.success('Role updated');
      } else {
        await createRole({
          name: formName, description: formDescription, permissionIds: selectedPermissions,
        });
        toast.success('Role created');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save role');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRole(deleteTarget.id);
      toast.success('Role deleted');
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const categoryLabel = (cat: string) =>
    cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Role Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage built-in and custom roles with granular permissions</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <HiOutlinePlus /> Create Role
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="grid gap-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div
                className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-800/30 transition"
                onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    role.builtIn ? 'bg-amber-600/10' : 'bg-blue-600/10'
                  }`}>
                    {role.builtIn
                      ? <HiOutlineLockClosed className="text-amber-400 text-xl" />
                      : <HiOutlineShieldCheck className="text-blue-400 text-xl" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">{role.name}</h3>
                      {role.builtIn && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-amber-600/10 text-amber-400 border border-amber-600/20 rounded">
                          Built-in
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm">{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-sm">{role.permissions.length} permissions</span>
                  {!role.builtIn && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(role); }}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition"
                        title="Edit role"
                      >
                        <HiOutlinePencil />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(role); }}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition"
                        title="Delete role"
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  )}
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${expandedRole === role.id ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {expandedRole === role.id && (
                <div className="border-t border-gray-800 px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((perm) => (
                      <span key={perm.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700"
                        title={perm.description}
                      >
                        {perm.name}
                      </span>
                    ))}
                    {role.permissions.length === 0 && (
                      <p className="text-gray-600 text-sm">No permissions assigned</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <HiOutlineX className="text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Role Name</label>
                  <input type="text" value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    placeholder="e.g. HELPDESK_AGENT" />
                  <p className="text-gray-600 text-xs mt-1">Will be auto-uppercased</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <input type="text" value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                    placeholder="Brief description of the role" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">
                  Permissions ({selectedPermissions.length} selected)
                </h3>
                <div className="space-y-4">
                  {Object.entries(permissions).map(([category, perms]) => {
                    const catPermIds = perms.map((p) => p.id);
                    const allSelected = catPermIds.every((id) => selectedPermissions.includes(id));
                    const someSelected = catPermIds.some((id) => selectedPermissions.includes(id));

                    return (
                      <div key={category} className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
                        <label className="flex items-center gap-3 mb-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                            onChange={() => toggleCategory(category)}
                            className="accent-blue-600"
                          />
                          <span className="text-white text-sm font-semibold">{categoryLabel(category)}</span>
                          <span className="text-gray-600 text-xs">
                            ({catPermIds.filter((id) => selectedPermissions.includes(id)).length}/{catPermIds.length})
                          </span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ml-7">
                          {perms.map((perm) => (
                            <label key={perm.id} className="flex items-start gap-2 cursor-pointer py-1">
                              <input
                                type="checkbox"
                                checked={selectedPermissions.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                className="accent-blue-600 mt-0.5"
                              />
                              <div>
                                <p className="text-gray-300 text-xs font-medium">{perm.name}</p>
                                <p className="text-gray-600 text-xs">{perm.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-gray-800">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleSave}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                {editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center">
                <HiOutlineTrash className="text-red-400 text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Delete Role</h2>
                <p className="text-gray-500 text-sm">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Are you sure you want to delete the role{' '}
              <span className="text-white font-medium">{deleteTarget.name}</span>?
              Users with this role will lose its permissions.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                Delete Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
