/**
 * Stock Farmer Client
 */

var socket = io.connect("213.66.254.63:25565");

var items = new Array();

var logins = {
  username: readCookie("username"),
  pin: readCookie("pin")
}
socket.connect();
initWaitOnConnectionMessage();

function initWaitOnConnectionMessage() {
  setTimeout(function () {
    if (socket.disconnected) {
      document.getElementById("connecting-message").innerHTML = "It's taking longer than usual to connect.<br> The servers might be down."
    }
  }, 3000)
}
socket.on("connect", function () {
  socket.emit("reqItems", true);
  console.log("%c Connected to LivingforIt Servers.", "font-family: 'Ubuntu'; color: #97ff77; font-size: 12px;");
  setTimeout(function () {
    removeLoadingScreen();
    autoLogin()
  }, 0)//1000)
});

socket.on("items", function(newItems){
  items = newItems;
})

socket.on("disconnect", function () {
  document.getElementById("server-loading-overlay-hold").innerHTML = '<div id="server-loading-overlay"> <video id="loadingvideo" height="150" autoplay loop> <source src="video/loading-animation.mp4" type="video/mp4"> </video> <span id="connecting-message">Connecting to LivingforIt Servers...</span> </div>';
  initWaitOnConnectionMessage()
});
var silver = 0;
var gold = 0;
var backgroundColors = ["#384459", "#633434", "#34634e", "#63344d"];
const rareities = ["#dddddd", "#70d177", "#70c0d1", "#e86fb5", "#f7d259"];
var inventory = new Object();

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
texture_arrows.src = "textures/arrows.png";
var texture_arrow_one = new Image();
texture_arrow_one.src = "textures/arrow_one.png";
var texture_arrow_two = new Image();
texture_arrow_two.src = "textures/arrow_two.png";
var texture_arrow_three = new Image();
texture_arrow_three.src = "textures/arrow_three.png";
var texture_mainBorder = new Image();
texture_mainBorder.src = "textures/main-border.png";
var texture_statusbar = new Image();
texture_statusbar.src = "textures/status-bar.png";
var sound_gas = new Audio();
sound_gas.src = "sound/gas.mp3"
var sound_tier_one = new Audio();
sound_tier_one.src = "sound/tier_one.mp3"
var sound_tier_two = new Audio();
sound_tier_two.src = "sound/tier_two.mp3"
var sound_gold_0 = new Audio();
sound_gold_0.src = "sound/gold_0.mp3";
var sound_gold_1 = new Audio();
sound_gold_1.src = "sound/gold_1.mp3";

var gemsToSort = new Array();
var gems = ["red", "blue", "green"];
var mouseDown = !1;
var picked = !1;
var mousePos = {
  x: 0,
  y: 0
};
var multiplierStatus = 0;
canvas.addEventListener("mousedown", function (e) {
  mouseDown = !0;
  if (mousePos.x > 307.5 && mousePos.x < 354.5 && mousePos.y > 39 && mousePos.y < 97) {
    pickUp()
  }
});
canvas.addEventListener("mouseup", function (e) {
  mouseDown = !1;
  if (picked) {
    drop()
  }
});
canvas.addEventListener("mousemove", function (e) {
  var rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top
});

function pickUp() {
  picked = !0;
  activeGem.active = !0;
  activeGem.name = gemsToSort[0].name;
  activeGem.x = gemsToSort[0].x;
  activeGem.y = gemsToSort[0].y;
  gemsToSort.splice(0, 1);
  spawnGem(gemsToSort[gemsToSort.length - 1].x - 50, 50)
}
var keysDown = new Array();
var keycodes = [37, 38, 39];
var colorOrder = ["red", "green", "blue"]
document.addEventListener("keydown", function (e) {
  keysDown.push(e.keyCode);
  for (let i = 0; i < keycodes.length; i++) {
    if (keycodes[i] == e.keyCode) {
      pickUp();
      picked = !1;
      activeGem.active = !1;
      oneUpEffect(activeGem.name)
      animateStats()
      if(activeGem.name === colorOrder[i]) multiplierStatus += 0.1;
      if(activeGem.name !== colorOrder[i]) multiplierStatus = 0;
      successDrop();
      socket.emit("sort", {
        username: logins.username,
        pin: logins.pin,
        gemType: activeGem.name,
        dropLocation: colorOrder[i],
        multiplier: multiplier
      })
    }
  }
});


