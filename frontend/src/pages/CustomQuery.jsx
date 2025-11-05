import { useState, useEffect } from 'react';
import { Play, Copy, Download, BookOpen, Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import { executeCustomQuery, getSampleQueries } from '../api/api';

const CustomQuery = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sampleQueries, setSampleQueries] = useState([]);
  const [showSamples, setShowSamples] = useState(true);

  useEffect(() => {
    fetchSampleQueries();
  }, []);

  const fetchSampleQueries = async () => {
    try {
      const response = await getSampleQueries();
      setSampleQueries(response.data.queries);
    } catch (error) {
      console.error('Error fetching sample queries:', error);
    }
  };

  const handleExecuteQuery = async () => {
    if (!query.trim()) {
      alert('Please enter a SQL query');
      return;
    }

    setLoading(true);
    try {
      const response = await executeCustomQuery(query);
      setResult(response.data);
    } catch (error) {
      console.error('Error executing query:', error);
      setResult({
        success: false,
        message: 'Failed to execute query. Please check your connection.',
        columns: [],
        data: [],
        rows_affected: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSampleQuery = (sampleQuery) => {
    setQuery(sampleQuery);
    setShowSamples(false);
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(query);
    alert('Query copied to clipboard!');
  };

  const downloadResults = () => {
    if (!result || !result.success || result.data.length === 0) {
      alert('No data to download');
      return;
    }

    // Convert to CSV
    const headers = result.columns.join(',');
    const rows = result.data.map(row => 
      result.columns.map(col => {
        const value = row[col];
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_results_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearQuery = () => {
    setQuery('');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Custom SQL Query</h1>
        <p className="text-gray-600 mt-1">Execute your own SQL queries on the database</p>
      </div>

      {/* Info Card */}
      <div className="card bg-blue-50 border border-blue-200">
        <div className="flex items-start space-x-3">
          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Query Tips:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use SELECT to query data, INSERT/UPDATE/DELETE to modify data</li>
              <li>End your query with a semicolon (;)</li>
              <li>Only one query can be executed at a time</li>
              <li>Available tables: Citizen, Department, Service, Service_Request, Grievance, Payment</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Editor Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Query Input */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">SQL Query Editor</h2>
              <div className="flex space-x-2">
                <button
                  onClick={copyQuery}
                  disabled={!query}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Copy Query"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={clearQuery}
                  disabled={!query && !result}
                  className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your SQL query here...&#10;Example: SELECT * FROM Citizen LIMIT 10;"
              className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm resize-none"
              style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
            />
            <div className="mt-3 flex space-x-3">
              <button
                onClick={handleExecuteQuery}
                disabled={!query || loading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Executing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Execute Query</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowSamples(!showSamples)}
                className="btn-secondary flex items-center space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>{showSamples ? 'Hide' : 'Show'} Examples</span>
              </button>
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <h2 className="text-lg font-semibold text-gray-900">Query Results</h2>
                </div>
                {result.success && result.data.length > 0 && (
                  <button
                    onClick={downloadResults}
                    className="btn-secondary flex items-center space-x-2 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV</span>
                  </button>
                )}
              </div>

              {/* Status Message */}
              <div className={`p-3 rounded-lg mb-4 ${
                result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <p className="text-sm font-medium">{result.message}</p>
              </div>

              {/* Data Table */}
              {result.success && result.data.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {result.columns.map((col) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.data.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          {result.columns.map((col) => (
                            <td
                              key={col}
                              className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                            >
                              {row[col] !== null && row[col] !== undefined ? String(row[col]) : 'NULL'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* No Results Message */}
              {result.success && result.data.length === 0 && result.rows_affected === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Query executed successfully but returned no results.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sample Queries Sidebar */}
        {showSamples && (
          <div className="lg:col-span-1">
            <div className="card sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sample Queries</h2>
              <div className="space-y-3">
                {sampleQueries.map((sample, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => loadSampleQuery(sample.query)}
                  >
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {sample.name}
                    </h3>
                    <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap font-mono">
                      {sample.query}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomQuery;
