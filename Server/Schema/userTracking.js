// userTrackingModel.js
const mongoose = require('mongoose');

const userTrackingSchema = new mongoose.Schema({
  username: { 
    type: String,
    required: true },
  train_id: { 
    type: Number,
    required: true },
});

const UserTracking = mongoose.model('UserTracking_data', userTrackingSchema);

module.exports = UserTracking;
