import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Citizens from './pages/Citizens';
import Services from './pages/Services';
import ServiceRequests from './pages/ServiceRequests';
import Grievances from './pages/Grievances';
import Departments from './pages/Departments';
import QueriesDemo from './pages/QueriesDemo';
import CustomQuery from './pages/CustomQuery';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/citizens" element={<Citizens />} />
          <Route path="/services" element={<Services />} />
          <Route path="/service-requests" element={<ServiceRequests />} />
          <Route path="/grievances" element={<Grievances />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/queries" element={<QueriesDemo />} />
          <Route path="/custom-query" element={<CustomQuery />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
