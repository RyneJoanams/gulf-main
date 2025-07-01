const Expense = require('../models/expense');

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createExpense = async (req, res) => {
  const { description, amount } = req.body;
  if (!description || amount == null) {
    return res.status(400).json({ message: 'Description and amount are required.' });
  }
  try {
    const expense = new Expense({ description, amount });
    const saved = await expense.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Expense not found.' });
    res.status(200).json({ message: 'Expense deleted.', deleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};