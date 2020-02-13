"use strict";

// IMPORTS
require("dotenv").config();
const Discord = require("discord.js");
const discord_client = new Discord.Client();
const fetch = require("node-fetch");

const geocode = require("./geocoder.js");

// CONSTANTS
const darksky_endpoint = "https://api.darksky.net/forecast/";
const prefix = "!";
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

// https://github.com/manifestinteractive/weather-underground-icons
const img_dir = "./img/";
const icon_name_to_filename_map = {
  "clear-day": "clear.png",
  "clear-night": "nt_clear.png",
  rain: "rain.png",
  snow: "snow.png",
  sleet: "sleet.png",
  wind: "wind.png",
  fog: "../img/fog.png",
  cloudy: "../img/cloudy.png",
  "partly-cloudy-day": "../img/partlycloudy.png",
  "partly-cloudy-night": "../img/nt_partlycloudy.png"
};

// Return one of the following: N, NE, E, SE, S, SW, W, NW
function get_wind_direction(windBearing) {
  const cardinal_rounded_bearing = Math.round(windBearing / 45) * 45;
  return cardinal_dir_map[cardinal_rounded_bearing];
}

async function get_weather_report(geocoder_result) {
  // Format an API request URL
  const coordinate_string = `/${geocoder_result.coordinates.lat},${geocoder_result.coordinates.lon}`;
  const weather_url = `${darksky_endpoint}${process.env.DARKSKY_KEY}${coordinate_string}`;

  // Send the request and convert it to JSON
  const weather_response = await fetch(weather_url);
  const weather_json = await weather_response.json();

  // Get the local time
  // TODO: Fix => This is the last recoding from DarkSky, not the actual current local time
  let date = new Date();
  const time_format_options = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: weather_json.timezone,
    hour12: false
  };
  const local_time = date.toLocaleString("en-US", time_format_options);

  // console.log(weather_json);
  const weather_report = {
    title: geocoder_result.formatted_address,
    summary: weather_json.currently.summary,
    local_time: local_time,
    temperatures: {
      current: Math.round(weather_json.currently.temperature),
      feels_like: Math.round(weather_json.currently.apparentTemperature),
      high: weather_json.daily.data[0].temperatureHigh,
      low: weather_json.daily.data[0].temperatureLow
    },
    chance_of_rain: Math.round(100 * weather_json.currently.precipProbability),
    wind: {
      speed: weather_json.currently.windSpeed,
      gust: weather_json.currently.windGust,
      direction: get_wind_direction(weather_json.currently.windBearing)
    },
    icon: weather_json.currently.icon
  };

  return weather_report;
}

function get_weather_icon(darksky_icon_name) {
  return 0;
}

function construct_Discord_embed(weather_report) {
  const embed = {
    color: 0x0099ff,
    title: weather_report.title,
    description: weather_report.summary,
    thumbnail: {
      url: "attachment://" + icon_name_to_filename_map[weather_report.icon]
    },
    fields: [
      {
        name: "Temperature",
        value: String(weather_report.temperatures.current) + "°",
        inline: true
      },
      {
        name: "Chance of Rain",
        value: String(weather_report.chance_of_rain) + "%",
        inline: true
      },
      {
        name: "Local Time",
        value: weather_report.local_time,
        inline: true
      },
      {
        name: "Feels Like",
        value: String(weather_report.temperatures.feels_like) + "°",
        inline: true
      },
      {
        name: "High",
        value: String(Math.round(weather_report.temperatures.high)) + "°",
        inline: true
      },
      {
        name: "Low",
        value: String(Math.round(weather_report.temperatures.low)) + "°",
        inline: true
      }
    ]
  };

  return embed;
}

// Message Handler
discord_client.on("message", async message => {
  // Return immediately if the message is from a bot
  if (message.author.bot) return;
  let message_content_split_array = message.content.split(/ +/);

  if (message.channel.type != "dm") {
    // Return immediately if the bot is not mentioned when it is messaged in a public chat
    if (!message.isMemberMentioned(discord_client.user)) {
      return;
    }
    // Remove mentions from the args list to make query parsing easier
    else {
      message_content_split_array = message_content_split_array.filter(
        // The Discord.MessageMentions method doesn't seem to work when the args list length is > 1
        // arg => !Discord.MessageMentions.USERS_PATTERN.test(arg)
        arg => !arg.startsWith("<@!")
      );
    }
  }

  // TODO: Send an error message or a usage guide
  if (message_content_split_array.length == 0) return;

  // Process Commands
  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();
    console.log(command, args);
  }
  // Process Queries
  else {
    const geocoder_result = await geocode(
      message_content_split_array.join(" ")
    );

    if (geocoder_result === undefined) {
      return;
    }

    const weather_report = await get_weather_report(geocoder_result);
    const embed = construct_Discord_embed(weather_report);
    message.channel.send({
      embed: embed,
      files: [
        {
          attachment: img_dir + icon_name_to_filename_map[weather_report.icon],
          name: icon_name_to_filename_map[weather_report.icon]
        }
      ]
    });
    console.log(weather_report);
  }
});

discord_client.login(process.env.DISCORD_TOKEN);
