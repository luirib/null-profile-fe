import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

export const SupportCancelPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6 text-center">
        {/* Cancel icon */}
        <div className="flex justify-center">
          <div className="p-4 bg-gray-100 rounded-full">
            <XCircle size={48} className="text-gray-600" />
          </div>
        </div>
        
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 font-mono">
            Donation cancelled
          </h1>
          <p className="text-gray-700 leading-relaxed">
            No worries — you can try again anytime. 
            Your support means a lot, but we understand if now isn't the right time.
          </p>
        </div>
        
        {/* Message */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            The payment process was cancelled and you were not charged. 
            Feel free to return to the Support page whenever you're ready.
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => navigate('/dashboard/support')}
            className="px-6 py-3 bg-gray-900 text-white font-mono font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-white text-gray-700 font-mono font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
