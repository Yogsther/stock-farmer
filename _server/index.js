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

// Socket setup
var io = socket.listen(server);


io.on("connection", function(socket){
  //  Socket init

  socket.on("disconnect", function(){
    var account = getActiveAccountFromSocket(socket.id);
    if(account === false) return;
    saveAccount(account);
    removeActiveAccount(account.username);
  })

  socket.on("check_account", function(accountName){
    /* Client checks if account is registered with the name. */
    io.sockets.connected[socket.id].emit("accountNameFree", checkAccount(accountName));
  });

  socket.on("sort", function(data){
    var account = readActiveAccountWithPin(data.username, data.pin);
    if(account === false) return;
  
    if(data.gemType == data.dropLocation){
      account.silver += data.multiplier;
    } else {
      account.silver -= 1;
    }
    
    saveActiveAccount(account, socket.id);
    io.sockets.connected[socket.id].emit("update", account);
  })

  socket.on("signupReq", function(data){
    console.log("Got shit");
    var err = undefined; /* If error is not undefined, account will not be created and an error mesage will be sent to the
    client */

    var username = data.username;
    var pin = data.pin;

    if(username !== username.replace(/[^a-z0-9]/gi,'')){
      /* Check if usenrame is alphanumeric */
      err = "Username is invalid. Only alphanumeric string are allowed. (Stop trying to cheat the system.)";
    } 

    if(isNaN(pin)){
      /* Check if pin is a number */
      err = "Invalid pin. Pin may only be numeric.";
    } 
    
    if(username.length < 2){
      err = "Username length too short, minimum length is 3."
    }

    if(username.length > 30){
      /* Prevent too long usernames */
      err = "Username is too long, maxium length is 30 characters.";
    }
    
    if(String(pin).length < 3){
      err = "Pin is too short! Minimum pin length is 3."
    }

    if(String(pin).length > 100){
      /* Only to prevent super long strings that could break the server. */
      err = "Pin length is too long. Sorry, you will have to use less than 100 numbers.";
    }

    if(checkAccount(username)){
      err = "This username is already in use.";
    }

    if(err !== undefined){
      io.sockets.connected[socket.id].emit("errorOnLogin", err);
      return;
    } else {
      /* Everything cleared, create account */
      createAccount(username, pin);
      io.sockets.connected[socket.id].emit("successCreatedAccount", true);
    }
  });


  socket.on("login", function(client){
    var err = undefined;
    var account = readAccountWithPin(client.username, client.pin);
    if(account === false) err = "Invalid pin.";
    if(account.active == false) err = "This account has been suspended."; 
    if(!checkAccount(client.username)) err = "This account does not exist.";
    if(client.username == "" || client.pin == "") err = "Please provide a username and a pin."
    if(err !== undefined){
      io.sockets.connected[socket.id].emit("errorOnLogin", err);
    } else {
      /* Successful login */
      if(!isAccountActive(client.username)){
        saveActiveAccount(account, socket.id)
      }
      io.sockets.connected[socket.id].emit("loggedIn", account);
    }
  })


  /* END OF SOCKET */
});

function removeActiveAccount(username){
  for(let i = 0; i < activeAccounts.length; i++){
    if(activeAccounts[i].username == username){
      activeAccounts.splice(i, 1);
    }
  }
}

function isAccountActive(username){
  for(let i = 0; i < activeAccounts.length; i++){
    if(activeAccounts[i].username == username){
      return true
    }
  }
  return false;
}


function createAccount(username, pin){
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

function getActiveAccount(username){
  for(let i = 0; i < activeAccounts.length; i++){
    if(activeAccounts[i].username == username){
      return activeAccounts[i].account;
    }
  }
  return false;
}


function getActiveAccountFromSocket(socket){
  for(let i = 0; i < activeAccounts.length; i++){
    if(activeAccounts[i].id == socket){
      return activeAccounts[i].account;
    }
  }
  return false;
}

function saveActiveAccount(account, socket){
  removeActiveAccount(account.username)
  activeAccounts.push({
    username: account.username.toLowerCase(),
    id: socket,
    account: account
  });
}

function saveAccount(account){
  var accountString = JSON.stringify(account);
  fs.writeFileSync("accounts/" + account.username.toLowerCase() + ".txt", accountString);
}

function log(message){
  var date = new Date();
  console.log("LOG: " + message + " | " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + " " + date.getDate() + " / " + date.getFullYear());
}

function checkAccount(accountName){
  /* Check if account is registered. */
  var account = readAccount(accountName);
  if(account === false){
    return false;
    /* Account does not exist! */
  } else {
    return true;
    /* Account exists! */
  }
}



function readAccountWithPin(username, pin){
  var account = readAccount(username);
  if(pin == account.pin){
    return account;
  } else {
    return false;
  }
}

function readActiveAccountWithPin(username, pin){
  var account = getActiveAccount(username);
  if(account.pin == pin){
    return account;
  } else {
    return false;
  }
}

function readAccount(accountName){
  /* Return account (Object) form account name. */
  try{
    var account = fs.readFileSync("accounts/" + accountName.toLowerCase() + ".txt", "utf8");
    return JSON.parse(account);
  } catch(e){
    return false;
  }
}