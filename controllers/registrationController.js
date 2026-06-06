const Registration = require('../models/registrationModel');
const mongoose = require('mongoose');

// In-Memory fallback list when MongoDB is not connected
let inMemoryRegistrations = [];

// Helper: Calculate age from Date
function calculateAge(dobDate) {
  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const m = today.getMonth() - dobDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
    age--;
  }
  return age;
}

// Helper: Format Date as DD/MM/YYYY
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Submit Registration
 * POST /api/register
 */
exports.createRegistration = async (req, res) => {
  try {
    const { name, phone, dob, gender, city, reelUrls } = req.body;

    // Backend Validations
    if (!name || !phone || !dob || !gender || !city || !reelUrls || !Array.isArray(reelUrls) || reelUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All registration fields and at least one Reel URL are required.'
      });
    }

    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Date of Birth format.'
      });
    }

    const age = calculateAge(dobDate);
    if (age < 18 || age > 36) {
      return res.status(400).json({
        success: false,
        message: 'Age must be between 18 and 36.'
      });
    }

    // Save in DB if connection is active
    let savedRecord = null;
    const isDbConnected = mongoose.connection.readyState === 1;

    if (isDbConnected) {
      try {
        const registrationDoc = new Registration({
          name,
          phone,
          dob: dobDate,
          gender,
          city,
          reelUrls
        });
        savedRecord = await registrationDoc.save();
        console.log(`[Database] Registration saved: ${name} (${phone})`);
      } catch (dbErr) {
        console.warn('[Database] DB save failed. Falling back to in-memory.', dbErr.message);
      }
    }

    // Always keep in-memory cache synchronized as fallback
    const memoryRecord = {
      _id: savedRecord ? savedRecord._id.toString() : new mongoose.Types.ObjectId().toString(),
      name,
      phone,
      dob: dobDate.toISOString().split('T')[0],
      dobFormatted: formatDate(dobDate),
      gender,
      city,
      reelUrls,
      age,
      createdAt: new Date()
    };

    inMemoryRegistrations.push(memoryRecord);

    if (!savedRecord) {
      console.log(`[Database Mock] Saved registration in-memory: ${name} (${phone})`);
    }

    return res.status(201).json({
      success: true,
      message: 'Registration submitted successfully.',
      registration: memoryRecord
    });

  } catch (error) {
    console.error('Create Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while submitting registration.'
    });
  }
};

/**
 * Get All Registrations
 * GET /api/registrations
 */
exports.getRegistrations = async (req, res) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    let records = [];

    if (isDbConnected) {
      try {
        const dbRecords = await Registration.find().sort({ createdAt: 1 });
        records = dbRecords.map((doc, idx) => {
          const dobDate = new Date(doc.dob);
          return {
            _id: doc._id.toString(),
            no: idx + 1,
            name: doc.name,
            phone: doc.phone,
            dob: dobDate.toISOString().split('T')[0],
            dobFormatted: formatDate(dobDate),
            gender: doc.gender,
            city: doc.city,
            reelUrls: doc.reelUrls,
            igLink: doc.reelUrls && doc.reelUrls.length > 0 ? doc.reelUrls[0] : '',
            age: calculateAge(dobDate),
            createdAt: doc.createdAt
          };
        });
        
        // Sync our local memory cache with DB
        inMemoryRegistrations = [...records];
        
        return res.status(200).json({
          success: true,
          registrations: records
        });
      } catch (dbErr) {
        console.warn('[Database] Failed to query registrations. Falling back to in-memory.', dbErr.message);
      }
    }

    // Map inMemoryRegistrations to have the exact index numbers
    const mappedMemory = inMemoryRegistrations.map((rec, idx) => ({
      ...rec,
      no: idx + 1,
      igLink: rec.reelUrls && rec.reelUrls.length > 0 ? rec.reelUrls[0] : ''
    }));

    return res.status(200).json({
      success: true,
      registrations: mappedMemory
    });

  } catch (error) {
    console.error('Get Registrations Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching registrations.'
    });
  }
};

/**
 * Delete Registration
 * DELETE /api/registrations/:id
 */
exports.deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Registration ID is required.'
      });
    }

    const isDbConnected = mongoose.connection.readyState === 1;
    let deletedFromDb = false;

    if (isDbConnected) {
      try {
        const result = await Registration.findByIdAndDelete(id);
        if (result) {
          deletedFromDb = true;
          console.log(`[Database] Registration deleted: ID ${id}`);
        }
      } catch (dbErr) {
        console.warn('[Database] DB delete failed.', dbErr.message);
      }
    }

    // Filter from local memory cache as well
    const initialLength = inMemoryRegistrations.length;
    inMemoryRegistrations = inMemoryRegistrations.filter(rec => rec._id !== id);
    const deletedFromMemory = inMemoryRegistrations.length < initialLength;

    if (deletedFromDb || deletedFromMemory) {
      return res.status(200).json({
        success: true,
        message: 'Registration deleted successfully.'
      });
    } else {
      return res.status(444).json({
        success: false,
        message: 'Registration record not found.'
      });
    }

  } catch (error) {
    console.error('Delete Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting registration.'
    });
  }
};
