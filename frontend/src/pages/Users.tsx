import { useEffect, useState } from 'react';
import {
  HiOutlineSearch, HiOutlinePencil, HiOutlineBan, HiOutlineCheck,
  HiOutlineTrash, HiOutlinePlus, HiOutlineX,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getUsers, toggleUser, assignRoles, createUser, updateUser, deleteUser } from '../api/users';
import { getRoles } from '../api/roles';
import { getAttributesByFormType } from '../api/attributes';
import type { User, Role, FormAttribute } from '../types';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form attributes
  const [createFields, setCreateFields] = useState<FormAttribute[]>([]);
  const [editFields, setEditFields] = useState<FormAttribute[]>([]);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createValues, setCreateValues] = useState<Record<string, string>>({});
  const [createRoleIds, setCreateRoleIds] = useState<number[]>([]);

  // Edit modal
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  // Role assignment modal
  const [roleEditUser, setRoleEditUser] = useState<User | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<number[]>([]);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    getUsers(page, 10, search || undefined, 'regular')
      .then((res) => {
        setUsers(res.data.content);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page, search]);
  useEffect(() => {
    getRoles().then((res) => setRoles(res.data));
    getAttributesByFormType('USER_CREATE').then((res) => setCreateFields(res.data));
    getAttributesByFormType('USER_EDIT').then((res) => setEditFields(res.data));
  }, []);

  // --- Create ---
  const openCreate = () => {
    const defaults: Record<string, string> = {};
    createFields.forEach((f) => { defaults[f.fieldName] = f.defaultValue || ''; });
    setCreateValues(defaults);
    setCreateRoleIds([]);
    setShowCreate(true);
  };

  const handleCreate = async () => {
    for (const field of createFields) {
      if (field.required && !createValues[field.fieldName]?.trim()) {
        toast.error(`${field.label} is required`);
        return;
      }
      if (field.validationRegex && createValues[field.fieldName]) {
        if (!new RegExp(field.validationRegex).test(createValues[field.fieldName])) {
          toast.error(field.validationMessage || `${field.label} is invalid`);
          return;
        }
      }
    }
    try {
      await createUser({
        firstName: createValues.firstName || '',
        lastName: createValues.lastName || '',
        email: createValues.email || '',
        password: createValues.password || '',
      }, createRoleIds.length > 0 ? createRoleIds : undefined);
      toast.success('User created');
      setShowCreate(false);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    }
  };

  // --- Edit ---
  const openEdit = (user: User) => {
    setEditTarget(user);
    const vals: Record<string, string> = {};
    editFields.forEach((f) => {
      const key = f.fieldName as keyof User;
      const userVal = user[key];
      vals[f.fieldName] = userVal != null ? String(userVal) : '';
    });
    setEditValues(vals);
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    for (const field of editFields) {
      if (field.required && field.editable && !editValues[field.fieldName]?.trim()) {
        toast.error(`${field.label} is required`);
        return;
      }
    }
    try {
      await updateUser(editTarget.id, {
        firstName: editValues.firstName,
        lastName: editValues.lastName,
        email: editValues.email,
      });
      toast.success('User updated');
      setShowEdit(false);
      setEditTarget(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  // --- Roles ---
  const openRoleEdit = (user: User) => {
    setRoleEditUser(user);
    const currentRoleIds = roles.filter((r) => user.roles.includes(r.name)).map((r) => r.id);
    setSelectedRoles(currentRoleIds);
  };

  const handleAssignRoles = async () => {
    if (!roleEditUser) return;
    try {
      await assignRoles(roleEditUser.id, selectedRoles);
      toast.success('Roles updated');
      setRoleEditUser(null);
      fetchUsers();
    } catch { toast.error('Failed to assign roles'); }
  };

  // --- Toggle / Delete ---
  const handleToggle = async (user: User) => {
    try {
      await toggleUser(user.id);
      toast.success(`User ${user.enabled ? 'deactivated' : 'activated'}`);
      fetchUsers();
    } catch { toast.error('Failed to update user'); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget.id);
      toast.success('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  // --- Form field renderer ---
  const renderField = (
    field: FormAttribute,
    values: Record<string, string>,
    setValues: (v: Record<string, string>) => void
  ) => {
    const value = values[field.fieldName] || '';
    const onChange = (val: string) => setValues({ ...values, [field.fieldName]: val });

    if (field.fieldType === 'BOOLEAN') {
      return (
        <label className="flex items-center gap-3 cursor-pointer py-1">
          <input type="checkbox" checked={value === 'true'}
            onChange={(e) => onChange(e.target.checked ? 'true' : 'false')}
            disabled={!field.editable} className="accent-blue-600" />
          <span className="text-gray-300 text-sm">{field.label}</span>
          {!field.editable && <span className="text-gray-600 text-xs">(read-only)</span>}
        </label>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">
          {field.label} {field.required && <span className="text-red-400">*</span>}
          {!field.editable && <span className="text-gray-600 text-xs ml-1">(read-only)</span>}
        </label>
        <input
          type={field.fieldType === 'PASSWORD' ? 'password' : field.fieldType === 'EMAIL' ? 'email' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!field.editable}
          placeholder={field.placeholder || ''}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {field.fieldType === 'PASSWORD' && field.validationMessage && (
          <p className="text-gray-600 text-xs mt-1">{field.validationMessage}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage regular users. Admin users are managed in the Admin Management module.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-3 text-gray-500" />
            <input type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search users..."
              className="pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition w-64" />
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <HiOutlinePlus /> Create User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">User</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Email</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Roles</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">MFA</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No regular users found</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <span className="text-white text-sm">{user.firstName} {user.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{user.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((role) => (
                        <span key={role} className="px-2 py-0.5 rounded text-xs font-medium bg-blue-600/10 text-blue-400 border border-blue-600/20">
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.enabled ? 'bg-green-600/10 text-green-400' : 'bg-red-600/10 text-red-400'
                    }`}>
                      {user.enabled ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs ${user.mfaEnabled ? 'text-green-400' : 'text-gray-600'}`}>
                      {user.mfaEnabled ? 'Enabled' : 'Off'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(user)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition"
                        title="Edit user">
                        <HiOutlinePencil />
                      </button>
                      <button onClick={() => openRoleEdit(user)}
                        className="p-2 text-gray-400 hover:text-purple-400 hover:bg-gray-800 rounded-lg transition"
                        title="Manage roles">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </button>
                      <button onClick={() => handleToggle(user)}
                        className={`p-2 rounded-lg transition ${
                          user.enabled ? 'text-gray-400 hover:text-orange-400 hover:bg-gray-800' : 'text-gray-400 hover:text-green-400 hover:bg-gray-800'
                        }`}
                        title={user.enabled ? 'Deactivate' : 'Activate'}>
                        {user.enabled ? <HiOutlineBan /> : <HiOutlineCheck />}
                      </button>
                      <button onClick={() => setDeleteTarget(user)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition"
                        title="Delete user">
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-800">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
              className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">
              Previous
            </button>
            <span className="text-gray-500 text-sm">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}
              className="px-3 py-1.5 bg-gray-800 text-gray-400 rounded-lg text-sm hover:bg-gray-700 disabled:opacity-50">
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create User Modal (dynamic form) */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Create New User</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-white">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {createFields.length === 0 ? (
                <p className="text-gray-500 text-sm">No form attributes configured. Go to Form Attributes to set up the creation form.</p>
              ) : (
                createFields.map((field) => (
                  <div key={field.id}>{renderField(field, createValues, setCreateValues)}</div>
                ))
              )}
              <div className="pt-2 border-t border-gray-800">
                <label className="block text-sm font-medium text-gray-400 mb-2">Assign Roles</label>
                <div className="space-y-2">
                  {roles.filter((r) => r.name !== 'ADMIN' && r.name !== 'SUPER_ADMIN').map((role) => (
                    <label key={role.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer">
                      <input type="checkbox"
                        checked={createRoleIds.includes(role.id)}
                        onChange={(e) => {
                          setCreateRoleIds(e.target.checked
                            ? [...createRoleIds, role.id]
                            : createRoleIds.filter((id) => id !== role.id));
                        }}
                        className="accent-blue-600" />
                      <div>
                        <span className="text-white text-sm font-medium">{role.name}</span>
                        <p className="text-gray-500 text-xs">{role.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-gray-600 text-xs mt-1">Leave empty to assign default USER role</p>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-800">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleCreate}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal (dynamic form from USER_EDIT attributes) */}
      {showEdit && editTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                Edit User — {editTarget.firstName} {editTarget.lastName}
              </h2>
              <button onClick={() => { setShowEdit(false); setEditTarget(null); }} className="text-gray-400 hover:text-white">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {editFields.length === 0 ? (
                <p className="text-gray-500 text-sm">No edit form attributes configured. Go to Form Attributes to set up the edit form.</p>
              ) : (
                editFields.map((field) => (
                  <div key={field.id}>{renderField(field, editValues, setEditValues)}</div>
                ))
              )}
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-800">
              <button onClick={() => { setShowEdit(false); setEditTarget(null); }}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleEdit}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {roleEditUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Assign Roles — {roleEditUser.firstName} {roleEditUser.lastName}
              </h2>
              <button onClick={() => setRoleEditUser(null)} className="text-gray-400 hover:text-white">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            <div className="space-y-2 mb-6">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 cursor-pointer">
                  <input type="checkbox"
                    checked={selectedRoles.includes(role.id)}
                    onChange={(e) => {
                      setSelectedRoles(e.target.checked
                        ? [...selectedRoles, role.id]
                        : selectedRoles.filter((id) => id !== role.id));
                    }}
                    className="accent-blue-600" />
                  <div>
                    <p className={`text-sm font-medium ${
                      role.name === 'SUPER_ADMIN' ? 'text-amber-400' :
                      role.name === 'ADMIN' ? 'text-purple-400' : 'text-white'
                    }`}>{role.name}</p>
                    <p className="text-gray-500 text-xs">{role.description}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setRoleEditUser(null)}
                className="flex-1 px-4 py-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleAssignRoles}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Save Roles
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
                <h2 className="text-lg font-semibold text-white">Delete User</h2>
                <p className="text-gray-500 text-sm">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Delete <span className="text-white font-medium">{deleteTarget.firstName} {deleteTarget.lastName}</span> ({deleteTarget.email})?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
