const express = require('express');
const router = express.Router();

const doctorController = require('../controllers/doctor');
const validation = require('../middleware/validate');
const { isAuthenticated } = require('../middleware/authenticate');

// PATIENT
router.get('/', doctorController.getAllDoctor);
router.get('/:id', doctorController.getSingleDoctor);
router.post('/', isAuthenticated, validation.saveDoctor, doctorController.createDoctor);
router.put('/:id', isAuthenticated, validation.saveDoctor, doctorController.updateDoctor);
router.delete('/:id', isAuthenticated, doctorController.deleteDoctor);

module.exports = router;
