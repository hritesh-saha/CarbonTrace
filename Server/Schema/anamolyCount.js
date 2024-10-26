const mongoose = require("mongoose");

const anomalyCountSchema = new mongoose.Schema({
  train_id:{
    type:Number,
    required:true
  },
  date: {
    type: String,
    required: true,
    unique: true,
  },
  count: {
    type: Number,
    default: 1,
  },
});
const AnomalyCount=mongoose.model("AnomalyCount", anomalyCountSchema);
module.exports =AnomalyCount