const mongoose = require("mongoose");
const express = require("express");
const LabNumber = require("../models/labNumber");
const Counter = require("../models/Counter");

// Controller to generate lab number based on medical type
exports.generateLabNumber = async (req, res) => {
  const { patientId, medicalType, passportNumber } = req.body;

  try {
    // Determine prefix based on medical type
    let prefix;
    let counterName;
    
    if (medicalType === 'SM-VDRL') {
      prefix = 'S';
      counterName = 'S_SERIES';
    } else if (['MAURITIUS', 'NORMAL', 'MEDICAL', 'FM'].includes(medicalType)) {
      prefix = 'F';
      counterName = 'F_SERIES';
    } else {
      // Default to F series for unknown types
      prefix = 'F';
      counterName = 'F_SERIES';
    }

    // Get and increment the counter
    const counter = await Counter.findOneAndUpdate(
      { name: counterName },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    // Format the lab number
    const formattedCounter = String(counter.value).padStart(3, '0');
    const labNumber = `LAB-${passportNumber}-${prefix}${formattedCounter}`;

    res.status(200).json({
      success: true,
      labNumber: labNumber,
      series: prefix,
      sequenceNumber: counter.value,
      message: "Lab number generated successfully",
    });
  } catch (error) {
    console.error("Error generating lab number:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate lab number",
    });
  }
};

// Controller to handle lab number submission
exports.createLabNumber = async (req, res) => {
  const { number, patient } = req.body;

  try {
    const newLabNumber = new LabNumber({ number, patient });
    const savedLabNumber = await newLabNumber.save();
    res.status(201).json({
      success: true,
      labNumber: savedLabNumber,
      message: "Lab number created successfully",
    });
  } catch (error) {
    console.error("Error creating lab number:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create lab number",
    });
  }
};

// Controller to get all lab numbers
exports.getAllLabNumbers = async (req, res) => {
  try {
    const labNumbers = await LabNumber.find(); // Fetch all lab numbers from the database
    res.status(200).json({
      success: true,
      labNumbers, // Return all lab numbers
    });
  } catch (error) {
    console.error('Error fetching lab numbers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lab numbers',
    });
  }
};

exports.deleteLabNumber = async (req, res) => {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const deleted = await LabNumber.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Lab number not found' });
        }

        res.json({ message: 'Lab number deleted successfully' });
    } catch (err) {
        console.error('DELETE error:', err);
        res.status(500).json({ error: 'Server error while deleting' });
    }
};

// Controller to mark lab number as completed
exports.markLabNumberCompleted = async (req, res) => {
    const { labNumber } = req.body;

    try {
        const updatedLabNumber = await LabNumber.findOneAndUpdate(
            { number: labNumber },
            { 
                status: 'completed',
                completedAt: new Date()
            },
            { new: true }
        );

        if (!updatedLabNumber) {
            return res.status(404).json({
                success: false,
                message: 'Lab number not found'
            });
        }

        res.status(200).json({
            success: true,
            labNumber: updatedLabNumber,
            message: 'Lab number marked as completed'
        });
    } catch (error) {
        console.error('Error marking lab number as completed:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark lab number as completed'
        });
    }
};
