import { useState, useEffect } from 'react';
import { Plus, FileText, Building2, Edit, Trash2 } from 'lucide-react';
import { getServices, getDepartments, createService, updateService, deleteService } from '../api/api';

const Services = () => {
  const [services, setServices] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    Service_Name: '',
    Service_Type: '',
    Department_ID: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, deptsRes] = await Promise.all([
        getServices(),
        getDepartments()
      ]);
      setServices(servicesRes.data);
      setDepartments(deptsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const serviceData = {
        ...formData,
        Department_ID: parseInt(formData.Department_ID)
      };

      if (editingService) {
        await updateService(editingService.Service_ID, serviceData);
      } else {
        await createService(serviceData);
      }
      
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Error saving service');
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      Service_Name: service.Service_Name,
      Service_Type: service.Service_Type,
      Department_ID: service.Department_ID
    });
    setShowModal(true);
  };

  const handleDelete = async (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service? This may affect related service requests.')) {
      try {
        await deleteService(serviceId);
        fetchData();
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Error deleting service. It may have related records.');
      }
    }
  };

  const resetForm = () => {
    setFormData({ 
      Service_Name: '', 
      Service_Type: '', 
      Department_ID: '' 
    });
    setEditingService(null);
  };

  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.Department_ID === deptId);
    return dept ? dept.Department_Name : 'Unknown';
  };

  const getServiceTypeColor = (type) => {
    const colors = {
      'Certificate': 'bg-blue-100 text-blue-800',
      'Utility': 'bg-green-100 text-green-800',
      'Grievance': 'bg-orange-100 text-orange-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">Available government services</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Service</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.Service_ID} className="card hover:shadow-xl transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4 flex-1">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{service.Service_Name}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getServiceTypeColor(service.Service_Type)}`}>
                    {service.Service_Type}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2 ml-2">
                <button
                  onClick={() => handleEdit(service)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Service"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(service.Service_ID)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Service"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-600">
                <Building2 className="w-4 h-4 mr-2" />
                {getDepartmentName(service.Department_ID)}
              </div>
              <p className="text-sm text-gray-500 mt-2">Service ID: {service.Service_ID}</p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.Service_Name}
                  onChange={(e) => setFormData({ ...formData, Service_Name: e.target.value })}
                  className="input-field"
                  placeholder="Enter service name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type *
                </label>
                <select
                  required
                  value={formData.Service_Type}
                  onChange={(e) => setFormData({ ...formData, Service_Type: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select type</option>
                  <option value="Certificate">Certificate</option>
                  <option value="Utility">Utility</option>
                  <option value="Grievance">Grievance</option>
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
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingService ? 'Update' : 'Create'}
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

export default Services;
