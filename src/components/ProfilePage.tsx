import React, { useState } from 'react';
import { User, Trash2 } from 'lucide-react';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import { deleteAccount } from '../lib/api';
import { useToast } from './ToastProvider';

export const ProfilePage: React.FC = () => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success('Account deleted successfully');
      // Redirect handled by API on 401 after deletion
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      
      // Handle 404 - backend not implemented yet
      if (error?.status === 404 || error?.status === 501) {
        toast.info('Account deletion is not yet implemented on the backend');
      } else {
        toast.error(error?.message || 'Failed to delete account');
      }
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-900 rounded-lg">
          <User size={24} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 font-mono">Profile</h1>
      </div>

      {/* Manifesto Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-mono mb-4">
            nullProfile Manifesto
          </h2>
          
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              <strong className="text-gray-900">nullProfile</strong> exists to prove that security does not require surveillance. 
              We authenticate people, not identities.
            </p>
            
            <p>
              We do not ask for your name, email, phone number, or any personal attributes. 
              There is no profile to leak—because there is no profile to collect.
            </p>
            
            <p>
              Your account is simply a set of <strong className="text-gray-900">passkeys you control</strong>. 
              If you can prove possession of a passkey, you can sign in. 
              If you lose them, we cannot "recover" you by asking personal questions—because we don't have that data.
            </p>
            
            <p>
              When you sign in to an app using nullProfile, we only share a pseudonymous identifier (<code className="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono">sub</code>). 
              It is <strong className="text-gray-900">pairwise</strong>, meaning different apps cannot correlate you.
            </p>
            
            <p>
              We keep the system minimal by design: fewer fields, fewer secrets, fewer ways to be harmed.
            </p>
          </div>
        </div>

        {/* Key Principles */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 font-mono mb-3">
            Key Principles
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span><strong className="text-gray-900">Passkeys only</strong> — phishing-resistant authentication</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span><strong className="text-gray-900">No personal profile attributes stored</strong> — nothing to leak</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span><strong className="text-gray-900">Pairwise identifiers</strong> per relying party / sector</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span><strong className="text-gray-900">Minimal data retention</strong> — only what's necessary</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span><strong className="text-gray-900">Transparent and user-controlled</strong> — you own your data</span>
            </li>
          </ul>
        </div>

        {/* Closing Statement */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-bold text-gray-900 font-mono italic">
            Privacy is not a feature. It's the default.
          </p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg border-2 border-red-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-red-600 font-mono">Danger Zone</h2>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Deleting your account permanently removes all associated passkeys, relying parties you created, 
            and access to this dashboard.
          </p>
          <p className="text-sm text-red-600 font-medium">
            This cannot be undone.
          </p>
        </div>

        <button
          onClick={() => setShowDeleteDialog(true)}
          className="
            flex items-center gap-2 px-4 py-2 
            bg-red-600 text-white rounded-lg
            font-mono font-medium text-sm
            hover:bg-red-700 transition-colors
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
          "
        >
          <Trash2 size={16} />
          Delete Account
        </button>
      </div>

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={showDeleteDialog}
        loading={deleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </div>
  );
};
