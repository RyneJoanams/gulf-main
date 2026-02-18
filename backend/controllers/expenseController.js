const Expense = require('../models/expense');

exports.getExpenses = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = Math.min(parseInt(req.query.limit || '200', 10), 500);
    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      Expense.find().sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Expense.countDocuments()
    ]);

    if (res.headersSent) return;
    res.status(200).json({
      expenses,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    if (res.headersSent) return;
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

exports.updateExpense = async (req, res) => {
  const { description, amount } = req.body;
  if (!description || amount == null) {
    return res.status(400).json({ message: 'Description and amount are required.' });
  }
  try {
    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      { description, amount },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Expense not found.' });
    res.status(200).json(updated);
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