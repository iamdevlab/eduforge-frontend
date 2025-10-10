function Dashboard() {
    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">EduForge Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-white shadow rounded-lg">
                    <h2 className="text-xl font-semibold">Lesson Plans</h2>
                    <p className="text-gray-600">Create, view, and manage lesson plans.</p>
                </div>

                <div className="p-4 bg-white shadow rounded-lg">
                    <h2 className="text-xl font-semibold">Exam Questions</h2>
                    <p className="text-gray-600">Generate and manage exam questions easily.</p>
                </div>

                <div className="p-4 bg-white shadow rounded-lg">
                    <h2 className="text-xl font-semibold">Reports</h2>
                    <p className="text-gray-600">Analyze performance and generate reports.</p>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
