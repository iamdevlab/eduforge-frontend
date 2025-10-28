// src/components/UpgradeModal.tsx
import React, { useState } from 'react';
import { useUpgradeModalStore } from '../stores/useUpgradeModalStore';
import apiClient from '../services/apiClient'; // Import our updated apiClient

// Add some basic CSS for the modal (you can put this in your main .css file)
/*
.modal-backdrop {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-content {
  background: white; padding: 2rem; border-radius: 8px;
  max-width: 400px; width: 100%;
}
*/

export function UpgradeModal() {
    const { isOpen, closeModal } = useUpgradeModalStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpgrade = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Call the new endpoint we created in Step 3
            const response = await apiClient.post('/subscriptions/create-checkout');

            // 2. Get the URL from Paystack
            const { authorization_url } = response.data;

            // 3. Redirect the user to the payment page
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
        <div className="modal-backdrop" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Upgrade to EduForge Pro</h2>
                <p>
                    You've reached your free limit. Upgrade to Pro for <strong>₦3,499/month</strong> to unlock:
                </p>
                <ul>
                    <li>✔️ Unlimited lesson note generation</li>
                    <li>✔️ Unlimited exam questions</li>
                    <li>✔️ Premium export options (PDF & DOCX)</li>
                    <li>✔️ Priority support</li>
                </ul>

                {error && <p style={{ color: 'red' }}>{error}</p>}

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                    <button onClick={closeModal} disabled={isLoading}>
                        Maybe Later
                    </button>
                    <button onClick={handleUpgrade} disabled={isLoading}>
                        {isLoading ? 'Redirecting...' : 'Upgrade Now'}
                    </button>
                </div>
            </div>
        </div>
    );
}