document.addEventListener("keyup", function (e) {
  remove();

  function remove() {
    for (let i = 0; i < keysDown.length; i++) {
      if (keysDown[i] == e.keyCode) keysDown.splice(i, 1)
    }
    if (keyDown(e.keyCode)) remove()
  }
});

function drop() {
  picked = !1;
  activeGem.active = !1;
  if (mousePos.y > 132) {
    var pick = "red";
    if (mousePos.x > 191) pick = "green";
    if (mousePos.x > 444.5) pick = "blue";
    oneUpEffect(pick);
    successDrop();
    if(activeGem.name === pick) multiplierStatus += 0.15;
    if(activeGem.name !== pick) multiplierStatus = 0;

    socket.emit("sort", {
      username: logins.username,
      pin: logins.pin,
      gemType: activeGem.name,
      dropLocation: pick,
      multiplier: multiplier
    })
  }
}

function successDrop() {
  animateStats();
}

function failedDrop() {
  multiplierStatus = 0
}
for (let i = 0; i < 8; i++) {
  spawnGem(210 - (i * 50), 50)
}
var activeGem = {
  active: !1,
  x: 0,
  y: 0,
  name: ""
}

function spawnGem(x, y) {
  gemsToSort.push({
    name: gems[Math.floor(Math.random() * gems.length)],
    x: x,
    y: y,
    active: !1
  })
}
var mouseOverCanvas = !1;
canvas.addEventListener("mouseover", function (e) {
  mouseOverCanvas = !0
})
canvas.addEventListener("mouseout", function (e) {
  mouseOverCanvas = !1
})
var arrowHeights = {
  one: 0,
  two: 0,
  three: 0
}
var blockColors = ["#ff314d", "#2af772", "#00b9ff"];
var activeOneUps = new Array();

function oneUpEffect(inputColor) {
  var boundingBox = [38.5, 209.5];
  var color = blockColors[0];
  if (inputColor == "green") {
    boundingBox = [248.5, 418.5];
    color = blockColors[1]
  } else if (inputColor == "blue") {
    boundingBox = [459.5, 629.5];
    color = blockColors[2]
  }
  spawnText(color, boundingBox[0], boundingBox[1])
}

function spawnText(color, x1, x2) {
  var xPosition = Math.floor(Math.random() * (x2 - x1)) + x1;
  activeOneUps.push({
    x: xPosition,
    y: 142,
    color: color,
    opacity: 1,
    thenMultipleir: multiplier
  })
}
var lastStage = 0;

function keyDown(keycode) {
  for (let i = 0; i < keysDown.length; i++) {
    if (keysDown[i] == keycode) return !0
  }
  return !1
}
var todaysColor = backgroundColors[Math.floor(Math.random() * backgroundColors.length)];
var lastDisplayedStatusBar = 0;

