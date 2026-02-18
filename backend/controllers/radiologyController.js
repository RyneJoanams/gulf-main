const RadiologyTest = require('../models/radiology');

exports.getRadiologyTests = async (req, res) => {
    try {
        const page = parseInt(req.query.page || '1', 10);
        const requestedLimit = parseInt(req.query.limit || process.env.DEFAULT_RADIOLOGY_LIMIT || '300', 10);
        const maxLimit = parseInt(process.env.MAX_RADIOLOGY_LIMIT || '1000', 10);
        const limit = Math.min(Math.max(requestedLimit, 1), maxLimit);
        const skip = (page - 1) * limit;

        // Exclude heavy patientImage field by default, use lean() for better performance
        const [tests, total] = await Promise.all([
          RadiologyTest.find()
            .select('-patientImage') // Exclude patientImage to reduce payload
            .sort({ timeStamp: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit)
            .lean(), // Use lean() for faster read-only queries
          RadiologyTest.countDocuments()
        ]);
        if (res.headersSent) return;
        res.status(200).json({
          data: tests,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        });
    } catch (error) {
        if (res.headersSent) return;
        res.status(500).json({ message: error.message });
        console.error(error);
    }
};

exports.createRadiologyTest = async (req, res) => {
    const {
        patientId,
        patientName,
        labNumber,
        chestXRayTest,
        heafMantouxTest,
        urineTest = {},
        bloodTest = {},
        fullHaemogram = {},
        liverFunction = {},
        renalFunction = {},
        labRemarks = {},
        patientImage,
        timestamp,
        area1,
        medicalType, // <-- Add this line
    } = req.body;

    console.log(req.body);

    // Validate required fields
    if (!patientName || !labNumber || !chestXRayTest || !heafMantouxTest || !area1) {
        return res.status(400).json({
            message: "Missing required fields: patientName, labNumber, chestXRayTest, heafMantouxTest, or area1",
        });
    }

    // Create a new radiology test object
    const newTest = new RadiologyTest({
        patientId: patientId || null,
        patientName,
        labNumber,
        chestXRayTest,
        heafMantouxTest,
        area1: {
            bloodGroup: area1.bloodGroup || "",
            pregnancyTest: area1.pregnancyTest || "",
            vdrlTest: area1.vdrlTest || "",
        },
        urineTest: {
            albumin: urineTest.albumin || "",
            sugar: urineTest.sugar || "",
            microscopic: urineTest.microscopic || "",
            reaction: urineTest.reaction || "",
        },
        bloodTest: {
            hivTest: bloodTest.hivTest || "",
            hbsAg: bloodTest.hbsAg || "",
            hcv: bloodTest.hcv || "",
            esr: bloodTest.esr || "",
        },
        fullHaemogram: {
            gran: fullHaemogram.gran || { value: '', units: '', status: '', range: '' },
            hct: fullHaemogram.hct || { value: '', units: '', status: '', range: '' },
            hgb: fullHaemogram.hgb || { value: '', units: '', status: '', range: '' },
            lym: fullHaemogram.lym || { value: '', units: '', status: '', range: '' },
            mch: fullHaemogram.mch || { value: '', units: '', status: '', range: '' },
            mchc: fullHaemogram.mchc || { value: '', units: '', status: '', range: '' },
            mcv: fullHaemogram.mcv || { value: '', units: '', status: '', range: '' },
            mid: fullHaemogram.mid || { value: '', units: '', status: '', range: '' },
            mpv: fullHaemogram.mpv || { value: '', units: '', status: '', range: '' },
            pct: fullHaemogram.pct || { value: '', units: '', status: '', range: '' },
            pdw: fullHaemogram.pdw || { value: '', units: '', status: '', range: '' },
            plcr: fullHaemogram.plcr || { value: '', units: '', status: '', range: '' },
            plt: fullHaemogram.plt || { value: '', units: '', status: '', range: '' },
            rbc: fullHaemogram.rbc || { value: '', units: '', status: '', range: '' },
            rwd: fullHaemogram.rwd || { value: '', units: '', status: '', range: '' },
            wbc: fullHaemogram.wbc || { value: '34', units: '', status: 'normal', range: '' }, // Defaulting to provided value
        },
        liverFunction: {
            albumin1: liverFunction.albumin1 || { value: '', status: '', range: '' },
            alkalinePhosphate: liverFunction.alkalinePhosphate || { value: '', status: '', range: '' },
            directBilirubin: liverFunction.directBilirubin || { value: '', status: '', range: '' },
            gammaGt: liverFunction.gammaGt || { value: '', status: '', range: '' },
            indirectBilirubin: liverFunction.indirectBilirubin || { value: '', status: '', range: '' },
            sgot: liverFunction.sgot || { value: '', status: '', range: '' },
            sgpt: liverFunction.sgpt || { value: '', status: '', range: '' },
            totalBilirubin: liverFunction.totalBilirubin || { value: '34', status: 'normal', range: '' },
            totalProteins: liverFunction.totalProteins || { value: '', status: '', range: '' },
        },
        renalFunction: {
            creatinine: renalFunction.creatinine || { value: '', status: '', range: '' },
            fastingBloodSugar: renalFunction.fastingBloodSugar || { value: '', status: '', range: '' },
            urea: renalFunction.urea || { value: '56', status: 'normal', range: '54' }, // Defaulting to provided value
        },
        labRemarks: {
            fitnessEvaluation: {
                otherAspectsFit: labRemarks?.fitnessEvaluation?.otherAspectsFit || "",
                overallStatus: labRemarks?.fitnessEvaluation?.overallStatus || "",
            },
            labSuperintendent: {
                name: labRemarks?.labSuperintendent?.name || "",
            },
        },
        patientImage,
        timeStamp: timestamp || Date.now(),
        medicalType, // <-- Add this line
    });

    try {
        // Save the new test entry to the database
        const savedTest = await newTest.save();
        res.status(201).json(savedTest);
    } catch (error) {
        res.status(400).json({ message: error.message });
        console.error(error);
    }
};
