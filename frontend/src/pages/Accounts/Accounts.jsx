import React, { useState, useEffect, useRef } from 'react';
import { usePatient } from '../../context/patientContext';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import ReactToPrint from 'react-to-print';
import { QRCodeCanvas } from 'qrcode.react';
import * as XLSX from 'xlsx';
import 'react-toastify/dist/ReactToastify.css';
import TopBar from '../../components/TopBar';
import logo from '../../assets/GULF HEALTHCARE KENYA LTD.png';
import Footer from '../../components/Footer';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Document as DocxDocument, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, ImageRun } from "docx";

const Accounts = () => {
  const { patientData, updatePatientData } = usePatient();
  const [amountDue, setAmountDue] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [modeOfPayment, setModeOfPayment] = useState('');
  const [commission, setCommission] = useState('');
  const [xrayPayment, setXrayPayment] = useState('');
  const [selectedPatient, setSelectedPatient] = useState("Select Patient");
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)));
  const [endDate, setEndDate] = useState(new Date());
  const componentRef = useRef();
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [activeSection, setActiveSection] = useState('summary'); // sidebar navigation

  // Calculate financial totals
  const totalAmountPaid = paymentRecords.reduce((sum, record) => sum + parseFloat(record.amountPaid || 0), 0);
  const totalCommission = paymentRecords.reduce((sum, record) => sum + parseFloat(record.commission || 0), 0);
  const totalXrayPayment = paymentRecords.reduce((sum, record) => sum + parseFloat(record.xrayPayment || 0), 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const totalDeductions = totalCommission + totalXrayPayment + totalExpenses;
  const netAmount = totalAmountPaid - totalDeductions;

  useEffect(() => {
    const fetchPaymentRecords = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/patient/account/id');
        setPaymentRecords(response.data);
      } catch (error) {
        console.error('Error fetching payment records:', error);
        toast.error('Error fetching payment records. Please try again.');
      }
    };

    fetchPaymentRecords();

    if (patientData && patientData.personalDetails) {
      setSelectedPatient(patientData.personalDetails.name);
      setAmountDue(parseFloat(patientData.amountDue || 0).toFixed(2));
      setAmountPaid(parseFloat(patientData.amountPaid || 0).toFixed(2));
    }
  }, [patientData]);

  useEffect(() => {
    if (currentRecord) {
      setSelectedPatient(currentRecord.patientName || '');
      setModeOfPayment(currentRecord.modeOfPayment || '');
      setAccountNumber(currentRecord.accountNumber || '');
      setAmountPaid(currentRecord.amountPaid || '');
      setCommission(currentRecord.commission || '');
      setXrayPayment(currentRecord.xrayPayment || '');
      setAmountDue(currentRecord.amountDue || '');
    } else {
      resetForm();
    }
  }, [currentRecord]);

  useEffect(() => {
    fetchExpenses();
  }, [startDate, endDate]);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/expenses');
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Error fetching expenses. Please try again.');
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPatient || !modeOfPayment || !accountNumber || !amountPaid || !commission || !xrayPayment || !amountDue) {
      toast.error('Please enter all required fields.');
      return;
    }

    const newPayment = {
      patientName: selectedPatient,
      modeOfPayment: modeOfPayment,
      accountNumber: accountNumber,
      amountPaid: parseFloat(amountPaid),
      commission: parseFloat(commission),
      xrayPayment: parseFloat(xrayPayment),
      amountDue: parseFloat(amountDue),
      paymentStatus: parseFloat(amountPaid) >= parseFloat(amountDue) ? 'Paid' : 'Pending',
      paymentDate: new Date(),
    };

    try {
      const response = await axios.post('http://localhost:5000/api/patient/account', newPayment);
      const savedPayment = response.data;

      toast.success(`Payment recorded: Due - ${amountDue}, Paid - ${amountPaid}, Account - ${accountNumber},
         Mode - ${modeOfPayment}, Commission - ${commission}, Xray - ${xrayPayment}`);
      setPaymentRecords([...paymentRecords, savedPayment]);
      updatePatientData({
        amountDue: parseFloat(amountDue),
        amountPaid: parseFloat(amountPaid),
        paymentStatus: savedPayment.paymentStatus,
      });
      resetForm();
    } catch (error) {
      toast.error('Error recording payment. Please try again.');
    }
  };

  const handleUpdateSubmit = async () => {
    if (!selectedPatient || !modeOfPayment || !accountNumber || !amountPaid || !commission || !xrayPayment || !amountDue) {
      toast.error('Please enter all required fields.');
      return;
    }

    const updatedPayment = {
      ...currentRecord,
      patientName: selectedPatient,
      modeOfPayment: modeOfPayment,
      accountNumber: accountNumber,
      amountPaid: parseFloat(amountPaid),
      commission: parseFloat(commission),
      xrayPayment: parseFloat(xrayPayment),
      amountDue: parseFloat(amountDue),
      paymentStatus: parseFloat(amountPaid) >= parseFloat(amountDue) ? 'Paid' : 'Pending',
    };

    try {
      await axios.put(`http://localhost:5000/api/patient/account/${currentRecord._id}`, updatedPayment);
      setPaymentRecords(paymentRecords.map(record =>
        record._id === currentRecord._id ? updatedPayment : record
      ));
      toast.success('Payment record updated successfully.');
      resetForm();
    } catch (error) {
      console.error('Error updating payment record:', error);
      toast.error('Error updating payment record. Please try again.');
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

  const resetForm = () => {
    setSelectedPatient('');
    setModeOfPayment('');
    setAccountNumber('');
    setAmountPaid('');
    setCommission('');
    setXrayPayment('');
    setAmountDue('');
    setCurrentRecord(null);
  };

  const filterRecordsByDate = (records) => {
    return records.filter(record => {
      const recordDate = new Date(record.paymentDate || record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });
  };

  const exportToExcel = () => {
    const filteredPayments = filterRecordsByDate(paymentRecords);

    const paymentData = filteredPayments.map(payment => ({
      'Patient Name': payment.patientName,
      'Mode of Payment': payment.modeOfPayment,
      'REF NO.': payment.accountNumber,
      'Amount Paid': payment.amountPaid,
      'Commission': payment.commission,
      'Xray Payment': payment.xrayPayment,
      'Amount Due': payment.amountDue,
      'Payment Status': payment.paymentStatus,
      'Date': new Date(payment.paymentDate).toLocaleDateString(),
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

    const expensesData = expenses.map(exp => ({
      'Description': exp.description,
      'Amount': exp.amount,
      'Date': new Date(exp.date).toLocaleDateString(),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(paymentData), 'Payments');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesData), 'Expenses');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');
    XLSX.writeFile(wb, `Financial_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportToWord = () => {
    const filteredPayments = filterRecordsByDate(paymentRecords);

    // Payment Table Rows
    const paymentRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Patient Name")] }),
          new TableCell({ children: [new Paragraph("Mode of Payment")] }),
          new TableCell({ children: [new Paragraph("REF NO.")] }),
          new TableCell({ children: [new Paragraph("Amount Paid")] }),
          new TableCell({ children: [new Paragraph("Commission")] }),
          new TableCell({ children: [new Paragraph("Xray Payment")] }),
          new TableCell({ children: [new Paragraph("Amount Due")] }),
          new TableCell({ children: [new Paragraph("Payment Status")] }),
          new TableCell({ children: [new Paragraph("Date")] }),
        ],
      }),
      ...filteredPayments.map((record) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(record.patientName || "")] }),
            new TableCell({ children: [new Paragraph(record.modeOfPayment || "")] }),
            new TableCell({ children: [new Paragraph(record.accountNumber || "")] }),
            new TableCell({ children: [new Paragraph(String(record.amountPaid || ""))] }),
            new TableCell({ children: [new Paragraph(String(record.commission || ""))] }),
            new TableCell({ children: [new Paragraph(String(record.xrayPayment || ""))] }),
            new TableCell({ children: [new Paragraph(String(record.amountDue || ""))] }),
            new TableCell({ children: [new Paragraph(record.paymentStatus || "")] }),
            new TableCell({ children: [new Paragraph(record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : "")] }),
          ],
        })
      ),
    ];

    // Expenses Table Rows
    const expenseRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Description")] }),
          new TableCell({ children: [new Paragraph("Amount")] }),
          new TableCell({ children: [new Paragraph("Date")] }),
        ],
      }),
      ...filteredExpenses.map((exp) =>
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph(exp.description || "")] }),
            new TableCell({ children: [new Paragraph(String(exp.amount || ""))] }),
            new TableCell({ children: [new Paragraph(exp.date ? new Date(exp.date).toLocaleDateString() : "")] }),
          ],
        })
      ),
    ];

    // Summary Table
    const summaryRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Total Amount Paid")] }),
          new TableCell({ children: [new Paragraph(`KES ${totalAmountPaid.toFixed(2)}`)] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Total Commission")] }),
          new TableCell({ children: [new Paragraph(`KES ${totalCommission.toFixed(2)}`)] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Total Xray Payment")] }),
          new TableCell({ children: [new Paragraph(`KES ${totalXrayPayment.toFixed(2)}`)] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Total Expenses")] }),
          new TableCell({ children: [new Paragraph(`KES ${totalExpenses.toFixed(2)}`)] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Total Deductions")] }),
          new TableCell({ children: [new Paragraph(`KES ${totalDeductions.toFixed(2)}`)] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Net Amount")] }),
          new TableCell({ children: [new Paragraph(`KES ${netAmount.toFixed(2)}`)] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Date Range")] }),
          new TableCell({ children: [new Paragraph(`${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`)] }),
        ],
      }),
    ];

    const doc = new DocxDocument({
      sections: [
        {
          children: [
            new Paragraph({
              text: "Health Center - Financial Report",
              heading: HeadingLevel.TITLE,
              alignment: "center",
            }),
            new Paragraph({
              text: `Date Range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
              alignment: "center",
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }),
            new Table({ rows: summaryRows }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Payment Records", heading: HeadingLevel.HEADING_2 }),
            new Table({ rows: paymentRows }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Expenses", heading: HeadingLevel.HEADING_2 }),
            new Table({ rows: expenseRows }),
            new Paragraph({ text: "" }),
            new Paragraph({
              text: "Thank you for choosing our health center!",
              alignment: "center",
            }),
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Financial_Report_${new Date().toISOString().slice(0, 10)}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  };

  const filteredPayments = filterRecordsByDate(paymentRecords);
  const filteredExpenses = filterRecordsByDate(expenses);

  // Sidebar + Main Content Layout
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-teal-900 text-white flex flex-col py-8 px-4">
          <h2 className="text-2xl font-bold mb-8 text-center">Accounts Menu</h2>
          <nav className="flex flex-col space-y-4">
            <button
              className={`text-left px-4 py-2 rounded ${activeSection === 'summary' ? 'bg-teal-700 font-bold' : 'hover:bg-teal-800'}`}
              onClick={() => setActiveSection('summary')}
            >
              Financial Summary
            </button>
            <button
              className={`text-left px-4 py-2 rounded ${activeSection === 'payments' ? 'bg-teal-700 font-bold' : 'hover:bg-teal-800'}`}
              onClick={() => setActiveSection('payments')}
            >
              Payments
            </button>
            <button
              className={`text-left px-4 py-2 rounded ${activeSection === 'expenses' ? 'bg-teal-700 font-bold' : 'hover:bg-teal-800'}`}
              onClick={() => setActiveSection('expenses')}
            >
              Expenses
            </button>
          </nav>
        </aside>
        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-2xl p-8 space-y-8">
            <ToastContainer />
            <div className="border-b border-gray-200 pb-6">
              <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Accounts Office</h1>
              <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
            </div>
            {/* Date Range Selector */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Date Range Filter</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Start Date</label>
                  <DatePicker
                    selected={startDate}
                    onChange={date => setStartDate(date)}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">End Date</label>
                  <DatePicker
                    selected={endDate}
                    onChange={date => setEndDate(date)}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
            {/* Conditional Sections */}
            {activeSection === 'summary' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
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
            )}
            {activeSection === 'payments' && (
              <div>
                {/* Patient Payment Form */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
                  <h2 className="text-xl font-semibold mb-4 text-gray-700">Patient Payment</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2" htmlFor="patientSelect">
                          Select Patient
                        </label>
                        <select
                          id="patientSelect"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out bg-white"
                          value={selectedPatient}
                          onChange={(e) => setSelectedPatient(e.target.value)}
                          disabled={!patientData.patients || patientData.patients.length === 0}
                        >
                          <option value="" disabled>Select Patient</option>
                          {patientData.patients.length > 0 ? (
                            patientData.patients.map((patient) => (
                              <option key={patient.labNumber} value={patient.name}>
                                {patient.name}
                              </option>
                            ))
                          ) : (
                            <option>No patients available</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2" htmlFor="modeOfPayment">
                          Mode of Payment
                        </label>
                        <select
                          id="modeOfPayment"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out bg-white"
                          value={modeOfPayment}
                          onChange={(e) => setModeOfPayment(e.target.value)}
                        >
                          <option value="">-- Select Mode of Payment --</option>
                          <option value="Cash">Cash</option>
                          <option value="Paybill">Paybill</option>
                          <option value="Invoice">Invoice</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2" htmlFor="accountNumber">
                          REF NO.
                        </label>
                        <input
                          type="text"
                          id="accountNumber"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Enter REF NO."
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2" htmlFor="amountPaid">
                          Amount Paid
                        </label>
                        <input
                          type="number"
                          id="amountPaid"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          placeholder="Enter amount paid"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2" htmlFor="commission">
                          Commission
                        </label>
                        <input
                          type="number"
                          id="commission"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                          value={commission}
                          onChange={(e) => setCommission(e.target.value)}
                          placeholder="Enter commission"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2" htmlFor="xrayPayment">
                          Xray Payment
                        </label>
                        <input
                          type="number"
                          id="xrayPayment"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                          value={xrayPayment}
                          onChange={(e) => setXrayPayment(e.target.value)}
                          placeholder="Enter xray payment"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-gray-700 font-semibold mb-2" htmlFor="amountDue">
                      Amount Due
                    </label>
                    <input
                      type="number"
                      id="amountDue"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                      value={amountDue}
                      onChange={(e) => setAmountDue(e.target.value)}
                      placeholder="Enter amount due"
                    />
                  </div>
                  <button
                    onClick={currentRecord ? handleUpdateSubmit : handlePaymentSubmit}
                    className="w-full mt-4 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {currentRecord ? 'Update Payment' : 'Record Payment'}
                  </button>
                </div>
                {/* Payment Records Section */}
                <div className="mt-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Payment Records</h2>
                    <div className="space-x-2">
                      {filteredPayments.length > 0 && (
                        <ReactToPrint
                          trigger={() => (
                            <button className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                              Print Records
                            </button>
                          )}
                          content={() => componentRef.current}
                        />
                      )}
                      <button
                        onClick={exportToExcel}
                        className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Export to Excel
                      </button>
                      <button
                        onClick={exportToWord}
                        className="bg-purple-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-600 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                      >
                        Export to Word
                      </button>
                    </div>
                  </div>
                  {filteredPayments.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div ref={componentRef} className="printable">
                        <style>
                          {`
                            @media print {
                              .printable {
                                margin: 0;
                                padding: 20px;
                                background: white;
                                color: black;
                              }
                              .printable h1, .printable h2 {
                                text-align: center;
                                margin-bottom: 20px;
                              }
                              .printable table {
                                width: 100%;
                                border-collapse: collapse;
                                margin-bottom: 20px;
                              }
                              .printable th, .printable td {
                                border: 1px solid #ddd;
                                padding: 12px;
                                text-align: left;
                              }
                              .printable th {
                                background-color: #f8f9fa;
                              }
                              .printable tr:nth-child(even) {
                                background-color: #f8f9fa;
                              }
                            }
                          `}
                        </style>

                        <header className="text-center p-6 border-b border-gray-200">
                          <img src={logo} alt="Logo" className="w-64 mx-auto mb-4" />
                          <h1 className="text-2xl font-bold text-gray-800">Health Center</h1>
                          <h2 className="text-xl text-gray-600">Payment Records</h2>
                          <p className="text-gray-500">
                            Date Range: {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
                          </p>
                        </header>

                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mode of Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REF NO.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Paid</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Xray Payment</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredPayments.map((record) => (
                                <tr key={record._id} className="hover:bg-gray-50 transition-colors duration-150">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.patientName}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.modeOfPayment}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.accountNumber}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.amountPaid}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.commission}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.xrayPayment}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.amountDue}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.paymentStatus === 'Paid'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                      {record.paymentStatus}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(record.paymentDate).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Printable Summary */}
                        <footer className="mt-8 text-center p-6 border-t border-gray-200">
                          <div className="flex flex-col items-center justify-center space-y-4">
                            <QRCodeCanvas
                              value={`Financial Report: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`}
                              size={128}
                              className="mb-4"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                              <div className="bg-gray-100 p-4 rounded">
                                <p className="font-semibold">Total Payments</p>
                                <p className="text-green-600 font-bold">KES {totalAmountPaid.toFixed(2)}</p>
                              </div>
                              <div className="bg-gray-100 p-4 rounded">
                                <p className="font-semibold">Total Deductions</p>
                                <p className="text-red-600 font-bold">KES {totalDeductions.toFixed(2)}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  (Commission: KES {totalCommission.toFixed(2)} + Xray: KES {totalXrayPayment.toFixed(2)} + Expenses: KES {totalExpenses.toFixed(2)})
                                </p>
                              </div>
                              <div className="bg-gray-100 p-4 rounded">
                                <p className="font-semibold">Net Amount</p>
                                <p className={`font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  KES {netAmount.toFixed(2)}
                                </p>
                              </div>
                            </div>
                            <p className="text-gray-600 font-medium">Thank you for choosing our health center!</p>
                            <p className="text-sm text-gray-500">For any inquiries, please contact our support team</p>
                          </div>
                        </footer>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-md p-8 text-center">
                      <p className="text-gray-700 text-lg">No payment records available for the selected date range.</p>
                    </div>
                  )}
                </div>
              </div>
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
                {expenses.length > 0 && (
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
                          {expenses.map((expense) => (
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
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Accounts;