function render() {
  if (gemsToSort[0].x < 308) {
    for (let i = 0; i < gemsToSort.length; i++) {
      gemsToSort[i].x += 10
    }
  }
  var arrowCodes = ["one", "two", "three"];
  for (let i = 0; i < keycodes.length; i++) {
    if (keyDown(keycodes[i])) {
      eval("arrowHeights." + arrowCodes[i] + " = -10")
    } else {
      eval("arrowHeights." + arrowCodes[i] + " = 0")
    }
  }
  if (multiplierStatus < 0) multiplierStatus = 0;
  ctx.fillStyle = todaysColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(texture_bg, 0, 0);
  if (!mouseOverCanvas) {
    ctx.globalCompositeOperation = 'none';
    ctx.drawImage(texture_arrow_one, 0, arrowHeights.one);
    ctx.drawImage(texture_arrow_two, 0, arrowHeights.two);
    ctx.drawImage(texture_arrow_three, 0, arrowHeights.three)
  }
  ctx.drawImage(texture_band, 0, 0);
  ctx.drawImage(texture_band, 80, 0);
  ctx.drawImage(texture_band, 180, 0);
  for (let i = 0; i < gemsToSort.length; i++) {
    ctx.drawImage(eval("texture_" + gemsToSort[i].name), gemsToSort[i].x, gemsToSort[i].y)
  }
  if (activeGem.active) {
    ctx.drawImage(eval("texture_" + activeGem.name), mousePos.x - 20, mousePos.y - 20)
  }
  ctx.globalAlpha = 0.3;
  ctx.drawImage(texture_glass, 0, 0);
  ctx.globalAlpha = 1.0;
  ctx.drawImage(texture_outline, 0, 0);
  ctx.fillStyle = "#262626";
  ctx.fillRect(607.5, 67, 60, 50);
  var multiplierColor = "#606060"
  window.multiplier = 1;
  multiplierPercent = multiplierStatus * 100;
  var minus = 0.002 * (multiplierPercent / 30);
  if (minus < 0.001) minus = 0.001;
  multiplierStatus -= minus;
  if (multiplierPercent > 100) multiplierPercent = 100;
  var stages = [{
    multiplier: 1,
    color: "#d6d6d6",
    percent: 0
  }, {
    multiplier: 2,
    color: "#3ca2fc",
    percent: 32,
    sound: sound_tier_one
  }, {
    multiplier: 5,
    color: "#f93953",
    percent: 55,
    sound: sound_tier_two
  }, {
    multiplier: 15,
    color: "#ffc832",
    percent: 75,
    sound: sound_gas
  }, {
    multiplier: 1,
    color: "fallback",
    percent: 9999
  }]
  for (let i = 0; i < stages.length; i++) {
    if (multiplierPercent > stages[i].percent && multiplierPercent < stages[i + 1].percent) {
      multiplierColor = stages[i].color;
      multiplier = stages[i].multiplier;
      if (lastStage < i) {
        if (stages[i].sound.paused) {
          stages[i].sound.volume = 0.5;
          stages[i].sound.currentTime = 0;
          stages[i].sound.play()
        }
      } else if (lastStage > i && lastStage == 3) {
        stages[i + 1].sound.pause()
      }
      lastStage = i;
      break
    }
  }
  var lastMultiplier = multiplier;
  var statusWidth = 230 * (multiplierPercent * 0.01);
  if (statusWidth > lastDisplayedStatusBar) lastDisplayedStatusBar += 5;
  if (statusWidth < lastDisplayedStatusBar) lastDisplayedStatusBar = statusWidth;
  ctx.fillRect(430, 26, 244, 30);
  ctx.fillStyle = multiplierColor;
  ctx.fillRect(660 - lastDisplayedStatusBar, 26, 244, 30)
  ctx.font = "20px Ubuntu";
  ctx.fillText(multiplier + "x", 622, 98);
  ctx.drawImage(texture_statusbar, 0, 0)
  for (let i = 0; i < activeOneUps.length; i++) {
    activeOneUps[i].opacity -= .02;
    activeOneUps[i].y -= 1.2;
    if (activeOneUps[i].opacity < 0) {
      activeOneUps.splice(i, 1)
    } else {
      ctx.fillStyle = activeOneUps[i].color;
      if (activeOneUps[i].thenMultipleir == 15) ctx.fillStyle = "#ffc832";
      ctx.globalAlpha = activeOneUps[i].opacity;
      ctx.font = 20 + "px Ubuntu";
      ctx.fillText("+" + (1 * activeOneUps[i].thenMultipleir), activeOneUps[i].x, activeOneUps[i].y)
    }
  }
  ctx.globalAlpha = 1;
  ctx.drawImage(texture_mainBorder, 0, 0)
  requestAnimationFrame(render)
}
window.onload = function () {
  render()
}

function showLogin() {
  document.getElementById("overlay").innerHTML = '<div id="overlay-block"> <div id="signup-page"> <img src="logo.png" id="signup-logo"> <span id="welcome-text">Welcome, please sign up or login to play!</span><br> <input id="username" class="login-input" oninput="checkUsername()" placeholder="Username" title="This will be your Display name and login-name! Only A-Z and Numbers allowed!" oninput="checkUsername()"> <input id="pin" title="(Must be numbers) Pin can be between 3-100 numbers long, this is your password." class="login-input" placeholder="Pin" type="password" oninput="checkUsername()"> <span id="signerbuttons"><button class="btn signup-button" onclick="signupRequest()" id="signup-button" disabled>Sign up!</button> <button class="btn signup-button" id="login-button" onclick="clientInitiatedLogin()" disabled>Log in!</button></span><span id="error_login"></span> </div> </div>'
}

function hideLogin() {
  document.getElementById("overlay").innerHTML = ""
}

