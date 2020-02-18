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
const query_modifiers = {
  today: {
    set: new Set(["td", "today"]),
    modifier: "t0"
  },
  tomorrow: {
    set: new Set(["tm", "tomorrow"]),
    modifier: "t1"
  }
};

function get_query_modifier(modifier) {
  if (query_modifiers.today.set.has(modifier)) {
    return query_modifiers.today.modifier;
  }
  else if (query_modifiers.tomorrow.set.has(modifier)) {
    return query_modifiers.tomorrow.modifier;
  }
  else {
    // TODO: Check if the potential modifier is a specific date
  }

  return "_";
}

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
  return channel.send({
    embed: construct_Discord_embed(weather_report),
    files: [
      {
        attachment: weather_report.icon_url,
        name: weather_report.icon
      }
    ]
  });
}

async function process_query(query_string, query_modifier, discord_channel) {
  const geocoder_result = await geocode(query_string);

  // Handle errors with geocoding
  if (geocoder_result === undefined) {
    return;
  }
  if (geocoder_result.status === -1) {
    discord_channel.send(geocoder_result.error_msg);
    return;
  }

  try {
    const weather_report = await get_weather_report(geocoder_result, query_modifier);
    await send_weather_to_user(discord_channel, weather_report);
  }
  catch (error) {
    logger.error(error);
  }

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
  let message_content_array = message.content.split(/ +/);

  if (message.channel.type != "dm") {
    // Return immediately if the bot is not mentioned when it is messaged in a public chat
    if (!message.isMemberMentioned(discord_client.user)) {
      return;
    }
    // Remove mentions from the args list to make query parsing easier
    else {
      message_content_array = message_content_array.filter(
        arg => !arg.startsWith("<@!")
      );
    }
  }

  // TODO: Send an error message or a usage guide
  if (message_content_array.length == 0) return;

  // Process Commands
  if (message.content.startsWith(prefix)) {
    const command = message_content_array[0].slice(prefix.length);
    const args = message_content_array.slice(1);
  }

  // Process Queries
  else {
    let modifier = message_content_array[message_content_array.length - 1];
    const query_modifier = get_query_modifier(modifier);

    const query_string = message_content_array.join(" ");
    process_query(query_string, query_modifier, message.channel);
  }
});

discord_client.login(process.env.DISCORD_TOKEN);
