import { useState } from 'react';
import { Code, Play, Database, TrendingUp, Users, FileText } from 'lucide-react';
import api from '../api/api';

const QueriesDemo = () => {
  const [activeQuery, setActiveQuery] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const queries = [
    {
      id: 1,
      title: 'Dashboard Statistics (Aggregate Query)',
      category: 'Aggregate Functions',
      description: 'Get total citizens, requests, grievances, and revenue using COUNT and SUM',
      sql: `SELECT 
    (SELECT COUNT(*) FROM Citizen) AS Total_Citizens,
    (SELECT COUNT(*) FROM Service_Request) AS Total_Requests,
    (SELECT COUNT(*) FROM Grievance) AS Total_Grievances,
    (SELECT COALESCE(SUM(Amount), 0) 
     FROM Payment WHERE Status = 'Completed') AS Total_Revenue;`,
      endpoint: '/dashboard/stats'
    },
    {
      id: 2,
      title: 'Recent Service Requests (Complex JOIN)',
      category: 'Advanced JOINs',
      description: 'Multi-table JOIN combining Citizens, Services, Departments, and Payments',
      sql: `SELECT 
    sr.Request_ID,
    c.Name AS Citizen_Name,
    s.Service_Name,
    d.Department_Name,
    sr.Request_Date,
    sr.Status,
    p.Amount,
    p.Payment_Method
FROM Service_Request sr
INNER JOIN Citizen c ON sr.Citizen_ID = c.Citizen_ID
INNER JOIN Service s ON sr.Service_ID = s.Service_ID
INNER JOIN Department d ON s.Department_ID = d.Department_ID
LEFT JOIN Payment p ON sr.Payment_ID = p.Payment_ID
ORDER BY sr.Request_Date DESC
LIMIT 10;`,
      endpoint: '/dashboard/recent-requests'
    },
    {
      id: 3,
      title: 'Department Performance (Aggregation + CASE)',
      category: 'Analytics Query',
      description: 'Calculate completion rates, revenue, and performance metrics by department',
      sql: `SELECT 
    d.Department_Name,
    COUNT(sr.Request_ID) AS Total_Requests,
    COUNT(CASE WHEN sr.Status = 'Completed' THEN 1 END) AS Completed,
    COUNT(CASE WHEN sr.Status = 'Pending' THEN 1 END) AS Pending,
    COALESCE(SUM(p.Amount), 0) AS Total_Revenue,
    ROUND(COUNT(CASE WHEN sr.Status = 'Completed' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(sr.Request_ID), 0), 2) AS Completion_Rate
FROM Department d
LEFT JOIN Service s ON d.Department_ID = s.Department_ID
LEFT JOIN Service_Request sr ON s.Service_ID = sr.Service_ID
LEFT JOIN Payment p ON sr.Payment_ID = p.Payment_ID 
    AND p.Status = 'Completed'
GROUP BY d.Department_ID, d.Department_Name
ORDER BY Total_Requests DESC;`,
      endpoint: '/dashboard/department-performance'
    },
    {
      id: 4,
      title: 'Monthly Trends (Date Functions + GROUP BY)',
      category: 'Time Series Analysis',
      description: 'Analyze service requests and revenue trends by month using DATE_FORMAT',
      sql: `SELECT 
    DATE_FORMAT(sr.Request_Date, '%Y-%m') AS Month,
    COUNT(sr.Request_ID) AS Total_Requests,
    COALESCE(SUM(p.Amount), 0) AS Total_Revenue,
    COUNT(DISTINCT sr.Citizen_ID) AS Unique_Citizens
FROM Service_Request sr
LEFT JOIN Payment p ON sr.Payment_ID = p.Payment_ID 
    AND p.Status = 'Completed'
GROUP BY DATE_FORMAT(sr.Request_Date, '%Y-%m')
ORDER BY Month DESC
LIMIT 12;`,
      endpoint: '/dashboard/monthly-trends'
    },
    {
      id: 5,
      title: 'Citizen Activity Summary (Multiple Aggregates)',
      category: 'Subqueries',
      description: 'Get comprehensive citizen activity with service requests and grievances',
      sql: `SELECT 
    c.Citizen_ID,
    c.Name,
    c.Email,
    COUNT(DISTINCT sr.Request_ID) AS Total_Requests,
    COUNT(DISTINCT g.Grievance_ID) AS Total_Grievances,
    COALESCE(SUM(p.Amount), 0) AS Total_Paid,
    MAX(sr.Request_Date) AS Last_Request_Date
FROM Citizen c
LEFT JOIN Service_Request sr ON c.Citizen_ID = sr.Citizen_ID
LEFT JOIN Grievance g ON c.Citizen_ID = g.Citizen_ID
LEFT JOIN Payment p ON sr.Payment_ID = p.Payment_ID 
    AND p.Status = 'Completed'
GROUP BY c.Citizen_ID, c.Name, c.Email
ORDER BY Total_Requests DESC;`,
      endpoint: '/citizens'
    },
    {
      id: 6,
      title: 'Services by Type (CASE Statement)',
      category: 'Conditional Logic',
      description: 'Categorize and count services by type with conditional aggregation',
      sql: `SELECT 
    Service_Type,
    COUNT(*) AS Service_Count,
    CASE 
        WHEN Service_Type = 'Certificate' THEN 'Documentation'
        WHEN Service_Type = 'Utility' THEN 'Bill Payment'
        ELSE 'Other'
    END AS Category
FROM Service
GROUP BY Service_Type
ORDER BY Service_Count DESC;`,
      endpoint: '/services'
    },
    {
      id: 7,
      title: 'Payment Analysis (Multiple Aggregates)',
      category: 'Financial Analytics',
      description: 'Analyze payment methods with success rates and statistics',
      sql: `SELECT 
    Payment_Method,
    COUNT(*) AS Total_Transactions,
    COUNT(CASE WHEN Status = 'Completed' THEN 1 END) AS Successful,
    COUNT(CASE WHEN Status = 'Failed' THEN 1 END) AS Failed,
    SUM(Amount) AS Total_Amount,
    AVG(Amount) AS Average_Amount,
    ROUND(COUNT(CASE WHEN Status = 'Completed' THEN 1 END) * 100.0 / 
          COUNT(*), 2) AS Success_Rate
FROM Payment
GROUP BY Payment_Method
ORDER BY Total_Amount DESC;`,
      endpoint: null
    },
    {
      id: 8,
      title: 'Grievance Status Report (String Functions)',
      category: 'Status Tracking',
      description: 'Analyze grievances with time calculations and pattern matching',
      sql: `SELECT 
    g.Status,
    COUNT(*) AS Count,
    AVG(DATEDIFF(CURDATE(), g.Date)) AS Avg_Days_Open,
    MIN(g.Date) AS Oldest_Date,
    MAX(g.Date) AS Newest_Date
FROM Grievance g
GROUP BY g.Status
ORDER BY Count DESC;`,
      endpoint: '/grievances'
    }
  ];

  const runQuery = async (query) => {
    setActiveQuery(query);
    setLoading(true);
    setQueryResult(null);

    try {
      if (query.endpoint) {
        const response = await api.get(query.endpoint);
        setQueryResult({
          success: true,
          data: response.data,
          rowCount: Array.isArray(response.data) ? response.data.length : 1
        });
      } else {
        setQueryResult({
          success: true,
          message: 'This query is for demonstration. Results would be fetched from backend.',
          data: null
        });
      }
    } catch (error) {
      setQueryResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Aggregate Functions': 'bg-blue-100 text-blue-800',
      'Advanced JOINs': 'bg-purple-100 text-purple-800',
      'Analytics Query': 'bg-green-100 text-green-800',
      'Time Series Analysis': 'bg-orange-100 text-orange-800',
      'Subqueries': 'bg-pink-100 text-pink-800',
      'Conditional Logic': 'bg-indigo-100 text-indigo-800',
      'Financial Analytics': 'bg-yellow-100 text-yellow-800',
      'Status Tracking': 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Database className="w-8 h-8 mr-3 text-primary-600" />
            Complex SQL Queries Demo
          </h1>
          <p className="text-gray-600 mt-1">
            Interactive demonstration of complex MySQL queries used in this system
          </p>
        </div>
      </div>

      {/* Query Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <Users className="w-8 h-8 mb-2" />
          <p className="text-2xl font-bold">{queries.length}</p>
          <p className="text-sm opacity-90">Query Examples</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <Code className="w-8 h-8 mb-2" />
          <p className="text-2xl font-bold">6+</p>
          <p className="text-sm opacity-90">Query Types</p>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <TrendingUp className="w-8 h-8 mb-2" />
          <p className="text-2xl font-bold">Live</p>
          <p className="text-sm opacity-90">Real Data</p>
        </div>
        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <FileText className="w-8 h-8 mb-2" />
          <p className="text-2xl font-bold">6</p>
          <p className="text-sm opacity-90">Tables Used</p>
        </div>
      </div>

      {/* Queries List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {queries.map((query) => (
          <div key={query.id} className="card hover:shadow-xl transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {query.title}
                </h3>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(query.category)}`}>
                  {query.category}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">{query.description}</p>
            
            <div className="bg-gray-900 rounded-lg p-4 mb-4 overflow-x-auto">
              <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                {query.sql}
              </pre>
            </div>

            <button
              onClick={() => runQuery(query)}
              className="btn-primary w-full flex items-center justify-center space-x-2"
              disabled={loading && activeQuery?.id === query.id}
            >
              {loading && activeQuery?.id === query.id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Query</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Query Results Modal */}
      {queryResult && activeQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{activeQuery.title}</h2>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${getCategoryColor(activeQuery.category)}`}>
                  {activeQuery.category}
                </span>
              </div>
              <button
                onClick={() => {
                  setQueryResult(null);
                  setActiveQuery(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {queryResult.success ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      ✓ Query executed successfully
                      {queryResult.rowCount && ` - ${queryResult.rowCount} rows returned`}
                    </p>
                  </div>

                  {queryResult.data && (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-100">
                            {Object.keys(Array.isArray(queryResult.data) ? queryResult.data[0] : queryResult.data).map((key) => (
                              <th key={key} className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(Array.isArray(queryResult.data) ? queryResult.data : [queryResult.data]).map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              {Object.values(row).map((value, i) => (
                                <td key={i} className="border border-gray-300 px-4 py-2 text-sm text-gray-700">
                                  {value !== null && value !== undefined ? String(value) : 'NULL'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {queryResult.message && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800">{queryResult.message}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium">✗ Error executing query</p>
                  <p className="text-red-600 text-sm mt-2">{queryResult.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueriesDemo;
