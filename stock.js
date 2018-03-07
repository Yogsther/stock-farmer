
/**
 * Stock Farmer - v.0.2
 * Client Side Main Script
 * Yogsther 2018
 */

 /* Import socket */
//var socket = io.connect("213.66.254.63:25565"); TODO UNCOMMENT

var silver = 0;
var backpackSize = 50;

const rareities = ["#dddddd", "#70d177", "#70c0d1", "#e86fb5", "#f7d259"];

var inventory = new Object();

items.sort(function (a, b) {
  return b.rarity - a.rarity;
});

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

var texture_bg = new Image();
texture_bg.src = "textures/bg.png";

var texture_red = new Image();
texture_red.src = "textures/gem-red.png";

var texture_blue = new Image();
texture_blue.src = "textures/gem-blue.png";

var texture_green = new Image();
texture_green.src = "textures/gem-green.png";

var texture_glass = new Image();
texture_glass.src = "textures/glass_layer.png";

var texture_outline = new Image();
texture_outline.src = "textures/layer_outline.png";

var texture_band = new Image();
texture_band.src = "textures/bg_layer.png";

var texture_arrows = new Image();
texture_arrows.src = "textures/arrows.png"; /* Unused texture */

var texture_arrow_one = new Image();
texture_arrow_one.src = "textures/arrow_one.png";

var texture_arrow_two = new Image();
texture_arrow_two.src = "textures/arrow_two.png";

var texture_arrow_three = new Image();
texture_arrow_three.src = "textures/arrow_three.png";

var gemsToSort = new Array();

var gems = ["red", "blue", "green"];

var mouseDown = false;

var picked = false;

var mousePos = {x: 0, y: 0};

canvas.addEventListener("mousedown", function(e){
  console.log(mousePos)
   mouseDown = true;
   if(mousePos.x > 204.5 && mousePos.x < 257.5 && mousePos.y > 39 && mousePos.y < 97){
    pickUp();
   }
});

canvas.addEventListener("mouseup", function(e){
  mouseDown = false;
  if(picked){
    drop();
  }
});

canvas.addEventListener("mousemove", function(e){
  var rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;

  

});

function pickUp(){
  picked = true;

  activeGem.active = true;
  activeGem.name = gemsToSort[0].name;
  activeGem.x = gemsToSort[0].x;
  activeGem.y = gemsToSort[0].y;

  gemsToSort.splice(0, 1);
  spawnGem(gemsToSort[gemsToSort.length-1].x - 50, 50);
}

var keysDown = new Array();

var keycodes = [37, 38, 39];
var colorOrder = ["red", "green", "blue"]

document.addEventListener("keydown", function(e){
  keysDown.push(e.keyCode);

  for(let i = 0; i < keycodes.length; i++){
    if(keycodes[i] == e.keyCode){
      pickUp();
      picked = false;
      activeGem.active = false;
      if(colorOrder[i] == activeGem.name){
        giveSilver(1);
        oneUpEffect(activeGem.name)
      }
    }
  }  
});

document.addEventListener("keyup", function(e){
  remove();
  function remove(){
    for(let i = 0; i < keysDown.length; i++){
      if(keysDown[i] == e.keyCode) keysDown.splice(i, 1);
    }
    if(keyDown(e.keyCode)) remove();
  }
  
  
})

function drop(){
  picked = false;
  activeGem.active = false;

  if(mousePos.y > 132){
    // Some option
    var pick = "red";
    if(mousePos.x > 191) pick = "green";
    if(mousePos.x > 444.5) pick = "blue";

    if(pick == activeGem.name){
      giveSilver(1);
      oneUpEffect(pick);
    } 
  }


}

for(let i = 0; i < 5; i++){
  spawnGem(210 - (i * 50), 50);
}

var activeGem = {
  active: false,
  x: 0,
  y: 0,
  name: ""
}

function spawnGem(x, y){
  gemsToSort.push({
    name: gems[Math.floor(Math.random()*gems.length)],
    x: x,
    y: y,
    active: false
  });
}

var mouseOverCanvas = false;

canvas.addEventListener("mouseover", function(e){
  mouseOverCanvas = true;
})

canvas.addEventListener("mouseout", function(e){
  mouseOverCanvas = false;
})

