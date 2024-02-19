const { json } = require('body-parser');
const mongodb = require('../data/database');
const ObjectId = require('mongodb').ObjectId;


const getAllAppointment = async(req, res) => {
    const result = await mongodb.getDatabase().db().collection('appointment').find();
    result.toArray().then((lists, err) => {
        if (err) {
            res.status(400).json({message:err});
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(lists);
    });
};

const getSingleAppointment = async(req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json('Must use a valid contact id to select an appointment.');
    }
    const userId = new ObjectId(req.params.id);
    const result = await mongodb.getDatabase().db().collection('appointment').find({_id: userId});
    result.toArray().then((result, err) => {
        if (err) {
            res.status(400).json({message:err});
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(result[0]);
    });
};

const createAppointment = async(req, res) => {
    try {
        const appointment = {
            date: req.body.date,
            doctor_id: new ObjectId(req.body.doctor_id),
            patient_id: new ObjectId(req.body.patient_id),
            reason: req.body.reason,
            status: req.body.status,
        };
        
        const db = await mongodb.getDatabase().db();

        // Insert the appointment into the appointment collection
        const appointmentCollection = db.collection('appointment');
        const appointmentResult = await appointmentCollection.insertOne(appointment);

        if (!appointmentResult.acknowledged) {
            throw new Error('Failed to create appointment');
        }

        // Update patient document with the new appointment
        await db.collection('patient').updateOne(
            { _id: appointment.patient_id },
            { $push: { appointment: appointment } } // Push the entire appointment document
        );

        // Update doctor document with the new appointment
        await db.collection('doctor').updateOne(
            { _id: appointment.doctor_id },
            { $push: { appointment: appointment } } // Push the entire appointment document
        );

        res.status(204).send();
    } catch (error) {
        console.error("Caught exception:", error);
        res.status(500).json(error.message || 'Some error occurred while creating the appointment.');
    }
};

const updateAppointment = async(req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json('Must use a valid contact id to update an appointment.');
    }

    const appointmentId = new ObjectId(req.params.id);
    try {
        const appointment = {
            date: req.body.date,
            doctor_id: new ObjectId(req.body.doctor_id),
            patient_id: new ObjectId(req.body.patient_id),
            reason: req.body.reason,
            status: req.body.status,
        };

        const db = await mongodb.getDatabase().db();

        // Retrieve the original appointment document
        const appointmentCollection = db.collection('appointment');
        const originalAppointment = await appointmentCollection.findOneAndUpdate(
            { _id: appointmentId },
            { $set: appointment },
            { returnOriginal: true }
        );

        // Update patient document with the updated appointment
        await db.collection('patient').updateOne(
            { _id: new ObjectId(req.body.patient_id), 'appointment._id': appointmentId },
            { $set: { 'appointment.$': originalAppointment }}
        );  

        // Update doctor document with the updated appointment
        await db.collection('doctor').updateMany(
            { _id: new ObjectId(req.body.doctor_id), 'appointment._id': appointmentId },
            { $set: { 'appointment.$': originalAppointment } }
        );

        res.status(204).send();
    } catch (error) {
        console.error("Caught exception:", error);
        res.status(500).json(error.message || 'Some error occurred while updating the appointment.');
    }
};


const deleteAppointment = async(req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json('Must use a valid contact id to delete an appointment.');
    }
    const appointmentId = new ObjectId(req.params.id);

    try { 

        const db = await mongodb.getDatabase().db();

        // Retrieve the appointment document
        const appointmentCollection = db.collection('appointment');
        const appointment = await appointmentCollection.findOne({ _id: appointmentId });

        if (!appointment) {
            res.status(404).json('Appointment not found.');
            return;
        }

        // Delete the appointment document
        await appointmentCollection.deleteOne({ _id: appointmentId });

        // Remove the appointment from the patient's appointment array
        await db.collection('patient').updateOne(
            { _id: appointment.patient_id },
            { $pull: { appointment: { _id: appointmentId } } }
        );

        // Remove the appointment from the doctor's appointment array
        await db.collection('doctor').updateOne(
            { _id: appointment.doctor_id },
            { $pull: { appointment: { _id: appointmentId } } }
        );

        res.status(204).send();
    } catch (error) {
        console.error("Caught exception:", error);
        res.status(500).json(error.message || 'Some error occurred while deleting the appointment.');
    }
};



module.exports = {
    getAllAppointment,
    getSingleAppointment,
    createAppointment,
    updateAppointment,
    deleteAppointment
};