const mongoose = require("mongoose");

const anomalyNotifySchema = new mongoose.Schema({
  train_id:{
    type:Number,
    required:true
  },
  date: {
    type: String,
    required: true,
  },
  anomaly_details:{
    type:String,
    required:true
  }
});
const AnomalyNotify=mongoose.model("AnomalyCount", anomalyNotifySchema);
module.exports =AnomalyNotify