const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const bodyParser = require("body-parser");
const cors = require("cors");
const { ethers } = require('ethers');
const nodemailer = require("nodemailer");
const app = express();
const db_uri = process.env.DB_URI;
mongoose.connect(db_uri);
const port = process.env.PORT;
const signUp = require("./Schema/signup");
const train=require("./Schema/train_data");
const UserTracking = require("./Schema/userTracking");
const moisture=require("./Schema/moisture_data");
const AnomalyCount=require("./Schema/anamolyCount");
const db = mongoose.connection;


db.once("open", async() => {
  console.log("Mongodb Connection Successful");
});

app.use(bodyParser.json());
app.use(
  cors({
    origin: true,
    methods: ["GET","POST","PUT"],
    allowedHeaders: "*",
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Welcome to the home page");
});

//const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');

// Initialize wallet with private key (use a test account)
//const privateKey = 'YOUR_PRIVATE_KEY'; // Replace with your Ethereum private key
//const wallet = new ethers.Wallet(privateKey, provider);

// Smart contract address and ABI
//const contractAddress = 'YOUR_CONTRACT_ADDRESS';
{/*const abi = [
  {
    "constant": false,
    "inputs": [
      { "name": "_trainNumber", "type": "string" },
      { "name": "_weight", "type": "string" },
      { "name": "_timestamp", "type": "string" }
    ],
    "name": "storeTrainData",
    "outputs": [],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{ "name": "_trainNumber", "type": "string" }],
    "name": "getTrainData",
    "outputs": [
      { "name": "weight", "type": "string" },
      { "name": "timestamp", "type": "string" }
    ],
    "type": "function"
  }
];

// Initialize the contract instance
const contract = new ethers.Contract(contractAddress, abi, wallet);*/}

app.post('/store-train-data', async (req, res) => {
  try {
    // Extract data from the request body
    const { train_id, train_weight,train_arrival } = req.body;

    if (!train_id || !train_weight) {
      return res.status(400).json({ message: 'Missing trainNumber, trainWeight, or timestamp' });
    }

    const trainData=new train({
      train_id,
      train_weight,
      train_arrival,
    });
    await trainData.save();

    // Store the train data directly on the blockchain
    //const tx = await contract.storeTrainData(trainNumber, trainWeight, timestamp);
    //await tx.wait(); // Wait for transaction confirmation
    //console.log('Train data stored on the blockchain.');

    // Send a response confirming storage
    res.json({ message: 'Train data stored on the blockchain!', train_id, train_weight, timestamp });
  } catch (error) {
    console.error('Error storing train data:', error);
    res.status(500).send('Error storing train data');
  }
});

app.get("/get-train-data",async(req,res)=>{
  try{
    const {train_id}=req.query;
    const trainData=await train.find({train_id});
    res.status(200).json(trainData);
  }
  catch{
    res.status(500).send('Error fetching train data');
  }
});

app.post("/post-moisture",async(req,res)=>{
  try{
    const {train_id,moisture_level,location}=req.body;
    const timestamp=new Date().toLocaleDateString('en-CA',{ 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit', 
      hour12: false 
    });
    const moistureData=new moisture({
      train_id,
      moisture_level,
      location,
      timestamp
      });
    await moistureData.save();
    res.json({ message: 'Moisture data stored successfully', train_id, moisture_level, location, timestamp });
  }
  catch{
    res.status(500).send('Error posting moisture data');
  }
});

app.get("/get-moisture", async (req, res) => {
  try {
    const { train_id, timestamp } = req.query;

    // Parse the timestamp from the query to a Date object
    const date = new Date(timestamp);

    // Set the start and end range to match the entire day
    const startOfDay = new Date(date.setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setUTCHours(23, 59, 59, 999));

    // Use the correct field (timestamp) and add a train_id filter
    const results = await moisture.find({
      train_id: train_id,
      timestamp: { $gte: startOfDay, $lte: endOfDay }
    });

    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching moisture data");
  }
});


// Route to verify train data
{/*app.post('/verify-train-data', async (req, res) => {
  try {
    // Extract data from the request body
    const { trainNumber, trainWeight, timestamp } = req.body;

    if (!trainNumber || !trainWeight || !timestamp) {
      return res.status(400).json({ message: 'Missing trainNumber, trainWeight, or timestamp' });
    }

    // Retrieve the stored train data from the blockchain using the train number
    const storedData = await contract.getTrainData(trainNumber);

    // Compare the provided data with the stored data
    const isVerified =
      storedData.weight === trainWeight && storedData.timestamp === timestamp;

    if (isVerified) {
      res.json({ message: 'Train data is verified!', verified: true, trainNumber });
    } else {
      res.json({ message: 'Train data verification failed.', verified: false, trainNumber });
    }
  } catch (error) {
    console.error('Error verifying train data:', error);
    res.status(500).send('Error verifying train data');
  }
});*/}

app.post("/signup", async (req, res) => {
  const { username, password, confirmPassword } = req.body;
  try {
    const user = await signUp.findOne({ username });
    if (user) {
      return res.status(401).json({ error: "User Already exists!!" });
    }
    if (password !== confirmPassword) {
      return res.status(400).send({ message: "Passwords are not matching" });
    }
    const salt = await bcryptjs.genSalt(10);
    const hashedpassword = await bcryptjs.hash(password, salt);
    const sign = new signUp({
      username,
      password: hashedpassword,
    });
    await sign.save();
    res.status(201).json({ message: "User registered Successfully!!" });
  } catch {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password} = req.body;
    const user = await signUp.findOne({ username });
    if (!user) {
      res.status(401).json({ error: "User not Found." });
    }
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(402).json({ error: "Invalid Credentials!!" });
    } else {
      res.status(200).json({ message: "User logged in Successfully!!" });
    }
  } catch {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

const userTracking={};

app.post("/user-tracking", async (req, res) => {
  try {
    const { username, train_id } = req.body;
    if (!username || !train_id) {
      return res.status(400).send({ message: "Please enter both username and train id" });
    }

    const user = await signUp.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    
    let trackingEntry = await UserTracking.findOne({ username, train_id });
    if (!trackingEntry) {
      trackingEntry = new UserTracking({ username, train_id });
      await trackingEntry.save();
    }

    res.json({ message: `User ${username} is now tracking train ${train_id}.` });
  } catch (error) {
    return res.status(500).json({ error: "Unable to Track!" });
  }
});

app.post("/anomaly-detected", async (req, res) => {
  try {
    const { train_id, anomaly_details } = req.body;
    if (!train_id || !anomaly_details) {
      return res.status(400).send({ message: "Please enter both train id and anomaly details" });
    }

    const usersTracking = await UserTracking.find({ train_id });

    if (usersTracking.length > 0) {
      console.log(usersTracking);
      for (const trackingEntry of usersTracking) {
        const transporter = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: process.env.USER,
            pass: process.env.PASS,
          },
        });

        const mailOptions = {
          from: process.env.USER,
          to: trackingEntry.username,
          subject: "Anomaly Detected!",
          text: `${anomaly_details}`,
        };

        await transporter.sendMail(mailOptions);
      }
      const today = new Date().toISOString().split("T")[0];
      const anomalyEntry = await AnomalyCount.findOne({ date: today });
  
      if (anomalyEntry) {
        anomalyEntry.count += 1;
        anomalyEntry.train_id=train_id;
        await anomalyEntry.save();
      } else {
        const data=new AnomalyCount({
          date: today,
          count: 1,
          train_id:train_id
        });
        await data.save();
      }
    }

    res.json({ message: 'Anomaly detected and users notified.', anomaly_details });
  } catch (error) {
    return res.status(500).json({ error: "Unable to Detect Anomaly!" });
  }
});

app.get("/get-Anamoly-count",async(req,res)=>{
  try{
    const {train_id}=req.query;
    //const results = await AnomalyCount.find({ name: new RegExp('^' + query, 'i'),email });
    const results = await AnomalyCount.find({train_id});
    res.json(results);
  }
  catch{
    return res.status(500).json({ error: "Unable to get Anomaly count!" });
  }
})


app.listen(port, () => {
    console.log("Server Started");
  });