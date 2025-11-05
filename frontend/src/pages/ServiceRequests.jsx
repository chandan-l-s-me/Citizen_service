import { useState, useEffect } from 'react';
import { FileText, Calendar, DollarSign, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { 
  getServiceRequests, 
  createServiceRequest, 
  updateServiceRequest, 
  updateServiceRequestStatus,
  deleteServiceRequest,
  getCitizens,
  getServices
} from '../api/api';

const ServiceRequests = () => {
  const [requests, setRequests] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({
    Citizen_ID: '',
    Service_ID: '',
    Request_Date: new Date().toISOString().split('T')[0],
    Status: 'Pending',
    Payment_ID: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsRes, citizensRes, servicesRes] = await Promise.all([
        getServiceRequests(),
        getCitizens(),
        getServices()
      ]);
      setRequests(requestsRes.data);
      setCitizens(citizensRes.data);
      setServices(servicesRes.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const requestData = {
        ...formData,
        Citizen_ID: parseInt(formData.Citizen_ID),
        Service_ID: parseInt(formData.Service_ID),
        Payment_ID: formData.Payment_ID ? parseInt(formData.Payment_ID) : null
      };

      if (editingRequest) {
        await updateServiceRequest(editingRequest.Request_ID, requestData);
      } else {
        await createServiceRequest(requestData);
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving service request:', error);
      alert('Error saving service request');
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setFormData({
      Citizen_ID: request.Citizen_ID,
      Service_ID: request.Service_ID,
      Request_Date: request.Request_Date,
      Status: request.Status,
      Payment_ID: request.Payment_ID || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (requestId) => {
    if (window.confirm('Are you sure you want to delete this service request?')) {
      try {
        await deleteServiceRequest(requestId);
        fetchData();
      } catch (error) {
        console.error('Error deleting service request:', error);
        alert('Error deleting service request');
      }
    }
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await updateServiceRequestStatus(requestId, newStatus);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const resetForm = () => {
    setFormData({
      Citizen_ID: '',
      Service_ID: '',
      Request_Date: new Date().toISOString().split('T')[0],
      Status: 'Pending',
      Payment_ID: ''
    });
    setEditingRequest(null);
  };

  const getCitizenName = (citizenId) => {
    const citizen = citizens.find(c => c.Citizen_ID === citizenId);
    return citizen ? citizen.Name : `Citizen #${citizenId}`;
  };

  const getServiceName = (serviceId) => {
    const service = services.find(s => s.Service_ID === serviceId);
    return service ? service.Service_Name : `Service #${serviceId}`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Completed': 'badge-success',
      'Pending': 'badge-warning',
      'Processing': 'badge-info',
      'Rejected': 'badge-danger',
    };
    return badges[status] || 'badge-info';
  };

  const filteredRequests = filter === 'All' 
    ? requests 
    : requests.filter(req => req.Status === filter);

  const statusCounts = {
    All: requests.length,
    Completed: requests.filter(r => r.Status === 'Completed').length,
    Pending: requests.filter(r => r.Status === 'Pending').length,
    Processing: requests.filter(r => r.Status === 'Processing').length,
    Rejected: requests.filter(r => r.Status === 'Rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Service Requests</h1>
          <p className="text-gray-600 mt-1">Track and manage all service requests</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Request</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.map((request) => (
          <div key={request.Request_ID} className="card hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Request #{request.Request_ID}
                  </h3>
                  <span className={`badge ${getStatusBadge(request.Status)}`}>
                    {request.Status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-sm text-gray-500">Citizen</p>
                    <p className="font-medium text-gray-900">{getCitizenName(request.Citizen_ID)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-medium text-gray-900">{getServiceName(request.Service_ID)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment ID</p>
                    <p className="font-medium text-gray-900">{request.Payment_ID || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Request Date</p>
                    <p className="font-medium text-gray-900">
                      {new Date(request.Request_Date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Status Change Buttons */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600 mr-2">Change Status:</span>
                  {['Pending', 'Processing', 'Completed', 'Rejected'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(request.Request_ID, status)}
                      disabled={request.Status === status}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                        request.Status === status
                          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-primary-100 hover:text-primary-700'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(request)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Request"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(request.Request_ID)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Request"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRequests.length === 0 && (
        <div className="card text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No service requests found</p>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingRequest ? 'Edit Service Request' : 'New Service Request'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Citizen *
                </label>
                <select
                  required
                  value={formData.Citizen_ID}
                  onChange={(e) => setFormData({ ...formData, Citizen_ID: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select citizen</option>
                  {citizens.map((citizen) => (
                    <option key={citizen.Citizen_ID} value={citizen.Citizen_ID}>
                      {citizen.Name} (ID: {citizen.Citizen_ID})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service *
                </label>
                <select
                  required
                  value={formData.Service_ID}
                  onChange={(e) => setFormData({ ...formData, Service_ID: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select service</option>
                  {services.map((service) => (
                    <option key={service.Service_ID} value={service.Service_ID}>
                      {service.Service_Name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Request Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.Request_Date}
                  onChange={(e) => setFormData({ ...formData, Request_Date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={formData.Status}
                  onChange={(e) => setFormData({ ...formData, Status: e.target.value })}
                  className="input-field"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment ID (Optional)
                </label>
                <input
                  type="number"
                  value={formData.Payment_ID}
                  onChange={(e) => setFormData({ ...formData, Payment_ID: e.target.value })}
                  className="input-field"
                  placeholder="Enter payment ID if available"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingRequest ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceRequests;
