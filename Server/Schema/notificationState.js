const mongoose = require("mongoose");

// Define a schema for NotificationState
const notificationStateSchema = new mongoose.Schema({
  lastCheckedDate: {
    type: Date,
    default: null,
  },
});

const notifyState=mongoose.model("NotifyState",notificationStateSchema);
module.exports = notifyState;