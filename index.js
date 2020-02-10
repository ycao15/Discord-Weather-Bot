"use strict";

// IMPORTS
require("dotenv").config();
const Discord = require("discord.js");
const discord_client = new Discord.Client();
// https://developers.google.com/maps/documentation/geocoding/start?hl=en_US
const googleMapsClient = require("@google/maps").createClient({
  key: process.env.GOOGLE_PLACES_GEOCODER_KEY,
  Promise: Promise
});
const fetch = require("node-fetch");

const geocode = require("./geocoder.js");

// CONSTANTS
const darksky_endpoint = "https://api.darksky.net/forecast/";
const prefix = "!";

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

    message.channel.send(
      `Fetching weather for ${geocoder_result.formatted_address}`
    );

    const coordinate_string = `/${geocoder_result.coordinates.lat},${geocoder_result.coordinates.lon}`;
    const weather_url = `${darksky_endpoint}${process.env.DARKSKY_KEY}${coordinate_string}`;

    const weather_response = await fetch(weather_url);
    const weather_json = await weather_response.json();
    console.log(weather_json);
  }

  console.log(message_content_split_array);
  // console.log(message.mentions);
  // console.log("message author: ", message.author);

  console.log();
});

discord_client.login(process.env.DISCORD_TOKEN);
