const config = require('../config/config');
const reviewTable = config.db.reviewTableUrl;
const apiKey = config.key.apiKey;
const axios = require('axios');
const catchAsync = require('../utils/errors/catchAsync');

const createReview = async (req, res) => {
    const {name, email, rating, message} = req.body;
    const fields = {
        Name:name,
        Email:email,
        Rating:rating,
        Message:message
    }
    const data = { fields };
    try {
        const response = await axios.post(reviewTable, data, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });

        console.log("Review added successfully:", response.data);
        res.status(201).json({
            success: true,
            message: "Successfully added..",
        });
    } catch (error) {
        console.error("Error adding record:", error.response.data);
        res.status(500).send("Error adding review to Airtable.");
    }
};

const getAllReview = async (req, res) => {
    try {
      const headers = {
        Authorization: `Bearer ${apiKey}`,
      };
  
      const response = await axios.get(reviewTable, { headers });
      const data = response.data;
  
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch data from Airtable" });
    }
  };

module.exports = { createReview, getAllReview }