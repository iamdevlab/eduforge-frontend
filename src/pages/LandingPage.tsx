import { Link } from "react-router-dom";
import { BookOpen, FileText, ShieldCheck } from "lucide-react";
import landingImage from "../assets/landing_image.png";

function LandingPage() {
    return (
        <div
            className="min-h-screen flex flex-col bg-cover bg-center"
            style={{ backgroundImage: `url(${landingImage})` }}
        >
            {/* Hero Section */}
            <main className="flex-1 flex items-center justify-center px-6 py-12 bg-black bg-opacity-50">
                <div className="max-w-4xl text-center text-white">
                    <h1 className="text-7xl md:text-8xl font-bold text-white mb-4 drop-shadow-lg">
                        EduForge
                    </h1>
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">
                        Simplify Lesson Planning & Exam Preparation
                    </h2>
                    <p className="text-lg mb-8">
                        EduForge empowers teachers with tools to create, manage, and share
                        lesson plans and exam questions seamlessly — saving you time and
                        helping students succeed.
                    </p>
                    <Link
                        to="/login"
                        className="inline-block px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg shadow hover:bg-blue-700 transition"
                    >
                        Get Started
                    </Link>
                </div>
            </main>

            {/* Features Section */}
            <section className="bg-white py-12 px-6">
                <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="p-6 border rounded-lg shadow hover:shadow-lg transition">
                        <BookOpen className="mx-auto text-blue-600 mb-4" size={40} />
                        <h3 className="text-xl font-semibold mb-2">Lesson Planner</h3>
                        <p className="text-gray-600">
                            Quickly create structured lesson plans tailored to your students'
                            needs.
                        </p>
                    </div>
                    <div className="p-6 border rounded-lg shadow hover:shadow-lg transition">
                        <FileText className="mx-auto text-blue-600 mb-4" size={40} />
                        <h3 className="text-xl font-semibold mb-2">Exam Generator</h3>
                        <p className="text-gray-600">
                            Generate exam questions with ease and export them in various
                            formats.
                        </p>
                    </div>
                    <div className="p-6 border rounded-lg shadow hover:shadow-lg transition">
                        <ShieldCheck className="mx-auto text-blue-600 mb-4" size={40} />
                        <h3 className="text-xl font-semibold mb-2">Secure Access</h3>
                        <p className="text-gray-600">
                            Login securely and keep your academic resources safe and private.
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-300 text-center py-6 text-sm">
                © {new Date().getFullYear()} EduForge. All rights reserved.
            </footer>
        </div>
    );
}

export default LandingPage;