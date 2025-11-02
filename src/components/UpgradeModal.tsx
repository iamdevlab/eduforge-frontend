// src/components/UpgradeModal.tsx
import React, { useState } from 'react';
import { useUpgradeModalStore } from '../stores/useUpgradeModalStore';
import apiClient from '../services/apiClient';
import { CheckCircle } from 'lucide-react'; // Import the check icon

export function UpgradeModal() {
    const { isOpen, closeModal } = useUpgradeModalStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpgrade = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.post('/subscriptions/create-checkout');
            const { authorization_url } = response.data;

            if (authorization_url) {
                window.location.href = authorization_url;
            } else {
                setError('Could not start payment. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300"
            onClick={closeModal}
        >
            {/* Modal Content */}
            <div
                className="relative bg-white p-6 sm:p-8 rounded-xl shadow-2xl max-w-md w-full m-4 font-['Inter']"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-gray-800">Upgrade to EduForge Pro</h2>
                <p className="mt-4 text-gray-600">
                    You've reached your free limit. Upgrade to Pro for <strong className="text-indigo-600">₦3,499/month</strong> to unlock:
                </p>

                {/* Features List */}
                <ul className="mt-4 space-y-2 text-gray-600">
                    <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Unlimited lesson note generation</span>
                    </li>
                    <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Unlimited exam questions</span>
                    </li>
                    <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Premium export options (PDF & DOCX)</span>
                    </li>
                    <li className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                        <span>Priority support</span>
                    </li>
                </ul>

                {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

                {/* Buttons */}
                <div className="mt-6 flex flex-col sm:flex-row sm:justify-between sm:space-x-4 space-y-2 sm:space-y-0">
                    <button
                        onClick={closeModal}
                        disabled={isLoading}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition duration-150 disabled:opacity-50"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={handleUpgrade}
                        disabled={isLoading}
                        className="w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-300"
                    >
                        {isLoading ? 'Redirecting...' : 'Upgrade Now'}
                    </button>
                </div>
            </div>
        </div>
    );
}