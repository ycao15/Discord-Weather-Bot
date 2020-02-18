"use strict";

// IMPORTS
require("dotenv").config();
const logger = require("./logger.js");
const googleMapsClient = require("@google/maps").createClient({
  key: process.env.GOOGLE_PLACES_GEOCODER_KEY,
  Promise: Promise
});
// https://developers.google.com/maps/documentation/geocoding/start?hl=en_US

async function geocode(query_string) {
  logger.info(`User query: ${query_string}`);
  let geocoder_response;
  try {
    geocoder_response = await googleMapsClient
      .geocode({
        address: query_string,
        region: "US"
      })
      .asPromise();
  } catch (error) {
    logger.error(error);
    return;
  }

  if (geocoder_response.status !== 200) {
    return;
  }

  const geocoder_json = geocoder_response.json; // Has 2 keys: 'results', 'status'
  const geocode_status = geocoder_json.status;
  logger.info(`Google Geocoder returned status: ${geocode_status}`);

  if (geocode_status !== "OK") {
    let error_msg;
    if (geocode_status === "ZERO_RESULTS") {
      error_msg = "Please enter a valid location";
    } else {
      error_msg = "Encountered error with geocoding service";
    }
    return {
      status: -1,
      error_msg: error_msg
    };
  }

  const geocoder_first_result = geocoder_json.results[0];

  const google_coordinates = geocoder_first_result.geometry.location;
  return {
    status: 0,
    coordinates: {
      lat: google_coordinates.lat,
      lon: google_coordinates.lng
    },
    formatted_address: geocoder_first_result.formatted_address
  };

}

module.exports = geocode;