function signupRequest() {
  var username = document.getElementById("username").value;
  var pin = document.getElementById("pin").value;
  if (pin == parseInt(pin)) pin = parseInt(pin);
  socket.emit("signupReq", {
    username: username,
    pin: pin
  });
  window.logins = {
    username: username,
    pin: pin
  }
}
socket.on("errorOnLogin", function (err) {
  errorLoginMessage(err)
})

function checkUsername() {
  document.getElementById("username").value = document.getElementById("username").value.replace(/[^a-z0-9]/gi, '');
  if (document.getElementById("username").value.length > 30) {
    document.getElementById("username").value = document.getElementById("username").value.substr(0, 30)
  }
  if (document.getElementById("username").value == "" || document.getElementById("pin").value == "") {
    document.getElementById("signup-button").disabled = !0;
    document.getElementById("login-button").disabled = !0;
    return
  }
  var username = document.getElementById("username").value;
  socket.emit("check_account", username)
}
socket.on("accountNameFree", function (callback) {
  if (callback) {
    document.getElementById("login-button").disabled = !1;
    document.getElementById("signup-button").disabled = !0
  } else {
    document.getElementById("login-button").disabled = !0;
    document.getElementById("signup-button").disabled = !1
  }
});

function errorLoginMessage(message) {
  document.getElementById("error_login").innerHTML = message
}

function getCrateByID(id) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].crateID == id) return items[i]
  }
  return !1
}

function animateStats(amount) {
  document.getElementById("silver-value").style.fontSize = "40px";
  setTimeout(function () {
    document.getElementById("silver-value").style.fontSize = "30px"
  }, 100);
  updateStats()
}

function listItem(){
  overlayMarketLister();
  var item = items[currentInspect];
  document.getElementById("item-name-lister").innerHTML = item.name;
  document.getElementById("item-name-lister").style.color = rareities[item.rarity];
}

function listItemToMarket(){
  var askingPrice = document.getElementById("lister-value-amount").value;
  socket.emit("list", {
    itemID: currentInspect,
    price: askingPrice,
    username: logins.username,
    pin: logins.pin
  });

  socket.emit("fetchInventory", logins.username);
}

function openInventory() {
  document.getElementById("overlay").innerHTML = '<div id="overlay-block"> <input type="text" id="search" oninput="listItems()" placeholder="Search items"> <div id="item-list"> </div> <div id="inspector"> <span id="item-name">Item Name</span> <span id="item-description">Description</span> <span id="value">Market value: 3g</span> <button class="btn" onclick="use()" id="use-button" disabled title="Use this item.">Use Item</button><button class="btn" onclick="listItem()" title="List this item on the Market." id="quicklist-button">List on Market</button> </div> <button class="btn" id="backbutton" onclick="clearOveraly()">Return</button> </div>';
  listItems();
  for(let i = 0; i < items.length; i++){
    if(inventory[i] > 0){
      inspect(i)
      return;
    }
  }
  inspect(0)
}

socket.on("test", text => console.log(text));

function use() {
  var item = items[currentInspect];
  if (item.useable) eval(item.use)
}
var crateContains = [
  ["gold_watch", "orange_juice_strong", "black_box", "dino_martin", "red_flair", "the_bird", "the_joy", "rare_pepe", "sunglasses", "starbucks", "silver_key", "bible", "mcpe", "launch_keys"]
];

function itemFromCode(code) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].code === code) return items[i]
  }
  return !1
}

function randomBoolean() {
  if (Math.random() > 0.5) return !0;
  return !1
}

function clientInitiatedLogin() {
  logins.username = document.getElementById("username").value;
  logins.pin = document.getElementById("pin").value;
  createCookie("username", logins.username, 10000);
  createCookie("pin", logins.pin, 10000);
  login(logins.username, logins.pin)
}

function login(username, pin) {
  socket.emit("login", {
    username: username,
    pin: pin
  })
}

function autoLogin() {
  showLogin();
  window.logins = {
    username: readCookie("username"),
    pin: readCookie("pin")
  }
  if (logins.username != undefined && logins.pin != undefined) {
    document.getElementById("username").value = logins.username;
    document.getElementById("pin").value = logins.pin;
    login(logins.username, logins.pin)
  }
}

function logout() {
  createCookie("username", "", 10000);
  createCookie("pin", "", 1000);
  autoLogin()
}
socket.on("loggedIn", function (account) {
  updateProfile(account);
  hideLogin()
});
socket.on("update", function (account) {
  updateProfile(account)
})

