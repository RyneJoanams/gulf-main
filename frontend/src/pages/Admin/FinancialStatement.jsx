import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaSearch, FaFilter, FaDownload, FaPrint, FaChartLine, FaMoneyBillWave, FaMinusCircle, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { API_BASE_URL } from '../../config/api.config';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// Add custom animations
const customStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(50px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.4s ease-out;
  }
`;

const FinancialStatements = () => {
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(true); // State to manage loading
  const [error, setError] = useState(null); // State to manage errors
  const [expenses, setExpenses] = useState([]);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [activeSection, setActiveSection] = useState('summary'); // Default to summary
  const [startDate, setStartDate] = useState(new Date()); // Set to today
  const [endDate, setEndDate] = useState(new Date()); // Set to today
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  // Edit states for payment records
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editPaymentData, setEditPaymentData] = useState({});
  
  // Edit states for expenses
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [editExpenseData, setEditExpenseData] = useState({});
  
  // Pagination states
  const [currentPaymentPage, setCurrentPaymentPage] = useState(1);
  const [paymentsPerPage, setPaymentsPerPage] = useState(10);
  const [currentExpensePage, setCurrentExpensePage] = useState(1);
  const [expensesPerPage, setExpensesPerPage] = useState(10);
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: '', name: '' });

  useEffect(() => {
    const fetchPaymentRecords = async () => {
      setLoading(true);
      try {
        // The backend route expects an ID but the controller gets all records anyway
        // Using 'all' as a placeholder ID since the controller ignores the parameter
        const response = await axios.get(`${API_BASE_URL}/api/patient/account/all`);
        console.log('Payment records:', response.data);
        console.log('Payment records type:', typeof response.data);
        console.log('Payment records length:', response.data?.length);
        setPaymentRecords(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching payment records:', error.response || error.message);
        setError(error.response?.data?.message || error.message || 'Unknown error');
        toast.error(`Error fetching payment records: ${error.response?.data?.message || error.message || 'Unknown error'}`);
        setPaymentRecords([]); // Set empty array on error
      } finally {
        setLoading(false); // Set loading to false after the API call
      }
    };

    fetchPaymentRecords();
  }, [startDate, endDate]); // Re-fetch when date range changes

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate]);

  // Helper functions for date range selection
  const setDateRangeToToday = () => {
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
    toast.info('Showing today\'s financial data');
  };

  const setDateRangeToYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setStartDate(yesterday);
    setEndDate(yesterday);
    toast.info('Showing yesterday\'s financial data');
  };

  const setDateRangeToThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    setStartDate(startOfWeek);
    setEndDate(today);
    toast.info('Showing this week\'s financial data');
  };

  const setDateRangeToThisMonth = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(startOfMonth);
    setEndDate(today);
    toast.info('Showing this month\'s financial data');
  };

  const setDateRangeToLast7Days = () => {
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    setStartDate(sevenDaysAgo);
    setEndDate(today);
    toast.info('Showing last 7 days financial data');
  };

  const fetchExpenses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/expenses`);
      // expenses controller now returns { expenses: [], pagination: {} }
      setExpenses(response.data.expenses || response.data || []);
    } catch (error) {
      toast.error('Error fetching expenses.');
    }
  };

  const handleAddExpense = async () => {
    if (!expenseDescription || !expenseAmount) {
      toast.error('Please enter all required fields.');
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/api/expenses`, {
        description: expenseDescription,
        amount: parseFloat(expenseAmount),
      });
      setExpenses([response.data, ...expenses]);
      setExpenseDescription('');
      setExpenseAmount('');
      toast.success('Expense added.');
    } catch (error) {
      toast.error('Error adding expense.');
    }
  };

  const handleDeleteExpense = (expense) => {
    setDeleteTarget({ type: 'expense', id: expense._id, name: expense.description });
    setShowDeleteModal(true);
  };
  
  const confirmDeleteExpense = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/expenses/${deleteTarget.id}`);
      setExpenses(expenses.filter(exp => exp._id !== deleteTarget.id));
      toast.success('Expense deleted.');
      setShowDeleteModal(false);
      setDeleteTarget({ type: '', id: '', name: '' });
    } catch (error) {
      toast.error('Error deleting expense.');
    }
  };
  
  const handleConfirmDelete = () => {
    if (deleteTarget.type === 'payment') {
      confirmDeletePayment();
    } else if (deleteTarget.type === 'expense') {
      confirmDeleteExpense();
    }
  };
  
  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteTarget({ type: '', id: '', name: '' });
  };

  // Payment record handlers
  const handleEditPayment = (record) => {
    setEditingPaymentId(record._id);
    setEditPaymentData({ ...record });
  };

  const handleCancelEditPayment = () => {
    setEditingPaymentId(null);
    setEditPaymentData({});
  };

  const handleSavePayment = async (id) => {
    try {
      // Ensure all required fields are present and properly formatted
      const paymentData = {
        patientName: editPaymentData.patientName,
        modeOfPayment: editPaymentData.modeOfPayment || '',
        accountNumber: editPaymentData.accountNumber,
        amountDue: parseFloat(editPaymentData.amountDue) || 0,
        amountPaid: parseFloat(editPaymentData.amountPaid) || 0,
        commission: parseFloat(editPaymentData.commission) || 0,
        xrayPayment: parseFloat(editPaymentData.xrayPayment) || 0,
        paymentStatus: editPaymentData.paymentStatus || (parseFloat(editPaymentData.amountPaid) >= parseFloat(editPaymentData.amountDue) ? 'Paid' : 'Pending')
      };

      const response = await axios.put(`${API_BASE_URL}/api/patient/account/${id}`, paymentData);
      setPaymentRecords(paymentRecords.map(record => 
        record._id === id ? response.data : record
      ));
      setEditingPaymentId(null);
      setEditPaymentData({});
      toast.success('Payment record updated successfully.');
    } catch (error) {
      console.error('Error updating payment record:', error);
      const errorMessage = error.response?.data?.message || 'Error updating payment record.';
      toast.error(errorMessage);
    }
  };

  const handleDeletePayment = (record) => {
    setDeleteTarget({ type: 'payment', id: record._id, name: record.patientName });
    setShowDeleteModal(true);
  };
  
  const confirmDeletePayment = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/patient/account/${deleteTarget.id}`);
      setPaymentRecords(paymentRecords.filter(record => record._id !== deleteTarget.id));
      toast.success('Payment record deleted successfully.');
      setShowDeleteModal(false);
      setDeleteTarget({ type: '', id: '', name: '' });
    } catch (error) {
      console.error('Error deleting payment record:', error);
      toast.error('Error deleting payment record.');
    }
  };

  // Expense handlers
  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense._id);
    setEditExpenseData({ ...expense });
  };

  const handleCancelEditExpense = () => {
    setEditingExpenseId(null);
    setEditExpenseData({});
  };

  const handleSaveExpense = async (id) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/expenses/${id}`, {
        description: editExpenseData.description,
        amount: parseFloat(editExpenseData.amount)
      });
      setExpenses(expenses.map(exp => 
        exp._id === id ? response.data : exp
      ));
      setEditingExpenseId(null);
      setEditExpenseData({});
      toast.success('Expense updated successfully.');
    } catch (error) {
      console.error('Error updating expense:', error);
      toast.error('Error updating expense.');
    }
  };

  const calculateChartData = (payments) => {
    const paidCount = payments.filter(record => record.paymentStatus === 'Paid').length;
    const pendingCount = payments.filter(record => record.paymentStatus === 'Pending').length;
    return {
      labels: ['Paid', 'Pending'],
      datasets: [
        {
          data: [paidCount, pendingCount],
          backgroundColor: ['#4CAF50', '#FF5733'],
        }
      ],
    };
  };

  const exportToExcel = () => {
    const paymentData = filteredPayments.map(record => ({
      PatientName: record.patientName,
      AmountDue: record.amountDue,
      AmountPaid: record.amountPaid,
      Commission: record.commission || 0,
      XrayPayment: record.xrayPayment || 0,
      AccountNumber: record.accountNumber,
      PaymentStatus: record.paymentStatus,
      Date: record.paymentDate,
    }));

    const expensesData = filteredExpenses.map(exp => ({
      Description: exp.description,
      Amount: exp.amount,
      Date: exp.date ? new Date(exp.date).toLocaleDateString() : '',
    }));

    const summaryData = [{
      'Total Amount Paid': totalAmountPaid,
      'Total Commission': totalCommission,
      'Total Xray Payment': totalXrayPayment,
      'Total Expenses': totalExpenses,
      'Total Deductions': totalDeductions,
      'Net Amount': netAmount,
      'Date Range': `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
    }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentData), 'Payments');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesData), 'Expenses');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');
    XLSX.writeFile(wb, `Financial_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filterRecordsByDate = (records) => {
    // Set time to 00:00:00 for start, and 23:59:59 for end to include the whole day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return records.filter(record => {
      const recordDate = new Date(record.paymentDate || record.date);
      const dateMatch = recordDate >= start && recordDate <= end;
      
      // Add patient name filter
      const nameMatch = searchTerm === '' || 
        (record.patientName && record.patientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (record.accountNumber && record.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Add payment method filter
      const methodMatch = paymentMethodFilter === 'All' || record.modeOfPayment === paymentMethodFilter;
      
      // Add status filter
      const statusMatch = statusFilter === 'All' || record.paymentStatus === statusFilter;
      
      return dateMatch && nameMatch && methodMatch && statusMatch;
    });
  };

  // Totals for summary
  const filteredPayments = filterRecordsByDate(paymentRecords);
  const filteredExpenses = filterRecordsByDate(expenses);
  
  // Pagination calculations for payments
  const indexOfLastPayment = currentPaymentPage * paymentsPerPage;
  const indexOfFirstPayment = indexOfLastPayment - paymentsPerPage;
  const currentPayments = filteredPayments.slice(indexOfFirstPayment, indexOfLastPayment);
  const totalPaymentPages = Math.ceil(filteredPayments.length / paymentsPerPage);
  
  // Pagination calculations for expenses
  const indexOfLastExpense = currentExpensePage * expensesPerPage;
  const indexOfFirstExpense = indexOfLastExpense - expensesPerPage;
  const currentExpenses = filteredExpenses.slice(indexOfFirstExpense, indexOfLastExpense);
  const totalExpensePages = Math.ceil(filteredExpenses.length / expensesPerPage);
  
  // Pagination handlers
  const handlePaymentPageChange = (pageNumber) => {
    setCurrentPaymentPage(pageNumber);
  };
  
  const handleExpensePageChange = (pageNumber) => {
    setCurrentExpensePage(pageNumber);
  };
  const totalAmountPaid = filteredPayments.reduce((sum, r) => sum + parseFloat(r.amountPaid || 0), 0);
  const totalCommission = filteredPayments.reduce((sum, r) => sum + parseFloat(r.commission || 0), 0);
  const totalXrayPayment = filteredPayments.reduce((sum, r) => sum + parseFloat(r.xrayPayment || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const totalDeductions = totalCommission + totalXrayPayment + totalExpenses;
  const netAmount = totalAmountPaid - totalDeductions;

  // Calculate payment method breakdown
  const cashPayments = filteredPayments.filter(record => record.modeOfPayment === 'Cash');
  const paybillPayments = filteredPayments.filter(record => record.modeOfPayment === 'Paybill');
  const invoicePayments = filteredPayments.filter(record => record.modeOfPayment === 'Invoice');
  
  const totalCashAmount = cashPayments.reduce((sum, record) => sum + parseFloat(record.amountPaid || 0), 0);
  const totalPaybillAmount = paybillPayments.reduce((sum, record) => sum + parseFloat(record.amountPaid || 0), 0);
  const totalInvoiceAmount = invoicePayments.reduce((sum, record) => sum + parseFloat(record.amountPaid || 0), 0);

  // Optional: Render loading state or error message
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Data</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 bg-gray-100 shadow-lg rounded-lg">
      <style>{customStyles}</style>
      <ToastContainer />
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-blue-600">Financial Statements</h1>
        <p className="text-gray-600 mt-2">
          Showing data for: <span className="font-semibold text-blue-600">
            {startDate.toLocaleDateString() === endDate.toLocaleDateString() 
              ? startDate.toLocaleDateString()
              : `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
            }
          </span>
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-lg mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveSection('summary')}
            className={`px-6 py-3 font-medium transition-colors duration-200 ${
              activeSection === 'summary' 
                ? 'bg-blue-500 text-white border-b-2 border-blue-500' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
          >
            <FaChartLine className="inline mr-2" />
            Financial Summary
          </button>
          <button
            onClick={() => setActiveSection('payments')}
            className={`px-6 py-3 font-medium transition-colors duration-200 ${
              activeSection === 'payments' 
                ? 'bg-blue-500 text-white border-b-2 border-blue-500' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
          >
            <FaMoneyBillWave className="inline mr-2" />
            Payment Records
          </button>
          <button
            onClick={() => setActiveSection('expenses')}
            className={`px-6 py-3 font-medium transition-colors duration-200 ${
              activeSection === 'expenses' 
                ? 'bg-blue-500 text-white border-b-2 border-blue-500' 
                : 'text-gray-600 hover:text-blue-500'
            }`}
          >
            <FaMinusCircle className="inline mr-2" />
            Expenses
          </button>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white p-6 shadow-lg rounded-lg mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <FaSearch className="absolute right-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name or account number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                showFilters ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FaFilter /> Filters
            </button>
            <button
              onClick={exportToExcel}
              className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              <FaDownload /> Export
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-gray-100 p-4 rounded-lg mt-4">
            {/* Quick Date Range Buttons */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Date Ranges</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={setDateRangeToToday}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors duration-200 text-sm"
                >
                  Today
                </button>
                <button
                  onClick={setDateRangeToYesterday}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm"
                >
                  Yesterday
                </button>
                <button
                  onClick={setDateRangeToLast7Days}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm"
                >
                  Last 7 Days
                </button>
                <button
                  onClick={setDateRangeToThisWeek}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm"
                >
                  This Week
                </button>
                <button
                  onClick={setDateRangeToThisMonth}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200 text-sm"
                >
                  This Month
                </button>
              </div>
            </div>
            
            {/* Date Range Inputs and Other Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dateFormat="yyyy-MM-dd"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Paybill">Paybill</option>
                  <option value="Invoice">Invoice</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Financial Summary Section */}
      {activeSection === 'summary' && (
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-blue-800">
            Financial Summary
            <span className="text-sm font-normal text-gray-600 ml-2">
              ({startDate.toLocaleDateString()} to {endDate.toLocaleDateString()})
            </span>
          </h2>
          
          {/* Main Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-gray-600 text-sm">Total Payments</p>
              <p className="text-2xl font-bold text-green-600">KES {totalAmountPaid.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">
                From {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-gray-600 text-sm">Total Deductions</p>
              <p className="text-2xl font-bold text-red-600">KES {totalDeductions.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">
                Commission: KES {totalCommission.toFixed(2)}<br/>
                Xray: KES {totalXrayPayment.toFixed(2)}<br/>
                Expenses: KES {totalExpenses.toFixed(2)} ({filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''})
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <p className="text-gray-600 text-sm">Net Amount</p>
              <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                KES {netAmount.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {netAmount >= 0 ? 'Profit' : 'Loss'} for selected period
              </p>
            </div>
          </div>
          
          {/* Additional breakdown section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded shadow">
              <h4 className="font-semibold text-gray-700 mb-2">Payment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Records:</span>
                  <span className="font-medium">{filteredPayments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid Records:</span>
                  <span className="font-medium text-green-600">
                    {filteredPayments.filter(p => p.paymentStatus === 'Paid').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pending Records:</span>
                  <span className="font-medium text-yellow-600">
                    {filteredPayments.filter(p => p.paymentStatus === 'Pending').length}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded shadow">
              <h4 className="font-semibold text-gray-700 mb-2">Period Analysis</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Days in Range:</span>
                  <span className="font-medium">
                    {Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Daily Revenue:</span>
                  <span className="font-medium">
                    KES {(totalAmountPaid / (Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Daily Expenses:</span>
                  <span className="font-medium">
                    KES {(totalExpenses / (Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown Section */}
          <div className="mt-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Payment Method Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-green-800">Cash Payments</h5>
                  <div className="bg-green-100 px-2 py-1 rounded-full text-xs font-medium text-green-700">
                    {cashPayments.length} record{cashPayments.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-700">KES {totalCashAmount.toFixed(2)}</p>
                <p className="text-sm text-green-600 mt-1">
                  {totalAmountPaid > 0 ? ((totalCashAmount / totalAmountPaid) * 100).toFixed(1) : 0}% of total payments
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-blue-800">Paybill Payments</h5>
                  <div className="bg-blue-100 px-2 py-1 rounded-full text-xs font-medium text-blue-700">
                    {paybillPayments.length} record{paybillPayments.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-700">KES {totalPaybillAmount.toFixed(2)}</p>
                <p className="text-sm text-blue-600 mt-1">
                  {totalAmountPaid > 0 ? ((totalPaybillAmount / totalAmountPaid) * 100).toFixed(1) : 0}% of total payments
                </p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-orange-800">Invoice Payments</h5>
                  <div className="bg-orange-100 px-2 py-1 rounded-full text-xs font-medium text-orange-700">
                    {invoicePayments.length} record{invoicePayments.length !== 1 ? 's' : ''}
                  </div>
                </div>
                <p className="text-2xl font-bold text-orange-700">KES {totalInvoiceAmount.toFixed(2)}</p>
                <p className="text-sm text-orange-600 mt-1">
                  {totalAmountPaid > 0 ? ((totalInvoiceAmount / totalAmountPaid) * 100).toFixed(1) : 0}% of total payments
                </p>
              </div>
            </div>
            
            {/* Visual representation */}
            <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
              <h6 className="font-semibold text-gray-700 mb-3">Payment Distribution</h6>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div className="h-full flex">
                  <div 
                    className="bg-green-500 h-full transition-all duration-500"
                    style={{ width: `${totalAmountPaid > 0 ? (totalCashAmount / totalAmountPaid) * 100 : 0}%` }}
                    title={`Cash: ${totalAmountPaid > 0 ? ((totalCashAmount / totalAmountPaid) * 100).toFixed(1) : 0}%`}
                  ></div>
                  <div 
                    className="bg-blue-500 h-full transition-all duration-500"
                    style={{ width: `${totalAmountPaid > 0 ? (totalPaybillAmount / totalAmountPaid) * 100 : 0}%` }}
                    title={`Paybill: ${totalAmountPaid > 0 ? ((totalPaybillAmount / totalAmountPaid) * 100).toFixed(1) : 0}%`}
                  ></div>
                  <div 
                    className="bg-orange-500 h-full transition-all duration-500"
                    style={{ width: `${totalAmountPaid > 0 ? (totalInvoiceAmount / totalAmountPaid) * 100 : 0}%` }}
                    title={`Invoice: ${totalAmountPaid > 0 ? ((totalInvoiceAmount / totalAmountPaid) * 100).toFixed(1) : 0}%`}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                  Cash ({totalAmountPaid > 0 ? ((totalCashAmount / totalAmountPaid) * 100).toFixed(1) : 0}%)
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
                  Paybill ({totalAmountPaid > 0 ? ((totalPaybillAmount / totalAmountPaid) * 100).toFixed(1) : 0}%)
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded mr-1"></div>
                  Invoice ({totalAmountPaid > 0 ? ((totalInvoiceAmount / totalAmountPaid) * 100).toFixed(1) : 0}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'payments' && (
        <>
          {/* Payment Records Table */}
          <div className="bg-white p-6 shadow-lg rounded-lg mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-500">Payment Details</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Show:</label>
                <select
                  value={paymentsPerPage}
                  onChange={(e) => {
                    setPaymentsPerPage(Number(e.target.value));
                    setCurrentPaymentPage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
            </div>
            {filteredPayments.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Patient Name</th>
                        <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Amount Due</th>
                        <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Amount Paid</th>
                        <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Commission</th>
                        <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Xray Payment</th>
                        <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Account Number</th>
                        <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Payment Status</th>
                        <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Date</th>
                        <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPayments.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition duration-200">
                      {editingPaymentId === record._id ? (
                        <>
                          <td className="py-2 px-4 border-b border-gray-200">
                            <input
                              type="text"
                              value={editPaymentData.patientName || ''}
                              onChange={(e) => setEditPaymentData({...editPaymentData, patientName: e.target.value})}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            <input
                              type="number"
                              value={editPaymentData.amountDue || ''}
                              onChange={(e) => setEditPaymentData({...editPaymentData, amountDue: e.target.value})}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            <input
                              type="number"
                              value={editPaymentData.amountPaid || ''}
                              onChange={(e) => setEditPaymentData({...editPaymentData, amountPaid: e.target.value})}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            <input
                              type="number"
                              value={editPaymentData.commission || ''}
                              onChange={(e) => setEditPaymentData({...editPaymentData, commission: e.target.value})}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            <input
                              type="number"
                              value={editPaymentData.xrayPayment || ''}
                              onChange={(e) => setEditPaymentData({...editPaymentData, xrayPayment: e.target.value})}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            <input
                              type="text"
                              value={editPaymentData.accountNumber || ''}
                              onChange={(e) => setEditPaymentData({...editPaymentData, accountNumber: e.target.value})}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            <select
                              value={editPaymentData.paymentStatus || ''}
                              onChange={(e) => setEditPaymentData({...editPaymentData, paymentStatus: e.target.value})}
                              className="w-full px-2 py-1 border rounded"
                            >
                              <option value="Paid">Paid</option>
                              <option value="Pending">Pending</option>
                            </select>
                          </td>
                          <td className="py-2 px-4 border-b border-gray-200">{record.paymentDate}</td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSavePayment(record._id)}
                                className="text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                <FaSave />
                              </button>
                              <button
                                onClick={handleCancelEditPayment}
                                className="text-gray-600 hover:text-gray-800"
                                title="Cancel"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-2 px-4 border-b border-gray-200">{record.patientName}</td>
                          <td className="py-2 px-4 border-b border-gray-200 text-right">KES {record.amountDue}</td>
                          <td className="py-2 px-4 border-b border-gray-200 text-right">KES {record.amountPaid}</td>
                          <td className="py-2 px-4 border-b border-gray-200 text-right">KES {record.commission || 0}</td>
                          <td className="py-2 px-4 border-b border-gray-200 text-right">KES {record.xrayPayment || 0}</td>
                          <td className="py-2 px-4 border-b border-gray-200">{record.accountNumber}</td>
                          <td className={`py-2 px-4 border-b border-gray-200 ${record.paymentStatus === 'Paid' ? 'text-green-500' : 'text-red-500'}`}>{record.paymentStatus}</td>
                          <td className="py-2 px-4 border-b border-gray-200">{record.paymentDate}</td>
                          <td className="py-2 px-4 border-b border-gray-200">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditPayment(record)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeletePayment(record)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {indexOfFirstPayment + 1} to {Math.min(indexOfLastPayment, filteredPayments.length)} of {filteredPayments.length} entries
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePaymentPageChange(currentPaymentPage - 1)}
                      disabled={currentPaymentPage === 1}
                      className={`px-3 py-1 rounded ${
                        currentPaymentPage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Previous
                    </button>
                    {[...Array(totalPaymentPages)].map((_, i) => {
                      const pageNumber = i + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNumber === 1 ||
                        pageNumber === totalPaymentPages ||
                        (pageNumber >= currentPaymentPage - 1 && pageNumber <= currentPaymentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePaymentPageChange(pageNumber)}
                            className={`px-3 py-1 rounded ${
                              currentPaymentPage === pageNumber
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      } else if (
                        pageNumber === currentPaymentPage - 2 ||
                        pageNumber === currentPaymentPage + 2
                      ) {
                        return <span key={pageNumber} className="px-2">...</span>;
                      }
                      return null;
                    })}
                    <button
                      onClick={() => handlePaymentPageChange(currentPaymentPage + 1)}
                      disabled={currentPaymentPage === totalPaymentPages}
                      className={`px-3 py-1 rounded ${
                        currentPaymentPage === totalPaymentPages
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaMoneyBillWave className="text-4xl mx-auto mb-4 text-gray-300" />
                <p>No payment records found for the selected period</p>
                <p className="text-sm mt-2">
                  {startDate.toLocaleDateString() === endDate.toLocaleDateString() 
                    ? `No payments recorded for ${startDate.toLocaleDateString()}`
                    : `No payments recorded between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}`
                  }
                </p>
                <p className="text-xs mt-1 text-gray-400">Try selecting a different date range or clearing filters</p>
              </div>
            )}
          </div>

          {/* Export Button */}
          <button
            onClick={exportToExcel}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
          >
            Export Data to Excel
          </button>
        </>
      )}

      {activeSection === 'expenses' && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-6 text-gray-700">Expense Management</h3>
          
          {/* Add Expense Form */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
            <h4 className="text-md font-semibold mb-4 text-gray-700">Add New Expense</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-gray-700 font-semibold mb-2" htmlFor="expenseDescription">
                  Description
                </label>
                <input
                  type="text"
                  id="expenseDescription"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  placeholder="Enter expense description"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2" htmlFor="expenseAmount">
                  Amount (KES)
                </label>
                <input
                  type="number"
                  id="expenseAmount"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <button
              onClick={handleAddExpense}
              className="mt-4 bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-all duration-200"
            >
              Add Expense
            </button>
          </div>

          {/* Expenses Table */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Expense Records</h3>
            {filteredExpenses.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Show:</label>
                <select
                  value={expensesPerPage}
                  onChange={(e) => {
                    setExpensesPerPage(Number(e.target.value));
                    setCurrentExpensePage(1);
                  }}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">entries</span>
              </div>
            )}
          </div>
          {filteredExpenses.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentExpenses.map((expense) => (
                    <tr key={expense._id} className="hover:bg-gray-50">
                      {editingExpenseId === expense._id ? (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="text"
                              value={editExpenseData.description || ''}
                              onChange={(e) => setEditExpenseData({...editExpenseData, description: e.target.value})}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              value={editExpenseData.amount || ''}
                              onChange={(e) => setEditExpenseData({...editExpenseData, amount: e.target.value})}
                              className="w-full px-2 py-1 border rounded"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.date ? new Date(expense.date).toLocaleDateString() : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveExpense(expense._id)}
                                className="text-green-600 hover:text-green-900 transition-colors duration-200"
                                title="Save"
                              >
                                <FaSave />
                              </button>
                              <button
                                onClick={handleCancelEditExpense}
                                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
                                title="Cancel"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">KES {expense.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expense.date ? new Date(expense.date).toLocaleDateString() : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense)}
                                className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstExpense + 1} to {Math.min(indexOfLastExpense, filteredExpenses.length)} of {filteredExpenses.length} entries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleExpensePageChange(currentExpensePage - 1)}
                  disabled={currentExpensePage === 1}
                  className={`px-3 py-1 rounded ${
                    currentExpensePage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Previous
                </button>
                {[...Array(totalExpensePages)].map((_, i) => {
                  const pageNumber = i + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalExpensePages ||
                    (pageNumber >= currentExpensePage - 1 && pageNumber <= currentExpensePage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handleExpensePageChange(pageNumber)}
                        className={`px-3 py-1 rounded ${
                          currentExpensePage === pageNumber
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentExpensePage - 2 ||
                    pageNumber === currentExpensePage + 2
                  ) {
                    return <span key={pageNumber} className="px-2">...</span>;
                  }
                  return null;
                })}
                <button
                  onClick={() => handleExpensePageChange(currentExpensePage + 1)}
                  disabled={currentExpensePage === totalExpensePages}
                  className={`px-3 py-1 rounded ${
                    currentExpensePage === totalExpensePages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FaMinusCircle className="text-4xl mx-auto mb-4 text-gray-300" />
              <p>No expenses found for the selected period</p>
            </div>
          )}
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all animate-slideUp">
            <div className="flex flex-col items-center">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4 animate-bounce">
                <FaTrash className="text-red-600 text-2xl" />
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Confirm Delete
              </h3>
              
              {/* Message */}
              <p className="text-gray-600 text-center mb-2">
                Are you sure you want to delete this {deleteTarget.type === 'payment' ? 'payment record' : 'expense'}?
              </p>
              <p className="text-gray-800 font-semibold text-center mb-6 px-4 py-2 bg-gray-100 rounded-lg">
                {deleteTarget.name}
              </p>
              
              {/* Warning */}
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 w-full">
                <p className="text-sm text-red-700">
                  <strong>Warning:</strong> This action cannot be undone. The {deleteTarget.type} will be permanently removed from the database.
                </p>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 shadow-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialStatements;
