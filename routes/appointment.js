const express = require('express');
const router = express.Router();

const appointmentController = require('../controllers/appointment');
const validation = require('../middleware/validate');
const { isAuthenticated } = require('../middleware/authenticate');

// PATIENT
router.get('/', appointmentController.getAllAppointment);
router.get('/:id', appointmentController.getSingleAppointment);
router.post('/', isAuthenticated, validation.createAppointment, appointmentController.createAppointment);
router.put('/:id', isAuthenticated, validation.createAppointment, appointmentController.updateAppointment);
router.delete('/:id', isAuthenticated, appointmentController.deleteAppointment);

module.exports = router;
