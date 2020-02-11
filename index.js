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

async function process_weather(geocoder_result) {
  // Format an API request URL
  const coordinate_string = `/${geocoder_result.coordinates.lat},${geocoder_result.coordinates.lon}`;
  const weather_url = `${darksky_endpoint}${process.env.DARKSKY_KEY}${coordinate_string}`;

  // Send the request and convert it to JSON
  const weather_response = await fetch(weather_url);
  const weather_json = await weather_response.json();

  // Get the local time
  let date = new Date(weather_json.currently.time);
  const time_format_options = {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: weather_json.timezone,
    hour12: false
  };
  const local_time = date.toLocaleString("en-US", time_format_options);

  // console.log(weather_json);
  const weather_report = {
    title: "Weather for " + geocoder_result.formatted_address,
    summary: weather_json.currently.summary,
    local_time: local_time,
    temperature: Math.round(weather_json.currently.temperature),
    feels_like: Math.round(weather_json.currently.apparentTemperature),
    icon: weather_json.currently.icon
  };

  return weather_report;
}

function construct_Discord_embed(weather_report) {
  const embed = {
    color: 0x0099ff,
    title: weather_report.title,
    description: weather_report.summary,
    fields: [
      {
        name: "Local Time",
        value: weather_report.local_time
      },
      {
        name: "Temperature",
        value: String(weather_report.temperature) + "°F"
      },
      {
        name: "Feels Like",
        value: String(weather_report.feels_like) + "°F"
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

    /*
    const geocoder_result = {
      formatted_address: "Los Angeles, CA, USA",
      coordinates: {
        lat: 34.0522342,
        lon: -118.2436849
      }
    };
    */

    if (geocoder_result === undefined) {
      return;
    }

    const weather_report = await process_weather(geocoder_result);
    const embed = construct_Discord_embed(weather_report);
    message.channel.send({ embed: embed });
    console.log(weather_report);
  }

  console.log(message_content_split_array);
  // console.log(message.mentions);
  // console.log("message author: ", message.author);

  console.log();
});

discord_client.login(process.env.DISCORD_TOKEN);

/*
// Converts given unix timestamp to local time
// timeZone parameter should be the one given by DarkSky
let date = new Date(timestamp);

let local_date_time = date.toLocaleString("en-US", {timeZone: "America/Los_Angeles"});
let local_time = local_date_time.split(", ")[1];

*/
