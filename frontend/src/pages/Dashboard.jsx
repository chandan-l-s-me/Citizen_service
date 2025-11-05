import { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  MessageSquare,
  DollarSign,
  Clock,
  AlertCircle,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { getDashboardStats, getRecentRequests, getDepartmentPerformance } from '../api/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [deptPerformance, setDeptPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, requestsRes, performanceRes] = await Promise.all([
        getDashboardStats(),
        getRecentRequests(5),
        getDepartmentPerformance()
      ]);
      setStats(statsRes.data);
      setRecentRequests(requestsRes.data);
      setDeptPerformance(performanceRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="card animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-4 rounded-full ${color}`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
    </div>
  );

  const getStatusBadge = (status) => {
    const badges = {
      'Completed': 'badge-success',
      'Pending': 'badge-warning',
      'Processing': 'badge-info',
      'Rejected': 'badge-danger',
    };
    return badges[status] || 'badge-info';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to Citizen Service Management System</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Citizens"
          value={stats?.total_citizens || 0}
          icon={Users}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend="+12% from last month"
        />
        <StatCard
          title="Service Requests"
          value={stats?.total_requests || 0}
          icon={FileText}
          color="bg-gradient-to-br from-green-500 to-green-600"
          trend="+8% from last month"
        />
        <StatCard
          title="Total Grievances"
          value={stats?.total_grievances || 0}
          icon={MessageSquare}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats?.total_revenue?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          trend="+15% from last month"
        />
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              Pending Actions
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Pending Requests</p>
                <p className="text-sm text-gray-600">Requires immediate attention</p>
              </div>
              <span className="text-2xl font-bold text-orange-600">{stats?.pending_requests || 0}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Open Grievances</p>
                <p className="text-sm text-gray-600">Needs resolution</p>
              </div>
              <span className="text-2xl font-bold text-red-600">{stats?.open_grievances || 0}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
              Quick Stats
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Completion Rate</p>
                <p className="text-sm text-gray-600">Service requests completed</p>
              </div>
              <span className="text-2xl font-bold text-green-600">87%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Avg Response Time</p>
                <p className="text-sm text-gray-600">For service requests</p>
              </div>
              <span className="text-2xl font-bold text-blue-600">3 days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Service Requests</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Request ID</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Citizen</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Service</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((request, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">#{request.Request_ID}</td>
                  <td className="py-3 px-4 text-gray-700">{request.Citizen_Name}</td>
                  <td className="py-3 px-4 text-gray-700">{request.Service_Name}</td>
                  <td className="py-3 px-4 text-gray-700">{request.Department_Name}</td>
                  <td className="py-3 px-4 text-gray-700">
                    {request.Request_Date ? new Date(request.Request_Date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${getStatusBadge(request.Status)}`}>
                      {request.Status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    ₹{request.Amount?.toLocaleString() || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Performance */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Department Performance</h2>
        <div className="space-y-4">
          {deptPerformance.slice(0, 5).map((dept, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{dept.Department_Name}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span>Total: {dept.Total_Requests}</span>
                  <span>Completed: {dept.Completed_Requests}</span>
                  <span>Revenue: ₹{dept.Total_Revenue?.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-600">{dept.Completion_Rate || 0}%</p>
                <p className="text-sm text-gray-600">Completion</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
