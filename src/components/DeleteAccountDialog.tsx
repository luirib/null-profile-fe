import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface DeleteAccountDialogProps {
  open: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  open,
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const REQUIRED_PHRASE = 'DELETE';
  const isConfirmed = confirmPhrase === REQUIRED_PHRASE;

  const handleConfirm = () => {
    if (isConfirmed && !loading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!loading) {
      setConfirmPhrase('');
      onCancel();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-lg w-full mx-4 p-6 font-mono">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
          </div>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4 mb-6">
          <p className="text-sm text-gray-700 font-semibold">
            This action is permanent and cannot be undone.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900 font-medium mb-2">
              Deleting your account will:
            </p>
            <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
              <li>Remove all your passkeys permanently</li>
              <li>Delete all relying parties you created</li>
              <li>Revoke access to this dashboard</li>
              <li>Erase all associated data from our systems</li>
            </ul>
          </div>

          <p className="text-sm text-gray-700">
            We cannot recover your account after deletion. There is no "undo" button.
          </p>

          <div className="space-y-2">
            <label htmlFor="confirm-phrase" className="block text-sm font-medium text-gray-900">
              Type <span className="font-bold text-red-600">{REQUIRED_PHRASE}</span> to confirm:
            </label>
            <input
              id="confirm-phrase"
              type="text"
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              disabled={loading}
              placeholder="Type DELETE here"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                disabled:opacity-50 disabled:bg-gray-100"
              autoComplete="off"
            />
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <Button
            onClick={handleCancel}
            disabled={loading}
            variant="secondary"
          >
            Cancel
          </Button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmed || loading}
            className="
              px-4 py-2 rounded-lg font-mono font-medium text-sm
              bg-red-600 text-white hover:bg-red-700
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600
            "
          >
            {loading ? 'Deleting...' : 'Permanently Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
