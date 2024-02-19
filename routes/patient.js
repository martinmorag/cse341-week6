const express = require('express');
const router = express.Router();

const patientController = require('../controllers/patient');
const validation = require('../middleware/validate');
const { isAuthenticated } = require('../middleware/authenticate');

// PATIENT
router.get('/', patientController.getAllPatient);
router.get('/:id', patientController.getSinglePatient);
router.post('/', isAuthenticated, validation.createPatient, patientController.createPatient);
router.put('/:id', isAuthenticated, validation.savePatient, patientController.updatePatient);
router.delete('/:id', isAuthenticated, patientController.deletePatient);

module.exports = router;
