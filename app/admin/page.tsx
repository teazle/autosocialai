'use client';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Active Clients</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Posts This Week</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">0%</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Client Management</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-500">No clients yet. Create your first client invite to get started.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

