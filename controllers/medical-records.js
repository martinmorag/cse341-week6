const { json } = require('body-parser');
const mongodb = require('../data/database');
const ObjectId = require('mongodb').ObjectId;


const getAllRecords = async(req, res) => {
    const result = await mongodb.getDatabase().db().collection('medical_records').find();
    result.toArray().then((lists, err) => {
        if (err) {
            res.status(400).json({message:err});
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(lists);
    });
};

const getSingleRecords = async(req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json('Must use a valid contact id to select medical records.');
    }
    const userId = new ObjectId(req.params.id);
    const result = await mongodb.getDatabase().db().collection('medical_records').find({_id: userId});
    result.toArray().then((result, err) => {
        if (err) {
            res.status(400).json({message:err});
        }
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(result[0]);
    });
};

const createRecords = async(req, res) => {

    try { 

        const record = {
            date: req.body.date,
            diagnosis: req.body.diagnosis,
            prescriptions: req.body.prescriptions,
            notes: req.body.notes,
            patient_id: new ObjectId(req.body.patient_id)
        };

        const db = await mongodb.getDatabase().db();

        // Insert the appointment into the appointment collection
        const recordsCollection = db.collection('medical_records');
        const recordResult = await recordsCollection.insertOne(record);

        if (!recordResult.acknowledged) {
            throw new Error('Failed to create medical record.');
        }

        // Update patient document with the new appointment
        await db.collection('patient').updateOne(
            { _id: record.patient_id },
            { $push: { medical_records: record } } // Push the entire appointment document
        );
            res.status(204).send();
    } catch (error) {
        res.status(500).json(response.error || 'Some error occurred while creating the medical records.')
    };
};

const updateRecords = async(req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json('Must use a valid contact id to update the medical records.');
    }
    try { 
        const recordId = new ObjectId(req.params.id);
        const record = {
            date: req.body.date,
            diagnosis: req.body.diagnosis,
            prescriptions: req.body.prescriptions,
            notes: req.body.notes,
            patient_id: new ObjectId(req.body.patient_id)
        };

        const db = await mongodb.getDatabase().db();

        // Retrieve the original appointment document
        const recordCollection = db.collection('medical_records');
        const newRecord = await recordCollection.findOneAndUpdate(
            { _id: recordId },
            { $set: record },
            { returnOriginal: true }
        );

        // Update patient document with the updated appointment
        await db.collection('patient').updateOne(
            { _id: new ObjectId(req.body.patient_id), 'medical_records._id': recordId },
            { $set: { 'medical_records.$': newRecord }}
        ); 

        res.status(204).send();
    } catch(error) {
        res.status(500).json(response.error || 'Some error occurred while updating the medical records.')
    };
};



const deleteRecords = async(req, res) => {
    if (!ObjectId.isValid(req.params.id)) {
        res.status(400).json('Must use a valid contact id to delete the medical records.');
    }

    const recordId = new ObjectId(req.params.id);

    try { 
        
        const db = await mongodb.getDatabase().db();

        // Retrieve the appointment document
        const recordCollection = db.collection('medical_records');
        const record = await recordCollection.findOne({ _id: recordId });

        if (!record) {
            res.status(404).json('Medical record not found.');
            return;
        }

        // Delete the appointment document
        await recordCollection.deleteOne({ _id: recordId });

        // Remove the appointment from the patient's appointment array
        await db.collection('patient').updateOne(
            { _id: record.patient_id },
            { $pull: { medical_records: { _id: recordId } } }
        );

        res.status(204).send();
    } catch(error) {
        res.status(500).json(response.error || 'Some error occurred while deleting the medical records.')
    };
};



module.exports = {
    getAllRecords,
    getSingleRecords,
    createRecords,
    updateRecords,
    deleteRecords
};