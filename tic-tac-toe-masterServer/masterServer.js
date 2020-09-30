const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const { assert } = require("console");
const fs = require("fs");
const fetch = require("node-fetch");

const jsonParser = bodyParser.json();
const urlEncodedParser = bodyParser.urlencoded({ extended: true });

//requiring a libary to easily and safely get the command line arguments
const argv = require("minimist")(process.argv.slice(2));
console.dir(argv);

//setting the port for the server, default port is 6010
const masterServerPort = argv.masterServerPort ? argv.masterServerPort : 7010;

const port = process.env.PORT || masterServerPort;
// const port = process.env.PORT;

const app = express();
app.use(jsonParser);
app.use(express.json());

const server = http.createServer(app);

let serverList = [];
let serverNamesList = null;
let serverNamesInUse = [];

let roomNamesList = null;
let roomNamesInUse = [];

let serverRegisterQueue = [];

let matchmakingServerList = [];

//read the server names from the serverNames.json file
const getServerNames = () => {
  fs.readFile("serverNames.json", (err, data) => {
    if (err) {
      console.log("error while reading the server names");
      throw err;
    } else {
      serverNamesList = JSON.parse(data);
      console.log("First dataset: " + data[0]);
    }
  });
};

//read the room names from the roomNames.json file
const getRoomNames = () => {
  fs.readFile("roomNames.json", (err, data) => {
    if (err) {
      console.log("error while reading the room names");
      throw err;
    } else {
      roomNamesList = JSON.parse(data);
      // console.log(roomNamesList);
      console.log("First dataset: " + data[0]);
      // getRandomUniqueRoomNames();
    }
  });
};

//get a random unique name for a game server
const getRandomUniqueServerName = () => {
  const randomDataSetIndex = Math.floor(Math.random() * serverNamesList.length);
  if (
    serverNamesInUse.findIndex(
      (serverName) => serverName == serverNamesList[randomDataSetIndex]
    ) == -1
  ) {
    console.log("random servername: " + serverNamesList[randomDataSetIndex]);
    serverNamesInUse.push(serverNamesList[randomDataSetIndex]);
    return serverNamesList[randomDataSetIndex];
  } else {
    console.log("server name already used");
  }
};

//get random unique names for the rooms
const getRandomUniqueRoomNames = (numberOfNames = 1) => {
  let randomIndexs = [];
  let randomNames = [];

  for (let index = 0; index < numberOfNames; index++) {
    randomIndexs.push(Math.floor(Math.random() * roomNamesList.length));
  }

  randomIndexs.forEach((randomIndex) => {
    if (
      roomNamesInUse.findIndex(
        (roomName) => roomName == roomNamesList[randomIndex]
      ) == -1
    ) {
      console.log("random roomname: " + roomNamesList[randomIndex]);
      roomNamesInUse.push(roomNamesList[randomIndex]);
      randomNames.push(roomNamesList[randomIndex]);
    } else {
      console.log("room name already used");
    }
  });
  return randomNames;
};

getServerNames();
getRoomNames();

app.get("/serverlist", (req, res) => {
  console.log("Received GET request on /serverlist");
  res.send(
    "Here is the serverlist!: " + JSON.stringify(serverList, null, "\t")
  );
});

app.post("/serverlist", (req, res) => {
  console.log("Received PUT request on /serverlist");
  console.log("Received data in put: " + req.body);
  console.log("Received data in put: " + JSON.stringify(req.body));

  // const requestJSON = JSON.parse(req.body);
  const requestJSON = req.body;

  //checking if the data is consistent

  if (
    requestJSON.serverName &&
    requestJSON.serverAddress &&
    requestJSON.gameRooms
  ) {
    // serverList.push(requestJSON);
    //need to add a check if server is in the list
    console.log(JSON.stringify(serverList, null, "\t"));
    res.end();
  } else {
    res.end();
  }
});

app.post("/registerGameserver", (req, res) => {
  console.log("Gameserver wants to register");

  const requestJSON = req.body;
  let roomNamesForGameserver = getRandomUniqueRoomNames(4);
  console.log(roomNamesForGameserver);
  let serverNameForGameserver = getRandomUniqueServerName();

  if (requestJSON.key == "secretGameserverRegKey") {
    let ip =
      (req.headers["x-forwarded-for"] || "").split(",").pop().trim() ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.connection.socket.remoteAddress;

    // console.log(req.headers["x-forwarded-for"]);
    // console.log(req.connection.remoteAddress);
    // console.log(req.socket.remoteAddress);
    // console.log(req.connection.socket.remoteAddress);

    if (ip.substr(0, 7) == "::ffff:") {
      ip = ip.substr(7);
    }

    serverRegisterQueue.push({
      serverName: serverNameForGameserver,
      serverAddress: ip,
      roomNames: roomNamesForGameserver,
    });
    res.json({
      response: "GameServer authenticated",
      serverName: serverNameForGameserver,
      serverAddress: ip,
      roomSize: 4,
      roomNames: JSON.stringify(roomNamesForGameserver),
    });
  } else {
    res.json({
      response: "GameServer could not be authenticated",
    });
  }
});

