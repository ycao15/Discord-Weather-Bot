"use strict";

// IMPORTS
require("dotenv").config();
const logger = require("./logger.js");
const fetch = require("node-fetch");

// CONSTANTS
const darksky_endpoint = "https://api.darksky.net/forecast/";
const img_dir = "../img/";
const cardinal_dir_map = {
  0: "N",
  45: "NE",
  90: "E",
  135: "SE",
  180: "S",
  225: "SW",
  270: "W",
  315: "NW",
  360: "N"
};

// Icons are from Weather Underground, located at the following repository:
// https://github.com/manifestinteractive/weather-underground-icons
const icon_name_to_filename_map = {
  "clear-day": "clear.png",
  "clear-night": "nt_clear.png",
  rain: "rain.png",
  snow: "snow.png",
  sleet: "sleet.png",
  wind: "wind.png",
  fog: "fog.png",
  cloudy: "cloudy.png",
  "partly-cloudy-day": "partlycloudy.png",
  "partly-cloudy-night": "nt_partlycloudy.png"
};

// Return one of the following: N, NE, E, SE, S, SW, W, NW
function get_wind_direction(windBearing) {
  const cardinal_rounded_bearing = Math.round(windBearing / 45) * 45;
  return cardinal_dir_map[cardinal_rounded_bearing];
}

async function get_weather_report(geocoder_result) {
  logger.info(`Fetching weather for ${geocoder_result.formatted_address}`);

  // Format an API request URL
  const coordinate_string = `/${geocoder_result.coordinates.lat},${geocoder_result.coordinates.lon}`;
  const weather_url = `${darksky_endpoint}${process.env.DARKSKY_KEY}${coordinate_string}`;

  // Send the request and convert it to JSON
  const weather_response = await fetch(weather_url);
  const weather_json = await weather_response.json();

  // Get the local time
  let date = new Date();
  const time_format_options = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: weather_json.timezone,
    hour12: false
  };
  const local_time = date.toLocaleString("en-US", time_format_options);

  const icon = icon_name_to_filename_map[weather_json.currently.icon];
  const weather_report = {
    title: geocoder_result.formatted_address,
    summary: weather_json.currently.summary,
    local_time: local_time,
    temperatures: {
      current: Math.round(weather_json.currently.temperature),
      feels_like: Math.round(weather_json.currently.apparentTemperature),
      high: Math.round(weather_json.daily.data[0].temperatureHigh),
      low: Math.round(weather_json.daily.data[0].temperatureLow)
    },
    chance_of_rain: Math.round(100 * weather_json.currently.precipProbability),
    wind: {
      speed: Math.round(weather_json.currently.windSpeed),
      gust: weather_json.currently.windGust,
      direction_cardinal: get_wind_direction(weather_json.currently.windBearing)
    },
    icon: icon,
    icon_url: img_dir + icon
  };

  return weather_report;
}

module.exports = get_weather_report;
