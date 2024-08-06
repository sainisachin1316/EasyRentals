import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import authRoutes from './routes/auth.js';
import bodyParser from "body-parser";
import listingRoutes from './routes/listing.js';
import userRoutes from './routes/user.js';
import {v2 as cloudinary} from 'cloudinary';

const app=express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

//Cloudinary Setup
cloudinary.config({ 
    cloud_name: process.env.CLOUD_NAME, 
    api_key: process.env.API_KEY, 
    api_secret: process.env.API_SECRET 
});

// Routes
app.use("/auth", authRoutes)
app.use("/properties", listingRoutes)
app.use("/users", userRoutes)

// MONGOOSE SETUP  
const PORT=3001;
mongoose.connect(process.env.MONGO_URL, {
    dbname: "rental123",
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=>{
    app.listen(PORT, ()=> console.log(`Server connect to Port: ${PORT}`))
}).catch((err)=> console.log(`${err} did not connect`));