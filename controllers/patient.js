const { json } = require('body-parser');
const mongodb = require('../data/database');
const ObjectId = require('mongodb').ObjectId;


const getAllPatient = async(req, res) => {
    const result = await mongodb.getDatabase().db().collection('patient').find();
    result.toArray().then((lists, err) => {
        if (err) {
            res.status(400).json({message:err});
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(lists);
    });
};

const getSinglePatient = async(req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json('Must use a valid contact id to select a patient.');
    }
    const userId = new ObjectId(req.params.id);
    const result = await mongodb.getDatabase().db().collection('patient').find({_id: userId});
    result.toArray().then((result, err) => {
        if (err) {
            res.status(400).json({message:err});
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(result[0]);
    });
};

const createPatient = async(req, res) => {

    const patient = {
        name: req.body.name,
        age: req.body.age,
        gender: req.body.gender,
        address: req.body.address,
        phone_number: req.body.phone_number,
        medical_records: req.body.medical_records.map(record => ({ ...record, _id: new ObjectId() })), // Generate new ObjectIds for medical_records
        appointment: req.body.appointment.map(appt => ({ 
            ...appt, 
            _id: new ObjectId()
        }))
    };

    try {
        const response = await mongodb.getDatabase().db().collection('patient').insertOne(patient);

        // Create related medical records
        await mongodb.getDatabase().db().collection('medical_records').insertMany(patient.medical_records);

        const insertedPatientId = response.insertedId;

        const updatedAppointment = patient.appointment.map(appt => ({
            ...appt,
            patient_id: insertedPatientId
        }));

        await mongodb.getDatabase().db().collection('appointment').insertMany(updatedAppointment);

        // Update patient document with the inserted patient_id
        await mongodb.getDatabase().db().collection('patient').updateMany(
            { _id: insertedPatientId },
            { $set: { appointment: updatedAppointment } }
        );

        if (response.acknowledged) {
            res.status(204).send();
        } else {
            res.status(500).json('Failed to create patient.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json('Some error occurred while creating related records.');
    }
};

const updatePatient = async(req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json('Must use a valid contact id to update a patient.');
    }

    const recordsData = req.body.medical_records;
    const appointmentsData = req.body.appointment;

    const userId = new ObjectId(req.params.id);
    const user = {
        name: req.body.name,
        age: req.body.age,
        gender: req.body.gender,
        address: req.body.address,
        phone_number: req.body.phone_number,
        medical_records: [],
        appointment: []
    };

    // Process each appointment array
    recordsData.forEach(recordData => {
        const medical_records = {
            _id: new ObjectId(recordData._id),
            date: recordData.date,
            diagnosis: recordData.diagnosis,
            prescriptions: recordData.prescriptions,
            notes: recordData.notes,
            patient_id: userId
        };
        user.medical_records.push(medical_records); // Push each appointment to doctor's appointment array
    });

    // Process each appointment array
    appointmentsData.forEach(appointmentData => {
        const appointment = {
            _id: new ObjectId(appointmentData._id),
            patient_id: userId,
            doctor_id: new ObjectId(appointmentData.doctor_id), 
            date: appointmentData.date,
            reason: appointmentData.reason,
            status: appointmentData.status
        };
        user.appointment.push(appointment); // Push each appointment to doctor's appointment array
    });

    try {
        // Update patient document
        const response = await mongodb.getDatabase().db().collection('patient').replaceOne({ _id: userId }, user);

        if (response.modifiedCount === 0) {
            return res.status(500).json('Some error occurred while updating the patient.');
        }

        // Update related medical records
        for (const medicalRecord of req.body.medical_records) {
            const { _id, ...updatedFields } = medicalRecord;
            await mongodb.getDatabase().db().collection('medical_records').updateMany(
                { _id: new ObjectId(_id) },
                { $set: { ...updatedFields } }
            );
        }

        // Update related appointments
        for (const appointment of req.body.appointment) {
            const { _id, ...updatedFields } = appointment;
            await mongodb.getDatabase().db().collection('appointment').updateMany(
                { _id: new ObjectId(_id) },
                { $set: { ...updatedFields, patient_id: userId, doctor_id: new ObjectId(appointment.doctor_id)} } // Update patient_id to userId
            );
        }

        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json('Some error occurred while updating related records.');
    }
};



const deletePatient = async(req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json('Must use a valid contact id to delete a patient.');
    }

    const userId = new ObjectId(req.params.id);
    
    //Extract medical record _id(s) from the patient document
    const patientDocument = await mongodb.getDatabase().db().collection('patient').findOne({ _id: userId });
    const medicalRecordIds = patientDocument.medical_records.map(record => new ObjectId(record._id));

    // Delete related medical records
    const medicalRecordsDeletionResult = await mongodb.getDatabase().db().collection('medical_records').deleteMany({ _id: { $in: medicalRecordIds } });
    console.log(`${medicalRecordsDeletionResult.deletedCount} medical records deleted.`);

    // Attempt to find and delete the patient document
    const patientResponse = await mongodb.getDatabase().db().collection('patient').deleteOne({ _id: userId });

    // Delete related appointments
    const appointmentDeletionResult = await mongodb.getDatabase().db().collection('appointment').deleteMany({ patient_id: userId });
    console.log(`${appointmentDeletionResult.deletedCount} appointments deleted.`);
        

    if (patientResponse.deletedCount > 0) {
        res.status(204).send();    
    } else {
        res.status(500).json(response.error || 'Some error occurred while deleting the patient.')
    };
};



module.exports = {
    getAllPatient,
    getSinglePatient,
    createPatient,
    updatePatient,
    deletePatient
};