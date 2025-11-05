import { useState, useEffect } from 'react';
import { Plus, MessageSquare, Calendar, AlertCircle, Edit, Trash2 } from 'lucide-react';
import { 
  getGrievances, 
  createGrievance, 
  updateGrievance,
  updateGrievanceStatus,
  deleteGrievance,
  getDepartments, 
  getCitizens 
} from '../api/api';

const Grievances = () => {
  const [grievances, setGrievances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGrievance, setEditingGrievance] = useState(null);
  const [filter, setFilter] = useState('All');
  const [formData, setFormData] = useState({
    Citizen_ID: '',
    Department_ID: '',
    Description: '',
    Status: 'Submitted',
    Date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [grievancesRes, deptsRes, citizensRes] = await Promise.all([
        getGrievances(),
        getDepartments(),
        getCitizens()
      ]);
      setGrievances(grievancesRes.data);
      setDepartments(deptsRes.data);
      setCitizens(citizensRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const grievanceData = {
        ...formData,
        Citizen_ID: parseInt(formData.Citizen_ID),
        Department_ID: parseInt(formData.Department_ID)
      };

      if (editingGrievance) {
        await updateGrievance(editingGrievance.Grievance_ID, grievanceData);
      } else {
        await createGrievance(grievanceData);
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving grievance:', error);
      alert('Error saving grievance');
    }
  };

  const handleEdit = (grievance) => {
    setEditingGrievance(grievance);
    setFormData({
      Citizen_ID: grievance.Citizen_ID,
      Department_ID: grievance.Department_ID,
      Description: grievance.Description,
      Status: grievance.Status,
      Date: grievance.Date
    });
    setShowModal(true);
  };

  const handleDelete = async (grievanceId) => {
    if (window.confirm('Are you sure you want to delete this grievance?')) {
      try {
        await deleteGrievance(grievanceId);
        fetchData();
      } catch (error) {
        console.error('Error deleting grievance:', error);
        alert('Error deleting grievance');
      }
    }
  };

  const handleStatusChange = async (grievanceId, newStatus) => {
    try {
      await updateGrievanceStatus(grievanceId, newStatus);
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status');
    }
  };

  const resetForm = () => {
    setFormData({
      Citizen_ID: '',
      Department_ID: '',
      Description: '',
      Status: 'Submitted',
      Date: new Date().toISOString().split('T')[0]
    });
    setEditingGrievance(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Submitted': 'badge-info',
      'Under Review': 'badge-warning',
      'Resolved': 'badge-success',
      'Closed': 'badge-secondary',
    };
    return badges[status] || 'badge-info';
  };

  const getCitizenName = (citizenId) => {
    const citizen = citizens.find(c => c.Citizen_ID === citizenId);
    return citizen ? citizen.Name : `Citizen #${citizenId}`;
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.Department_ID === deptId);
    return dept ? dept.Department_Name : `Department #${deptId}`;
  };

  const filteredGrievances = filter === 'All' 
    ? grievances 
    : grievances.filter(g => g.Status === filter);

  const statusCounts = {
    All: grievances.length,
    Submitted: grievances.filter(g => g.Status === 'Submitted').length,
    'Under Review': grievances.filter(g => g.Status === 'Under Review').length,
    Resolved: grievances.filter(g => g.Status === 'Resolved').length,
    Closed: grievances.filter(g => g.Status === 'Closed').length,
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
          <h1 className="text-3xl font-bold text-gray-900">Grievances</h1>
          <p className="text-gray-600 mt-1">Manage citizen complaints and issues</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Grievance</span>
        </button>
      </div>

      {/* Status Filter */}
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

      {/* Grievances List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredGrievances.map((grievance) => (
          <div key={grievance.Grievance_ID} className="card hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Grievance #{grievance.Grievance_ID}
                    </h3>
                    <span className={`badge ${getStatusBadge(grievance.Status)} mt-1`}>
                      {grievance.Status}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 ml-auto">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(grievance.Date).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700">{grievance.Description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Citizen</p>
                    <p className="font-medium text-gray-900">{getCitizenName(grievance.Citizen_ID)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Department</p>
                    <p className="font-medium text-gray-900">{getDepartmentName(grievance.Department_ID)}</p>
                  </div>
                </div>

                {/* Status Change Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600 mr-2">Change Status:</span>
                  {['Submitted', 'Under Review', 'Resolved', 'Closed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(grievance.Grievance_ID, status)}
                      disabled={grievance.Status === status}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                        grievance.Status === status
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
                  onClick={() => handleEdit(grievance)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Grievance"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(grievance.Grievance_ID)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Grievance"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGrievances.length === 0 && (
        <div className="card text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No grievances found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingGrievance ? 'Edit Grievance' : 'New Grievance'}
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
                  Department *
                </label>
                <select
                  required
                  value={formData.Department_ID}
                  onChange={(e) => setFormData({ ...formData, Department_ID: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept.Department_ID} value={dept.Department_ID}>
                      {dept.Department_Name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.Description}
                  onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
                  className="input-field"
                  rows="4"
                  placeholder="Describe the grievance..."
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
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.Date}
                  onChange={(e) => setFormData({ ...formData, Date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingGrievance ? 'Update' : 'Submit'}
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

export default Grievances;
