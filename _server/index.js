/*
    Server-side socket.io main
*/

/* Choose a port */
//var port = 25565;
var port = 25565;

var express = require("express");

var socket = require("socket.io");

var app = express();

/** Import file loader. */
var fs = require("fs");

var path = require('path');

var server = app.listen(port);

log("Started on port " + port);

var activeAccounts = new Array();

var leaderboard = new Array();

// Socket setup
var io = socket.listen(server);


io.on("connection", function (socket) {
  //  Socket init

  socket.on("disconnect", function () {
    var account = getActiveAccountFromSocket(socket.id);
    if (account === false) return;
    saveAccount(account);
    removeActiveAccount(account.username);
  })

  socket.on("check_account", function (accountName) {
    /* Client checks if account is registered with the name. */
    io.sockets.connected[socket.id].emit("accountNameFree", checkAccount(accountName));
  });

  socket.on("sort", function (data) {
    var account = readActiveAccountWithPin(data.username, data.pin);
    if (account === false) return;
    if (data.gemType === data.dropLocation) {
      account.silver += data.multiplier;
    } else {
      account.silver -= 1;
    }

    saveActiveAccount(account, socket.id);
    io.sockets.connected[socket.id].emit("update", account);
  });

  socket.on("updateProfile", function(data){
    io.sockets.connected[socket.id].emit("update", readActiveAccountWithPin(data.username, data.pin));
  })

  socket.on("list", data => {
    var err = undefined;
    
    var price = Math.round(data.price);
    var id = data.itemID;
    
    if(price < 1) err = "Asking price can't be less than 1.";
    if(price > 999999)  err = "Asking price can't be more than 999999";
    if(isNaN(price)) err = "Asking price has to be a number.";
    var account = readActiveAccountWithPin(data.username, data.pin);
    if(account === false) return;
    log(account.inventory[id] + " id: "+ id)
    if(account.inventory[id] < 1) return;
    if(err != undefined){
      // TODO send error message to client
    } else {
      account.inventory[id] -= 1;
      var listing = new Object();
      listing.itemID = id;
      listing.seller = account.orignalUsername;
      listing.price = price;
      listing.listedTime = Date.now();
      ticketSent = false;

      var ticketNumber = "listing_" + Date.now() + "-" + Math.floor(Math.random()*1000) +  ".txt";
      fs.writeFileSync("listings/" + ticketNumber, JSON.stringify(listing));
      log("Listing > Seller: " + listing.seller + " Price: " + listing.price + " ID: " + listing.itemID);
      loadAllListings();
    }
  });

  socket.on("signupReq", function (data) {
    var err = undefined;
    /* If error is not undefined, account will not be created and an error mesage will be sent to the
       client */

    var username = data.username;
    var pin = data.pin;

    if (username !== username.replace(/[^a-z0-9]/gi, '')) {
      /* Check if usenrame is alphanumeric */
      err = "Username is invalid. Only alphanumeric string are allowed. (Stop trying to cheat the system.)";
    }

    if (isNaN(pin)) {
      /* Check if pin is a number */
      err = "Invalid pin. Pin may only be numeric.";
    }

    if (username.length < 2) {
      err = "Username length too short, minimum length is 3."
    }

    if (username.length > 30) {
      /* Prevent too long usernames */
      err = "Username is too long, maxium length is 30 characters.";
    }

    if (String(pin).length < 3) {
      err = "Pin is too short! Minimum pin length is 3."
    }

    if (String(pin).length > 100) {
      /* Only to prevent super long strings that could break the server. */
      err = "Pin length is too long. Sorry, you will have to use less than 100 numbers.";
    }

    if (checkAccount(username)) {
      err = "This username is already in use.";
    }

    if (err !== undefined) {
      io.sockets.connected[socket.id].emit("errorOnLogin", err);
      return;
    } else {
      /* Everything cleared, create account */
      createAccount(username, pin);
      io.sockets.connected[socket.id].emit("successCreatedAccount", true);
    }
  });


  socket.on("login", function (client) {
    var err = undefined;
    var account = readAccountWithPin(client.username, client.pin);
    if (account === false) err = "Invalid pin.";
    if (account.active == false) err = "This account has been suspended.";
    if (!checkAccount(client.username)) err = "This account does not exist.";
    if (client.username == "" || client.pin == "") err = "Please provide a username and a pin."
    if (err !== undefined) {
      io.sockets.connected[socket.id].emit("errorOnLogin", err);
    } else {
      /* Successful login */
      if (!isAccountActive(client.username)) {
        saveActiveAccount(account, socket.id)
      }
      io.sockets.connected[socket.id].emit("loggedIn", account);
    }
  })

  var crateContains = [
    ["gold_watch", "orange_juice_strong", "black_box", "dino_martin", "red_flair", "the_bird", "the_joy", "rare_pepe", "sunglasses", "starbucks", "silver_key", "bible", "mcpe", "launch_keys"]
  ];

  socket.on("buyCrate", function (data) {
    var id = data.crateID;
    var account = getActiveAccount(data.username)
    if(readAccountWithPin(data.username, data.pin) === false) return;
    var silver = account.silver;
    var crate = getCrateByID(id);
    if (silver < crate.price) return;
    account.silver -= crate.price;
    if (account.inventory[getCrateIndexByID(id)] == undefined) {
      account.inventory[getCrateIndexByID(id)] = 1
    } else {
      account.inventory[getCrateIndexByID(id)]++
    }
    saveActiveAccount(account, socket.id);
    io.sockets.connected[socket.id].emit("baught", account);
  })

  socket.on("openCrate", function (data) {
    
    var id = data.crateID;

    var account = readActiveAccountWithPin(data.username, data.pin);
    if(account === false) return;

    if(account.inventory[getCrateIndexByID(id)] < 1){
      return;
    } else {
      account.inventory[getCrateIndexByID(id)] -= 1;
    }

    var crate = getCrateByID(id);
    var contents = crateContains[id];
    var finalItems = new Array();
    var amountOfItems = 5;
    for (let i = 0; i < amountOfItems; i++) {
      var rarityNum = Math.random();
      var rarity = 0;
      if (rarityNum > 0.6) rarity = 1;
      if (rarityNum > 0.85) rarity = 2;
      if (rarityNum > 0.95) rarity = 3;
      if (rarityNum > 0.998) rarity = 4; // Chance of getting a rarity 4 item is 0.2%
      var possibleItems = new Array();
      for (let i = 0; i < contents.length; i++) {
        if (itemFromCode(contents[i]).rarity == rarity) possibleItems.push(itemFromCode(contents[i]))
      }
      finalItems.push(possibleItems[Math.floor(Math.random() * possibleItems.length)])
    }

    var goldRushActive = true;
    var gold = 0;
    while(goldRushActive){
      if(Math.floor(Math.random()*100) > 60){
        gold++;
      } else {
        goldRushActive = false;
      }
    }

    /* Credit account with gold. */
    account.gold += gold;

    finalItems.forEach(item => {
      if(account.inventory[getItemIndexFromCode(item.code)] == undefined){ 
        account.inventory[getItemIndexFromCode(item.code)] = 1;
      } else {
      account.inventory[getItemIndexFromCode(item.code)] += 1;
      }
    });

    saveActiveAccount(account, socket.id);

    io.sockets.connected[socket.id].emit("finalItems", finalItems);
    io.sockets.connected[socket.id].emit("gold", gold);

  });

  socket.on("fetchInventory", username => {
    var account = getActiveAccount(username);
    io.sockets.connected[socket.id].emit("inventoryUpdate", account.inventory);
  });


  socket.on("reqItems", function (bool) {
    io.sockets.connected[socket.id].emit("items", items);
  })

  socket.on("give", data => {
    if(data.token == undefined) return;
    var token = fs.readFileSync("token.txt", "utf8");
    if(token === data.token){
      var account = getActiveAccount(data.username);
      if(account.inventory[data.id] == undefined) account.inventory[data.id] = 0;
      account.inventory[data.id] += data.amount;
      saveAccount(account);
    }
  });


  socket.on("fetchMarket", a => {
    io.sockets.connected[socket.id].emit("market", market);
  })



  /* END OF SOCKET */
});

