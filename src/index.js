"use strict";

// IMPORTS
require("dotenv").config();
const logger = require("./logger.js");
const Discord = require("discord.js");
const discord_client = new Discord.Client();
const geocode = require("./geocoder.js");
const get_weather_report = require("./weather.js");

// CONSTANTS
const prefix = "!";

function construct_Discord_embed(weather_report) {
  const discord_rich_embed = {
    color: 0x0099ff,
    title: weather_report.title,
    description: weather_report.summary,
    thumbnail: {
      url: "attachment://" + weather_report.icon
    },
    fields: [
      {
        name: "Temperature",
        value: String(weather_report.temperatures.current) + "°",
        inline: false
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
        value: String(weather_report.temperatures.high) + "°",
        inline: true
      },
      {
        name: "Low",
        value: String(weather_report.temperatures.low) + "°",
        inline: true
      },
      {
        name: "Wind",
        value:
          String(weather_report.wind.speed) +
          "mph " +
          weather_report.wind.direction_cardinal,
        inline: true
      }
    ]
  };

  return discord_rich_embed;
}

function send_weather_to_user(channel, weather_report) {
  channel.send({
    embed: construct_Discord_embed(weather_report),
    files: [
      {
        attachment: weather_report.icon_url,
        name: weather_report.icon
      }
    ]
  });
}

////////////////////
// EVENT HANDLERS //
////////////////////

discord_client.on("ready", () => logger.info("Starting Weather Bot"));
discord_client.on("debug", m => logger.debug(m));
discord_client.on("warn", m => logger.warn(m));
discord_client.on("error", m => logger.error(m));

process.on("uncaughtException", error => logger.error(error));

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
    const query_string = message_content_split_array.join(" ");
    const geocoder_result = await geocode(query_string);

    // Handle errors with geocoding
    if (geocoder_result === undefined) {
      return;
    }
    if (geocoder_result.status === -1) {
      message.channel.send(geocoder_result.error_msg);
      return;
    }

    const weather_report = await get_weather_report(geocoder_result);
    send_weather_to_user(message.channel, weather_report);
  }
});

discord_client.login(process.env.DISCORD_TOKEN);
