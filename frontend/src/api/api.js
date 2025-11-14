import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard APIs
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getRecentRequests = (limit = 10) => api.get(`/dashboard/recent-requests?limit=${limit}`);
export const getDepartmentPerformance = () => api.get('/dashboard/department-performance');
export const getMonthlyTrends = () => api.get('/dashboard/monthly-trends');

// Citizens APIs
export const getCitizens = (skip = 0, limit = 100) => api.get(`/citizens?skip=${skip}&limit=${limit}`);
export const getCitizen = (id) => api.get(`/citizens/${id}`);
export const createCitizen = (data) => api.post('/citizens', data);
export const updateCitizen = (id, data) => api.put(`/citizens/${id}`, data);
export const deleteCitizen = (id) => api.delete(`/citizens/${id}`);

// Departments APIs
export const getDepartments = () => api.get('/departments');
export const getDepartment = (id) => api.get(`/departments/${id}`);
export const createDepartment = (data) => api.post('/departments', data);

// Services APIs
export const getServices = () => api.get('/services');
export const getService = (id) => api.get(`/services/${id}`);
export const createService = (data) => api.post('/services', data);
export const updateService = (id, data) => api.put(`/services/${id}`, data);
export const deleteService = (id) => api.delete(`/services/${id}`);

// Service Requests APIs
export const getServiceRequests = (skip = 0, limit = 100) => api.get(`/service-requests?skip=${skip}&limit=${limit}`);
export const getServiceRequest = (id) => api.get(`/service-requests/${id}`);
export const createServiceRequest = (data) => api.post('/service-requests', data);
export const updateServiceRequest = (id, data) => api.put(`/service-requests/${id}`, data);
export const updateServiceRequestStatus = (id, status) => api.patch(`/service-requests/${id}/status?status=${status}`);
export const deleteServiceRequest = (id) => api.delete(`/service-requests/${id}`);

// Payments APIs
export const getPayments = (skip = 0, limit = 100) => api.get(`/payments?skip=${skip}&limit=${limit}`);
export const getPayment = (id) => api.get(`/payments/${id}`);
export const createPayment = (data) => api.post('/payments', data);

// Grievances APIs
export const getGrievances = (skip = 0, limit = 100) => api.get(`/grievances?skip=${skip}&limit=${limit}`);
export const getGrievance = (id) => api.get(`/grievances/${id}`);
export const createGrievance = (data) => api.post('/grievances', data);
export const updateGrievance = (id, data) => api.put(`/grievances/${id}`, data);
export const updateGrievanceStatus = (id, status) => api.patch(`/grievances/${id}/status?status=${status}`);
export const deleteGrievance = (id) => api.delete(`/grievances/${id}`);

// Custom Query APIs
export const executeCustomQuery = (query) => api.post('/custom-queries/execute', { query });
export const getSampleQueries = () => api.get('/custom-queries/sample-queries');

// DB Tools: procedures, functions and views (demo)
export const getProcedureCitizenSummary = (citizen_id) => api.get(`/db/procedures/citizen_summary?citizen_id=${citizen_id}`);
export const getProcedureDepartmentStats = (department_id) => api.get(`/db/procedures/department_stats?department_id=${department_id}`);
export const postProcedureMarkGrievanceResolved = (grievance_id, resolved_by) => api.post('/db/procedures/mark_grievance_resolved', { grievance_id, resolved_by });

export const getFunctionTotalPaid = (citizen_id) => api.get(`/db/functions/total_paid?citizen_id=${citizen_id}`);
export const getFunctionCountRequests = (citizen_id) => api.get(`/db/functions/count_requests?citizen_id=${citizen_id}`);
export const getFunctionAvgPayment = (service_id) => api.get(`/db/functions/avg_payment?service_id=${service_id}`);
export const getFunctionOpenGrievances = (department_id) => api.get(`/db/functions/open_grievances?department_id=${department_id}`);
export const getFunctionIsCitizenActive = (citizen_id) => api.get(`/db/functions/is_citizen_active?citizen_id=${citizen_id}`);

export const getView = (viewName) => api.get(`/db/views/${encodeURIComponent(viewName)}`);

export default api;
