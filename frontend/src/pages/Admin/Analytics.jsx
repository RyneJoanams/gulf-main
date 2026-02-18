import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { API_BASE_URL } from '../../config/api.config';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Paper,
  CircularProgress
} from '@mui/material';
import { FaUsers, FaUserMd, FaClipboardList, FaChartLine } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

const Analytics = () => {
  const [patients, setPatients] = useState([]);
  const [labReports, setLabReports] = useState([]);
  const [clinicalReports, setClinicalReports] = useState([]);
  const [radiologyReports, setRadiologyReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [patientsRes, labRes, clinicalRes, radiologyRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/patient?limit=500`),
        axios.get(`${API_BASE_URL}/api/lab?limit=500`),
        axios.get(`${API_BASE_URL}/api/clinical?limit=500`),
        axios.get(`${API_BASE_URL}/api/radiology?limit=500`),
        axios.get(`${API_BASE_URL}/api/user/all`)
      ]);

      setPatients(patientsRes.data.patients || patientsRes.data || []);
      setLabReports(labRes.data.data || []);
      setClinicalReports(clinicalRes.data.reports || clinicalRes.data || []);
      // radiology controller now returns { data: [], pagination: {} }
      setRadiologyReports(radiologyRes.data.data || radiologyRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Analytics calculations
  const getTotalPatients = () => patients.length;
  const getTotalReports = () => labReports.length + clinicalReports.length + radiologyReports.length;
  const getTotalUsers = () => users.length;
  const getActiveUsers = () => users.filter(user => user.status === 'Active').length;

  // Medical type distribution
  const getMedicalTypeData = () => {
    const medicalTypeCounts = patients.reduce((acc, patient) => {
      acc[patient.medicalType] = (acc[patient.medicalType] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(medicalTypeCounts),
      datasets: [{
        data: Object.values(medicalTypeCounts),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ],
        hoverBackgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40'
        ]
      }]
    };
  };

  // Age distribution
  const getAgeDistributionData = () => {
    const ageGroups = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61+': 0
    };

    patients.forEach(patient => {
      const age = parseInt(patient.age);
      if (age <= 20) ageGroups['0-20']++;
      else if (age <= 40) ageGroups['21-40']++;
      else if (age <= 60) ageGroups['41-60']++;
      else ageGroups['61+']++;
    });

    return {
      labels: Object.keys(ageGroups),
      datasets: [{
        label: 'Number of Patients',
        data: Object.values(ageGroups),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };
  };

  // Monthly patient registration trend
  const getMonthlyRegistrationData = () => {
    const monthlyData = {};
    const currentDate = new Date();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      monthlyData[monthKey] = 0;
    }

    patients.forEach(patient => {
      if (patient.createdAt) {
        const monthKey = patient.createdAt.slice(0, 7);
        if (monthlyData.hasOwnProperty(monthKey)) {
          monthlyData[monthKey]++;
        }
      }
    });

    return {
      labels: Object.keys(monthlyData).map(month => {
        const date = new Date(month + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      datasets: [{
        label: 'New Patients',
        data: Object.values(monthlyData),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1
      }]
    };
  };

  // Department activity data
  const getDepartmentActivityData = () => {
    return {
      labels: ['Lab Reports', 'Clinical Reports', 'Radiology Reports'],
      datasets: [{
        label: 'Number of Reports',
        data: [labReports.length, clinicalReports.length, radiologyReports.length],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 205, 86, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)'
        ],
        borderWidth: 1
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress size={60} />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <ToastContainer />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" align="center" gutterBottom className="text-blue-600 font-bold mb-8">
          System Analytics Dashboard
        </Typography>

        {/* Key Metrics Cards */}
        <Grid container spacing={3} className="mb-8">
          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Paper className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="h4" className="font-bold">
                      {getTotalPatients()}
                    </Typography>
                    <Typography variant="body1">Total Patients</Typography>
                  </div>
                  <FaUsers size={40} className="opacity-80" />
                </div>
              </Paper>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Paper className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="h4" className="font-bold">
                      {getTotalReports()}
                    </Typography>
                    <Typography variant="body1">Total Reports</Typography>
                  </div>
                  <FaClipboardList size={40} className="opacity-80" />
                </div>
              </Paper>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Paper className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="h4" className="font-bold">
                      {getActiveUsers()}
                    </Typography>
                    <Typography variant="body1">Active Users</Typography>
                  </div>
                  <FaUserMd size={40} className="opacity-80" />
                </div>
              </Paper>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <Paper className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="h4" className="font-bold">
                      {patients.filter(p => p.sex === 'Male').length}
                    </Typography>
                    <Typography variant="body1">Male Patients</Typography>
                  </div>
                  <FaChartLine size={40} className="opacity-80" />
                </div>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        {/* Charts Grid */}
        <Grid container spacing={4}>
          {/* Medical Type Distribution */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Paper className="p-6">
                <Typography variant="h6" className="mb-4 text-gray-700">
                  Medical Type Distribution
                </Typography>
                <div style={{ height: '300px' }}>
                  <Doughnut data={getMedicalTypeData()} options={chartOptions} />
                </div>
              </Paper>
            </motion.div>
          </Grid>

          {/* Age Distribution */}
          <Grid item xs={12} md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Paper className="p-6">
                <Typography variant="h6" className="mb-4 text-gray-700">
                  Age Distribution
                </Typography>
                <div style={{ height: '300px' }}>
                  <Bar data={getAgeDistributionData()} options={chartOptions} />
                </div>
              </Paper>
            </motion.div>
          </Grid>

          {/* Monthly Registration Trend */}
          <Grid item xs={12} md={8}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <Paper className="p-6">
                <Typography variant="h6" className="mb-4 text-gray-700">
                  Monthly Patient Registration Trend
                </Typography>
                <div style={{ height: '300px' }}>
                  <Line data={getMonthlyRegistrationData()} options={chartOptions} />
                </div>
              </Paper>
            </motion.div>
          </Grid>

          {/* Department Activity */}
          <Grid item xs={12} md={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Paper className="p-6">
                <Typography variant="h6" className="mb-4 text-gray-700">
                  Department Activity
                </Typography>
                <div style={{ height: '300px' }}>
                  <Bar data={getDepartmentActivityData()} options={chartOptions} />
                </div>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </div>
  );
};

export default Analytics;
