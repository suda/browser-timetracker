function addFrame() {
  var iframe = document.createElement("iframe");
  iframe.setAttribute("src", "http://browser-timetracker.appspot.com/stats/view?now=" +
                            escape(new Date().getTime()/1000));
  iframe.setAttribute("width", "400px");
  iframe.setAttribute("height", "400px");
  iframe.setAttribute("id", "stats_frame");
  document.getElementById("stats").appendChild(iframe);
}

function addIgnoredSite(new_site) {
  return function() {
    chrome.extension.sendRequest(
       {action: "addIgnoredSite", site: new_site},
       function(response) {
         initialize();
       });
  };
}

function addLocalDisplay() {
  var table = document.getElementById("stats");
  var tbody = document.createElement("tbody");
  table.appendChild(tbody);

  /* Sort sites by time spent */
  var sites = JSON.parse(localStorage.sites);
  var sortedSites = new Array();
  var totalTime = 0;
  for (site in sites) {
   sortedSites.push([site, sites[site]]);
   totalTime += sites[site];
  }
  sortedSites.sort(function(a, b) {
   return b[1] - a[1];
  });

  /* Show only the top 15 sites by default */
  var max = 15;
  if (document.location.href.indexOf("show=all") != -1) {
   max = sortedSites.length;
  }

  /* Add total row. */
  var row = document.createElement("tr");
  var cell = document.createElement("td");
  cell.innerHTML = "<b>Total</b>";
  row.appendChild(cell);
  cell = document.createElement("td");
  cell.appendChild(document.createTextNode((totalTime / 60).toFixed(2)));
  row.appendChild(cell);
  cell = document.createElement("td");
  cell.appendChild(document.createTextNode(("100")));
  row.appendChild(cell);
  tbody.appendChild(row);

  for (var index = 0; ((index < sortedSites.length) && (index < max));
      index++ ){
   var site = sortedSites[index][0];
   row = document.createElement("tr");
   cell = document.createElement("td");
   var removeImage = document.createElement("span");
   removeImage.className = "glyphicon glyphicon-ban-circle";
   removeImage.title = "Remove and stop tracking.";
   removeImage.width = 10;
   removeImage.height = 10;
   removeImage.onclick = addIgnoredSite(site);
   // cell.appendChild(removeImage);
   cell.appendChild(document.createTextNode(site));
   row.appendChild(cell);
   cell = document.createElement("td");
   cell.appendChild(document.createTextNode((sites[site] / 60).toFixed(2)));
   row.appendChild(cell);
   cell = document.createElement("td");
   cell.appendChild(document.createTextNode(
     (sites[site] / totalTime * 100).toFixed(2)));
   row.appendChild(cell);
   tbody.appendChild(row);
  }

  /* Add an option to show all stats */
  var showAllLink = document.createElement("a");
  showAllLink.onclick = function() {
   chrome.tabs.create({url: "popup.html?show=all"});
  }

  /* Show the "Show All" link if there are some sites we didn't show. */
  if (max < sortedSites.length) {
   showAllLink.setAttribute("href", "javascript:void(0)");
   showAllLink.appendChild(document.createTextNode("Show All"));
   document.getElementById("options").appendChild(showAllLink);
  }
}

function sendStats() {
  chrome.extension.sendRequest({action: "sendStats"}, function(response) {
   /* Reload the iframe. */
   var iframe = document.getElementById("stats_frame");
   iframe.src = iframe.src;
  });
}

function clearStats() {
  console.log("Request to clear stats.");
  chrome.extension.sendRequest({action: "clearStats"}, function(response) {
   initialize();
  });
}

function togglePause() {
  console.log("In toggle pause");
  console.log("Value = " + localStorage["paused"]);
  if (localStorage["paused"] == "false") {
   console.log("Setting to Resume");
   chrome.extension.sendRequest({action: "pause"}, function(response) {});
   document.getElementById("toggle_pause").innerHTML = "Resume Timer";
  } else if (localStorage["paused"] == "true"){
   console.log("Setting to Pause");
   chrome.extension.sendRequest({action: "resume"}, function(response) {});
   document.getElementById("toggle_pause").innerHTML = "Pause Timer";
  }
}

function initialize() {
  var stats = document.getElementById("stats");
  if (stats.childNodes.length == 1) {
   stats.removeChild(stats.childNodes[0]);
  }

  if (localStorage["storageType"] == "appengine") {
   addFrame();
  } else if (localStorage["storageType"] == "local") {
   addLocalDisplay();
  }

  var link = document.getElementById("toggle_pause");
  if (localStorage["paused"] == undefined || localStorage["paused"] == "false") {
   localStorage["paused"] = "false";
   link.innerHTML = "Pause Timer";
  } else {
   link.innerHTML = "Resume Timer";
  }

  var nextClearStats = localStorage["nextTimeToClear"];
  if (nextClearStats) {
   nextClearStats = parseInt(nextClearStats, 10);
   nextClearStats = new Date(nextClearStats);
   var nextClearDiv = document.getElementById("nextClear");
   if (nextClearDiv.childNodes.length == 1) {
     nextClearDiv.removeChild(nextClear.childNodes[0]);
   }
   nextClearDiv.appendChild(
     document.createTextNode("Next Reset: " + nextClearStats.toString()));
  }
}

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("clear").addEventListener("click", clearStats);
  document.getElementById("toggle_pause").addEventListener(
    "click", togglePause); 
  initialize();
});
