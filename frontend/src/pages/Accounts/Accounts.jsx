import React, { useState, useEffect, useRef } from 'react';
import { usePatient } from '../../context/patientContext';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
// import ReactToPrint from 'react-to-print';
import { QRCodeCanvas } from 'qrcode.react';
import * as XLSX from 'xlsx';
import 'react-toastify/dist/ReactToastify.css';
import TopBar from '../../components/TopBar';
import logo from '../../assets/GULF HEALTHCARE KENYA LTD.png';
import Footer from '../../components/Footer';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Document as DocxDocument, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, ImageRun } from "docx";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.vfs;

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
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const componentRef = useRef();
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [activeSection, setActiveSection] = useState('summary');
  const [searchPatientName, setSearchPatientName] = useState('');
  
  // New states for direct patient data fetching
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [pendingPatients, setPendingPatients] = useState([]);
  const [loadingPendingPatients, setLoadingPendingPatients] = useState(true);

  // Filter function
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
      const nameMatch = searchPatientName === '' || 
        (record.patientName && record.patientName.toLowerCase().includes(searchPatientName.toLowerCase()));
      
      return dateMatch && nameMatch;
    });
  };

  // Filter records by date range and search
  const filteredPayments = filterRecordsByDate(paymentRecords);
  const filteredExpenses = filterRecordsByDate(expenses);

  // Calculate financial totals based on filtered data (date range)
  const totalAmountPaid = filteredPayments.reduce((sum, record) => sum + parseFloat(record.amountPaid || 0), 0);
  const totalCommission = filteredPayments.reduce((sum, record) => sum + parseFloat(record.commission || 0), 0);
  const totalXrayPayment = filteredPayments.reduce((sum, record) => sum + parseFloat(record.xrayPayment || 0), 0);
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

  // Helper function to fetch pending patients
  const fetchPendingPatients = async () => {
    try {
      console.log('Fetching pending patients...');
      const response = await axios.get('http://localhost:5000/api/patient/pending-payment');
      console.log('Fetched pending patients response:', response.data);
      
      const pendingPatientsData = Array.isArray(response.data) ? response.data : [];
      console.log('Processed pending patients data:', pendingPatientsData);
      
      setPendingPatients(pendingPatientsData);
    } catch (error) {
      console.error('Error fetching pending patients:', error);
      toast.error('Failed to fetch pending patients data.');
      setPendingPatients([]);
    } finally {
      setLoadingPendingPatients(false);
    }
  };

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

    const fetchAllPatients = async () => {
      try {
        console.log('Fetching patients for Accounts...');
        const response = await axios.get('http://localhost:5000/api/patient');
        console.log('Fetched patients response:', response.data);
        
        // Handle different response structures - backend returns array directly
        const patientsData = Array.isArray(response.data) ? response.data : (response.data.patients || []);
        console.log('Processed patients data:', patientsData);
        
        setPatients(patientsData);
        toast.success(`Loaded ${patientsData.length} patients for payments`);
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast.error('Failed to fetch patients data.');
        setPatients([]);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPaymentRecords();
    fetchAllPatients();
    fetchPendingPatients();

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

      // Mark patient payment as recorded
      await axios.put('http://localhost:5000/api/patient/mark-payment-recorded', {
        patientName: selectedPatient
      });

      toast.success(`Payment recorded: Due - ${amountDue}, Paid - ${amountPaid}, Account - ${accountNumber},
         Mode - ${modeOfPayment}, Commission - ${commission}, Xray - ${xrayPayment}`);
      setPaymentRecords([...paymentRecords, savedPayment]);
      updatePatientData({
        amountDue: parseFloat(amountDue),
        amountPaid: parseFloat(amountPaid),
        paymentStatus: savedPayment.paymentStatus,
      });
      
      // Remove patient from pending list
      setPendingPatients(pendingPatients.filter(patient => patient.name !== selectedPatient));
      
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
      
      // If payment status is updated to "Paid", refresh pending patients list
      if (updatedPayment.paymentStatus === 'Paid') {
        fetchPendingPatients();
        // Remove patient from pending list immediately in UI
        setPendingPatients(pendingPatients.filter(patient => patient.name !== selectedPatient));
      }
      
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

  const exportToExcel = () => {
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
      '': '',
      'Payment Method Breakdown': '',
      'Cash Payments': totalCashAmount,
      'Cash Records': cashPayments.length,
      'Paybill Payments': totalPaybillAmount,
      'Paybill Records': paybillPayments.length,
      'Invoice Payments': totalInvoiceAmount,
      'Invoice Records': invoicePayments.length,
    }];

    const expensesData = filteredExpenses.map(exp => ({
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

  const exportExpensesToExcel = () => {
    const expensesData = filteredExpenses.map(expense => ({
      'Description': expense.description,
      'Amount (KES)': parseFloat(expense.amount || 0).toFixed(2),
      'Date': expense.date ? new Date(expense.date).toLocaleDateString() : '',
    }));

    const summaryData = [{
      'Total Expenses': `KES ${filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0).toFixed(2)}`,
      'Number of Records': filteredExpenses.length,
      'Date Range': `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
      'Report Generated': new Date().toLocaleDateString(),
    }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expensesData), 'Expenses');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');
    XLSX.writeFile(wb, `Expenses_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    
    toast.success('Expenses data exported to Excel successfully!');
  };

  const exportToWord = async () => {
    // Fetch logo as Uint8Array
    const getLogoUint8Array = async () => {
      const response = await fetch(logo);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    };

    const logoUint8Array = await getLogoUint8Array();

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

    // Payment Method Breakdown Table
    const paymentMethodRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Payment Method")] }),
          new TableCell({ children: [new Paragraph("Amount")] }),
          new TableCell({ children: [new Paragraph("Records Count")] }),
          new TableCell({ children: [new Paragraph("Percentage")] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Cash")] }),
          new TableCell({ children: [new Paragraph(`KES ${totalCashAmount.toFixed(2)}`)] }),
          new TableCell({ children: [new Paragraph(cashPayments.length.toString())] }),
          new TableCell({ children: [new Paragraph(`${totalAmountPaid > 0 ? ((totalCashAmount / totalAmountPaid) * 100).toFixed(1) : 0}%`)] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Paybill")] }),
          new TableCell({ children: [new Paragraph(`KES ${totalPaybillAmount.toFixed(2)}`)] }),
          new TableCell({ children: [new Paragraph(paybillPayments.length.toString())] }),
          new TableCell({ children: [new Paragraph(`${totalAmountPaid > 0 ? ((totalPaybillAmount / totalAmountPaid) * 100).toFixed(1) : 0}%`)] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph("Invoice")] }),
          new TableCell({ children: [new Paragraph(`KES ${totalInvoiceAmount.toFixed(2)}`)] }),
          new TableCell({ children: [new Paragraph(invoicePayments.length.toString())] }),
          new TableCell({ children: [new Paragraph(`${totalAmountPaid > 0 ? ((totalInvoiceAmount / totalAmountPaid) * 100).toFixed(1) : 0}%`)] }),
        ],
      }),
    ];

    const doc = new DocxDocument({
      sections: [
        {
          children: [
            // Add logo at the top
            new Paragraph({
              children: [
                new ImageRun({
                  data: logoUint8Array,
                  transformation: { width: 200, height: 60 },
                }),
              ],
              alignment: "center",
            }),
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
            new Paragraph({ text: "Payment Method Breakdown", heading: HeadingLevel.HEADING_2 }),
            new Table({ rows: paymentMethodRows }),
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

  const printPDF = async () => {
    // Convert logo to base64
    const getLogoBase64 = async () => {
      const response = await fetch(logo);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    };
    const logoBase64 = await getLogoBase64();

    // Calculate totals for filtered payments and expenses
    const totalPayments = filteredPayments.reduce((sum, record) => sum + parseFloat(record.amountPaid || 0), 0);
    const totalExpensesFiltered = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);

    // Payment Table
    const paymentTable = [
      [
        "Patient Name", "Mode of Payment", "REF NO.", "Amount Paid", "Commission", "Xray Payment", "Amount Due", "Payment Status", "Date"
      ],
      ...filteredPayments.map(record => [
        record.patientName || "",
        record.modeOfPayment || "",
        record.accountNumber || "",
        record.amountPaid || "",
        record.commission || "",
        record.xrayPayment || "",
        record.amountDue || "",
        record.paymentStatus || "",
        record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : ""
      ])
    ];

    // Expenses Table
    const expenseTable = [
      ["Description", "Amount", "Date"],
      ...filteredExpenses.map(exp => [
        exp.description || "",
        exp.amount || "",
        exp.date ? new Date(exp.date).toLocaleDateString() : ""
      ]),
    ];

    // Summary Table
    const summaryTable = [
      ["Total Amount Paid", `KES ${totalAmountPaid.toFixed(2)}`],
      ["Total Commission", `KES ${totalCommission.toFixed(2)}`],
      ["Total Xray Payment", `KES ${totalXrayPayment.toFixed(2)}`],
      ["Total Expenses", `KES ${totalExpenses.toFixed(2)}`],
      ["Total Deductions", `KES ${totalDeductions.toFixed(2)}`],
      ["Net Amount", `KES ${netAmount.toFixed(2)}`],
      ["Date Range", `${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`],
    ];

    // Payment Method Breakdown Table
    const paymentMethodTable = [
      ["Payment Method", "Amount", "Records", "Percentage"],
      ["Cash", `KES ${totalCashAmount.toFixed(2)}`, cashPayments.length.toString(), `${totalAmountPaid > 0 ? ((totalCashAmount / totalAmountPaid) * 100).toFixed(1) : 0}%`],
      ["Paybill", `KES ${totalPaybillAmount.toFixed(2)}`, paybillPayments.length.toString(), `${totalAmountPaid > 0 ? ((totalPaybillAmount / totalAmountPaid) * 100).toFixed(1) : 0}%`],
      ["Invoice", `KES ${totalInvoiceAmount.toFixed(2)}`, invoicePayments.length.toString(), `${totalAmountPaid > 0 ? ((totalInvoiceAmount / totalAmountPaid) * 100).toFixed(1) : 0}%`],
    ];

    // PDF Document Definition
    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      defaultStyle: {
        fontSize: 8 // Reduce the default font size for all content
      },
      content: [
        {
          image: logoBase64,
          width: 200,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        { text: "Financial Report", style: "header", alignment: "center" },
        { text: `Date Range: ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`, alignment: "center", margin: [0, 0, 0, 10] },
        { text: "Summary", style: "subheader" },
        { table: { body: summaryTable }, margin: [0, 0, 0, 10] },
        { text: "Payment Method Breakdown", style: "subheader" },
        { table: { body: paymentMethodTable }, margin: [0, 0, 0, 10] },
        { text: "Payment Records", style: "subheader" },
        { table: { body: paymentTable }, margin: [0, 0, 0, 10] },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              table: {
                body: [
                  [
                    { text: 'Total Payments:', bold: true, alignment: 'right' },
                    { text: `KES ${totalPayments.toFixed(2)}`, bold: true }
                  ]
                ]
              },
              layout: 'noBorders',
              margin: [0, 0, 0, 10]
            }
          ]
        },
        { text: "Expenses", style: "subheader" },
        { table: { body: expenseTable }, margin: [0, 0, 0, 10] },
        {
          columns: [
            { width: '*', text: '' },
            {
              width: 'auto',
              table: {
                body: [
                  [
                    { text: 'Total Expenses:', bold: true, alignment: 'right' },
                    { text: `KES ${totalExpensesFiltered.toFixed(2)}`, bold: true }
                  ]
                ]
              },
              layout: 'noBorders',
              margin: [0, 0, 0, 10]
            }
          ]
        },
        { text: "Thank you for choosing our health center!", alignment: "center", margin: [0, 20, 0, 0] }
      ],
      styles: {
        header: { fontSize: 12, bold: true, margin: [0, 0, 0, 10] },
        subheader: { fontSize: 10, bold: true, margin: [0, 10, 0, 5] }
      }
    };

    pdfMake.createPdf(docDefinition).print();
  };

  // Sidebar + Main Content Layout
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-80 bg-teal-900 text-white flex flex-col py-8 px-4 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Accounts Menu</h2>
          
          {/* Navigation Menu */}
          <nav className="flex flex-col space-y-4 mb-8">
            <button
              className={`text-left px-4 py-2 rounded ${activeSection === 'summary' ? 'bg-teal-700 font-bold' : 'hover:bg-teal-800'}`}
              onClick={() => setActiveSection('summary')}
            >
              Financial Summary
            </button>
            <button
              className={`text-left px-4 py-2 rounded flex items-center justify-between ${activeSection === 'payments' ? 'bg-teal-700 font-bold' : 'hover:bg-teal-800'}`}
              onClick={() => setActiveSection('payments')}
            >
              <span>Payments</span>
              {pendingPatients.length > 0 && (
                <span className="bg-yellow-500 text-teal-900 text-xs px-2 py-1 rounded-full font-bold ml-2">
                  {pendingPatients.length}
                </span>
              )}
            </button>
            <button
              className={`text-left px-4 py-2 rounded ${activeSection === 'expenses' ? 'bg-teal-700 font-bold' : 'hover:bg-teal-800'}`}
              onClick={() => setActiveSection('expenses')}
            >
              Expenses
            </button>
          </nav>

          {/* Pending Patients Section */}
          <div className="border-t border-teal-700 pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
              <span>Pending Payments</span>
              <span className="bg-yellow-500 text-teal-900 text-xs px-2 py-1 rounded-full font-bold">
                {pendingPatients.length}
              </span>
            </h3>
            
            {loadingPendingPatients ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <p className="text-teal-200 text-sm mt-2">Loading...</p>
              </div>
            ) : pendingPatients.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pendingPatients.map((patient, index) => (
                  <div 
                    key={patient._id} 
                    className="bg-teal-800 p-3 rounded-lg cursor-pointer hover:bg-teal-700 transition-colors duration-200 border border-teal-600"
                    onClick={() => {
                      setSelectedPatient(patient.name);
                      setActiveSection('payments');
                      // Auto-scroll to payment form
                      setTimeout(() => {
                        document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-white text-sm">{patient.name}</h4>
                      <span className="text-xs px-2 py-1 bg-yellow-500 text-teal-900 rounded-full font-medium">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="text-xs text-teal-200 space-y-1">
                      <p><span className="font-medium">Passport:</span> {patient.passportNumber}</p>
                      <p><span className="font-medium">Type:</span> {patient.medicalType}</p>
                      <p><span className="font-medium">Age:</span> {patient.age}y</p>
                      <p><span className="font-medium">Submitted:</span> {new Date(patient.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="mt-2 text-xs text-yellow-300 font-medium flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Click to process
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-teal-200">
                <div className="text-2xl mb-2">✅</div>
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs">No pending payments.</p>
              </div>
            )}
          </div>
        </aside>
        
        {/* Main Content Container */}
        <div className="flex-1 flex flex-col">
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
                <h2 className="text-xl font-semibold mb-4 text-blue-800">
                  Financial Summary
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    ({startDate.toLocaleDateString()} to {endDate.toLocaleDateString()})
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded shadow">
                    <p className="text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-green-600">KES {totalAmountPaid.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      From {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <p className="text-gray-600">Total Deductions</p>
                    <p className="text-2xl font-bold text-red-600">KES {totalDeductions.toFixed(2)}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Commission: KES {totalCommission.toFixed(2)}<br/>
                      Xray: KES {totalXrayPayment.toFixed(2)}<br/>
                      Expenses: KES {totalExpenses.toFixed(2)} ({filteredExpenses.length} expense{filteredExpenses.length !== 1 ? 's' : ''})
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded shadow">
                    <p className="text-gray-600">Net Amount</p>
                    <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      KES {netAmount.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {netAmount >= 0 ? 'Profit' : 'Loss'} for selected period
                    </p>
                  </div>
                </div>
                
                {/* Additional breakdown section */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          className="bg-green-500 h-full"
                          style={{ width: `${totalAmountPaid > 0 ? (totalCashAmount / totalAmountPaid) * 100 : 0}%` }}
                          title={`Cash: ${totalAmountPaid > 0 ? ((totalCashAmount / totalAmountPaid) * 100).toFixed(1) : 0}%`}
                        ></div>
                        <div 
                          className="bg-blue-500 h-full"
                          style={{ width: `${totalAmountPaid > 0 ? (totalPaybillAmount / totalAmountPaid) * 100 : 0}%` }}
                          title={`Paybill: ${totalAmountPaid > 0 ? ((totalPaybillAmount / totalAmountPaid) * 100).toFixed(1) : 0}%`}
                        ></div>
                        <div 
                          className="bg-orange-500 h-full"
                          style={{ width: `${totalAmountPaid > 0 ? (totalInvoiceAmount / totalAmountPaid) * 100 : 0}%` }}
                          title={`Invoice: ${totalAmountPaid > 0 ? ((totalInvoiceAmount / totalAmountPaid) * 100).toFixed(1) : 0}%`}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-600">
                      <span>Cash</span>
                      <span>Paybill</span>
                      <span>Invoice</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeSection === 'payments' && (
              <div>
                {/* Patient Payment Form */}
                <div id="payment-form" className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-700">Patient Payment</h2>
                    {selectedPatient && (
                      <div className="bg-green-100 border border-green-400 rounded-lg px-4 py-2">
                        <div className="flex items-center">
                          <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                          <span className="text-green-800 text-sm font-medium">
                            Processing: {selectedPatient}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-700 font-semibold mb-2" htmlFor="patientSelect">
                          Select Patient
                        </label>
                        <div className="space-y-2">
                          <select
                            id="patientSelect"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out bg-white"
                            value={selectedPatient}
                            onChange={(e) => setSelectedPatient(e.target.value)}
                            disabled={loadingPatients || patients.length === 0}
                          >
                            <option value="" disabled>
                              {loadingPatients ? 'Loading patients...' : 'Select Patient'}
                            </option>
                            {patients.length > 0 ? (
                              patients.map((patient) => (
                                <option key={patient._id} value={patient.name}>
                                  {patient.name} - {patient.passportNumber}
                                </option>
                              ))
                            ) : (
                              <option>No patients available</option>
                            )}
                          </select>
                          {selectedPatient && (
                            <button
                              type="button"
                              onClick={() => setSelectedPatient('')}
                              className="w-full px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition duration-150 ease-in-out"
                            >
                              Clear Selection
                            </button>
                          )}
                        </div>
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
                  <div className="mt-6">
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
                    className="w-full mt-6 bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {currentRecord ? 'Update Payment' : 'Record Payment'}
                  </button>
                </div>

                {/* Search Filter for Payments - Moved after the record payment button */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 mb-6">
                  <h3 className="text-xl font-semibold mb-4 text-blue-800">Search Payments</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-gray-700 font-semibold mb-2">Search by Patient Name</label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                        value={searchPatientName}
                        onChange={(e) => setSearchPatientName(e.target.value)}
                        placeholder="Enter patient name to search..."
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => setSearchPatientName('')}
                        className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Clear Search
                      </button>
                    </div>
                  </div>
                  {searchPatientName && (
                    <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                      <p className="text-sm text-gray-700">
                        Showing results for: <span className="font-bold text-blue-600">"{searchPatientName}"</span>
                        {filteredPayments.length > 0 && (
                          <span className="ml-2 text-green-600 font-semibold">({filteredPayments.length} record{filteredPayments.length !== 1 ? 's' : ''} found)</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment Records Section */}
                <div className="mt-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
                      Payment Records
                      {(searchPatientName || startDate.toDateString() !== endDate.toDateString()) && (
                        <span className="text-base font-normal text-gray-600 ml-2">
                          ({filteredPayments.length} record{filteredPayments.length !== 1 ? 's' : ''})
                        </span>
                      )}
                    </h2>
                    <div className="flex gap-3">
                      <button
                        onClick={exportToExcel}
                        className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Export to Excel
                      </button>
                      <button
                        onClick={printPDF}
                        className="bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-orange-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      >
                        Print PDF
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
                      <div className="max-w-md mx-auto">
                        <div className="mb-4">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
                        <p className="text-gray-600 mb-4">
                          {searchPatientName 
                            ? `No payment records found for "${searchPatientName}" in the selected date range.`
                            : 'No payment records available for the selected date range.'
                          }
                        </p>
                        {searchPatientName && (
                          <button
                            onClick={() => setSearchPatientName('')}
                            className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            Clear search and show all records
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSection === 'expenses' && (
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h2 className="text-xl font-semibold mb-6 text-gray-700">Expenses Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="col-span-2">
                    <label className="block text-gray-700 font-semibold mb-2" htmlFor="expenseDescription">
                      Description
                    </label>
                    <input
                      type="text"
                      id="expenseDescription"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out"
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>
                </div>
                
                {/* Action buttons row */}
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={handleAddExpense}
                    className="bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Add Expense
                  </button>
                  
                  {filteredExpenses.length > 0 && (
                    <button
                      onClick={exportExpensesToExcel}
                      className="bg-green-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Export to Excel
                    </button>
                  )}
                </div>

                {filteredExpenses.length > 0 && (
                  <div className="mt-8">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-2 md:mb-0">
                        Expense Records
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          ({filteredExpenses.length} record{filteredExpenses.length !== 1 ? 's' : ''})
                        </span>
                      </h3>
                      <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                        <span className="text-sm font-medium text-blue-800">
                          Total for {startDate.toLocaleDateString()}
                          {startDate.toLocaleDateString() !== endDate.toLocaleDateString() && ` to ${endDate.toLocaleDateString()}`}
                          : 
                        </span>
                        <span className="ml-2 text-lg font-bold text-green-700">
                          KES {filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredExpenses.map((expense) => (
                              <tr key={expense._id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  KES {parseFloat(expense.amount || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {expense.date ? new Date(expense.date).toLocaleDateString() : ''}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {expenses.length === 0 && (
                  <div className="mt-8 bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Expenses Found</h3>
                      <p className="text-gray-600">
                        No expense records available for the selected date range. Add your first expense above.
                      </p>
                    </div>
                  </div>
                )}

                {expenses.length > 0 && filteredExpenses.length === 0 && (
                  <div className="mt-8 bg-white rounded-lg shadow-md p-8 text-center">
                    <div className="max-w-md mx-auto">
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Expenses Found</h3>
                      <p className="text-gray-600">
                        No expense records found for the selected date range: {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
    </div>
  );
};

export default Accounts;