function getItemIndexFromCode(code){
  for(var i = 0;i < items.length; i++){
    if(items[i].code == code){
      return i;
    }
  }
}

function getCrateByID(id) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].crateID == id) return items[i]
  }
  return !1
}

function removeActiveAccount(username) {
  for (let i = 0; i < activeAccounts.length; i++) {
    if (activeAccounts[i].username.toLowerCase() == username.toLowerCase()) {
      activeAccounts.splice(i, 1);
    }
  }
}

function isAccountActive(username) {
  for (let i = 0; i < activeAccounts.length; i++) {
    if (activeAccounts[i].username == username) {
      return true
    }
  }
  return false;
}


function createAccount(username, pin) {
  var account = new Object();
  account.username = username;
  account.pin = pin;
  account.inventory = new Object();
  account.active = true;
  account.timeCreated = Date.now();
  account.silver = 0;
  account.gold = 0;
  account.orignalUsername = username;
  account.savedName = username.toLowerCase();
  log("New Account was created: " + account.orignalUsername);
  saveAccount(account);
}

function getActiveAccount(username) {
  username = username.toLowerCase();
  for (let i = 0; i < activeAccounts.length; i++) {
    if (activeAccounts[i].username == username) {
      return activeAccounts[i].account;
    }
  }
  return false;
}


