import { useState } from 'react';
import { getCitizenSummary, getDepartmentStats } from '../api/api';

export default function Procedures() {
  const [citizenId, setCitizenId] = useState('');
  const [deptId, setDeptId] = useState('');
  const [citizenSummary, setCitizenSummary] = useState(null);
  const [deptStats, setDeptStats] = useState(null);
  const [error, setError] = useState(null);

  const fetchCitizen = async () => {
    setError(null);
    setCitizenSummary(null);
    try {
      const res = await getCitizenSummary(citizenId);
      setCitizenSummary(res.data);
    } catch (e) {
      setError(e.response?.data || e.message);
    }
  };

  const fetchDept = async () => {
    setError(null);
    setDeptStats(null);
    try {
      const res = await getDepartmentStats(deptId);
      setDeptStats(res.data);
    } catch (e) {
      setError(e.response?.data || e.message);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Stored Procedures (GUI)</h2>

      <section className="mb-8">
        <h3 className="text-lg font-semibold">Citizen Summary</h3>
        <div className="flex items-center space-x-2 mt-2">
          <input
            type="number"
            placeholder="Citizen ID"
            value={citizenId}
            onChange={(e) => setCitizenId(e.target.value)}
            className="border px-3 py-2 rounded w-48"
          />
          <button onClick={fetchCitizen} className="bg-primary-600 text-white px-4 py-2 rounded">
            Get Summary
          </button>
        </div>
        {citizenSummary && (
          <pre className="mt-4 bg-white p-4 rounded shadow">{JSON.stringify(citizenSummary, null, 2)}</pre>
        )}
      </section>

      <section>
        <h3 className="text-lg font-semibold">Department Stats</h3>
        <div className="flex items-center space-x-2 mt-2">
          <input
            type="number"
            placeholder="Department ID"
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="border px-3 py-2 rounded w-48"
          />
          <button onClick={fetchDept} className="bg-primary-600 text-white px-4 py-2 rounded">
            Get Stats
          </button>
        </div>
        {deptStats && (
          <pre className="mt-4 bg-white p-4 rounded shadow">{JSON.stringify(deptStats, null, 2)}</pre>
        )}
      </section>

      {error && (
        <div className="mt-4 text-red-600">Error: {JSON.stringify(error)}</div>
      )}
    </div>
  );
}
