import { useState } from 'react';
import { X } from 'lucide-react';
import {
  getProcedureCitizenSummary,
  getProcedureDepartmentStats,
  postProcedureMarkGrievanceResolved,
  getFunctionTotalPaid,
  getFunctionCountRequests,
  getFunctionAvgPayment,
  getFunctionOpenGrievances,
  getFunctionIsCitizenActive,
  getView
} from '../api/api';

export default function DBTools() {
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Input states for procedures
  const [citizenIdProc, setCitizenIdProc] = useState('1');
  const [departmentIdProc, setDepartmentIdProc] = useState('1');
  const [grievanceId, setGrievanceId] = useState('');
  const [resolvedBy, setResolvedBy] = useState('');

  // Input states for functions
  const [citizenIdFunc, setCitizenIdFunc] = useState('1');
  const [serviceIdFunc, setServiceIdFunc] = useState('1');
  const [departmentIdFunc, setDepartmentIdFunc] = useState('1');

  // View selection
  const [selectedView, setSelectedView] = useState('view_total_paid_per_citizen');

  const handleApiCall = async (apiFunc, label) => {
    setLoading(true);
    setError(null);
    setShowModal(true);
    try {
      const response = await apiFunc();
      console.log(`${label} response:`, response.data);
      setResults({ label, data: response.data });
    } catch (err) {
      console.error(`${label} error:`, err);
      setError(err.response?.data?.detail || err.message || 'An error occurred');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setResults(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Database Tools Demo</h1>
      </div>


      {/* Stored Procedures Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Summary & Analysis</h2>
        
        <div className="space-y-4">
          {/* Citizen Summary */}
          <div className="border border-gray-200 rounded p-4">
            <h3 className="text-lg font-medium mb-2">Get Citizen Summary</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={citizenIdProc}
                onChange={(e) => setCitizenIdProc(e.target.value)}
                placeholder="Citizen ID"
                className="border rounded px-3 py-2 w-32"
              />
              <button
                onClick={() => handleApiCall(() => getProcedureCitizenSummary(citizenIdProc), 'Citizen Summary')}
                disabled={loading || !citizenIdProc}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Get Summary
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Calls: sp_get_citizen_summary</p>
          </div>

          {/* Department Stats */}
          <div className="border border-gray-200 rounded p-4">
            <h3 className="text-lg font-medium mb-2">Get Department Statistics</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={departmentIdProc}
                onChange={(e) => setDepartmentIdProc(e.target.value)}
                placeholder="Department ID"
                className="border rounded px-3 py-2 w-32"
              />
              <button
                onClick={() => handleApiCall(() => getProcedureDepartmentStats(departmentIdProc), 'Department Stats')}
                disabled={loading || !departmentIdProc}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Get Stats
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Calls: sp_get_department_stats</p>
          </div>

          {/* Mark Grievance Resolved */}
          <div className="border border-gray-200 rounded p-4">
            <h3 className="text-lg font-medium mb-2">Mark Grievance as Resolved</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={grievanceId}
                onChange={(e) => setGrievanceId(e.target.value)}
                placeholder="Grievance ID"
                className="border rounded px-3 py-2 w-32"
              />
              <input
                type="text"
                value={resolvedBy}
                onChange={(e) => setResolvedBy(e.target.value)}
                placeholder="Resolved By"
                className="border rounded px-3 py-2 w-48"
              />
              <button
                onClick={() => handleApiCall(() => postProcedureMarkGrievanceResolved(grievanceId, resolvedBy), 'Mark Resolved')}
                disabled={loading || !grievanceId || !resolvedBy}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                Mark Resolved
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Calls: sp_mark_grievance_resolved</p>
          </div>
        </div>
      </div>

      {/* Functions Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Funcionalities</h2>
        
        <div className="space-y-4">
          {/* Total Paid by Citizen */}
          <div className="border border-gray-200 rounded p-4">
            <h3 className="text-lg font-medium mb-2">Total Amount Paid by Citizen</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={citizenIdFunc}
                onChange={(e) => setCitizenIdFunc(e.target.value)}
                placeholder="Citizen ID"
                className="border rounded px-3 py-2 w-32"
              />
              <button
                onClick={() => handleApiCall(() => getFunctionTotalPaid(citizenIdFunc), 'Total Paid')}
                disabled={loading || !citizenIdFunc}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                Calculate
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Calls: fn_total_paid_by_citizen</p>
          </div>

          {/* Count Requests by Citizen */}
          <div className="border border-gray-200 rounded p-4">
            <h3 className="text-lg font-medium mb-2">Count Service Requests by Citizen</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={citizenIdFunc}
                onChange={(e) => setCitizenIdFunc(e.target.value)}
                placeholder="Citizen ID"
                className="border rounded px-3 py-2 w-32"
              />
              <button
                onClick={() => handleApiCall(() => getFunctionCountRequests(citizenIdFunc), 'Count Requests')}
                disabled={loading || !citizenIdFunc}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                Count
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Calls: fn_count_requests_by_citizen</p>
          </div>

          {/* Average Payment by Service */}
          <div className="border border-gray-200 rounded p-4">
            <h3 className="text-lg font-medium mb-2">Average Payment Amount by Service</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={serviceIdFunc}
                onChange={(e) => setServiceIdFunc(e.target.value)}
                placeholder="Service ID"
                className="border rounded px-3 py-2 w-32"
              />
              <button
                onClick={() => handleApiCall(() => getFunctionAvgPayment(serviceIdFunc), 'Avg Payment')}
                disabled={loading || !serviceIdFunc}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                Calculate
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Calls: fn_avg_payment_by_service</p>
          </div>

          {/* Open Grievances by Department */}
          <div className="border border-gray-200 rounded p-4">
            <h3 className="text-lg font-medium mb-2">Open Grievances Count by Department</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={departmentIdFunc}
                onChange={(e) => setDepartmentIdFunc(e.target.value)}
                placeholder="Department ID"
                className="border rounded px-3 py-2 w-32"
              />
              <button
                onClick={() => handleApiCall(() => getFunctionOpenGrievances(departmentIdFunc), 'Open Grievances')}
                disabled={loading || !departmentIdFunc}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                Count
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Calls: fn_open_grievances_by_department</p>
          </div>

          {/* Is Citizen Active */}
          <div className="border border-gray-200 rounded p-4">
            <h3 className="text-lg font-medium mb-2">Check if Citizen is Active</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={citizenIdFunc}
                onChange={(e) => setCitizenIdFunc(e.target.value)}
                placeholder="Citizen ID"
                className="border rounded px-3 py-2 w-32"
              />
              <button
                onClick={() => handleApiCall(() => getFunctionIsCitizenActive(citizenIdFunc), 'Is Active')}
                disabled={loading || !citizenIdFunc}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                Check
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Calls: fn_is_citizen_active</p>
          </div>
        </div>
      </div>

      {/* Views Section */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Database Views</h2>
        
        <div className="space-y-4">
          <div className="border border-gray-200 rounded p-4">
            <h3 className="text-lg font-medium mb-2">Query Database View</h3>
            <div className="flex items-center gap-2">
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value)}
                className="border rounded px-3 py-2 flex-grow"
              >
                <option value="view_total_paid_per_citizen">Total Paid Per Citizen</option>
                <option value="view_request_counts_per_service">Request Counts Per Service</option>
                <option value="view_open_grievances_per_department">Open Grievances Per Department</option>
                <option value="view_recent_requests">Recent Requests</option>
              </select>
              <button
                onClick={() => handleApiCall(() => getView(selectedView), `View: ${selectedView}`)}
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400"
              >
                Query View
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">Selects from pre-defined database views</p>
          </div>
        </div>
      </div>

      {/* Modal for Results */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                {loading ? 'Loading...' : error ? 'Error' : results?.label || 'Results'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 text-lg">Loading results...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-red-800 mb-2">Error Occurred</h4>
                      <p className="text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Results State */}
              {results && !loading && !error && (
                <div>
                  {/* Table Display for Array Results */}
                  {Array.isArray(results.data) && results.data.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(results.data[0]).map((key) => (
                              <th
                                key={key}
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {results.data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              {Object.keys(results.data[0]).map((key) => (
                                <td
                                  key={key}
                                  className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                                >
                                  {row[key] !== null && row[key] !== undefined ? String(row[key]) : 'NULL'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Empty Array */}
                  {Array.isArray(results.data) && results.data.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="mt-4 text-lg">No results found.</p>
                    </div>
                  )}

                  {/* Object/Scalar Display (for functions returning single values) */}
                  {!Array.isArray(results.data) && results.data !== null && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-lg border border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {typeof results.data === 'object' ? (
                          Object.entries(results.data).map(([key, value]) => (
                            <div key={key} className="bg-white p-4 rounded-lg shadow-sm">
                              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-2">{key}</span>
                              <span className="text-2xl font-bold text-gray-900">
                                {value !== null && value !== undefined ? String(value) : 'NULL'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 bg-white p-6 rounded-lg shadow-sm text-center">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-3">Result</span>
                            <p className="text-3xl font-bold text-gray-900">{String(results.data)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