//not really used at the moment, needs to be implemented in a debug rest call to show matchmaking servers
//there also needs to be some sort of check if the matchmaking server is acutally alive
app.post("/registerMatchmakingServer", (req, res) => {
  console.log("Matchmaking-Server wants to register");

  let ip =
    (req.headers["x-forwarded-for"] || "").split(",").pop().trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  if (ip.substr(0, 7) == "::ffff:") {
    ip = ip.substr(7);
  }

  const requestJSON = req.body;
  let serverNameForMatchmaking = getRandomUniqueServerName();

  if (requestJSON.key == "registerMatchmakingKey") {
    matchmakingServerList.push({
      serverName: serverNameForMatchmaking,
      serverAddress: ip,
    });
    res.json({
      response: "MatchmakingServer authenticated",
      serverName: serverNameForMatchmaking,
      serverAddress: ip,
      serverList: serverList,
    });
  } else {
    res.json({
      response: "MatchmakingServer could not be authenticated",
    });
  }
});

app.post("/completeRegisterGameserver", (req, res) => {
  console.log("Gameserver wants to register its rooms");

  const requestJSON = req.body;
  console.log(requestJSON);
  if (requestJSON.key == "registerKey") {
    //needs to check for fitting data
    serverList.push(requestJSON.serverList);
    res.end();
  } else {
    res.json({ status: "could not register gameserver in serverlist" });
  }
  console.log("current serverlist: " + JSON.stringify(serverList, null, "\t"));
});

app.post("/checkGameserver", (req, res) => {
  console.log("Checking gameservers health.");
  const requestJSON = req.body;
  console.log(requestJSON);

  console.log(requestJSON.serverAddress);
  let responseFromServer = null;
  (async () => {
    try {
      const response = await fetch(requestJSON.serverAddress, {
        method: "get",
        headers: { "Content-Type": "application/json" },
      });
      responseFromServer = await response.catch();
    } catch (err) {
      console.log("Error getting data from gameserver");
      responseFromServer = null;
    }

    if (responseFromServer == null) {
      //remove server from serverlist
      // for (let index = 0; index <= serverList.length; index++) {
      //   const element = serverList[index];
      //   if (element.serverName == requestJSON.serverName && index == 0) {
      //     serverList = [];
      //   } else if (element.serverName == requestJSON.serverName && index > 0) {
      //     console.log("found server to delete");
      //     serverList.splice(index, 1);
      //   }
      // }

      let indexToRemove = -1;

      serverList.forEach((server, index) => {
        console.log(server);
        if (server.serverAddress == requestJSON.serverAddress) {
          indexToRemove = index;
        }
      });

      // const indexToRemove = serverList.findIndex(
      //   (server) => server.fo.serverName == requestJSON.serverName
      // );

      console.log("indexToRemove: " + indexToRemove);

      if (indexToRemove != -1) {
        serverList.splice(indexToRemove, 1);
      }
      // serverList = serverList.filter((value, index, arr) => {
      //   return value.serverName != requestJSON.serverName;
      // });
      console.log(JSON.stringify(serverList, null, "\t"));
      console.log("Server not alive");
      res.json({
        response: "GameServer not alive",
      });
    } else {
      res.json({
        response: "GameServer alive",
      });
      // console.log("Server alive");
    }
  })();

  // res.end();
});

app.post("/getGameserverNames", (req, res) => {
  console.log("Client wants GameserverNames");

  let gameServerNames = [];

  serverList.forEach((server) => {
    gameServerNames.push(server.serverName);
  });

  res.json({
    gameServerNames: gameServerNames,
  });
  res.end();
  console.log("client got gameservername");
});

app.post("/getGameServerData", (req, res) => {
  console.log("Client wants GameServerData");

  const requestJSON = req.body;
  console.log(requestJSON);

  const gameServerData = serverList.find(
    (server) => server.serverName == requestJSON.serverName
  );

  console.log(JSON.stringify(gameServerData, null, "\t"));

  res.json(JSON.stringify(gameServerData));
  res.end();
});

server.listen(port, () => console.log(`Listening on port ${port}`));
