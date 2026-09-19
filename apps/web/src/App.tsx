import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import PayslipAudit from './pages/PayslipAudit';
import ManualAudit from './pages/ManualAudit';
import Calendar from './pages/Calendar';
import Archive from './pages/Archive';
import Simulator from './pages/Simulator';
import Settings from './pages/Settings';
import Personal from './pages/Personal';
import PlanChoice from './pages/PlanChoice';
import Checkout from './pages/Checkout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="login" element={<Login />} />
        <Route path="plans" element={<PlanChoice />} />
        <Route path="register" element={<Register />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="audit/payslip" element={<PayslipAudit />} />
        <Route path="audit/manuale" element={<ManualAudit />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="archive" element={<Archive />} />
        <Route path="simulator" element={<Simulator />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Personal />} />
      </Route>
    </Routes>
  );
}

export default App;
