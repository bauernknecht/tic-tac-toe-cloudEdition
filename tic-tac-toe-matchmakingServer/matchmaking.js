const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const socketIOClient = require("socket.io-client");
const fetch = require("node-fetch");
const cors = require("cors");
const { rejects } = require("assert");

//requiring a libary to easily and safely get the command line arguments
const argv = require("minimist")(process.argv.slice(2));
console.dir(argv);

//setting the port for the server, default port is 6010
const gameserverPort = argv.gameserverPort ? argv.gameserverPort : 6010;
const frontendPort = argv.frontendPort ? argv.frontendPort : 6011;
const masterServerAddress = argv.masterServerAddress
  ? argv.masterServerAddress
  : null;

const port = process.env.PORT || gameserverPort;

const app = express();

//using cors() to allow cross-origin headers
app.use(cors());

const server = http.createServer(app);

//socket for the gameserver connection
const io = socketIo(server);

//socket for the frontend server connection
const frontendServer = new socketIo(frontendPort);

let serverAddress = null;
let serverName = null;

let removedServerNames = [];

let listOfGameservers = null;

//getting the gameserver list from to masterserver to establish a connection to them
const getMasterserverGameserverList = () => {
  console.log("getting the masterserver gameserverlist");
  (async () => {
    const body = {
      key: "registerMatchmakingKey",
    };

    const response = await fetch(
      masterServerAddress + "/registerMatchmakingServer",
      {
        method: "post",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }
    );
    clientJoinRoomData;

    const responseFromServer = await response.json();
    if (responseFromServer.response == "MatchmakingServer authenticated") {
      console.log("Matchmaking server got authenticated");
      console.log(
        "Serverresponse: " + JSON.stringify(responseFromServer, null, "\t")
      );
      serverAddress = responseFromServer.serverAddress;
      serverName = responseFromServer.serverName;
      listOfGameservers = responseFromServer.serverList;
      setupFrontendSockets();
      // setupGameserverSockets();

      // listOfGameservers.forEach((gameServerData) =>
      //   setupGameServerSocket(gameServerData)
      // );
    }
  })();
};

//get the game server names from the master server to compare them for new servers
const getGameServerNamesFromMasterServer = () => {
  (async () => {
    const response = await fetch(masterServerAddress + "/getGameserverNames", {
      method: "post",
      headers: { "Content-Type": "application/json" },
    });

    const responseFromServer = await response.json();

    let newGameServers = responseFromServer.gameServerNames;

    let currentGameServerNames = [];

    listOfGameservers.forEach((gameServer) => {
      currentGameServerNames.push(gameServer.serverName);
    });

    console.log("NewGameServers length: " + newGameServers.length);
    console.log(
      "currentGameServerNames length: " + currentGameServerNames.length
    );

    let gameServerNameDifference = newGameServers.filter(
      (x) => !currentGameServerNames.includes(x)
    );

    console.log(
      "NewGameServers: " + JSON.stringify(gameServerNameDifference, null, "\t")
    );

    gameServerNameDifference.forEach((serverName) =>
      setupGameServersFromMasterData(serverName)
    );
  })();
};

getMasterserverGameserverList();

//interval to check for new game server
setInterval(() => {
  console.log("Checking for new names");
  getGameServerNamesFromMasterServer();
}, 5000);

