import express from "express";
const router=express.Router();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import  User  from '../models/User.js';
import multer from 'multer';
import streamifier from 'streamifier'
import {v2 as cloudinary} from 'cloudinary';


// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// User register
router.post("/register", upload.single('profileImage'), async(req,res) => {
    try{
        // Take all information from the from 
        const {firstName, lastName, email, password}=req.body;
        
        // Check if a file was uploaded or not
        if (!req.file) {
            return res.status(400).send("No file uploaded");
        }
        
        // Check if user already exists or not
        const existingUser=await User.findOne({email});
        if(existingUser)
        {   
           return res.status(409).json({message: "User already exists"});
        }

        // Get the file data from multer's stream
        let uploadFromBuffer = (req) => {
            return new Promise((resolve, reject) => {
                let cld_upload_stream = cloudinary.uploader.upload_stream({
                    folder: "user_profile_img",width: 900, height: 900, gravity: "face", crop: "thumb"
                }, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
                streamifier.createReadStream(req.file.buffer).pipe(cld_upload_stream);
            });
        };

        const imageResult = await uploadFromBuffer(req);
        const profileImagePath = imageResult.secure_url;

        // Hass the password
        const salt=await bcrypt.genSalt();
        const hashedPassword=await bcrypt.hash(password,salt);

        // Create a new User
        const newUser=new User ({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            profileImagePath,
        });

        // Save the new User
        await newUser.save();
        res.status(200).json ({message: "User registered successfully", user:newUser})
    }
    catch (err) {
        console.log(err);
        res.status(500).json({message: "Registration failed", error:err.message});
    }
})


// User Login
router.post("/login", async(req,res)=>{
    try {
        //Take the info from the form
        const {email,password}=req.body;

        // Check if user exists or not
        const user=await User.findOne({email});
        if(!user)
        {
            return res.status(409).json({message: "User doesn't exist"});
        }

        // Compare the password with the hashed password
        const isMatch=await bcrypt.compare(password, user.password);
        if(!isMatch)
        {
            return res.status(400).json({message: "Invalid Credentials"});
        }

        // Generate JWT Token
        const token=jwt.sign({id: user._id}, process.env.JWT_SECRET);
        delete user.password;
        res.status(200).json({token, user, message: "Logged In Successfully"});

    } catch (error) {
        res.status(500).json({message: "Login failed", error:error.message});
    }
})

export default router;
