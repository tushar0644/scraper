const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');
const registrationController = require('../controllers/registrationController');

// OTP Routes
router.post('/send-otp', otpController.sendOtp);
router.post('/verify-otp', otpController.verifyOtp);

// Campaign Registration Routes
router.post('/register', registrationController.createRegistration);
router.get('/registrations', registrationController.getRegistrations);
router.delete('/registrations/:id', registrationController.deleteRegistration);

module.exports = router;
