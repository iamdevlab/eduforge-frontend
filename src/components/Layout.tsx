import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, FileText, Menu, ChevronLeft, LogOut } from "lucide-react";
import { useState } from "react";

function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const navItems = [
        { name: "Lesson Planner", path: "/lessons", icon: <BookOpen size={18} /> },
        { name: "Exam Questions", path: "/exams", icon: <FileText size={18} /> },
    ];

    // Logout handler with confirmation
    const handleLogout = () => {
        const confirmed = window.confirm("Are you sure you want to log out?");
        if (confirmed) {
            localStorage.removeItem("token"); // clear JWT or session
            alert("You have been logged out.");
            navigate("/"); // redirect to login page
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar */}
            <aside
                className={`${collapsed ? "w-20" : "w-64"
                    } bg-gray-900 text-gray-100 flex flex-col transition-all duration-300`}
            >
                {/* Sidebar header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    {!collapsed && <span className="text-xl font-bold">EduForge</span>}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 rounded hover:bg-gray-800"
                    >
                        {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                {/* Nav links */}
                <nav className="flex-1 p-3">
                    <ul className="space-y-2">
                        {navItems.map((item) => {
                            const isActive =
                                location.pathname === item.path ||
                                (item.path !== "/" && location.pathname.startsWith(item.path));

                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.path}
                                        className={`flex items-center gap-3 p-2 rounded transition-colors ${isActive
                                            ? "bg-gray-700 text-white"
                                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                            }`}
                                    >
                                        {item.icon}
                                        {!collapsed && <span>{item.name}</span>}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Logout button at bottom */}
                <div className="p-3 border-t border-gray-700">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full p-2 rounded text-gray-300 hover:bg-gray-800 hover:text-white"
                    >
                        <LogOut size={18} />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 text-xs text-gray-400">
                    {!collapsed && <>© {new Date().getFullYear()} EduForge</>}
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 p-6">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;
