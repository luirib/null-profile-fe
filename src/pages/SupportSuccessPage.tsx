import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';

export const SupportSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 space-y-6 text-center">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle2 size={48} className="text-green-600" />
          </div>
        </div>
        
        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 font-mono">
            Thank you for supporting nullProfile!
          </h1>
          <p className="text-gray-700 leading-relaxed">
            Your contribution helps keep the project running and improving. 
            We're grateful for your support in maintaining a privacy-first authentication service.
          </p>
        </div>
        
        {/* Message */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            You'll receive a confirmation email from Stripe with your receipt. 
            Your donation summary has been updated on the Support page.
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            onClick={() => navigate('/dashboard/support')}
            className="px-6 py-3 bg-gray-900 text-white font-mono font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            View Support Page
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
