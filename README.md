# Railway Opeartions Centre
An Open Source project to provide a PBX Style system for use with SimSig games.

- [Railway Opeartions Centre](#railway-opeartions-centre)
- [Getting started](#getting-started)
  - [Installation](#installation)
  - [Server configuration](#server-configuration)
  - [Running ROC](#running-roc)
- [Screenshots](#screenshots)
- [Bot and Discord server set up](#bot-and-discord-server-set-up)


# Getting started

Prerequisits: Requires node.js v16 and yarn.

ROC requires a working discord server and bot. See [Bot and Discord server set up](#bot-and-discord-server-set-up).

## Installation
* Run `yarn` in the root of the project to install all dependencies

## Server configuration

This applies to `./ROC-Server/config.json`.

1. Get your server ID and enter this as `guild`
2. In your discord bot settings, go to `Bot`, generate a token and copy this into `token`

For local development, set the `corsOrigin` to `*`. Do not use this value in production.

## Running ROC

* To start the server, run `yarn server`
* To start the client, run `yarn client`

# Screenshots
![ROC Screenshot](https://bradshaw.onourlines.co.uk/mediawiki/images/d/d0/ROC_Main_Screen_%28Alpha_1.3.1%29.png)
![ROC Incoming Call](https://bradshaw.onourlines.co.uk/mediawiki/images/d/da/ROC_Incoming_Call_%28Alpha_1.3.1%29.png)
![ROC REC Incoming](https://bradshaw.onourlines.co.uk/mediawiki/images/5/52/Incoming_REC_%28Beta%29.png)

# Bot and Discord server set up

1. Create a test discord server using the "+" button in your discord server list
2. Create the voice channels listed in `./ROC-Server/config.json`
3. Create a [Discord bot](https://discord.com/developers/applications). Copy the `Application ID`.
4. Visit `https://discord.com/oauth2/authorize?client_id=MY_BOT_APPLICATION_ID&scope=bot` to add the bot to your test server
5. Create a new role for your SimSig bot, make sure it has the `Move members` permission, and give it to your bot.

