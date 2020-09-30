const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const fetch = require("node-fetch");

//requiring a libary to easily and safely get the command line arguments
const argv = require("minimist")(process.argv.slice(2));
console.dir(argv);

//setting the port for the server, default port is 5050
const serverGamePort = argv.portGame ? argv.portGame : 5050;
const serverStatusPort = argv.portStatus ? argv.portStatus : 5051;
const masterServerAddress = argv.masterServerAddress
  ? argv.masterServerAddress
  : null;

const port = process.env.PORT || serverGamePort;
const index = require("./index");

const app = express();
app.use(index);

const server = http.createServer(app);

//socket for the complete game behaviour
const io = socketIo(server);

//socket for the status information
const statusServer = new socketIo(serverStatusPort);

let clientsLength = 0;
let roomSize = 3;
let roomNames = null;
let rooms = [];
let serverName = null;
let serverAddress = null;

//create a game object
const gameFactory = () => ({
  gameSquares: Array(9).fill(null),
  gamePlayers: Array(2).fill(
    {
      player: null,
      playerFigure: null,
      nextRound: null,
      points: 0,
    },
    {
      player: null,
      playerFigure: null,
      nextRound: null,
      points: 0,
    }
  ),
  lastPlayerID: null,
  nextPlayerID: null,
  gameStatus: "not used",
});

//create rooms
const createRooms = () => {
  console.log("Creating game rooms");
  for (let i = 0; i < roomSize; i++) {
    rooms.push({ game: gameFactory(), roomName: roomNames[i] });
  }
};