function updateProfile(account) {
  gold = account.gold;
  silver = account.silver;
  inventory = account.inventory;
  updateStats();
  document.getElementById("accountName").innerHTML = account.orignalUsername
}
socket.on("successCreatedAccount", function (bool) {
  if (bool) {
    createCookie("username", logins.username, 10000);
    createCookie("pin", logins.pin, 10000);
    autoLogin()
  }
})

function createCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString()
  }
  document.cookie = name + "=" + value + expires + "; path=/"
}

function readCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

function openCrate(id) {
  socket.emit("openCrate", {
    crateID: id,
    username: logins.username,
    pin: logins.pin
  });

  document.getElementById("crate-opener-overlay").innerHTML = '<div id="crate-open-background"> <span id="opening-status">Opening Crate</span> <div id="loading-bar-under"> <div id="loading-bar-over"></div> </div><button class="btn" id="backbutton" onclick="clearUnbox()">Close</button> </div>';
  setTimeout(function () {
    document.getElementById("loading-bar-over").style.width = "100%"
  }, 20);

}

socket.on("finalItems", function(finalItems){
  var amountOfItems = 5;
  for (let i = 0; i < amountOfItems; i++) {
    var item = finalItems[i];
    var itemName = item.name.split("");
    itemName = itemName.join("");
    document.getElementById("crate-open-background").innerHTML += '<span class="new-item" id="new-item-' + i + '" style="color:' + rareities[item.rarity] + ';">' + encryptText(itemName) + '</span>'
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
      itemIndex++
    }
    try {
      document.getElementById("new-item-" + itemIndex).innerHTML = encryptText(finalItems[itemIndex].name)
    } catch (e) {
      clearInterval(openAnimation)
    }
    progression++
  }, 50);
  socket.emit("fetchInventory", logins.username);
});


socket.on("inventoryUpdate", newInventory => {
  inventory = newInventory;
  listItems();
});


socket.on("gold", gold => {
  for(let i = 0; i < gold; i++){
    setTimeout(function(){
      if(Math.random() > .5){
        sound_gold_0.currentTime = 0;
        sound_gold_0.volume = .4;
        sound_gold_0.play();
      } else {
        sound_gold_1.currentTime = 0;
        sound_gold_1.volume = .4;
        sound_gold_1.play();
      }
    }, 500 * i)
  }
})

const alpha = "abcdefghijklmnopqrstuvwxyz0123456789#!".split("");

function encryptText(text) {
  text = text.split("");
  for (var l = 0; l < text.length; l++) {
    text[l] = alpha[Math.floor(Math.random() * alpha.length)];
    if (randomBoolean()) text[l] = text[l].toUpperCase()
  }
  return text.join("")
}

function inspect(id) {
  var item = items[id];
  window.currentInspect = id;
  document.getElementById("item-name").innerHTML = "<span style='color:" + rareities[item.rarity] + "'>" + item.name + "</span>";
  document.getElementById("item-description").innerHTML = item.description;
  if (item.crateID != undefined) {
    var itemsArray = getCrateItemsAsArray(item.crateID);
    document.getElementById("item-description").innerHTML += "<br><br>Crate contains: "
    for (let i = 0; i < itemsArray.length; i++) {
      var displayItem = itemsArray[i]
      document.getElementById("item-description").innerHTML += "<br><span style='color:" + rareities[displayItem.rarity] + ";'>" + displayItem.name + "</span>"
    }
  }
  document.getElementById("use-button").disabled = !item.useable;
  document.getElementById("quicklist-button").disabled = !item.marketable
}

function getCrateItemsAsArray(crateID) {
  var contents = crateContains[crateID];
  var itemsArray = new Array();
  for (let i = 0; i < contents.length; i++) {
    itemsArray.push(itemFromCode(contents[i]))
  }
  itemsArray.sort(function (a, b) {
    return b.rarity - a.rarity
  });
  return itemsArray
}

function listItems() {
  var search = document.getElementById("search").value;
  document.getElementById("item-list").innerHTML = "";
  for (let i = 0; i < items.length; i++) {
    if (inventory[i] > 0) {
      if (search == "" || items[i].name.toLowerCase().indexOf(search.toLowerCase()) != -1) {
        document.getElementById("item-list").innerHTML += '<div class="list-pick" onclick="inspect(' + i + ')"> <span style="color:' + rareities[items[i].rarity] + ';" class="item-name-pick">' + items[i].name + '</span> <span class="item-value-pick">' + inventory[i] + '</span> </div>'
      }
    }
  }
}

