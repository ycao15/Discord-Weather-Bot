"use strict";

require("dotenv").config();

const googleMapsClient = require("@google/maps").createClient({
  key: process.env.GOOGLE_PLACES_GEOCODER_KEY,
  Promise: Promise
});
// https://developers.google.com/maps/documentation/geocoding/start?hl=en_US

async function geocode(query_string) {
  try {
    const geocoder_response = await googleMapsClient
      .geocode({
        address: query_string,
        region: "US"
      })
      .asPromise();
    const geocoder_json = geocoder_response.json; // Has 2 keys: 'results', 'status'

    if (geocoder_response.status !== 200) {
      // TODO: Depending on the status, send a message to the user about the error
      console.log(
        "Google Geocoder API returned status: ",
        geocoder_json.status
      );
      return;
    }

    const geocoder_first_result = geocoder_json.results[0];
    console.log(
      "Fetching weather for",
      geocoder_first_result.formatted_address
    );

    const google_coordinates = geocoder_first_result.geometry.location;
    return {
      coordinates: {
        lat: google_coordinates.lat,
        lon: google_coordinates.lng
      },
      formatted_address: geocoder_first_result.formatted_address
    };
  } catch (err) {
    console.log(err);
  }
}

module.exports = geocode;
