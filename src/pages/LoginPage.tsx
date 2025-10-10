import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../services/apiClient";
import type { AxiosError } from "axios";

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    interface LoginResponse {
        access_token: string;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            const res = await apiClient.post<LoginResponse>("auth/login", {
                username,
                password,
            });

            localStorage.setItem("token", res.data.access_token);
            navigate("/lessons");
        } catch (err) {
            const axiosErr = err as AxiosError<{ message?: string }>;

            if (axiosErr.response) {
                setError(axiosErr.response.data?.message || "Invalid credentials");
            } else if (axiosErr.request) {
                setError("No response from server.");
            } else {
                setError("Login failed: " + axiosErr.message);
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500">
            <form
                onSubmit={handleLogin}
                className="bg-white/20 backdrop-blur-md shadow-lg border border-white/30 p-8 rounded-2xl w-96"
            >
                <h2 className="text-3xl font-bold mb-6 text-center text-white drop-shadow-md">
                    Login
                </h2>
                {error && <p className="text-red-300 mb-4 text-center">{error}</p>}

                <input
                    type="text"
                    placeholder="Username"
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
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-lg font-semibold hover:opacity-90 transition"
                >
                    Login
                </button>
            </form>
        </div>
    );
}

export default LoginPage;