/* Heights of arrows, changes when arrow-keys are pressed and used in the render method. */
var arrowHeights = {
  one: 0,
  two: 0,
  three: 0
}

/* Store the origin colors of the gems */
var blockColors = ["#ff314d", "#2af772", "#00b9ff"];
/* Stores the current one up texts */
var activeOneUps = new Array();

function oneUpEffect(inputColor){
  /* Red or undefined */
  var boundingBox = [38.5, 209.5];
  var color = blockColors[0];
  if(inputColor == "green"){
    /* For color green */
    
    boundingBox = [248.5, 418.5];
    color = blockColors[1];
  } else if(inputColor == "blue"){
    /* For color blue */
    boundingBox = [459.5, 629.5];
    color = blockColors[2];
  }
  spawnText(color, boundingBox[0], boundingBox[1]);
}

function spawnText(color, x1, x2){
  var xPosition = Math.floor(Math.random() * (x2 - x1)) + x1;
  activeOneUps.push({
    x: xPosition,
    y: 142,
    color: color,
    opacity: 1
  });
}




render();

function keyDown(keycode){
  for(let i = 0; i < keysDown.length; i++){
    if(keysDown[i] == keycode) return true;
  }
  return false;
}



function render(){

  if(gemsToSort[0].x < 210){
    for(let i = 0; i < gemsToSort.length; i++){
      gemsToSort[i].x+=10;
    }
  }

  var arrowCodes = ["one", "two", "three"];
  
  for(let i = 0; i < keycodes.length; i++){
    if(keyDown(keycodes[i])){
      eval("arrowHeights." +  arrowCodes[i] + " = -10") 
    } else {
      eval("arrowHeights." +  arrowCodes[i] + " = 0") 
    }
  }


  ctx.drawImage(texture_bg, 0, 0); /* Draw background */
  if(!mouseOverCanvas){
    ctx.globalCompositeOperation='none';
    ctx.drawImage(texture_arrow_one, 0, arrowHeights.one);
    ctx.drawImage(texture_arrow_two, 0, arrowHeights.two);
    ctx.drawImage(texture_arrow_three, 0, arrowHeights.three);
  }

  for(let i = 0; i < activeOneUps.length; i++){

    /* Move the one up */
    activeOneUps[i].opacity -= .02;
    activeOneUps[i].y -= 1.2;
    if(activeOneUps[i].opacity < 0){
        activeOneUps.splice(i, 1); /* Remove from array if dead. */
      } else { 
      /* Render one up */
      ctx.fillStyle = activeOneUps[i].color;
      ctx.globalAlpha = activeOneUps[i].opacity;
      ctx.font = "20px Ubuntu";
      ctx.fillText("+1", activeOneUps[i].x, activeOneUps[i].y);
    }
  }
  
  ctx.globalAlpha = 1;

  /* Render travelators */
  ctx.drawImage(texture_band, 0, 0);
  ctx.drawImage(texture_band, 70, 0);

  /* Render all active gems */
  for(let i = 0; i < gemsToSort.length; i++){
    ctx.drawImage(eval("texture_" + gemsToSort[i].name), gemsToSort[i].x, gemsToSort[i].y);
  }

  if(activeGem.active){
    ctx.drawImage(eval("texture_" + activeGem.name), mousePos.x - 20, mousePos.y - 20);
  }

  /* Render transparent glass effect */
  ctx.globalAlpha = 0.3;
  ctx.drawImage(texture_glass, 0, 0);
  ctx.globalAlpha = 1.0;

  /* Render outline */
  ctx.drawImage(texture_outline, 0, 0);

  /* Request callback */
  requestAnimationFrame(render);
}


window.onload = function () {
  /* Add items for debugging */
  for (let i = 0; i < items.length; i++) {
    inventory[i] = 10;
  }
  //loadPrePage();
}

