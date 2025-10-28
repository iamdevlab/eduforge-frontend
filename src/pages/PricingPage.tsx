import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { Check, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Define the shape of the subscription status we expect from the backend
interface SubscriptionStatus {
    subscription_tier: 'FREE' | 'PRO';
    is_active: boolean;
    expires_at: string | null;
}

export default function PricingPage() {
    // State for the Paystack checkout button
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for fetching the user's current plan
    const [status, setStatus] = useState<SubscriptionStatus | null>(null);
    const [statusLoading, setStatusLoading] = useState(true);

    // --- 2. GET useNavigate ---
    const navigate = useNavigate();

    // Fetch the user's subscription status when the page loads
    useEffect(() => {
        const fetchStatus = async () => {
            setStatusLoading(true);
            try {
                const response = await apiClient.get<SubscriptionStatus>('/subscriptions/status');
                setStatus(response.data);
            } catch (err) {
                console.error("Failed to fetch subscription status", err);

                // --- 3. IMPROVED ERROR HANDLING ---
                if (axios.isAxiosError(err) && err.response?.status === 401) {
                    // This is a 401 Unauthorized error
                    setError("You must be logged in to view your subscription status.");
                    // Optional: redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate('/login');
                    }, 3000);
                } else {
                    // This is a different error (e.g., server is down)
                    setError("Could not load your subscription status. Please try again later.");
                }
            } finally {
                setStatusLoading(false);
            }
        };

        fetchStatus();
    }, [navigate]);

    // Handle the "Upgrade" button click
    const handleUpgrade = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.post('/subscriptions/create-checkout');
            const { authorization_url } = response.data;
            if (authorization_url) {
                // Redirect user to Paystack's page
                window.open(authorization_url, '_blank');
            } else {
                setError('Could not start payment. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to format the expiry date
    const getExpiryDate = () => {
        if (!status?.expires_at) return '';
        try {
            return new Date(status.expires_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (e) {
            return 'N/A';
        }
    };

    // Show a loading spinner while fetching status
    if (statusLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    const isPro = status?.subscription_tier === 'PRO';
    const isProActive = isPro && status?.is_active === true;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-4">
                EduForge Pricing
            </h1>
            <p className="text-center text-lg text-gray-500 mb-10">
                Choose the plan that's right for you.
            </p>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 text-center" role="alert">
                    {error}
                </div>
            )}

            {/* --- 5. Only render cards if there is NO error and status IS loaded --- */}
            {!error && status && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* --- FREE PLAN CARD --- */}
                    <div className={`p-8 bg-white rounded-2xl shadow-lg border-2 ${!isPro ? 'border-indigo-600' : 'border-gray-200'}`}>
                        <h3 className="text-2xl font-semibold text-gray-800">Free</h3>
                        <div className="my-4">
                            <span className="text-5xl font-extrabold text-gray-900">₦0</span>
                            <span className="text-gray-500 text-lg">/month</span>
                        </div>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>2 Lesson Plan Credits(10 weeks)</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>5 Exam Question Credits</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>5 Subject Limit</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Community Support</span>
                            </li>
                        </ul>
                        <button
                            disabled
                            className="w-full py-3 px-6 text-center font-semibold rounded-lg bg-gray-200 text-gray-600"
                        >
                            {isPro ? 'Included in Pro' : 'Your Current Plan'}
                        </button>
                    </div>

                    {/* --- PRO PLAN CARD --- */}
                    <div className={`p-8 bg-white rounded-2xl shadow-lg border-2 ${isPro ? 'border-indigo-600' : 'border-gray-200'}`}>
                        <h3 className="text-2xl font-semibold text-indigo-700">Pro</h3>
                        <div className="my-4">
                            <span className="text-5xl font-extrabold text-gray-900">₦3,499</span>
                            <span className="text-gray-500 text-lg">/month</span>
                        </div>
                        <ul className="space-y-3 mb-6">
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Unlimited Lesson Notes</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Unlimited Exam Questions</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Unlimited Subjects</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Premium PDF & DOCX Exports</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span>Priority Email Support</span>
                            </li>
                        </ul>

                        {isProActive ? (
                            // User is Pro and Active
                            <div className="text-center">
                                <button
                                    disabled
                                    className="w-full py-3 px-6 text-center font-semibold rounded-lg bg-gray-200 text-gray-600"
                                >
                                    Your Current Plan
                                </button>
                                <p className="text-sm text-gray-500 mt-2">
                                    Renews on: {getExpiryDate()}
                                </p>
                            </div>
                        ) : (
                            // User is Free OR Pro and Expired
                            <div className="text-center">
                                <button
                                    onClick={handleUpgrade}
                                    disabled={isLoading}
                                    className="w-full py-3 px-6 text-center font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    ) : isPro ? (
                                        'Re-subscribe to Pro'
                                    ) : (
                                        'Upgrade to Pro'
                                    )}
                                </button>
                                {isPro && !isProActive && (
                                    <p className="text-sm text-red-600 mt-2">
                                        Your plan expired on: {getExpiryDate()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <footer className="text-center mt-12 text-gray-500 text-sm">
                <p>
                    Payments are securely processed by Paystack.
                    You can cancel your subscription at any time.
                </p>
                <p className="mt-2">
                    <Link to="/terms" className="hover:underline">Terms of Service</Link> | <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
                </p>
            </footer>
        </div>
    );
}