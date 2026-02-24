import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import {
  getRelyingParties,
  getRelyingParty,
  createRelyingParty,
  updateRelyingParty,
  deleteRelyingParty,
} from '../lib/api';
import type { RelyingPartySummary, CreateRelyingPartyRequest } from '../types/api';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { ConfirmDialog } from './ConfirmDialog';

export const RelyingPartiesPage: React.FC = () => {
  const toast = useToast();
  const [relyingParties, setRelyingParties] = useState<RelyingPartySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateRelyingPartyRequest>({
    name: '',
    redirectUris: [],
    sectorId: '',
    logoUrl: '',
    primaryColor: '#1f2937',
    secondaryColor: '#4b5563',
  });
  const [editingRpId, setEditingRpId] = useState<string | null>(null);
  const [redirectUriInput, setRedirectUriInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; redirectUris?: string; redirectUriInput?: string }>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRelyingParties = async () => {
    setLoading(true);
    try {
      const data = await getRelyingParties();
      setRelyingParties(data);
    } catch (error) {
      console.error('Failed to load relying parties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRelyingParties();
  }, []);

  const handleEdit = async (id: string) => {
    try {
      const rp = await getRelyingParty(id);
      setFormData({
        name: rp.name,
        redirectUris: rp.redirectUris,
        sectorId: rp.sectorId || '',
        logoUrl: rp.branding?.logoUrl || '',
        primaryColor: rp.branding?.primaryColor || '#1f2937',
        secondaryColor: rp.branding?.secondaryColor || '#4b5563',
      });
      setEditingId(id);
      setEditingRpId(rp.rpId);
      setShowForm(true);
    } catch (error) {
      console.error('Failed to load relying party details:', error);
      toast.error('Failed to load relying party details');
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    setDeleting(true);
    try {
      await deleteRelyingParty(deleteConfirmId);
      await loadRelyingParties();
      toast.success('Relying party deleted successfully');
    } catch (error) {
      console.error('Failed to delete relying party:', error);
      toast.error('Failed to delete relying party');
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleSubmit = async () => {
    const errors: { name?: string; redirectUris?: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (formData.redirectUris.length === 0) {
      errors.redirectUris = 'At least one redirect URI is required';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix form errors');
      return;
    }

    setFormErrors({});
    setSaving(true);
    try {
      if (editingId) {
        await updateRelyingParty(editingId, formData);
      } else {
        await createRelyingParty(formData);
      }

      await loadRelyingParties();
      handleCloseForm();
      toast.success(`Relying party ${editingId ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Failed to save relying party:', error);
      toast.error('Failed to save relying party');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setEditingRpId(null);
    setFormData({
      name: '',
      redirectUris: [],
      sectorId: '',
      logoUrl: '',
      primaryColor: '#1f2937',
      secondaryColor: '#4b5563',
    });
    setRedirectUriInput('');
    setFormErrors({});
  };

  const handleAddRedirectUri = () => {
    const uri = redirectUriInput.trim();
    if (!uri) return;

    try {
      new URL(uri); // Validate URL
      if (!formData.redirectUris.includes(uri)) {
        setFormData({ ...formData, redirectUris: [...formData.redirectUris, uri] });
        if (formErrors.redirectUris) {
          setFormErrors({ ...formErrors, redirectUris: undefined });
        }
      }
      setRedirectUriInput('');
      if (formErrors.redirectUriInput) {
        setFormErrors({ ...formErrors, redirectUriInput: undefined });
      }
    } catch {
      setFormErrors({ ...formErrors, redirectUriInput: 'Invalid URL format' });
      toast.error('Invalid URL format');
    }
  };

  const handleRemoveRedirectUri = (uri: string) => {
    setFormData({
      ...formData,
      redirectUris: formData.redirectUris.filter((u) => u !== uri),
    });
  };

  if (loading) {
    return <div className="font-mono text-gray-600">Loading relying parties...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mono font-bold text-gray-900">Relying Parties</h1>
        <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
          <Plus size={16} />
          New Relying Party
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-mono font-bold text-lg">
              {editingId ? 'Edit Relying Party' : 'New Relying Party'}
            </h3>
            <button
              onClick={handleCloseForm}
              className="text-gray-500 hover:text-gray-700"
              disabled={saving}
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {editingId && editingRpId && (
              <div>
                <label className="block font-mono text-sm font-medium text-gray-700 mb-1">
                  Client ID
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm bg-gray-50 text-gray-600">
                  {editingRpId}
                </div>
                <p className="mt-1 text-xs text-gray-500 font-mono">Client ID cannot be changed</p>
              </div>
            )}

            <div>
              <label className="block font-mono text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) {
                    setFormErrors({ ...formErrors, name: undefined });
                  }
                }}
                placeholder="e.g., My Application"
                className={`w-full px-3 py-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 ${
                  formErrors.name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-gray-900'
                }`}
                disabled={saving}
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600 font-mono">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label className="block font-mono text-sm font-medium text-gray-700 mb-1">
                Redirect URIs *
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={redirectUriInput}
                  onChange={(e) => {
                    setRedirectUriInput(e.target.value);
                    if (formErrors.redirectUriInput) {
                      setFormErrors({ ...formErrors, redirectUriInput: undefined });
                    }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRedirectUri())}
                  placeholder="https://example.com/callback"
                  className={`flex-1 px-3 py-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 ${
                    formErrors.redirectUriInput
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-gray-900'
                  }`}
                  disabled={saving}
                />
                <Button onClick={handleAddRedirectUri} disabled={saving} type="button">
                  Add
                </Button>
              </div>
              {formErrors.redirectUriInput && (
                <p className="mb-2 text-sm text-red-600 font-mono">{formErrors.redirectUriInput}</p>
              )}
              {formData.redirectUris.length > 0 && (
                <div className="space-y-1">
                  {formData.redirectUris.map((uri) => (
                    <div
                      key={uri}
                      className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded border border-gray-200"
                    >
                      <span className="font-mono text-sm text-gray-700">{uri}</span>
                      <button
                        onClick={() => handleRemoveRedirectUri(uri)}
                        className="text-red-600 hover:text-red-800"
                        disabled={saving}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {formErrors.redirectUris && (
                <p className="mt-2 text-sm text-red-600 font-mono">{formErrors.redirectUris}</p>
              )}
            </div>

            <div>
              <label className="block font-mono text-sm font-medium text-gray-700 mb-1">
                Sector ID
              </label>
              <input
                type="text"
                value={formData.sectorId}
                onChange={(e) => setFormData({ ...formData, sectorId: e.target.value })}
                placeholder="Optional sector identifier"
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block font-mono text-sm font-medium text-gray-700 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                value={formData.logoUrl}
                onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-mono text-sm font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryColor: e.target.value,
                    })
                  }
                  className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block font-mono text-sm font-medium text-gray-700 mb-1">
                  Secondary Color
                </label>
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      secondaryColor: e.target.value,
                    })
                  }
                  className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </Button>
              <Button onClick={handleCloseForm} disabled={saving} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        <table className="w-full font-mono text-sm">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Name</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Client ID</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Created</th>
              <th className="text-right px-6 py-3 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {relyingParties.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No relying parties configured. Click "New Relying Party" to add one.
                </td>
              </tr>
            ) : (
              relyingParties.map((rp) => (
                <tr key={rp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{rp.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{rp.rpId}</code>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(rp.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(rp.id)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit relying party"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(rp.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Delete relying party"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteConfirmId !== null}
        title="Delete Relying Party"
        description="Are you sure you want to delete this relying party? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
