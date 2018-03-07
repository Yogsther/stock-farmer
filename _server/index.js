/*
    Server-side socket.io main
*/

/** Choose a port */
var port = 25565;

var express = require("express");

var socket = require("socket.io");

var app = express();

/** Import file loader. */
var fs = require("fs");

var path = require('path');

var server = app.listen(port, function(){

  console.log("Listening to requests on port " + port);

// Static files
app.use(express.static("public"));

// Socket setup
var io = socket(server);


io.on("connection", function(socket){
  //  Socket

    
  socket.on("create_account", function(package){
    
  });
  
  socket.on("check_account", function(accountName){
    /* Client checks if account is registered with the name. */
    io.sockets.connected[socket].emit("accountNameFree", checkAccount(accountName));
  });



  
  /* END OF SOCKET */
    });
});

generateImage();

function generateImage(){
  const alpha = "abcdefghijklmnopqrstuvwxyz0123456789".split("");
  var char = alpha[Math.floor(Math.random() * alpha.length)];

  const canvas = new Canvas(100, 100, "png")


}

function checkAccount(){
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

function readAccount(accountName){
  /* Return account (Object) form account name. */
  try{
    var account = fs.readFileSync("accounts/" + accountName.toLowerCase() + ".txt");
    return JSON.parse(account);
  } catch(e){
    return false;
  }
}

function saveAccount(account){
  /* Save an account, provide the entire (account) object. */
  // TODO: Save account
}