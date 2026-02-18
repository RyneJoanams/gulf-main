const clinical = require("../models/clinical");
const { validationResult } = require("express-validator");

// Fetch all clinical reports with pagination support and date filtering
exports.getAllReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const requestedLimit = parseInt(req.query.limit || process.env.DEFAULT_CLINICAL_LIMIT || '300', 10);
        const maxLimit = parseInt(process.env.MAX_CLINICAL_LIMIT || '1000', 10);
        const limit = Math.min(Math.max(requestedLimit, 1), maxLimit);
        const skip = (page - 1) * limit;
        const { startDate, endDate } = req.query;
        const includePatientImage = req.query.includePatientImage === 'true';
        const projection = includePatientImage ? {} : { 'selectedReport.patientImage': 0 };
        
        // Build date filter
        let dateFilter = {};
        if (startDate || endDate) {
            dateFilter['selectedReport.timeStamp'] = {};
            if (startDate) {
                dateFilter['selectedReport.timeStamp'].$gte = new Date(startDate);
            }
            if (endDate) {
                // Add 23:59:59 to include the entire end date
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                dateFilter['selectedReport.timeStamp'].$lte = endDateTime;
            }
        }
        
        // If no pagination params are provided, still apply a safe default limit to avoid gateway timeouts
        if (!req.query.page && !req.query.limit) {
            const reports = await clinical.find(dateFilter)
                .select(projection)
                .sort({ createdAt: -1 })
                .limit(limit)
                .lean(); // Use lean() for faster read-only queries
            if (res.headersSent) return;
            return res.status(200).json(reports);
        }
        
        const [reports, total] = await Promise.all([
            clinical.find(dateFilter)
                .select(projection)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            clinical.countDocuments(dateFilter)
        ]);
        
        if (res.headersSent) return;
        res.status(200).json({
            reports,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        if (res.headersSent) return;
        res.status(500).json({ error: "Error fetching clinical reports." });
    }
};

// Search clinical reports with optimized query
exports.searchReports = async (req, res) => {
    try {
        const { query } = req.query;
        const limit = parseInt(req.query.limit) || 20;
        
        if (!query || query.trim().length < 2) {
            return res.status(400).json({ error: "Search query must be at least 2 characters." });
        }
        
        const searchTerm = query.trim();
        
        // Use regex for partial matching on indexed fields
        const reports = await clinical.find({
            $or: [
                { 'selectedReport.patientName': { $regex: searchTerm, $options: 'i' } },
                { 'selectedReport.labNumber': { $regex: searchTerm, $options: 'i' } },
                { passportNumber: { $regex: searchTerm, $options: 'i' } }
            ]
        })
        .sort({ 'selectedReport.timeStamp': -1, createdAt: -1 })
        .limit(limit)
        .lean();
        
        res.status(200).json(reports);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: "Error searching clinical reports." });
    }
};

// Create a new clinical report
exports.createReport = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const {
            selectedReport,
            generalExamination,
            systemicExamination,
            otherTests,
            clinicalNotes,
            clinicalOfficerName,
            height,
            weight,
            historyOfPastIllness,
            allergy,
            radiologyData,
            medicalType,
            passportNumber,
            gender,
            age,
            agent,
            radiologyReferral,
            requiresRadiology,
            radiologyStatus,
        } = req.body;

        const newReport = new clinical({
            passportNumber: passportNumber || selectedReport?.passportNumber,
            gender: gender || selectedReport?.gender,
            age: age || selectedReport?.age,
            agent: agent || selectedReport?.agent,
            selectedReport: {
                ...selectedReport,
                medicalType: medicalType || selectedReport?.medicalType || 'N/A', // Ensure medicalType is included
            },
            generalExamination,
            systemicExamination,
            otherTests,
            clinicalNotes,
            clinicalOfficerName,
            height,
            weight,
            historyOfPastIllness,
            allergy,
            radiologyData,
            // Track if this report is from phlebotomy F-series routing
            isFromPhlebotomy: req.body.isFromPhlebotomy || false,
            // Radiology referral fields
            radiologyReferral: radiologyReferral,
            requiresRadiology: requiresRadiology || false,
            radiologyStatus: radiologyStatus || 'not-required',
        });

        // Log radiology referral information
        if (requiresRadiology) {
            console.log(`🩻 Radiology Referral: Patient ${selectedReport?.patientName} (Lab #${selectedReport?.labNumber}) referred to Radiology`);
            console.log(`📋 Routing: Clinical → Radiology → Lab`);
        } else {
            console.log(`🔬 Direct to Lab: Patient ${selectedReport?.patientName} (Lab #${selectedReport?.labNumber}) sent directly to Lab`);
            console.log(`📋 Routing: Clinical → Lab`);
        }

        const savedReport = await newReport.save();
        res.status(201).json(savedReport);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error creating clinical report." });
    }
};

// Update a clinical report
exports.updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedReport = await clinical.findByIdAndUpdate(id, req.body, {
            new: true,
        });

        if (!updatedReport) {
            return res.status(404).json({ error: "Report not found." });
        }

        res.status(200).json(updatedReport);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error updating clinical report." });
    }
};

// Delete a clinical report
exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedReport = await clinical.findByIdAndDelete(id);

        if (!deletedReport) {
            return res.status(404).json({ error: "Report not found." });
        }

        res.status(200).json({ message: "Report deleted successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error deleting clinical report." });
    }
};