function getActiveAccountFromSocket(socket) {
  for (let i = 0; i < activeAccounts.length; i++) {
    if (activeAccounts[i].id == socket) {
      return activeAccounts[i].account;
    }
  }
  return false;
}

function saveActiveAccount(account, socket) {
  removeActiveAccount(account.username)
  activeAccounts.push({
    username: account.username.toLowerCase(),
    id: socket,
    account: account
  });
}

function saveAccount(account) {
  var accountString = JSON.stringify(account);
  fs.writeFileSync("accounts/" + account.username.toLowerCase() + ".txt", accountString);
}

function log(message) {
  var date = new Date();
  console.log("LOG: " + message + " | " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + " " + date.getDate() + " / " + date.getFullYear());
}

function checkAccount(accountName) {
  /* Check if account is registered. */
  var account = readAccount(accountName);
  if (account === false) {
    return false;
    /* Account does not exist! */
  } else {
    return true;
    /* Account exists! */
  }
}



function readAccountWithPin(username, pin) {
  var account = readAccount(username);
  if (pin == account.pin) {
    return account;
  } else {
    return false;
  }
}

function readActiveAccountWithPin(username, pin) {
  var account = getActiveAccount(username);
  if (account.pin == pin) {
    return account;
  } else {
    return false;
  }
}

function readAccount(accountName) {
  /* Return account (Object) form account name. */
  try {
    var account = fs.readFileSync("accounts/" + accountName.toLowerCase() + ".txt", "utf8");
    return JSON.parse(account);
  } catch (e) {
    return false;
  }
}

var lastLoadedLB = 0;
loadLeaderboards();

function loadLeaderboards() {
  /* Load leaderboards - Read every users silver (for now). Start with all active users, then read offline accounts.
     This is important since progress is only saved to the files when a player goes offline.
  */
  /* Don't update the leaderboard if it already has been updated in the last minute. */
  if ((Date.now() - lastLoadedLB) < 60000) return;
  leaderboard = new Array();

  activeAccounts.forEach(account => {
    leaderboard.push()
  });

  fs.readdir("accounts", function (err, filenames) {
    if (err) {
      log("Error reading directory of accounts.");
    }
    filenames.forEach(filename => {
      var account = readAccount(filename.substr(0, filename.length - 4));
      leaderboard.push({
        username: account.username,
        silver: account.silver
      });
    });
  })

  lastLoadedLB = Date.now();
}


