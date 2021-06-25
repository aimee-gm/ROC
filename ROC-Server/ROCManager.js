// Begin Better logger
const chalk = require('chalk');
require('better-logging')(console, {
  format: ctx => `${ctx.date}${ctx.time24}${ctx.type}${ctx.STAMP('ROCManager.js', chalk.blueBright)} ${ctx.msg}`
});
// End Better Logger

/*

Log info:
console.info(chalk.yellow("FuncHere()"), "Message Here");

*/

const {
  ReactionUserManager
} = require('discord.js');
let Player = require('./player');


class ROCManager {
  players = {};
  privateCalls;
  constructor(sockets, bot, config) {
    this.sockets = sockets;
    this.bot = bot;
    this.guild = config.guild;
    this.channels = config.channels;
    this.sims = config.sims;
    this.config = config;
    this.privateCalls = config.privateCalls;
    console.info(chalk.yellow("constructor"), `Welcome! Yum yum! Options:`, this);
  }
  
  
  // ============================= BEGIN PLAYER SHIT =============================


  //takes player object
  addPlayer(player) {
    console.info(chalk.yellow("AddPlayer"), "New Player Joining");
    if (/^((.{2,32})#\d{4})$/.test(player.discordID)) //arturs did this and its fuck'd
    {
      var channel = this.bot.getUserVoiceChannel(player.discordID);
      if (channel) {
        console.info(chalk.yellow("AddPlayer"), `User ${player.discordID} is in a voice channel:`, chalk.magentaBright(channel));
        if (channel === this.channels.lobby) {
          console.info(chalk.yellow("AddPlayer"), `User ${player.discordID} is in lobby channel`);
          this.players[player.discordID] = player;
          // this.players[player.discordID].inCall = true;
          // console.info(this.players);
          this.sockets.to(player.socket.id).emit("loggedIn", {
            "loggedIn": true,
            "error": ""
          });
          this.sockets.emit("gameInfo", this.getGameState());
        } else {
          console.info(chalk.yellow("AddPlayer"), `User ${player.discordID} is not in the lobby.`);
          this.sockets.to(player.socket.id).emit("loggedIn", {
            "loggedIn": false,
            "error": `You aren't in the lobby. Please join ${this.channels.lobby} to join the game.`
          });
        }
      } else {
        console.info(chalk.yellow("AddPlayer"), `User ${player.discordID} is not in a voice channel:`);
        this.sockets.to(player.socket.id).emit("loggedIn", {
          "loggedIn": false,
          "error": "You aren't in a voice chat.."
        });
        return false;
      }
    } else {
      console.info(chalk.yellow("AddPlayer"), `User ${player.discordID} is not a discord username. What?`);
      this.sockets.to(player.socket.id).emit("loggedIn", {
        "loggedIn": false,
        "error": "That isn't a discord username."
      });
    }
  }

  updatePlayerPanel(user, panel)
  {
    this.players[user].panel = panel;
    this.updatePlayerUI();
  }

  //take in a player's name
  deletePlayer(player)
  {
    console.info("Player wishes to leave:", player);
    for(var [key, value] of Object.entries(this.players))
    {
      if(value.socket.id === player)
      {
        delete this.players[key];
      }
    }
    this.updatePlayerUI();
  }


  // ============================== END PLAYER SHIT ==============================

  // ============================== BEGIN CALL SHIT ==============================


  // take in an object with sender and reciever
  placeCall(data)
  {
    // console.log(data);
    var caller = this.players[data.sender];
    var reciever = this.players[data.user];
    console.info(chalk.yellow("Placing Call"), chalk.magentaBright("Caller:"), caller.discordID, chalk.magentaBright("Reciever:"), reciever.discordID);
    reciever.callQueue.push({"discordID": caller.discordID, "panel": caller.panel, "sim": data.sendersim, "timePlaced": Date.now()});
    console.log(chalk.yellow("Queue for"), reciever.discordID, reciever.callQueue);
    reciever.socket.emit("newCallInQueue", reciever.callQueue);
    this.players[data.user] = reciever;
    this.updatePlayerUI();
  }

  acceptCall(data)
  {
    this.players[data.user].callQueue.filter(item => item !== data.sender);
    if(this.players[data.sender].inCall === false)
    {
    var p = this.players[data.sender];
    console.log(chalk.blueBright("GameManager"), chalk.yellow("Join Call"), chalk.magenta("Length:"), this.privateCalls['priv-1'].length);
    if(this.privateCalls['priv-1'].length < 1)
    {
      this.privateCalls['priv-1'] = [data.user, data.sender];
      this.joinCall(data, 0);
    }
    else if(this.privateCalls['priv-2'] < 1)
    {
      this.privateCalls['priv-2'] = [data.user, data.sender];
      this.joinCall(data, 1);
    }
    else
    {
      this.sockets.to(p.socket.id).emit('rejectCall', {"success":false})
    }}
    else
    {
      this.sockets.to(this.players[data.sender].socket.id).emit('rejectCall', {"success":false})
    }
  }

  rejectCall(data)
  {
    this.players[data.user].callQueue.splice(this.players[data.user].callQueue.findIndex(item => item.field === data.sender), 1);
    this.sockets.to(this.players[data.sender].socket.id).emit("rejectCall",{"success": false});
    this.sockets.to(this.players[data.user].socket.id).emit('updateMyCalls', this.players[data.user].callQueue);
    this.updatePlayerUI();
  }

  joinCall(data, channel)
  {
    var success = false;
    console.log(chalk.blueBright("GameManager"), chalk.yellow("Join Call"), chalk.magenta("Incoming Data"), data);
    data.users.forEach((d) =>{
      // console.log(chalk.blueBright("GameManager"), chalk.yellow("Join Call"), chalk.magenta("Selecting user"), d);
      var p = this.players[d];
      // console.log(chalk.blueBright("GameManager"), chalk.yellow("Join Call"), chalk.magenta("Selected user"), p);
      switch(channel)
      {
        case 0:
          this.movePlayerToSim(p.discordID, this.sims["priv-1"]);
          // this.sockets.to(p.socket.id).emit("joinedCall",{"success":true});
          success = true;
          break;
        case 1:
          this.movePlayerToSim(p.discordID, this.sims["priv-2"]);
          success = true;
          // this.sockets.to(p.socket.id).emit("joinedCall",{"success":true});
          break;
        default:
          this.sockets.to(p.socket.id).emit("rejectCall", {"success":false});
          break;
      }
      if(success === true)
      {
        console.log("del");
        this.players[data.user].inCall = true;
        this.players[data.sender].inCall = true;
        console.log("queue", this.players[data.user].callQueue);
        // var index = this.players[data.user].callQueue.indexOf(getKeyByValue(data.sender));
        // if(index != -1){this.players[data.user].callQueue.splice(index, 1);}

        // this.players[data.user].callQueue = this.players[data.user].callQueue.filter(function(obj) {
        //   return obj.discordID !== data.sender;
        // })

        this.players[data.user].callQueue.splice(this.players[data.user].callQueue.findIndex(item => item.field === data.sender), 1);

        console.log("my call queue", this.players[data.user].callQueue);
        this.sockets.to(this.players[data.user].socket.id).emit('updateMyCalls', this.players[data.user].callQueue);
      }
      else
      {
        console.log("shit");
      }
      this.updatePlayerUI();
    });
  }

  leaveCall(data)
  {
    console.log(chalk.blueBright("GameManager"), chalk.yellow("Leave Call"), chalk.magenta("Before:"), this.privateCalls);
    
    for(var call in this.privateCalls)
    {
      if(this.privateCalls[call] != null || this.privateCalls[call] != [])
      {
        if(this.privateCalls[call].indexOf(data.user)>-1)
        {
          // console.log(this.privateCalls[call]);
          var index = this.privateCalls[call].indexOf(data.user);
          if (index !== -1) {
            this.privateCalls[call].splice(index, 1);
            this.players[data.user].inCall = false;
          }
          this.movePlayerToSim(data.user, data.sim);
        }
      }
    }
    console.log(chalk.blueBright("GameManager"), chalk.yellow("Leave Call"), chalk.magenta("Priv Call:"), this.privateCalls);
  }


  // =============================== END CALL SHIT ===============================

// REc
 //obj and strings
 playerJoinREC(player)
 {
   console.log(chalk.blueBright("GameManager"), chalk.yellow("Player joining REC:"), chalk.white(player));
  //  this.acceptCall({users:[player]}, 1);
  this.movePlayerToSim(this.players[player].discordID, this.sims["priv-2"]);
 }

playerStartREC(data)
  {
    console.log(chalk.blueBright("GameManager"), chalk.yellow("playerStartREC"), chalk.magenta("REC started by:"), data.user);
    var gs = this.getGameState();
    this.privateCalls['priv-2'].push(data.user);
    this.playerJoinREC(data.user);
    gs.forEach(el => {
      if(el.name === data.panel)
      {
        if(el.players != null)
        {
          el.players.forEach(p => {
            if(p.discordID != data.user)
            {
              console.log(chalk.blueBright("playerStartREC"), chalk.yellow("el.players foreach"), chalk.white(), p);
              var player = this.players[p.discordID];
              this.privateCalls['priv-2'].push(p.discordID);
              this.sockets.to(player.socket.id).emit('incomingREC');
            }
          });
        }
      }
    });
  }

// en dREC





  getAllPlayerLocs()
  {
    var locations = {};
    for (let sim = 0; sim < this.sims.length; sim++) {
      const element = this.sims[sim];
      locations[element] = [];
    }
    for(const [key, value] of Object.entries(this.players))
    {
      var loc = this.getPlayerLocation(value);
      if (!locations[loc]){ locations[loc] = [];}
      var player = {discordID: value.discordID, panel: value.panel, inCall: value.inCall, callQueue: value.callQueue};
      if(!locations[loc][player])
      {
        locations[loc].push(player);
      }
    }
    return locations;
  }

  // Take in a player object.
  // return their location
  getPlayerLocation(player)
  {
    return getKeyByValue(this.channels, this.bot.getUserVoiceChannel(player.discordID));
  }

  //strings in
  movePlayerToSim(player, sim)
  {
    this.bot.setUserVoiceChannel(player, this.channels[getKeyByValue(this.sims, sim)]);
  }

  getGameState()
  {
    var obj = [];
    var playerLocs = this.getAllPlayerLocs();
    var channels = this.channels;
    var sims = this.sims;
    Object.keys(this.channels).forEach(key => {
      var chan = channels[key];
      obj.push({
        players: playerLocs[key],
        id: chan,
        name: sims[getKeyByValue(channels,chan)]
      });
    });
    console.info(chalk.yellow("Game State:"), obj);
    return obj;
  }

  // Just updates the player UI
  updatePlayerUI()
  {
    this.sockets.emit("gameInfo", this.getGameState());
  }
}

module.exports = ROCManager;


function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}