import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { getPasskeys, deletePasskey, getPasskeyRegistrationOptions, verifyPasskeyRegistration } from '../lib/api';
import type { PasskeySummary } from '../types/api';
import { Button } from './Button';
import { useToast } from './ToastProvider';
import { ConfirmDialog } from './ConfirmDialog';

export const PasskeysPage: React.FC = () => {
  const toast = useToast();
  const [passkeys, setPasskeys] = useState<PasskeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [registering, setRegistering] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadPasskeys = async () => {
    setLoading(true);
    try {
      const data = await getPasskeys();
      setPasskeys(data);
    } catch (error) {
      console.error('Failed to load passkeys:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPasskeys();
  }, []);

  const handleAddPasskey = async () => {
    if (!newPasskeyName.trim()) {
      setFormError('Please enter a passkey name');
      toast.error('Please enter a passkey name');
      return;
    }

    setFormError('');
    setRegistering(true);
    try {
      // Step 1: Get registration options
      const options = await getPasskeyRegistrationOptions(newPasskeyName);

      // Step 2: Create credential
      const credential = await navigator.credentials.create({
        publicKey: options,
      }) as PublicKeyCredential;

      // Step 3: Verify registration
      await verifyPasskeyRegistration({
        name: newPasskeyName,
        credential: {
          id: credential.id,
          rawId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
          response: {
            clientDataJSON: btoa(
              String.fromCharCode(
                ...new Uint8Array((credential.response as AuthenticatorAttestationResponse).clientDataJSON)
              )
            ),
            attestationObject: btoa(
              String.fromCharCode(
                ...new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)
              )
            ),
          },
          type: credential.type,
        },
      });

      // Success - reload passkeys and reset form
      await loadPasskeys();
      setNewPasskeyName('');
      setShowAddForm(false);
      toast.success('Passkey registered successfully!');
    } catch (error) {
      console.error('Passkey registration failed:', error);
      toast.error('Failed to register passkey. Check console for details.');
    } finally {
      setRegistering(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    setDeleting(true);
    try {
      await deletePasskey(deleteConfirmId);
      await loadPasskeys();
      toast.success('Passkey deleted successfully');
    } catch (error) {
      console.error('Failed to delete passkey:', error);
      toast.error('Failed to delete passkey');
    } finally {
      setDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  if (loading) {
    return (
      <div className="font-mono text-gray-600">Loading passkeys...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-mono font-bold text-gray-900">Passkeys</h1>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          New Passkey
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="font-mono font-bold text-lg mb-4">Register New Passkey</h3>
          <div className="space-y-4">
            <div>
              <label className="block font-mono text-sm font-medium text-gray-700 mb-1">
                Passkey Name
              </label>
              <input
                type="text"
                value={newPasskeyName}
                onChange={(e) => {
                  setNewPasskeyName(e.target.value);
                  if (formError) setFormError('');
                }}
                placeholder="e.g., My Laptop"
                className={`w-full px-3 py-2 border rounded-md font-mono text-sm focus:outline-none focus:ring-2 ${
                  formError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-gray-900'
                }`}
                disabled={registering}
              />
              {formError && (
                <p className="mt-1 text-sm text-red-600 font-mono">{formError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleAddPasskey}
                disabled={registering}
                className="flex items-center gap-2"
              >
                {registering ? 'Registering...' : 'Register Passkey'}
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewPasskeyName('');
                }}
                disabled={registering}
                variant="secondary"
              >
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
              <th className="text-left px-6 py-3 font-semibold text-gray-900">Created</th>
              <th className="text-left px-6 py-3 font-semibold text-gray-900">ID</th>
              <th className="text-right px-6 py-3 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {passkeys.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No passkeys registered. Click "New Passkey" to add one.
                </td>
              </tr>
            ) : (
              passkeys.map((passkey) => (
                <tr key={passkey.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{passkey.name}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(passkey.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {passkey.id.substring(0, 16)}...
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeletePasskey(passkey.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Delete passkey"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={deleteConfirmId !== null}
        title="Delete Passkey"
        description="Are you sure you want to delete this passkey? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
};
