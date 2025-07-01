import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const FinancialStatements = () => {
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [loading, setLoading] = useState(true); // State to manage loading
  const [error, setError] = useState(null); // State to manage errors
  const [expenses, setExpenses] = useState([]);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [activeSection, setActiveSection] = useState('payments'); // 'payments' or 'expenses'
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [endDate, setEndDate] = useState(new Date());

  useEffect(() => {
    const fetchPaymentRecords = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/patient/account/:id');
        console.log('Payment records:', response.data);
        setPaymentRecords(response.data);
      } catch (error) {
        console.error('Error fetching payment records:', error.response || error.message);
        setError(error.response?.data?.message || error.message || 'Unknown error');
        toast.error(`Error fetching payment records: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      } finally {
        setLoading(false); // Set loading to false after the API call
      }
    };

    fetchPaymentRecords();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate]);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/expenses');
      setExpenses(response.data);
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
      const response = await axios.post('http://localhost:5000/api/expenses', {
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

  const handleDeleteExpense = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`);
      setExpenses(expenses.filter(exp => exp._id !== id));
      toast.success('Expense deleted.');
    } catch (error) {
      toast.error('Error deleting expense.');
    }
  };

  const calculateChartData = () => {
    const paidCount = paymentRecords.filter(record => record.paymentStatus === 'Paid').length;
    const pendingCount = paymentRecords.filter(record => record.paymentStatus === 'Pending').length;
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
    return records.filter(record => {
      const recordDate = new Date(record.paymentDate || record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });
  };

  // Totals for summary
  const filteredPayments = filterRecordsByDate(paymentRecords);
  const filteredExpenses = filterRecordsByDate(expenses);
  const totalAmountPaid = filteredPayments.reduce((sum, r) => sum + parseFloat(r.amountPaid || 0), 0);
  const totalCommission = filteredPayments.reduce((sum, r) => sum + parseFloat(r.commission || 0), 0);
  const totalXrayPayment = filteredPayments.reduce((sum, r) => sum + parseFloat(r.xrayPayment || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const totalDeductions = totalCommission + totalXrayPayment + totalExpenses;
  const netAmount = totalAmountPaid - totalDeductions;

  // Optional: Render loading state or error message
  if (loading) {
    return <div className="text-center text-lg">Loading payment records...</div>;
  }

  if (error) {
    return <div className="text-center text-lg text-red-600">Error: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-8 bg-gray-100 shadow-lg rounded-lg">
      <ToastContainer />
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-600">Financial Statements</h1>

      {/* Dropdown for section selection */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <label className="font-semibold mr-2">Section:</label>
          <select
            value={activeSection}
            onChange={e => setActiveSection(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option value="payments">Payments</option>
            <option value="expenses">Expenses</option>
          </select>
        </div>
      </div>

      {/* Date Filter Section */}
      <div className="bg-white p-6 shadow-lg rounded-lg mb-8">
        <h2 className="text-xl font-semibold text-center mb-4 text-blue-500">Filter by Date</h2>
        <div className="flex justify-center gap-4">
          <div className="w-full max-w-xs">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
              Start Date
            </label>
            <DatePicker
              selected={startDate}
              onChange={date => setStartDate(date)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              dateFormat="yyyy-MM-dd"
            />
          </div>
          <div className="w-full max-w-xs">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
              End Date
            </label>
            <DatePicker
              selected={endDate}
              onChange={date => setEndDate(date)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              dateFormat="yyyy-MM-dd"
            />
          </div>
        </div>
      </div>

      {activeSection === 'payments' && (
        <>
          {/* Chart Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 shadow-lg rounded-lg">
              <h2 className="text-xl font-semibold text-center mb-4 text-blue-500">Payment Status</h2>
              <Doughnut data={calculateChartData()} />
            </div>

            <div className="bg-white p-6 shadow-lg rounded-lg">
              <h2 className="text-xl font-semibold text-center mb-4 text-blue-500">Payment Distribution</h2>
              <Bar
                data={{
                  labels: paymentRecords.map(record => record.patientName),
                  datasets: [
                    {
                      label: 'Amount Due',
                      data: paymentRecords.map(record => record.amountDue),
                      backgroundColor: '#FF6347',
                    },
                    {
                      label: 'Amount Paid',
                      data: paymentRecords.map(record => record.amountPaid),
                      backgroundColor: '#4CAF50',
                    },
                    {
                      label: 'Commission',
                      data: paymentRecords.map(record => record.commission || 0),
                      backgroundColor: '#FFD700',
                    },
                    {
                      label: 'Xray Payment',
                      data: paymentRecords.map(record => record.xrayPayment || 0),
                      backgroundColor: '#00BFFF',
                    }
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    title: { display: true, text: 'Financial Breakdown by Patient' }
                  },
                  scales: {
                    x: { stacked: false },
                    y: { beginAtZero: true }
                  }
                }}
              />
            </div>
          </div>

          {/* Payment Records Table */}
          <div className="bg-white p-6 shadow-lg rounded-lg mb-8 overflow-x-auto">
            <h2 className="text-xl font-semibold text-center mb-4 text-blue-500">Payment Details</h2>
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Patient Name</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Amount Due</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Amount Paid</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Commission</th> {/* NEW */}
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Xray Payment</th> {/* NEW */}
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Account Number</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Payment Status</th>
                  <th className="py-2 px-4 border-b border-gray-200 text-left text-gray-600 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {paymentRecords.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition duration-200">
                    <td className="py-2 px-4 border-b border-gray-200">{record.patientName}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-right">sh {record.amountDue}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-right">sh {record.amountPaid}</td>
                    <td className="py-2 px-4 border-b border-gray-200 text-right">{record.commission || 0}</td> {/* NEW */}
                    <td className="py-2 px-4 border-b border-gray-200 text-right">{record.xrayPayment || 0}</td> {/* NEW */}
                    <td className="py-2 px-4 border-b border-gray-200">{record.accountNumber}</td>
                    <td className={`py-2 px-4 border-b border-gray-200 ${record.paymentStatus === 'Paid' ? 'text-green-500' : 'text-red-500'}`}>{record.paymentStatus}</td>
                    <td className="py-2 px-4 border-b border-gray-200">{record.paymentDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-800">Financial Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded shadow">
                <p className="text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-green-600">KES {totalAmountPaid.toFixed(2)}</p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <p className="text-gray-600">Total Deductions</p>
                <p className="text-2xl font-bold text-red-600">KES {totalDeductions.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">
                  (Commission: KES {totalCommission.toFixed(2)} + Xray: KES {totalXrayPayment.toFixed(2)} + Expenses: KES {totalExpenses.toFixed(2)})
                </p>
              </div>
              <div className="bg-white p-3 rounded shadow">
                <p className="text-gray-600">Net Amount</p>
                <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  KES {netAmount.toFixed(2)}
                </p>
              </div>
            </div>
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
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Expenses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="expenseDescription">
                Description
              </label>
              <input
                type="text"
                id="expenseDescription"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                placeholder="Enter expense description"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-2" htmlFor="expenseAmount">
                Amount
              </label>
              <input
                type="number"
                id="expenseAmount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm"
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
          {filteredExpenses.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Recent Expenses</h3>
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
                    {filteredExpenses.map((expense) => (
                      <tr key={expense._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.amount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.date ? new Date(expense.date).toLocaleDateString() : ''}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteExpense(expense._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialStatements;
