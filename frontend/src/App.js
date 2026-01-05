import React from "react";
import { ToastContainer } from "react-toastify";
import {
  BrowserRouter as Router,
  Route,
  Routes
} from "react-router-dom";
import Login from "./pages/FrontOffice/Login.jsx";
import FrontOffice from "./pages/FrontOffice/FrontOffice.jsx";
import Accounts from "./pages/Accounts/Accounts.jsx";
import Home from "../src/pages/Home/Home.jsx";
import Phlebotomy from "./pages/Phlebotomy/Phlebotomy.jsx";
import Lab from "./pages/Lab/Lab.jsx";
import Admin from "./pages/Admin/Admin.jsx";
import AccountsLogin from "./pages/Accounts/AccountsLogin.jsx";
import ClinicalLogin from "./pages/Clinical/ClinicalLogin.jsx";
import LabLogin from "./pages/Lab/LabLogin.jsx";
import RadiologyLogin from "./pages/Radiology/RadiologyLogin.jsx";
import PhlebotomyLogin from "./pages/Phlebotomy/PhlebotomyLogin.jsx";
import AgentLogin from "./pages/Agent/AgentLogin.jsx";
import { PatientProvider } from "./context/patientContext.jsx";
import "react-toastify/dist/ReactToastify.css";
import AllPatients from "./pages/Admin/AllPatients.jsx";
import UserAccount from "./pages/Admin/UserAccount.jsx";
import FinancialStatements from "./pages/Admin/FinancialStatement.jsx";
import AllUsers from "./pages/Admin/AllUsers.jsx";
import Clinical from "./pages/Clinical/Clinical.jsx";
import Radiology from "./pages/Radiology/Radiology.jsx";
import Agent from "./pages/Agent/Agent.jsx";
import AdminAuth from "./pages/Admin/AdminAuth.jsx";
import ErrorBoundary from "./pages/ErrorPage.jsx";
import LabResultViewer from "./pages/LabResult/LabResultViewer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const App = () => {
  return (
    <ErrorBoundary>
        <PatientProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/lab-result/:reportId" element={<LabResultViewer />} />
              
              {/* Login Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/accounts-login" element={<AccountsLogin />} />
              <Route path="/clinical-login" element={<ClinicalLogin />} />
              <Route path="/lab-login" element={<LabLogin />} />
              <Route path="/radiology-login" element={<RadiologyLogin />} />
              <Route path="/phlebotomy-login" element={<PhlebotomyLogin />} />
              <Route path="/agent-login" element={<AgentLogin />} />
              <Route path="/admin-auth" element={<AdminAuth />} />
              
              {/* Protected Routes */}
              <Route path="/front-office" element={<ProtectedRoute loginPath="/login" requiredDepartment="Front Office"><FrontOffice /></ProtectedRoute>} />
              <Route path="/accounts" element={<ProtectedRoute loginPath="/accounts-login" requiredDepartment="Accounts"><Accounts /></ProtectedRoute>} />
              <Route path="/phlebotomy" element={<ProtectedRoute loginPath="/phlebotomy-login" requiredDepartment="Phlebotomy"><Phlebotomy /></ProtectedRoute>} />
              <Route path="/lab" element={<ProtectedRoute loginPath="/lab-login" requiredDepartment="Laboratory"><Lab /></ProtectedRoute>} />
              <Route path="/clinical" element={<ProtectedRoute loginPath="/clinical-login" requiredDepartment="Clinical"><Clinical /></ProtectedRoute>} />
              <Route path="/radiology" element={<ProtectedRoute loginPath="/radiology-login" requiredDepartment="Radiology"><Radiology /></ProtectedRoute>} />
              <Route path="/agent" element={<ProtectedRoute loginPath="/agent-login" requiredDepartment="Agent"><Agent /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute loginPath="/admin-auth" requiredDepartment="Admin"><Admin /></ProtectedRoute>} />
              <Route path="/all-patients" element={<ProtectedRoute loginPath="/admin-auth" requiredDepartment="Admin"><AllPatients /></ProtectedRoute>} />
              <Route path="/user-account" element={<ProtectedRoute loginPath="/login"><UserAccount /></ProtectedRoute>} />
              <Route path="/financial-statements" element={<ProtectedRoute loginPath="/admin-auth" requiredDepartment="Admin"><FinancialStatements /></ProtectedRoute>} />
              <Route path="/all-users" element={<ProtectedRoute loginPath="/admin-auth" requiredDepartment="Admin"><AllUsers /></ProtectedRoute>} />

              {/* Add more routes as needed */}
            </Routes>
          </Router>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </PatientProvider>
    </ErrorBoundary>
  );
};

export default App;
