var silverHP = 100;
var silverStage = 0;
var currentSilverStage = 0;
var silver = 0;
var backpackSize = 50;


const rareities = ["#dddddd", "#70d177", "#70c0d1", "#e86fb5", "#f7d259"];

var inventory = new Object();

items.sort(function (a, b) {
  return b.rarity - a.rarity;
})

/* Add items for debugging */
window.onload = function () {
  for (let i = 0; i < items.length; i++) {
    inventory[i] = 10;
  }
}


function getCrateByID(id) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].crateID == id) return items[i];
  }
  return false;
}

function mine() {
  /* This function is runs when the player uses the arrow. */
  silverHP -= 5;

  if (silverHP <= 80) silverStage = 1;
  if (silverHP <= 60) silverStage = 2;
  if (silverHP <= 40) silverStage = 3;
  if (silverHP <= 20) silverStage = 4;
  if (silverHP == 0) cycleComplete();

  if (currentSilverStage !== silverStage) {
    document.getElementById("silver-mine").src = "textures/silver_stage_" + silverStage + ".png";
    currentSilverStage = silverStage;
  }
  giveSilver(1);
}

function cycleComplete() {
  silverStage = 0;
  silverHP = 100;
  giveSilver(10)
}

function giveSilver(amount) {
  animateSilver();
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