function loadPrePage(){
  /* Load login and signup page */
  document.getElementById("overlay").innerHTML = '<div id="overlay-block"> <div id="signup-page"> <img src="logo.png" id="signup-logo"> <span id="welcome-text">Welcome, please sign up or login to play!</span><br> <input id="username" class="login-input" oninput="checkUsername()" placeholder="Username" title="This will be your Display name and login-name! Only A-Z and Numbers allowed!" oninput="checkUsername()"> <input id="pin" title="(Must be numbers) Pin can be between 4-20 numbers long, this is your password." class="login-input" placeholder="Pin" type="password" oninput="checkUsername()"> <span id="signerbuttons"><button class="btn signup-button" id="signup-button" disabled>Sign up!</button> <button class="btn signup-button" id="login-button" disabled>Log in!</button></span><span id="error_login"></span> </div> </div>';
}

function checkUsername(){

  if(document.getElementById("username").value == "" || document.getElementById("pin").value == ""){
    document.getElementById("signup-button").disabled = true;
    document.getElementById("login-button").disabled = true;
    return;
  }

  var username = document.getElementById("username").value;
  socket.emit("check_account", username);
}

/* socket.on("accountNameFree", function(callback){

  if(callback){
    // Username exists, allow login.
    document.getElementById("login-button").disabled = false;
    document.getElementById("signup-button").disabled = true;

  } else {
    // Username doesn't exist, allow signup.
    document.getElementById("login-button").disabled = true;
    document.getElementById("signup-button").disabled = false;
  }

}); */

function errorLoginMessage(message){
  document.getElementById("error_login").innerHTML = message;
}


function getCrateByID(id) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].crateID == id) return items[i];
  }
  return false;
}



function giveSilver(amount) {
  silver += amount;
  if (silver > backpackSize) silver = backpackSize;
  document.getElementById("silver-value").style.fontSize = "40px";
  setTimeout(function () {
    document.getElementById("silver-value").style.fontSize = "30px";
  }, 100);
  updateStats();
}

function openInventory() {
  document.getElementById("overlay").innerHTML = '<div id="overlay-block"> <input type="text" id="search" oninput="listItems()" placeholder="Search items"> <div id="item-list"> </div> <div id="inspector"> <span id="item-name">Item Name</span> <span id="item-description">Description</span> <span id="value">Market value: 3g</span> <button class="btn" onclick="use()" id="use-button" disabled title="Use this item.">Use Item</button><button class="btn" title="List this item for (-1) of the current Market value." id="quicklist-button">Quick list</button> </div> <button class="btn" id="backbutton" onclick="clearOveraly()">Return</button> </div>';

  listItems();
  inspect(0) // TODO: Load first item default
}

function use() {
  var item = items[currentInspect];
  if (item.useable) eval(item.use);
}

var crateContains = [["pocket_10", "pocket_50", "gold_watch", "orange_juice_strong", "black_box"]];

function itemFromCode(code) {
  /* Code is the keyword or id for that item, ex. gold_watch */
  for (let i = 0; i < items.length; i++) {
    if (items[i].code === code) return items[i];
  }
  return false;
}



function randomBoolean() {
  if (Math.random() > 0.5) return true;
  return false;
}

function openCrate(id) {
  var crate = getCrateByID(id);
  var contents = crateContains[id];

  document.getElementById("crate-opener-overlay").innerHTML = '<div id="crate-open-background"> <span id="opening-status">Opening Crate</span> <div id="loading-bar-under"> <div id="loading-bar-over"></div> </div><button class="btn" id="backbutton" onclick="clearUnbox()">Close</button> </div>';

  setTimeout(function () {
    document.getElementById("loading-bar-over").style.width = "100%";
  }, 20);

  var finalItems = new Array();

  var amountOfItems = 5;

  for (let i = 0; i < amountOfItems; i++) {
    var rarityNum = Math.floor(Math.random() * 100);
    var rarity = 0;
    if (rarityNum > 60) rarity = 1;
    if (rarityNum > 85) rarity = 2;
    if (rarityNum > 95) rarity = 3;
    if (rarityNum > 99) rarity = 4;

    var possibleItems = new Array();
    for (let i = 0; i < contents.length; i++) {
      if (itemFromCode(contents[i]).rarity == rarity) possibleItems.push(itemFromCode(contents[i]));
    }
    finalItems.push(possibleItems[Math.floor(Math.random() * possibleItems.length)]);
  }

  for (let i = 0; i < amountOfItems; i++) {
    var item = finalItems[i];
    var itemName = item.name.split("");

    itemName = itemName.join("");
    document.getElementById("crate-open-background").innerHTML += '<span class="new-item" id="new-item-' + i + '" style="color:' + rareities[item.rarity] + ';">' + encryptText(itemName) + '</span>';
  }

  var totalLengtht = 0;
  for (let i = 0; i < finalItems.length; i++) {
    totalLengtht += finalItems[i].name.length
  }

  var progression = 0;
  var itemIndex = 0;

  var openAnimation = setInterval(function () {
    if (progression > 10) {
      progression = 0;
      document.getElementById("new-item-" + itemIndex).innerHTML = finalItems[itemIndex].name;
      itemIndex++;
    }
    try {
      document.getElementById("new-item-" + itemIndex).innerHTML = encryptText(finalItems[itemIndex].name);
    } catch (e) {
      clearInterval(openAnimation);
    }
    progression++;
  }, 50);

}

