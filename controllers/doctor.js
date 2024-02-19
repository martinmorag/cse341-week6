const { json } = require('body-parser');
const mongodb = require('../data/database');
const ObjectId = require('mongodb').ObjectId;


const getAllDoctor = async(req, res) => {
    const result = await mongodb.getDatabase().db().collection('doctor').find();
    result.toArray().then((lists, err) => {
        if (err) {
            res.status(400).json({message:err});
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(lists);
    });
};

const getSingleDoctor = async(req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json('Must use a valid contact id to select a doctor.');
    }
    const userId = new ObjectId(req.params.id);
    const result = await mongodb.getDatabase().db().collection('doctor').find({_id: userId});
    result.toArray().then((result, err) => {
        if (err) {
            res.status(400).json({message:err});
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(result[0]);
    });
};

const createDoctor = async(req, res) => {
    try { 
        const appointmentsData = req.body.appointment; // Access all appointment arrays

        const doctor = {
            name: req.body.name,
            specialization: req.body.specialization,
            hospital: req.body.hospital,
            phone_number: req.body.phone_number,
            availability: req.body.availability,
            appointment: [] // Initialize empty array for appointments
        };

        // Process each appointment array
        appointmentsData.forEach(appointmentData => {
            const appointment = {
                _id: new ObjectId(appointmentData._id),
                patient_id: new ObjectId(appointmentData.patient_id),
                doctor_id: new ObjectId(appointmentData.doctor_id),
                date: appointmentData.date,
                reason: appointmentData.reason,
                status: appointmentData.status
            };
            doctor.appointment.push(appointment); // Push each appointment to doctor's appointment array
        });
        
        const db = await mongodb.getDatabase().db();

        // Insert the doctor document into the doctor collection
        const doctorCollection = db.collection('doctor');
        const response = await doctorCollection.insertOne(doctor);

        if (!response.acknowledged) {
            throw new Error('Failed to create doctor');
        }

        // Insert the appointment(s) into the appointment collection
        const appointmentCollection = db.collection('appointment');
        if (doctor.appointment && doctor.appointment.length > 0) {
            await appointmentCollection.insertMany(doctor.appointment);
        }

        // Update patient document with the new appointment
        if (doctor.appointment && doctor.appointment.length > 0) {
            await Promise.all(doctor.appointment.map(async (appointmentItem) => {
                await db.collection('patient').updateOne(
                    { _id: new ObjectId(appointmentItem.patient_id) },
                    { $push: { appointment: appointmentItem } }
                );
            }));
        }

        res.status(204).send();
    } catch (error) {
        console.error("Caught exception:", error);
        res.status(500).json(error.message || 'Some error occurred while creating the doctor.');
    }
};

const updateDoctor = async(req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json('Must use a valid contact id to update a doctor.');
    }

    try {
        const doctorId = new ObjectId(req.params.id); // Extract doctor ID from request params

        const appointmentsData = req.body.appointment; // Access all appointment arrays

        const doctor = {
            name: req.body.name,
            specialization: req.body.specialization,
            hospital: req.body.hospital,
            phone_number: req.body.phone_number,
            availability: req.body.availability,
            appointment: [] // Initialize empty array for appointments
        };

        // Process each appointment array
        appointmentsData.forEach(appointmentData => {
            const appointment = {
                _id: new ObjectId(appointmentData._id),
                patient_id: new ObjectId(appointmentData.patient_id),
                doctor_id: doctorId, // Use doctorId extracted from request params
                date: appointmentData.date,
                reason: appointmentData.reason,
                status: appointmentData.status
            };
            doctor.appointment.push(appointment); // Push each appointment to doctor's appointment array
        });

        const db = await mongodb.getDatabase().db();

        // Update the doctor document in the doctor collection
        const doctorCollection = db.collection('doctor');
        const response = await doctorCollection.updateOne(
            { _id: doctorId },
            { $set: doctor }
        );

        if (!response.modifiedCount) {
            throw new Error('Doctor not found or update failed');
        }
        // Insert the appointment(s) into the appointment collection
        const appointmentCollection = db.collection('appointment');
        if (doctor.appointment.length > 0) {
            await Promise.all(doctor.appointment.map(async (appointmentItem) => {
                await appointmentCollection.updateOne(
                    { _id: appointmentItem._id },
                    { $set: appointmentItem }
                );
            }));
        }

        // Update patient document with the new appointment
        if (doctor.appointment && doctor.appointment.length > 0) {
            await Promise.all(doctor.appointment.map(async (appointmentItem) => {
                await db.collection('patient').updateMany(
                    { 
                        _id: new ObjectId(appointmentItem.patient_id), 
                        'appointment._id': appointmentItem._id // Match the appointment by its _id
                    },
                    { $set: { 'appointment.$': appointmentItem } } // Update the matched appointment
                );
            }));
        }

        res.status(204).send();
    } catch (error) {
        console.error("Caught exception:", error);
        res.status(500).json(error.message || 'Some error occurred while updating the doctor.');
    };
};



const deleteDoctor = async(req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json('Must use a valid contact id to delete a doctor.');
    }
    try {
        const doctorId = new ObjectId(req.params.id); // Extract doctor ID from request params

        const db = await mongodb.getDatabase().db();

        // Delete doctor document from the doctor collection
        const doctorCollection = db.collection('doctor');
        const deleteDoctorResult = await doctorCollection.deleteOne({ _id: doctorId });

        if (!deleteDoctorResult.deletedCount) {
            throw new Error('Doctor not found or delete failed');
        }

        // Delete doctor's appointments from the appointment collection
        const appointmentCollection = db.collection('appointment');
        const deleteAppointmentsResult = await appointmentCollection.deleteMany({ doctor_id: doctorId });

        // Remove doctor's appointments from patient documents
        if (deleteAppointmentsResult.deletedCount) {
            await db.collection('patient').updateMany(
                { 'appointment.doctor_id': doctorId },
                { $pull: { appointment: { doctor_id: doctorId } } }
            );
        }

        res.status(204).send(); // Successfully deleted doctor and related appointments
    } catch (error) {
        console.error("Caught exception:", error);
        res.status(500).json(error.message || 'Some error occurred while deleting the doctor.');
    };
};



module.exports = {
    getAllDoctor,
    getSingleDoctor,
    createDoctor,
    updateDoctor,
    deleteDoctor
};