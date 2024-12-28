const RadiologyTest = require('../models/RadiologyTest');

exports.getRadiologyTests = async (req, res) => {
    try {
        const tests = await RadiologyTest.find();
        res.status(200).json(tests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createRadiologyTest = async (req, res) => {
    const { heafMantouxTest, chestXRayTest } = req.body;

    const newTest = new RadiologyTest({
        heafMantouxTest,
        chestXRayTest
    });

    try {
        const savedTest = await newTest.save();
        res.status(201).json(savedTest);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
