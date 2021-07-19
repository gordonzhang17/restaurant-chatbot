const serverless = require('serverless-http');
const express = require('express')
const app = express()

const axios = require('axios');
var cors = require('cors');

app.use(cors());
require('dotenv').config()

const NUM_RESULTS = 5;
const URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';

app.get('/fetchRestaurants', function(req, res, next) {

    const cuisine = req.query.cuisine;
    const address = req.query.address;
  
    const addressWithPlusSigns = address.replace(/[, ]+/g, "+").trim();
    const query = `${cuisine}+restaurants+in+${addressWithPlusSigns}`;
  
    axios({
      method: 'get',
      url: URL,
      params: {
        query: query,
        inputType: 'textquery',
        key: process.env.GOOGLE_PLACES_API_KEY,
      }
    }).then((response) => {
  
      let results = response.data.results;
  
      let parsedRestaurants = [];
  
      let initialNumberOfResults = NUM_RESULTS;
  
      for (let i = 0 ; i < initialNumberOfResults; i++) {
  
        let result = results[i];
  
        //check if restaurant is in business first
    
        if (result.business_status === "OPERATIONAL") {
          const name = result.name;
          const formattedAddress = result.formatted_address;
          const isOpenNow = result.opening_hours.open_now === true ? true : false;
          const rating = result.rating;
          
          const restaurant = {
            name: name, 
            formattedAddress: formattedAddress, 
            isOpenNow: isOpenNow, 
            rating: rating
          };
  
          parsedRestaurants.push(restaurant);
        } else {
  
          //want at least NUM_RESULTS so if skip, add to counter
          initialNumberOfResults++;
        }
      }
      let final = {restaurants: parsedRestaurants};
      res.send(JSON.stringify(final));
  
    }).catch((error) => {
      console.log(error);
    })
  
  });
  

module.exports.handler = serverless(app);