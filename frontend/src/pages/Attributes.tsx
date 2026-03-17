import { useEffect, useState } from 'react';
import {
  HiOutlineEye, HiOutlineEyeOff, HiOutlineSave, HiOutlinePlus,
  HiOutlinePencil, HiOutlineTrash, HiOutlineX, HiOutlineChevronUp, HiOutlineChevronDown,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import {
  getAllAttributesByFormType, bulkUpdateAttributes, createAttribute, deleteAttribute,
} from '../api/attributes';
import type { FormAttribute } from '../types';

const FORM_TYPES = [
  { key: 'USER_CREATE', label: 'User Creation Form' },
  { key: 'USER_EDIT', label: 'User Edit Form' },
] as const;

const FIELD_TYPES = ['TEXT', 'EMAIL', 'PASSWORD', 'BOOLEAN', 'DATE', 'SELECT'];

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: 'Text', EMAIL: 'Email', PASSWORD: 'Password',
  BOOLEAN: 'Boolean', DATE: 'Date', SELECT: 'Select',
};

export default function Attributes() {
  const [activeTab, setActiveTab] = useState<string>('USER_CREATE');
  const [attributes, setAttributes] = useState<FormAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editingAttr, setEditingAttr] = useState<FormAttribute | null>(null);
  const [form, setForm] = useState({
    fieldName: '', label: '', fieldType: 'TEXT', required: false,
    visible: true, editable: true, placeholder: '', defaultValue: '',
    validationRegex: '', validationMessage: '',
  });

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<FormAttribute | null>(null);

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const res = await getAllAttributesByFormType(activeTab);
      setAttributes(res.data);
      setHasChanges(false);
    } catch {
      toast.error('Failed to load attributes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttributes(); }, [activeTab]);

  const updateField = (id: number, field: keyof FormAttribute, value: any) => {
    setAttributes((prev) =>
      prev.map((attr) => (attr.id === id ? { ...attr, [field]: value } : attr))
    );
    setHasChanges(true);
  };

  const moveAttribute = (index: number, direction: 'up' | 'down') => {
    const newAttrs = [...attributes];
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newAttrs.length) return;

    const tempOrder = newAttrs[index].displayOrder;
    newAttrs[index].displayOrder = newAttrs[swapIdx].displayOrder;
    newAttrs[swapIdx].displayOrder = tempOrder;

    [newAttrs[index], newAttrs[swapIdx]] = [newAttrs[swapIdx], newAttrs[index]];
    setAttributes(newAttrs);
    setHasChanges(true);
  };

  const handleBulkSave = async () => {
    setSaving(true);
    try {
      const res = await bulkUpdateAttributes(attributes);
      setAttributes(res.data.sort((a, b) => a.displayOrder - b.displayOrder));
      setHasChanges(false);
      toast.success('Attributes saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditingAttr(null);
    setForm({
      fieldName: '', label: '', fieldType: 'TEXT', required: false,
      visible: true, editable: true, placeholder: '', defaultValue: '',
      validationRegex: '', validationMessage: '',
    });
    setShowModal(true);
  };

  const openEdit = (attr: FormAttribute) => {
    setEditingAttr(attr);
    setForm({
      fieldName: attr.fieldName, label: attr.label, fieldType: attr.fieldType,
      required: attr.required, visible: attr.visible, editable: attr.editable,
      placeholder: attr.placeholder || '', defaultValue: attr.defaultValue || '',
      validationRegex: attr.validationRegex || '', validationMessage: attr.validationMessage || '',
    });
    setShowModal(true);
  };

  const handleSaveAttr = async () => {
    if (!form.fieldName.trim() || !form.label.trim()) {
      toast.error('Field name and label are required');
      return;
    }
    try {
      if (editingAttr) {
        // Update existing via the single PUT
        const updated: FormAttribute = {
          ...editingAttr, ...form,
          placeholder: form.placeholder || null,
          defaultValue: form.defaultValue || null,
          validationRegex: form.validationRegex || null,
          validationMessage: form.validationMessage || null,
        };
        // We'll do bulk save with all attributes including this one
        const newAttrs = attributes.map((a) => (a.id === editingAttr.id ? updated : a));
        const res = await bulkUpdateAttributes(newAttrs);
        setAttributes(res.data.sort((a, b) => a.displayOrder - b.displayOrder));
        toast.success('Attribute updated');
      } else {
        await createAttribute({
          fieldName: form.fieldName,
          label: form.label,
          fieldType: form.fieldType,
          formType: activeTab as 'USER_CREATE' | 'USER_EDIT',
          required: form.required,
          visible: form.visible,
          editable: form.editable,
          placeholder: form.placeholder || null,
          defaultValue: form.defaultValue || null,
          validationRegex: form.validationRegex || null,
          validationMessage: form.validationMessage || null,
          displayOrder: 0,
        } as any);
        toast.success('Attribute created');
      }
      setShowModal(false);
      setHasChanges(false);
      fetchAttributes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save attribute');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAttribute(deleteTarget.id);
      toast.success('Attribute deleted');
      setDeleteTarget(null);
      fetchAttributes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Form Attributes</h1>
          <p className="text-gray-500 text-sm mt-1">Configure which fields appear in user creation and edit forms</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button onClick={handleBulkSave} disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50">
              <HiOutlineSave /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <HiOutlinePlus /> Add Attribute
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 p-1 rounded-lg border border-gray-800 w-fit">
        {FORM_TYPES.map((ft) => (
          <button key={ft.key} onClick={() => setActiveTab(ft.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === ft.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}>
            {ft.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase w-16">Order</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Field Name</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Label</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase w-20">Type</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase w-20">Visible</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase w-20">Required</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase w-20">Editable</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr, index) => (
                <tr key={attr.id}
                  className={`border-b border-gray-800/50 ${!attr.visible ? 'opacity-50' : ''} hover:bg-gray-800/20 transition`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="flex flex-col">
                        <button onClick={() => moveAttribute(index, 'up')} disabled={index === 0}
                          className="text-gray-600 hover:text-white disabled:opacity-20 p-0.5">
                          <HiOutlineChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => moveAttribute(index, 'down')} disabled={index === attributes.length - 1}
                          className="text-gray-600 hover:text-white disabled:opacity-20 p-0.5">
                          <HiOutlineChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-gray-600 text-xs ml-1">{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-blue-400 text-sm bg-blue-600/10 px-2 py-0.5 rounded">{attr.fieldName}</code>
                  </td>
                  <td className="px-4 py-3 text-white text-sm">{attr.label}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
                      {attr.fieldType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => updateField(attr.id, 'visible', !attr.visible)}
                      className={`p-1.5 rounded-lg transition ${
                        attr.visible
                          ? 'text-green-400 bg-green-600/10 hover:bg-green-600/20'
                          : 'text-gray-600 bg-gray-800 hover:bg-gray-700'
                      }`}>
                      {attr.visible ? <HiOutlineEye /> : <HiOutlineEyeOff />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={attr.required}
                      onChange={(e) => updateField(attr.id, 'required', e.target.checked)}
                      className="accent-blue-600" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={attr.editable}
                      onChange={(e) => updateField(attr.id, 'editable', e.target.checked)}
                      className="accent-blue-600" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(attr)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition" title="Edit">
                        <HiOutlinePencil />
                      </button>
                      <button onClick={() => setDeleteTarget(attr)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition" title="Delete">
                        <HiOutlineTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {attributes.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-gray-600">
                    No attributes configured. Click "Add Attribute" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-6 text-xs text-gray-600">
        <span><strong className="text-gray-400">Visible:</strong> Field appears on the form</span>
        <span><strong className="text-gray-400">Required:</strong> Field must be filled</span>
        <span><strong className="text-gray-400">Editable:</strong> Field can be modified</span>
      </div>

      {/* Create / Edit Attribute Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">
                {editingAttr ? 'Edit Attribute' : 'Create Attribute'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <HiOutlineX className="text-xl" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Field Name</label>
                  <input type="text" value={form.fieldName}
                    onChange={(e) => setForm({ ...form, fieldName: e.target.value })}
                    disabled={!!editingAttr}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
                    placeholder="e.g. department" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Field Type</label>
                  <select value={form.fieldType}
                    onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
                    disabled={!!editingAttr}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition disabled:opacity-50">
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft} value={ft}>{FIELD_TYPE_LABELS[ft]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Label</label>
                <input type="text" value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                  placeholder="Display label for the field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Placeholder</label>
                <input type="text" value={form.placeholder}
                  onChange={(e) => setForm({ ...form, placeholder: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                  placeholder="Hint text inside the field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Default Value</label>
                <input type="text" value={form.defaultValue}
                  onChange={(e) => setForm({ ...form, defaultValue: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                  placeholder="Pre-filled value (optional)" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Validation Regex</label>
                <input type="text" value={form.validationRegex}
                  onChange={(e) => setForm({ ...form, validationRegex: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition font-mono text-sm"
                  placeholder="^[A-Za-z]+$" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Validation Message</label>
                <input type="text" value={form.validationMessage}
                  onChange={(e) => setForm({ ...form, validationMessage: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                  placeholder="Error message shown on validation failure" />
              </div>
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.visible}
                    onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                    className="accent-blue-600" />
                  <span className="text-gray-300 text-sm">Visible</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.required}
                    onChange={(e) => setForm({ ...form, required: e.target.checked })}
                    className="accent-blue-600" />
                  <span className="text-gray-300 text-sm">Required</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.editable}
                    onChange={(e) => setForm({ ...form, editable: e.target.checked })}
                    className="accent-blue-600" />
                  <span className="text-gray-300 text-sm">Editable</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-800">
              <button onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleSaveAttr}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                {editingAttr ? 'Update' : 'Create'}
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
                <h2 className="text-lg font-semibold text-white">Delete Attribute</h2>
                <p className="text-gray-500 text-sm">This will remove the field from the form.</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              Delete <span className="text-white font-medium">{deleteTarget.label}</span> ({deleteTarget.fieldName})
              from {deleteTarget.formType === 'USER_CREATE' ? 'User Creation' : 'User Edit'} form?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg hover:bg-gray-700 transition">
                Cancel
              </button>
              <button onClick={handleDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