//register the game server to the master server
const registerGameServerToMasterServer = () => {
  (async () => {
    let roomsForMasterServer = [];
    rooms.forEach((room) => {
      roomsForMasterServer.push(room.roomName);
    });

    const body = {
      key: "secretGameserverRegKey",
    };

    const response = await fetch(masterServerAddress + "/registerGameserver", {
      method: "post",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const responseFromServer = await response.json();

    console.log("Response from Server");
    console.log(responseFromServer);
    if (responseFromServer.response == "GameServer authenticated") {
      console.log("Received information about the gamerooms");
      roomSize = responseFromServer.roomSize;
      roomNames = JSON.parse(responseFromServer.roomNames);
      serverName = responseFromServer.serverName;
      serverAddress = responseFromServer.serverAddress;
      createRooms();
      createSocketForStatusServer();
      createSocketForGameServer();
      console.log("calling sendGameServerInformation");
      sendGameServerInformationToTheMasterServer();
      console.log("ServerAddress: " + serverAddress);
    } else {
      console.log("Authentification not successfull");
      console.log("Response from masterserver: " + responseFromServer.response);
    }
  })();
};

//send the game server information to the master server
const sendGameServerInformationToTheMasterServer = () => {
  console.log("sending the gameinformation to the masterserver");
  (async () => {
    let roomsForMasterServer = [];
    rooms.forEach((room) => {
      roomsForMasterServer.push(room.roomName);
    });

    const body = {
      key: "registerKey",
      serverList: {
        serverName: serverName,
        serverAddress: serverAddress,
        serverGamePort: serverGamePort,
        serverStatusPort: serverStatusPort,
        gameRooms: roomsForMasterServer,
      },
    };

    const response = await fetch(
      masterServerAddress + "/completeRegisterGameserver",
      {
        method: "post",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }
    );
    const responseFromServer = await response;

    console.log(responseFromServer);
  })();
};
registerGameServerToMasterServer();

//console.log(rooms);

//create the socket for the matchmaking server to watch the rooms
const createSocketForStatusServer = () => {
  //socket-connection for the status information
  statusServer.on("connection", (socket) => {
    console.log("Matchmaking-Server connected");

    statusServer.emit(
      "serverDebugMessage",
      "Server Debug Message: someone connected"
    );

    //emit the current status
    emitCurrentRoomStatusToMatchmakingServers();

    //logging the currently connected users
    userCountStatus(socket);

    //listens on the disconnect event
    socket.on("disconnect", () => {
      console.log("Matchmaking-Server disconnected");
      statusServer.emit(
        "serverDebugMessage",
        "Server Debug Message: someone left"
      );
    });
  });
};

//creating a socket for a game server
const createSocketForGameServer = () => {
  io.on("connection", (socket) => {
    console.log("New client connected to gameserver");

    userCount(socket);

    //socket joining a room
    socket.on("room", function (room) {
      console.log("Client interacted with room: " + room);

      //check, if room user wants to join exists
      if (rooms.find((element) => element.roomName == room)) {
        //check, if there is space for the user to join
        if (getUserCountFromRoom(room) <= 1) {
          //make the socket actually join the game room
          socket.join(room, () => {
            console.log("Socket: " + socket.id + " joined room: " + room);

            socket.emit("clientJoinedRoom", {
              socketId: socket.id,
            });

            const roomIndexToChange = rooms.findIndex(
              (element) => element.roomName == room
            );

            if (getUserCountFromRoom(room) <= 1) {
              //changing the state of the game
              rooms[roomIndexToChange].game.gameStatus =
                "player joined, not started yet";
              rooms[roomIndexToChange].game.someOneJoined = true;
            } else {
              rooms[roomIndexToChange].game.gameStatus = "room is full";
              rooms[roomIndexToChange].game.someOneJoined = false;
            }

            //Emit a joinLeaveEvent to the player which just connected.
            socket.emit("joinLeaveEvent", { roomJoined: true, roomName: room });

            if (io.sockets.adapter.rooms[room].length == 2) {
              setupGameRoom(room);
            }

            emitCurrentRoomStatusToMatchmakingServers();
          });
        } else {
          //user wants to join a full room
          console.log("user wanted to join a full game");
        }
      } else {
        //user wants to join a room that is not existing
        console.log("user wanted to join a non-existing room");
      }
    });

    //Spielfeld resetten
    socket.on("clearGame", (room) => {
      console.log("Gamereset has been called");
      //check, if user who wants to reset game, actually takes part of the game
      const roomToSearch = rooms.find((element) => element.roomName == room);
      console.log("Zu suchender room: " + room);
      console.log(
        "Gefundener room: " + JSON.stringify(roomToSearch, null, "\t")
      );

      //check if room that the user wants to reset actually exists
      if (roomToSearch !== undefined) {
        //search for the player that wants to reset the game in the game object
        const playerIsInGame = roomToSearch.game.gamePlayers.find(
          (element) => element.player == socket.id
        );
        console.log(
          "Gefundener Spieler: " + JSON.stringify(playerIsInGame, null, "\t")
        );
        //TODO: check if the player is in the room

        const roomIndexToSearch = rooms.findIndex(
          (element) => element.roomName == room
        );

        //getting the player data before resettting the player;
        let playerOne = rooms[roomIndexToSearch].game.gamePlayers[0];
        let playerTwo = rooms[roomIndexToSearch].game.gamePlayers[1];

        let nextPlayerID = getRandomNextPlayer(
          rooms[roomIndexToSearch].game.gamePlayers
        );

        //actually resetting the game
        rooms[roomIndexToSearch].game = gameFactory();

        //setting the player data back to the previous data
        rooms[roomIndexToSearch].game.gamePlayers[0] = playerOne;
        rooms[roomIndexToSearch].game.gamePlayers[1] = playerTwo;

        //setting the next player
        rooms[roomIndexToSearch].game.nextPlayerID = nextPlayerID;

        io.to(rooms[roomIndexToSearch].roomName).emit("gameEvent", {
          gameReset: true,
          nextPlayer: nextPlayerID,
        });

        console.log(JSON.stringify(rooms[roomIndexToSearch], null, "\t"));
      } else {
        console.log("Zu suchender Room nicht gefunden");
      }
    });

    socket.on("game", (data) => {
      io.to("some room").emit("test gamedata");
    });

    //reacting to a game event from a client (player did a move)
    socket.on("gameEvent", (data) => {
      //making sure the data which is needed is complete
      if (
        data === null ||
        !data.hasOwnProperty("player") ||
        !data.hasOwnProperty("playerID") ||
        !data.hasOwnProperty("squareClickedIn")
      ) {
        console.log("Data ist nicht komplett");
        return;
      }

      let matchingRoom = null;
      let currentPlayer = null;

      rooms.forEach((element) => {
        element.game.gamePlayers.forEach((gamePlayers) => {
          if (gamePlayers.player == data.playerID) {
            matchingRoom = element;
            currentPlayer = gamePlayers;
          }
        });
      });

      if (matchingRoom == null) {
        console.log("No matching room found for player: " + data.playerID);
        return;
      }

      let currentRoomIndex = rooms.findIndex(
        (roomToFind) => roomToFind.roomName == matchingRoom.roomName
      );

      // console.log("Current room index: " + currentRoomIndex);
      // console.log("Stuff: " + rooms[currentRoomIndex].game.gameSquares);

      rooms[currentRoomIndex].game.gameSquares[data.squareClickedIn] =
        currentPlayer.playerFigure;
      rooms[currentRoomIndex].game.lastPlayerID = currentPlayer.player;

      console.log("squareClickedIn: " + data.squareClickedIn);
      let squareClickedIn = data.squareClickedIn;

      if (calculateWinner(rooms[currentRoomIndex].game.gameSquares)) {
        console.log("game finished");
        //emitting latest gameMove to clients
        io.to(rooms[currentRoomIndex].roomName).emit("gameMove", {
          gameMove: {
            gameSquare: rooms[currentRoomIndex].game.gameSquares,
            squareIndex: squareClickedIn,
          },
        });
        //emitting that the game has finished
        io.to(rooms[currentRoomIndex].roomName).emit("gameEvent", {
          gameFinished: true,
        });

        //give the winning player a point
        let playerIndex = rooms[currentRoomIndex].game.gamePlayers.findIndex(
          (player) => player.player == socket.id
        );
        rooms[currentRoomIndex].game.gamePlayers[playerIndex].points += 1;
        //emitting the points to the players
        io.to(rooms[currentRoomIndex].roomName).emit("playerPoints", {
          playerOneId: rooms[currentRoomIndex].game.gamePlayers[0].player,
          playerOnePoints: rooms[currentRoomIndex].game.gamePlayers[0].points,
          playerTwoId: rooms[currentRoomIndex].game.gamePlayers[1].player,
          playerTwoPoints: rooms[currentRoomIndex].game.gamePlayers[1].points,
        });
      } else if (
        rooms[currentRoomIndex].game.gameSquares.filter((gameSquare) => {
          return gameSquare == null;
        }).length == 0
      ) {
        console.log("game tied");
        console.log(
          "sending game move to: " + rooms[currentRoomIndex].roomName
        );
        io.to(rooms[currentRoomIndex].roomName).emit("gameMove", {
          gameMove: {
            gameSquare: rooms[currentRoomIndex].game.gameSquares,
            squareIndex: squareClickedIn,
          },
        });
        //emitting that the game has finished
        io.to(rooms[currentRoomIndex].roomName).emit("gameEvent", {
          gameFinished: true,
        });
      } else {
        console.log(
          "sending game move to: " + rooms[currentRoomIndex].roomName
        );
        io.to(rooms[currentRoomIndex].roomName).emit("gameMove", {
          gameMove: {
            gameSquare: rooms[currentRoomIndex].game.gameSquares,
            squareIndex: squareClickedIn,
            nextPlayer: matchingRoom.game.gamePlayers.find(
              (element) => element.player != socket.id
            ).player,
            nextPlayerFigure: matchingRoom.game.gamePlayers.find(
              (element) => element.player != socket.id
            ).playerFigure,
          },
        });
      }
    });

    socket.on("playerReadyForNextRound", (data) => {
      console.log("Player wants another round: " + socket.id);
      if (data.playerWantsNextRound) {
        const roomsFromSocket = Object.keys(socket.rooms);

        //find matching room:
        const roomIndexToChange = rooms.findIndex(
          (element) => element.roomName == roomsFromSocket[1]
        );

        //find matching player:
        let playerIndex = rooms[roomIndexToChange].game.gamePlayers.findIndex(
          (player) => player.player == socket.id
        );

        //setting the players nextRound attribute to true
        rooms[roomIndexToChange].game.gamePlayers[playerIndex].nextRound = true;

        //emitting a event to the room that a next round is played
        if (
          rooms[roomIndexToChange].game.gamePlayers[0].nextRound &&
          rooms[roomIndexToChange].game.gamePlayers[1].nextRound
        ) {
          io.to(rooms[roomIndexToChange].roomName).emit("nextRoundGetsPlayed", {
            nextRound: true,
          });
          rooms[roomIndexToChange].game.gameSquares = Array(9).fill(null);
          rooms[roomIndexToChange].game.gamePlayers[0].nextRound = null;
          rooms[roomIndexToChange].game.gamePlayers[1].nextRound = null;

          const winnerFromLastGame = rooms[roomIndexToChange].game.lastPlayerID;
          const loserFromLastGame = rooms[
            roomIndexToChange
          ].game.gamePlayers.find(
            (element) => element.player != winnerFromLastGame
          ).player;

          console.log("Looser from last round: " + loserFromLastGame);

          rooms[roomIndexToChange].game.nextPlayer = loserFromLastGame;

          io.to(rooms[roomIndexToChange].roomName).emit("gameSetup", {
            gameSetup: {
              playerOne: loserFromLastGame,
              playerTwo: socket.id,
              nextPlayer: loserFromLastGame,
            },
          });
        }
      }
    });

    //listens on the disconnect event
    socket.on("disconnecting", () => {
      console.log("Client disconnected");

      //console.log("Client interacted to leave room: " + room);
      const roomsFromSocket = Object.keys(socket.rooms);

      console.log(
        "Room from socket disconnecting: " +
          JSON.stringify(roomsFromSocket, null, "\t")
      );

      roomsFromSocket.forEach((room) => {
        //TODO: make the game reset once a player has left
        //TODO: remove the player from the game object
        console.log("Rooms: " + room);
        if (room == socket.id) {
          console.log("Socket is room");
        } else {
          socket.leave(room, () => {
            console.log("Room to leave: " + room);
            socket.emit(
              "joinLeaveEvent",
              // "User: " + socket.id + " has left room: " + room
              { roomJoined: false, roomName: "none", roomLeft: true }
            );

            io.to(room).emit("joinLeaveEvent", {
              roomJoined: true,
              otherPlayerLeft: true,
            });

            //check if the room the user wants to leave exists
            if (rooms.find((element) => element.roomName == room)) {
              let roomIndex = rooms.findIndex(
                (element) => element.roomName == room
              );
              let playerIndex = rooms[roomIndex].game.gamePlayers.findIndex(
                (player) => player.player == socket.id
              );

              //delete the user from the game

              try {
                rooms[roomIndex].game.gamePlayers[playerIndex].player = null;
                rooms[roomIndex].game.gamePlayers[
                  playerIndex
                ].playerFigure = null;
                rooms[roomIndex].game.gamePlayers[playerIndex].nextRound = null;
                rooms[roomIndex].game.gamePlayers[playerIndex].points = 0;
                rooms[roomIndex].game.someOneJoined = true;
              } catch (error) {
                rooms[roomIndex].game.gameStatus = "Room is empty";
                delete rooms[roomIndex].game.someOneJoined;
                emitCurrentRoomStatusToMatchmakingServers();
                return;
              }

              otherPlayerIndex = playerIndex == 0 ? 1 : 0;

              rooms[roomIndex].game.gamePlayers[otherPlayerIndex].points = 0;

              //setting the game status
              if (
                rooms[roomIndex].game.gamePlayers[otherPlayerIndex].player !=
                null
              ) {
                rooms[roomIndex].game.gameStatus = "player waiting";
                rooms[roomIndex].game.someOneJoined = true;
              } else {
                rooms[roomIndex].game.gameStatus = "Room is empty";
                delete rooms[roomIndex].game.someOneJoined;
              }

              //resetting the game
              if (
                rooms[roomIndex].game.gamePlayers[otherPlayerIndex].player !=
                null
              ) {
                rooms[roomIndex].game.gameSquares = Array(9).fill(null);
                rooms[roomIndex].game.lastPlayerID = null;
              } else {
                rooms[roomIndex].game.gameSquares = Array(9).fill(null);
                rooms[roomIndex].game.lastPlayerID = null;
                rooms[roomIndex].game.nextPlayerID = null;
              }
              //gameMove event to sync data to remaining player

              io.to(rooms[roomIndex].roomName).emit("gameMove", {
                gameMove: {
                  gameSquare: rooms[roomIndex].game.gameSquares,
                  squareIndex: null,
                  nextPlayer: rooms[roomIndex].game.gamePlayers.find(
                    (element) => element.player != socket.id
                  ).player,
                  nextPlayerFigure: rooms[roomIndex].game.gamePlayers.find(
                    (element) => element.player != socket.id
                  ).playerFigure,
                },
              });

              emitCurrentRoomStatusToMatchmakingServers();
            }
          });
        }
        //getUserCountFromRoom(room);
      });
      userCount(socket);
    });
  });
};

//watching that a user trying to connect actually wants to connect to an existing game server
io.use(function (socket, next) {
  console.log("Query from client: ", socket.handshake.query);
  console.log("RoomName from client: " + socket.handshake.query.roomName);
  console.log(
    "Evaluation from check: " +
      rooms.findIndex(
        (room) => room.roomName == socket.handshake.query.roomName
      )
  );

  if (
    rooms.findIndex(
      (room) => room.roomName == socket.handshake.query.roomName
    ) != -1
  ) {
    next();
  } else {
    console.log("client wanted to connect with not matching room");
    //next(new Error("Authentication error"));
    socket.emit();
    socket.disconnect();
    userCount(socket);
  }
});

//usercount for all connected users to the gameserver
let userCount = (socket) => {
  io.clients((error, clients) => {
    if (error) throw error;
    clientsLength = clients.length;
    console.log(
      "Clients on the game server: " +
        clients.length +
        " " +
        JSON.stringify(clients, null, "\t")
    );
    getUserCount(socket);
  });
};

//usercount for all connected users to the gameserver
let userCountStatus = (socket) => {
  statusServer.clients((error, clients) => {
    if (error) throw error;
    clientsLength = clients.length;
    console.log(
      "Clients on the status server: " +
        clients.length +
        " " +
        JSON.stringify(clients, null, "\t")
    );
    //getUserCount(socket);
  });
};

//emitting a message with the usercoutn to all users
const getUserCount = (socket) => {
  // Emitting a new message. Will be consumed by the client
  io.emit("FromUserCount", clientsLength);
};

//function to the the count of users of a certain room
let getUserCountFromRoom = (room) => {
  try {
    console.log("get roomsize count: " + io.sockets.adapter.rooms[room].length);
    return io.sockets.adapter.rooms[room].length;
  } catch (error) {
    console.log("room may not be created yet, count is 0");
    return 0;
  }
};

//caluclating if the game is over
let calculateWinner = (squares) => {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
};

const getRandomNextPlayer = (gamePlayers) => {
  return gamePlayers[Math.floor(Math.random() * 2)].player;
};

const emitCurrentRoomStatusToMatchmakingServers = () => {
  //little trick to clone a object, but not usefull when object has functions and prototypes
  // see: https://stackoverflow.com/questions/39736397/is-this-a-good-way-to-clone-an-object-in-es6
  let currentRooms = JSON.parse(JSON.stringify(rooms));

  currentRooms.forEach((element) => {
    delete element.game.gameSquares;
    delete element.game.lastPlayerID;
    delete element.game.nextPlayerID;

    let playerCount = 0;

    if (element.game.someOneJoined == true) {
      playerCount = 1;
    } else if (element.game.someOneJoined == false) {
      playerCount = 2;
    }

    delete element.game.gamePlayers;
    element.game.playerCount = playerCount;
  });
  //console.log("old rooms: " + JSON.stringify(rooms, null, "\t"));
  console.log(
    "Emitting room status to status server: " +
      JSON.stringify(currentRooms, null, "\t")
  );
  statusServer.emit("roomStatus", currentRooms);
};

const setupGameRoom = (roomName) => {
  const roomIndexToChange = rooms.findIndex(
    (element) => element.roomName == roomName
  );

  console.log(
    "users in room for setup: " +
      JSON.stringify(io.sockets.adapter.rooms[roomName], null, "\t")
  );

  // making sure two players are connected
  const firstPlayerIndex = Math.floor(Math.random() * 2);
  const secondPlayerIndex = firstPlayerIndex == 0 ? 1 : 0;

  console.log("firstPlayerIndex: " + firstPlayerIndex);
  console.log("secondPlayerIndex: " + secondPlayerIndex);

  const socketIdsFromRoom = Object.keys(
    io.sockets.adapter.rooms[roomName].sockets
  );

  //putting the first player in the first slot
  rooms[roomIndexToChange].game.gamePlayers[0] = {
    player: socketIdsFromRoom[firstPlayerIndex],
    playerFigure: "X",
    points: 0,
    nextRound: null,
  };

  //putting the second player in the second slot
  rooms[roomIndexToChange].game.gamePlayers[1] = {
    player: socketIdsFromRoom[secondPlayerIndex],
    playerFigure: "O",
    points: 0,
    nextRound: null,
  };

  //emit the finished gamesetup to the players in the room
  io.to(rooms[roomIndexToChange].roomName).emit("gameSetup", {
    gameSetup: {
      playerOne: socketIdsFromRoom[firstPlayerIndex],
      playerTwo: socketIdsFromRoom[secondPlayerIndex],
      nextPlayer: socketIdsFromRoom[firstPlayerIndex],
    },
  });

  console.log(
    "playerOne: " + rooms[roomIndexToChange].game.gamePlayers[0].player
  );
};

app.get("/status", function (req, res) {
  let roomsOccupied = 0;
  rooms.forEach((room) => {
    if (room.game.gameStatus != "not used") {
      roomsOccupied++;
    }
  });

  res.json({
    status: "alive",
    users: clientsLength,
    rooms: roomSize,
    roomsOccupied: roomsOccupied,
    roomStatus: rooms,
  });
});

server.listen(port, () => console.log(`Listening on port ${port}`));
