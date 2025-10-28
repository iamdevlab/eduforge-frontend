import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import landingImage from "../assets/landing_image.png";
import type { AxiosError } from "axios";
import { useAuthStore } from "../stores/useAuthStore";
import { Loader2 } from "lucide-react";

function LoginPage() {
    // State for login vs. signup view
    const [isLoginView, setIsLoginView] = useState(true);

    // Form fields state
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const setToken = useAuthStore((state) => state.setToken);

    interface LoginResponse {
        access_token: string;
    }

    const clearState = () => {
        setUsername("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setError("");
        setSuccess("");
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await apiClient.post<LoginResponse>("auth/token", {
                username, // This field will now send either a username or an email
                password,
            });

            //localStorage.setItem("token", res.data.access_token);
            setToken(res.data.access_token);
            navigate("/lessons");
        } catch (err) {
            const axiosErr = err as AxiosError<{ detail?: string }>;
            if (axiosErr.response) {
                setError(axiosErr.response.data?.detail || "Invalid credentials");
            } else {
                setError("No response from server.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        setError("");
        setSuccess("");
        setIsLoading(true);

        try {
            await apiClient.post("auth/register", {
                username, // Send the username to the backend
                email,
                password,
            });

            setSuccess("Account created successfully! Please login.");
            setIsLoginView(true);
            clearState();

        } catch (err) {
            const axiosErr = err as AxiosError<{ detail?: string }>;
            if (axiosErr.response) {
                setError(axiosErr.response.data?.detail || "Registration failed. Please try again.");
            } else {
                setError("No response from server.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${landingImage})` }}
        >
            <div className="bg-white/20 backdrop-blur-md shadow-lg border border-white/30 p-8 rounded-2xl w-96">
                {isLoginView ? (
                    // --- LOGIN FORM ---
                    <form onSubmit={handleLogin}>
                        <h2 className="text-3xl font-bold mb-6 text-center text-white drop-shadow-md">
                            Login
                        </h2>
                        {error && <p className="text-red-300 mb-4 text-center">{error}</p>}
                        {success && <p className="text-green-300 mb-4 text-center">{success}</p>}

                        <input
                            type="text"
                            placeholder="Username or Email" // Correct placeholder
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full mb-4 px-4 py-2 border border-white/30 rounded-lg bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full mb-6 px-4 py-2 border border-white/30 rounded-lg bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Login"
                            )}
                        </button>
                        <p className="text-center text-gray-200 mt-6">
                            No Account?{" "}
                            <button
                                type="button"
                                onClick={() => { setIsLoginView(false); clearState(); }}
                                className="font-semibold text-white hover:underline"
                            >
                                Create New account
                            </button>
                        </p>
                    </form>
                ) : (
                    // --- SIGNUP FORM (Corrected) ---
                    <form onSubmit={handleSignUp}>
                        <h2 className="text-3xl font-bold mb-6 text-center text-white drop-shadow-md">
                            Create Account
                        </h2>
                        {error && <p className="text-red-300 mb-4 text-center">{error}</p>}

                        {/* ADDED USERNAME OPTION */}
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full mb-4 px-4 py-2 border border-white/30 rounded-lg bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full mb-4 px-4 py-2 border border-white/30 rounded-lg bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full mb-4 px-4 py-2 border border-white/30 rounded-lg bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full mb-6 px-4 py-2 border border-white/30 rounded-lg bg-white/10 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Create Account"
                            )}
                        </button>
                        <p className="text-center text-gray-200 mt-6">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => { setIsLoginView(true); clearState(); }}
                                className="font-semibold text-white hover:underline"
                            >
                                Login
                            </button>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}

export default LoginPage;