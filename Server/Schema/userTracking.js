// models/TrackingStatus.js
const mongoose = require("mongoose");

const trackingStatusSchema = new mongoose.Schema({
  train_id: { 
    type: String,
     required: true
     },
  username: { 
    type: String, 
    required: true
   },
  isTracking: { 
    type: Boolean,
     required: true
     }
});

const trainAvail= mongoose.model("TrackingStatus", trackingStatusSchema);
module.exports=trainAvail
