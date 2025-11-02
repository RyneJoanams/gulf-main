const express = require('express');
const router = express.Router();
const LabResultSnapshot = require('../models/LabResultSnapshot');
const Lab = require('../models/lab');

/**
 * POST /api/lab-result/save
 * Save a lab result snapshot when printing (for QR code access)
 */
router.post('/lab-result/save', async (req, res) => {
  try {
    const { labNumber, patientName, reportData } = req.body;
    
    if (!labNumber || !patientName || !reportData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: labNumber, patientName, and reportData are required'
      });
    }
    
    // Create or update snapshot
    const snapshot = await LabResultSnapshot.findOneAndUpdate(
      { labNumber },
      {
        labNumber,
        patientName,
        reportData,
        createdAt: new Date(),
        expiresAt: new Date(+new Date() + 90*24*60*60*1000) // 90 days
      },
      { 
        upsert: true, 
        new: true,
        runValidators: true
      }
    );
    
    console.log(`Lab result snapshot saved: ${labNumber}`);
    
    res.json({
      success: true,
      message: 'Lab result snapshot saved successfully',
      data: {
        labNumber: snapshot.labNumber,
        patientName: snapshot.patientName,
        createdAt: snapshot.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error saving lab result snapshot:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error saving lab result snapshot',
      error: error.message 
    });
  }
});

/**
 * GET /api/lab-result/:labNumber
 * Retrieve a lab result by lab number for QR code access
 */
router.get('/lab-result/:labNumber', async (req, res) => {
  try {
    const { labNumber } = req.params;
    
    // First, try to get from snapshot (most recent print)
    let snapshot = await LabResultSnapshot.findOne({ labNumber });
    
    if (snapshot) {
      console.log(`Lab result retrieved from snapshot: ${labNumber}`);
      
      return res.json({
        success: true,
        data: {
          id: snapshot.labNumber,
          patientName: snapshot.patientName,
          labNumber: snapshot.labNumber,
          reportDate: new Date(snapshot.createdAt).toLocaleDateString(),
          data: snapshot.reportData
        },
        source: 'snapshot'
      });
    }
    
    // Fallback: Try to get from Lab collection directly
    const labResult = await Lab.findOne({ labNumber }).lean();
    
    if (labResult) {
      console.log(`Lab result retrieved from Lab collection: ${labNumber}`);
      
      // Format response
      const responseData = {
        id: labNumber,
        patientName: labResult.patientName,
        labNumber: labResult.labNumber,
        reportDate: new Date(labResult.timeStamp).toLocaleDateString(),
        data: labResult
      };
      
      return res.json({
        success: true,
        data: responseData,
        source: 'lab-collection'
      });
    }
    
    // Not found in either collection
    return res.status(404).json({ 
      success: false, 
      message: 'Lab result not found',
      labNumber
    });
    
  } catch (error) {
    console.error('Error fetching lab result:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error retrieving lab result',
      error: error.message 
    });
  }
});

/**
 * DELETE /api/lab-result/:labNumber
 * Delete a lab result snapshot (admin only)
 */
router.delete('/lab-result/:labNumber', async (req, res) => {
  try {
    const { labNumber } = req.params;
    
    const result = await LabResultSnapshot.findOneAndDelete({ labNumber });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Lab result snapshot not found'
      });
    }
    
    console.log(`Lab result snapshot deleted: ${labNumber}`);
    
    res.json({
      success: true,
      message: 'Lab result snapshot deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting lab result snapshot:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting lab result snapshot',
      error: error.message
    });
  }
});

/**
 * GET /api/lab-result/stats
 * Get statistics about lab result snapshots (admin only)
 */
router.get('/lab-result-stats', async (req, res) => {
  try {
    const totalSnapshots = await LabResultSnapshot.countDocuments();
    const recentSnapshots = await LabResultSnapshot.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) } // Last 7 days
    });
    
    const oldestSnapshot = await LabResultSnapshot.findOne()
      .sort({ createdAt: 1 })
      .select('labNumber createdAt');
      
    const newestSnapshot = await LabResultSnapshot.findOne()
      .sort({ createdAt: -1 })
      .select('labNumber createdAt');
    
    res.json({
      success: true,
      data: {
        total: totalSnapshots,
        lastSevenDays: recentSnapshots,
        oldest: oldestSnapshot,
        newest: newestSnapshot
      }
    });
    
  } catch (error) {
    console.error('Error fetching lab result stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;