//set up the socket via the game server name
const setupGameServersFromMasterData = (serverNameToGet) => {
  (async () => {
    console.log("GameServerNameToGet: " + serverNameToGet);

    try {
      const body = { serverName: serverNameToGet };

      const response = await fetch(masterServerAddress + "/getGameServerData", {
        method: "post",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      responseFromServer = await response.json();
      console.log("Response: " + JSON.stringify(responseFromServer));
      if (responseFromServer != null) {
        setupGameServerSocket(responseFromServer);
      }
    } catch (err) {
      console.log("Error getting data from masterserver");
      console.log(err);
    }
  })();
};

let listOfRooms = [];

//proxy to watch for changes in rooms
let listOfRoomsProxy = new Proxy(listOfRooms, {
  set: (target, key, value) => {
    target[key] = value;
    console.log("listOfRooms has changed");
    frontendServer.emit("roomStatus", listOfRooms);
    return true;
  },
  get: (target, property, receiver) => {
    // console.log("listOfRoomsProxy called");
    return target[property];
  },
});

let roomCount = 0;
let allPlayerCount = 0;
let roomsOccupied = 0;
let roomSpace = 0;

//frontendserver on connect listener, emits the current list of rooms
const setupFrontendSockets = () => {
  frontendServer.on("connection", function (socket) {
    console.log("Frontend connected");

    socket.on("getRoomStatus", (data) => {
      socket.emit("roomStatus", listOfRoomsProxy);
    });

    socket.emit("roomStatus", listOfRoomsProxy);
    //console.log("Proxy stuff: " + JSON.stringify(listOfRoomsProxy, null, "\t"));

    socket.on("getRoomData", (data) => {
      // console.log(
      //   "getRoomData received from client: " + JSON.stringify(data, null, "\t")
      // );

      let roomDataMatchingClientRequest = findRoomByClientRequest(data);
      console.log(JSON.stringify(roomDataMatchingClientRequest, null, "\t"));
      socket.emit("clientJoinRoomData", roomDataMatchingClientRequest);
      // frontendServer.sockets
      //   .to("\\")
      //   .emit("roomData", roomDataMatchingClientRequest);
    });

    frontendServer.on("clientJoinsRoom", (data) => {
      console.log("Client: " + socket.id + " want to join a room");
      //check if client is already in a room
    });

    socket.on("disconnect", () => {
      console.log("Frontend disconnected");
    });
  });
};

//set up a socket to a game server
const setupGameServerSocket = (gameServerData) => {
  console.log("setting up new socket");
  console.log("gameServerData: " + JSON.stringify(gameServerData, null, "\t"));

  let receivedGameServerData = null;

  try {
    receivedGameServerData = JSON.parse(gameServerData);
  } catch (error) {
    receivedGameServerData = gameServerData;
  }

  listOfGameservers.push(receivedGameServerData);
  const gameServerName = receivedGameServerData.serverName;
  const serverAddress =
    "http://[" +
    receivedGameServerData.serverAddress +
    "]:" +
    receivedGameServerData.serverStatusPort;
  console.log("Server to connect to: " + JSON.stringify(serverAddress));
  const matchMakingSocket = socketIOClient(serverAddress);
  // console.log("MatchmakingSOcket: ");
  // console.log(matchMakingSocket);

  matchMakingSocket.on("connect", () => {
    if (matchMakingSocket.connected) {
      console.log(
        "Gameserver: " + gameServerName + " connected to this server"
      );

      //frontendServer.emit("roomStatus", listOfRoomsProxy);
    }
  });

  matchMakingSocket.on("disconnect", () => {
    removedServerNames.push(gameServerName);
    console.log("Gameserver: " + gameServerName + " disconnected");

    //remove the rooms from the listOfRooms
    removeServerFromListOfRooms(gameServerName);
    //frontendServer.emit("roomStatus", listOfRooms);

    const serverFromList = listOfGameservers.filter((server) => {
      return server.serverName == gameServerName;
    });
    console.log(serverFromList);

    //point of bug?
    const serverAddress =
      "http://[" +
      serverFromList[0].serverAddress +
      "]:" +
      serverFromList[0].serverGamePort;

    console.log(serverAddress);

    (async () => {
      const body = {
        serverName: gameServerName,
        serverAddress: serverAddress,
      };
      const response = await fetch(masterServerAddress + "/checkGameserver", {
        method: "post",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      });
      const jsonResponse = await response.json();

      console.log("Changing Gameserverlist");
      if (jsonResponse.response == "GameServer alive") {
        console.log("gameserver is fine");
        return;
      } else {
        //remove the gameserver from the list, as it is not alive anymore
        console.log("gameserver is not alive!!");
        listOfGameservers = listOfGameservers.filter((value) => {
          console.log(
            "serverName:" +
              value.serverName +
              " gameServerName: " +
              gameServerName
          );
          return value.serverName != gameServerName;
        });
        console.log("Gameserver length: " + listOfGameservers.length);
        removeServerFromListOfRooms(gameServerName);
        console.log(JSON.stringify(listOfRoomsProxy, null, "\t"));
      }
    })();
  });

  matchMakingSocket.on("serverDebugMessage", (data) => {
    console.log("Data from GameserverStatus: " + data);
  });

  matchMakingSocket.on("roomStatus", (data) => {
    console.log("roomStatus event fired");

    //getting the index of the server in our current listOfRooms, is -1 when server is not yet in this list
    const indexOfServerInListOfRooms = listOfRoomsProxy.findIndex((server) => {
      return server.serverName == gameServerName;
    });

    //checking if the server is in this list
    if (indexOfServerInListOfRooms != -1) {
      roomsToBeUpdated = { serverName: gameServerName, serverGame: data };

      listOfRoomsProxy[indexOfServerInListOfRooms] = roomsToBeUpdated;
    } else {
      roomsToBeAdded = { serverName: gameServerName, serverGame: data };
      console.log("ServerName in roomsToBeAdded: " + roomsToBeAdded.serverName);
      console.log("ServerData: " + JSON.stringify(data));
      // let tempListOfRoomProxy = listOfRoomsProxy;
      listOfRoomsProxy.push(roomsToBeAdded);
    }
    console.log(
      "ListOfRoomsProxy after adding or updating it: " + listOfRoomsProxy
    );
    frontendServer.emit("roomStatus", listOfRoomsProxy);
  });
};

//return the number of rooms
const calcRoomCount = () => {
  let roomCounter = 0;

  listOfRoomsProxy.forEach((room) => {
    room.serverGame.forEach((game) => roomCounter++);
  });

  return roomCounter;
};

//return the number of players playing or waiting in a game
const calcPlayersPlaying = () => {
  let playerCount = 0;

  listOfRoomsProxy.forEach((room) => {
    room.serverGame.forEach((game) => {
      playerCount += game.game.playerCount;
    });
  });
  return playerCount;
};

//return the number of rooms that are occupied
const calcRoomsOccupied = () => {
  let roomsOccupiedCount = 0;

  listOfRoomsProxy.forEach((room) => {
    room.serverGame.forEach((game) => {
      if (game.game.playerCount > 0) {
        roomsOccupiedCount++;
      }
    });
  });

  return roomsOccupiedCount;
};

//removes a server with all his rooms from the list
const removeServerFromListOfRooms = (serverName) => {
  console.log("removeServerFromListofRooms called");
  listOfRoomsProxy = listOfRoomsProxy.filter((value, index, arr) => {
    return value.serverName != serverName;
  });
  frontendServer.emit("roomStatus", listOfRoomsProxy);
  console.log("ListOfRooms check after removal: " + listOfRoomsProxy);
};

//return a random empty match
const getRandomMatch = () => {
  let listWithEmptyRooms = [];

  listOfRoomsProxy.forEach((server) => {
    server.serverGame.forEach((value) => {
      if (value.game.playerCount == 0) {
        listWithEmptyRooms.push({
          serverName: server.serverName,
          roomName: value.roomName,
        });
      }
    });
  });

  const randomMatch = Math.floor(Math.random() * listWithEmptyRooms.length);
  return listWithEmptyRooms[randomMatch];
};

app.get("/status", function (req, res) {
  res.json({
    status: "alive",
    listOfGameservers: listOfGameservers,
    listOfRooms: listOfRoomsProxy,
  });
});

app.post("/getRandomMatch", function (req, res) {
  console.log("getRandomMatch called");
  let filledMatches = [];

  listOfRoomsProxy.forEach((gameServer) => {
    gameServer.serverGame.forEach((gameRoom) => {
      if (gameRoom.game.playerCount == 1) {
        filledMatches.push({
          serverName: gameServer.serverName,
          roomName: gameRoom.roomName,
        });
      }
    });
  });

  console.log(filledMatches);

  if (filledMatches.length == 0) {
    //send random match
    res.send(getRandomMatch());
  } else if (filledMatches.length == 1) {
    res.json(filledMatches[0]);
  } else {
    const randomGameIndex = Math.floor(Math.random() * filledMatches.length);
    res.json(filledMatches[randomGameIndex]);
  }
});

app.get("/roomStatus", function (req, res) {
  roomCount = calcRoomCount();
  allPlayerCount = calcPlayersPlaying();
  roomsOccupied = calcRoomsOccupied();

  res.json({
    roomCount: roomCount,
    roomsOccupied: roomsOccupied,
    totalPlayerCapacity: roomCount * 2,
    playerSlotsAvailable: roomCount * 2 - allPlayerCount,
    playerCount: allPlayerCount,
  });
});

const findRoomByClientRequest = (clientData) => {
  let foundRoom = {};

  listOfGameservers.find((gameServer) => {
    if (gameServer.serverName == clientData.serverName) {
      gameServer.gameRooms.forEach((gameRoom) => {
        if (gameRoom == clientData.roomName) {
          const serverAddress =
            "http://[" +
            gameServer.serverAddress +
            "]:" +
            gameServer.serverGamePort;

          foundRoom = {
            serverAddress: serverAddress,
            serverName: gameServer.serverName,
            roomName: gameRoom,
          };
        }
      });
    }
  });
  return foundRoom;
};

server.listen(port, () => console.log(`Listening on port ${port}`));