function buyCrate(id) {
  socket.emit("buyCrate", {
    crateID: id,
    username: logins.username,
    pin: logins.pin
  })
 
}

socket.on("baught", account => {
  updateProfile(account);
  updateStats();
  overlayCrateStore();
});

function clearOveraly() {
  socket.emit("update", {username: logins.username, pin: logins.pin});
  document.getElementById("overlay").innerHTML = ""
}

function updateStats() {
  document.getElementById("silver-value").innerHTML = silver;
  document.getElementById("gold-value").innerHTML = gold;
}

function getCrateIndexByID(id) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].crateID == id) return i
  }
}

function overlayMarketLister(){
  document.getElementById("crate-opener-overlay").innerHTML = '<div id="market-lister"> <span id="smaller-header-lister">List an item on the market.</span> <span id="item-name-lister">Item Name</span> <span id="asking-price-label">Asking Price Gold:</span> <input type="number" id="lister-value-amount" placeholder="Asking price" value="10"> <button id="list-button-final" class="btn" onclick="listItemToMarket()" title="List the item on the market.">List on market</button><br> <button id="cancel-button" class="btn" onclick="clearUnbox()">Cancel</button> </div>';
}

function clearUnbox() {
  document.getElementById("crate-opener-overlay").innerHTML = ""
}

function overlayCrateStore() {
  var crateID = 0;
  var crate = getCrateByID(crateID);
  document.getElementById("overlay").innerHTML = '<div id="overlay-block"> <img src="textures/crate-defualt.png" id="crate-thumbnail"> <span id="crate-name">Beta Crate</span> <span id="crate-cost">Cost: 50<img src="textures/silver.png" style="height:25px;position: relative;top:6px;"></span> <button class="btn" id="buy-crate-button" onclick="buyCrate(' + crateID + ')">Buy</button> <button class="btn" id="backbutton" onclick="clearOveraly()">Return</button> </div>';
  document.getElementById("buy-crate-button").disabled = !(silver >= crate.price)
}

function overlayMarket(){
  document.getElementById("overlay").innerHTML = '<div id="overlay-block"> <input type="text" id="search" oninput="fillMarketList()" placeholder="Search items"> <div id="item-list"> </div> <div id="inspector"> <span id="item-name">Item Name</span> <span id="item-description">Description</span> <span id="listings"> <span id="tiny-listing">30g <i>Yogsther</i> <a href="javascript:asd()" id="tiny-buy">Buy</a></span> </span> <span id="value">Market value: 3g</span> <input id="quantity" placeholder="Quantity" type="text"> <button class="btn" onclick="buy()" id="buy-button" title="Buy this item.">Buy Item</button> </div> <button class="btn" id="backbutton" onclick="clearOveraly()">Return</button> </div>';
  socket.emit("fetchMarket");
}

var market = new Array();

socket.on("market", newMarket => {
  market = newMarket;
  fillMarketList();
});

function fillMarketList(){
  var search = document.getElementById("search").value;
  console.log(market);
  market.forEach(item => {
    if (item.length > 0) {
      if (search == "" || items[i].name.toLowerCase().indexOf(search.toLowerCase()) != -1) {
        document.getElementById("item-list").innerHTML += '<div class="list-pick" onclick="viewlisting(' + item.name + ')"> <span style="color:' + rareities[item.rarity] + ';" class="item-name-pick">' + item.name + '</span> <span class="item-value-pick">'+'</span> </div>'
      }
    }
  })
}

function animateSilver() {
  var id = "particle_" + Date.now();
  document.getElementById("wrap").innerHTML += '<img class="silver-particle" id="' + id + '" src="textures/silver.png">';
  setTimeout(function () {
    document.getElementById(id).classList.toggle("silver-particle-after")
  }, 20)
}
document.addEventListener("keydown", function (e) {
  if (e.code == "Escape") {
    clearUnbox();
    clearOveraly()
  }
})

function removeLoadingScreen() {
  document.getElementById("server-loading-overlay-hold").innerHTML = "";
  document.getElementById("black-overlay-insert").innerHTML = ""
}