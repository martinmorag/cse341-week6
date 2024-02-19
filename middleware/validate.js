const validator = require('../helpers/validate');

const savePatient = async (req, res, next) => {
    const validationRule = {
        "_id": "string",
        "name": "required|string",
        "age": "required|integer",
        "gender": "required|string",
        "address": "required|string",
        "phone_number": "required|string",
        "medical_records": "required|array",
        "medical_records.*.date": "required|string|date",
        "medical_records.*.diagnosis": "required|string",
        "medical_records.*.prescriptions": "required|array",
        "medical_records.*.prescriptions.*": "string",
        "medical_records.*.notes": "string",
        "medical_records.*._id": "required|string",
        "appointment": "required|array",
        "appointment.*.appointment_id": "string",
        "appointment.*.date": "required|string|date",
        "appointment.*.doctor_id": "required|string",
        "appointment.*.patient_id": "required|string",
        "appointment.*.reason": "required|string",
        "appointment.*.status": "required|string"
    };

    await validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
};

const createPatient = async (req, res, next) => {
        const validationRule = {
            "name": "required|string",
            "age": "required|integer",
            "gender": "required|string",
            "address": "required|string",
            "phone_number": "required|string",
            "medical_records": "required|array",
            "medical_records.*.date": "required|string|date",
            "medical_records.*.diagnosis": "required|string",
            "medical_records.*.prescriptions": "required|array",
            "medical_records.*.prescriptions.*": "string",
            "medical_records.*.notes": "string",
            "appointment": "required|array",
            "appointment.*.date": "required|string|date",
            "appointment.*.doctor_id": "required|string",
            "appointment.*.reason": "required|string",
            "appointment.*.status": "required|string"
    };


    await validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    });
};

const saveDoctor = async (req, res, next) => {
    const validationRule = {
        "name": "required|string",
        "specialization": "required|string",
        "hospital": "required|string",
        "phone_number": "required|integer",
        "availability": "required|string",
        "appointment": "required|array",
            "appointment.*.date": "required|string|date",
            "appointment.*.patient_id": "required|string",
            "appointment.*.doctor_id": "required|string",
            "appointment.*.reason": "required|string",
            "appointment.*.status": "required|string"
    };

    await validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    })
};

const createAppointment = async (req, res, next) => {
    const validationRule = {
        "date": "required|string",
        "doctor_id": "required|string",
        "patient_id": "required|string",
        "reason": "required|string",
        "status": "required|string",
    };

    await validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    })
};

const saveRecords = async (req, res, next) => {
    const validationRule = {
        "date": "required|string",
        "diagnosis": "required|string",
        "prescriptions": "required|array",
        "notes": "required|string",
        "patient_id": "required|string"
    };

    await validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(412)
                .send({
                    success: false,
                    message: 'Validation failed',
                    data: err
                });
        } else {
            next();
        }
    })
};



module.exports = {
    savePatient,
    createPatient,
    saveDoctor,
    createAppointment,
    saveRecords,
};