"use strict";

const Discord = require("discord.js");
const discord_client = new Discord.Client();
require("dotenv").config();

const prefix = "!";

/*
discord_client.once("ready", () => {
  // console.log("Ready!");
});
*/

discord_client.on("message", message => {
  // Immediately return if the messager is a bot OR the weather bot is not @mentioned
  if (message.author.bot || !message.isMemberMentioned(discord_client.user))
    return;

  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).split(" ");
    const command = args.shift().toLowerCase();
    console.log(command, args);
  }

  console.log(message.content);
  // console.log(message.mentions);
  // console.log("message author: ", message.author);

  console.log();
});

discord_client.login(process.env.DISCORD_TOKEN);