const alpha = "abcdefghijklmnopqrstuvwxyz0123456789#!".split("");

function encryptText(text) {
  text = text.split("");
  for (var l = 0; l < text.length; l++) {
    text[l] = alpha[Math.floor(Math.random() * alpha.length)];
    if (randomBoolean()) text[l] = text[l].toUpperCase();
  }
  return text.join("");
}


function inspect(id) {
  /* Inspect item */
  var item = items[id];
  window.currentInspect = id;
  document.getElementById("item-name").innerHTML = "<span style='color:" + rareities[item.rarity] + "'>" + item.name + "</span>";
  document.getElementById("item-description").innerHTML = item.description;

  document.getElementById("use-button").disabled = !item.useable;
  document.getElementById("quicklist-button").disabled = !item.marketable;
}

function openCrateStore() {
  //document.getElementById("overlay").innerHTML
}

function listItems() {
  var search = document.getElementById("search").value;
  document.getElementById("item-list").innerHTML = ""; /* Reset */
  for (let i = 0; i < items.length; i++) {
    if (inventory[i] > 0) {
      if (search == "" || items[i].name.toLowerCase().indexOf(search.toLowerCase()) != -1) {
        document.getElementById("item-list").innerHTML += '<div class="list-pick" onclick="inspect(' + i + ')"> <span style="color:' + rareities[items[i].rarity] + ';" class="item-name-pick">' + items[i].name + '</span> <span class="item-value-pick">' + inventory[i] + '</span> </div>';
      }
    }
  }
}

function buyCrate(id) {
  var crate = getCrateByID(id);
  if (silver < crate.price) return;
  silver -= crate.price;
  if (inventory[getCrateIndexByID(id)] == undefined) {
    inventory[getCrateIndexByID(id)] = 1
  } else {
    inventory[getCrateIndexByID(id)]++;
  }
  updateStats();
  overlayCrateStore();
}

function clearOveraly() {
  document.getElementById("overlay").innerHTML = "";
}


function updateStats() {
  document.getElementById("silver-value").innerHTML = silver;
}

function getCrateIndexByID(id) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].crateID == id) return i;
  }
}

function clearUnbox() {
  document.getElementById("crate-opener-overlay").innerHTML = "";
}


function overlayCrateStore() {

  var crateID = 0;
  var crate = getCrateByID(crateID);

  document.getElementById("overlay").innerHTML = '<div id="overlay-block"> <img src="textures/crate-defualt.png" id="crate-thumbnail"> <span id="crate-name">Beta Crate</span> <span id="crate-cost">Cost: 50<img src="textures/silver.png" style="height:25px;position: relative;top:6px;"></span> <button class="btn" id="buy-button" onclick="buyCrate(' + crateID + ')">Buy</button> <button class="btn" id="backbutton" onclick="clearOveraly()">Return</button> </div>';

  document.getElementById("buy-button").disabled = !(silver >= crate.price);
}

function animateSilver() {
  var id = "particle_" + Date.now();
  document.getElementById("wrap").innerHTML += '<img class="silver-particle" id="' + id + '" src="textures/silver.png">';
  setTimeout(function () {
    document.getElementById(id).classList.toggle("silver-particle-after");
  }, 20);
}

document.addEventListener("keydown", function (e) {
  if (e.code == "Escape") {
    clearUnbox();
    clearOveraly();
  }
})