function loadAllListings(){
  market = new Array(); 
  fs.readdir("listings", function (err, filenames) {
    if (err) {
      log("Error reading directory of listings.");
    }
    filenames.forEach(filename => {
      var listing = fs.readFileSync("listings/" + filename, "utf8");
      listing = JSON.parse(listing);
      listing.origin = filename;
      market.push(listing);
    });
  });
}

function itemFromCode(code) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].code === code) return items[i]
  }
  return !1
}

function getCrateIndexByID(id) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].crateID == id) return i
  }
}

/**
 * Items for Stock Farmer (Server copy)
 */

const items = [{
  name: "Golden Watch",
  rarity: 4,
  marketable: true,
  code: "gold_watch",
  useable: false,
  description: "Expensive and rare watch only for the richest of the richest. The ultimate status symbol!"
}, {
  name: "Beta Crate",
  rarity: 0,
  code: "crate_0",
  price: 50,
  description: "Limited crates that are only be avalible for purchase during the Beta.",
  useable: true,
  marketable: true,
  use: "openCrate(0)",
  crateID: 0
}, {
  /* ID 4 */
  name: "Orange Juice (Strong)",
  rarity: 2,
  code: "orange_juice_strong",
  marketable: true,
  useable: false,
  description: "Really tasty orange juice."
}, {
  name: "Black box",
  rarity: 3,
  code: "black_box",
  marketable: true,
  useable: false,
  description: "Mysterious black box.. It's heavy too."
}, {
  name: "Dino and Martin",
  rarity: 1,
  marketable: true,
  code: "dino_martin",
  useable: false,
  description: "Bootleg merchandise from China. Bump and Go!"
}, {
  name: "Red Flair",
  rarity: 0,
  marketable: true,
  code: "red_flair",
  useable: false,
  description: "Bootleg merchandise from China. Bump and Go!"
}, {
  name: "The Bird",
  rarity: 3,
  marketable: true,
  code: "the_bird",
  useable: false,
  description: "'Do you have the bird?' 🤔"
}, {
  name: "😂 (Laughing Crying Emoji)",
  rarity: 4,
  marketable: true,
  code: "the_joy",
  useable: false,
  description: "Very rare emoji"
}, {
  name: "Rare Pepe",
  rarity: 4,
  marketable: true,
  code: "rare_pepe",
  useable: false,
  description: "The rarest pepe you will find on the market..."
}, {
  name: "Black Sunglasses",
  rarity: 0,
  marketable: true,
  code: "sunglasses",
  useable: false,
  description: "Ordinary slick looking sunglasses."
}, {
  name: "Starbucks Cup",
  rarity: 1,
  marketable: true,
  code: "starbucks",
  useable: false,
  description: "Is it half-empty or half-full?."
}, {
  name: "Silver Key",
  rarity: 2,
  marketable: true,
  code: "silver_key",
  useable: false,
  description: "What does it lead too?"
}, {
  name: "Cursed Bible",
  rarity: 3,
  marketable: true,
  code: "bible",
  useable: false,
  description: "Almost falling apart, tied together with a rosehip branch."
}, {
  name: "Original Minecraft (PE) copy",
  rarity: 1,
  marketable: true,
  code: "mcpe",
  useable: false,
  description: "A copy of the popular game Minecraft Pocket Edition for IOS, worth $5."
}, {
  name: "USSR Launch Keys",
  rarity: 1,
  marketable: true,
  code: "launch_keys",
  useable: false,
  description: "Launch keys used by the USSR to launch their nuclear weapons."
}];

items.sort(function (a, b) {
  return b.rarity - a.rarity
});

var market = new Array(items.length).fill(new Array()); 
loadAllListings();