import express from "express";
const router=express.Router();
import { extractPublicId } from 'cloudinary-build-url'
import  User  from '../models/User.js';
import  Listing  from '../models/Listing.js';
import {v2 as cloudinary} from 'cloudinary';


//Add listing to wishlist
router.patch("/:userId/:listingId", async (req, res) => {
    try {
      const { userId, listingId } = req.params;
      const user = await User.findById(userId);
      const listing = await Listing.findById(listingId).populate("creator");
      const favoriteListing = listing.wishlistUsers.find((item) => item === userId);
      
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      if (favoriteListing) {
        listing.wishlistUsers = listing.wishlistUsers.filter((item) => item !== userId);
        await listing.save();
        const relatedListings = await Listing.find({ wishlistUsers: userId }).populate("creator");

        res.status(200).json({ message: "Listing is removed from wish list", wishList: relatedListings});
      } else {
        listing.wishlistUsers.push(userId);
        await listing.save();
        const relatedListings = await Listing.find({ wishlistUsers: userId }).populate("creator");

        res.status(200).json({ message: "Listing is added to wish list", wishList: relatedListings});
      } 
      
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  })

//Get wishlist of users 
router.get("/:userId/wishlist", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    const wishlist = await Listing.find({ wishlistUsers: userId }).populate("creator");
    
      
      res.status(202).json(wishlist);
    
    
  } catch (err) {
    res.status(404).json({ message: "Can not find properties!", error: err.message })
  }
})

//Get Listings list
router.get("/:userId/properties", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if(user.isAdmin)
    {
      const properties = await Listing.find().populate("creator");
      res.status(202).json(properties);
    }
    else
    {
      const properties = await Listing.find({ creator: userId }).populate("creator");
      res.status(202).json(properties);
    }
    
  } catch (err) {
    res.status(404).json({ message: "Can not find properties!", error: err.message })
  }
})


//Delete listing
router.delete("/delete/:userId/:listingId", async (req,res) => {
  try {
    const { userId, listingId } = req.params;
    const user = await User.findById(userId);
    const deletedListing = await Listing.findByIdAndDelete(listingId);
    if (!deletedListing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    for (const photoPath of deletedListing.listingPhotoPaths) {
      const publicId = extractPublicId(photoPath);
      await cloudinary.uploader.destroy(publicId);
    }
    
    if(user.isAdmin)
    {
      const properties = await Listing.find().populate("creator");
      res.status(200).json({properties: properties, wishlist: user.wishList});
    }
    else
    {
      const properties = await Listing.find({ creator: userId }).populate("creator");
      res.status(200).json({properties: properties, wishlist: user.wishList});
    }
    
  } catch (err) {
    res.status(500).json({ message: "An error occurred while deleting the listing.", error: err.message });
  }
})

//Certify the listing by Admin
router.patch("/certify/:userId/:listingId", async (req,res)=> {
  try {
    const { listingId } = req.params;
    const listing = await Listing.findById(listingId);
    
    if (listing.certified) {
      listing.certified=false;
      await listing.save();
      const properties = await Listing.find().populate("creator");
      res.status(200).json({properties:properties, message: "Removed from certification"});
    } else {
      listing.certified=true;
      await listing.save();
      const properties = await Listing.find().populate("creator");
      res.status(200).json({properties:properties, message: "Listing is certified successfully"});
    } 
  } catch (error) {
    res.status(404).json({ error: err.message });
  }
})
export default router;