import express from "express";
const router=express.Router();
import {v2 as cloudinary} from 'cloudinary';
import  Listing  from '../models/Listing.js';
import multer from 'multer';
import streamifier from 'streamifier'

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


//Create the listing
router.post("/create", upload.array("listingPhotos"), async (req,res)=>{
    try {
        /* Take the information from the form */
        const {
            creator,
            category,
            type,
            streetAddress,
            aptSuite,
            city,
            province,
            country,
            guestCount,
            bedroomCount,
            bedCount,
            bathroomCount,
            amenities,
            title,
            description,
            highlight,
            highlightDesc,
            price,
        } = req.body;
  
      const listingPhotos = req.files
  
      if (!listingPhotos) {
        return res.status(400).send("No files uploaded.")
      }

      let uploadFromBuffer = (files) => {
        return new Promise((resolve, reject) => {
          const uploadPromises = files.map(file => {
              return new Promise((resolve, reject) => {
                  let cld_upload_stream = cloudinary.uploader.upload_stream({
                      folder: "listing"
                  }, (error, result) => {
                      if (error) {
                          reject(error);
                      } else {
                          resolve(result);
                      }
                  });
                  streamifier.createReadStream(file.buffer).pipe(cld_upload_stream);
              });
          });
          Promise.all(uploadPromises)
            .then(results => {
                resolve(results);
            })
            .catch(error => {
                reject(error);
            });
          });
      };
        
      const imageResults = await uploadFromBuffer(req.files);
      const listingPhotoPaths = imageResults.map(result => result.secure_url);

      const newListing = new Listing({
        creator,
        category,
        type,
        streetAddress,
        aptSuite,
        city,
        province,
        country,
        guestCount,
        bedroomCount,
        bedCount,
        bathroomCount,
        amenities,
        listingPhotoPaths,
        title,
        description,
        highlight,
        highlightDesc,
        price,
      })
  
      await newListing.save()
      res.status(200).json(newListing)
    
    } catch (err) {
        res.status(409).json({ message: "Fail to create Listing", error: err.message })
    }
})


/* GET lISTINGS BY CATEGORY */
router.get("/", async (req, res) => {
  const qCategory = req.query.category;
  try {
    let listings;
    if (qCategory) {
      listings = await Listing.find({ category: qCategory }).populate("creator");
    } else {
      listings = await Listing.find().populate("creator");
    }
    res.status(200).json(listings)
  } catch (err) {
    res.status(404).json({ message: "Fail to fetch listings", error: err.message })
    console.log(err)
  }
})


/* LISTING DETAILS */
router.get("/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params
    const listing = await Listing.findById(listingId).populate("creator")
    res.status(202).json(listing)
  } catch (err) {
    res.status(404).json({ message: "Listing can not found!", error: err.message })
  }
})


export default router;