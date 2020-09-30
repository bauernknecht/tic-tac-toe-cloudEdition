const io = require("socket.io-client");
const { expect } = require("chai");
const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const assert = require("chai").assert;
chai.use(require("chai-json"));
chai.use(chaiHttp);

describe("Suite of unit tests", function () {
  let socketOne;
  let socketTwo;
  let roomName;
  let socketTwoClosed = false;

  const getServerName = (doneCall) => {
    chai
      .request("localhost:7010")
      .post("/getGameserverNames")
      .end((err, res) => {
        //   console.log(res.body.gameServerNames[0]);
        getRoomName(res.body.gameServerNames[0], doneCall);
      });
  };

  const getRoomName = (serverName, doneCall) => {
    chai
      .request("localhost:7010")
      .post("/getGameServerData")
      .send({
        serverName: serverName,
      })
      .end((err, res) => {
        // console.log("serverData");
        // console.log(res.body);
        roomName = JSON.parse(res.body).gameRooms[0];
        // console.log(roomName);
        setupGameServerSocket(doneCall);
      });
  };

  const setupGameServerSocket = (done) => {
    socketOne = io.connect("http://localhost:5032", {
      "reconnection delay": 0,
      "reopen delay": 0,
      "force new connection": true,
      query: "roomName=" + roomName,
    });
    socketOne.on("connect", function () {
      //   console.log("worked...");
      //   done();
    });
    socketOne.on("disconnect", function () {
      //   console.log("disconnected...");
    });

    socketTwo = io.connect("http://localhost:5032", {
      "reconnection delay": 0,
      "reopen delay": 0,
      "force new connection": true,
      query: "roomName=" + roomName,
    });
    socketTwo.on("connect", function () {
      //   console.log("worked...");
      done();
    });
    socketTwo.on("disconnect", function () {
      //   console.log("disconnected...");
    });
  };

  beforeEach(function (done) {
    getServerName(done);
    // Setup
  });

  afterEach(function (done) {
    // Cleanup
    if (socketOne.connected) {
      //   console.log("disconnecting...");
      socketOne.disconnect();
    } else {
      // There will not be a connection unless you have done() in beforeEach, socket.on('connect'...)
      console.log("no connection to break...");
    }
    if (socketTwo.connected) {
      //   console.log("disconnecting...");
      socketTwo.disconnect();
    } else {
      // There will not be a connection unless you have done() in beforeEach, socket.on('connect'...)
      console.log("no connection to break...");
    }
    setTimeout(() => {
      done();
    }, 1500);
  });

  describe("GameServer tests", function () {
    it("Joining GameServer room", function (done) {
      let socketOneId;
      let socketTwoId;
      socketOne.emit("room", roomName);

      socketOne.on("clientJoinedRoom", (data) => {
        expect(data.socketId).to.be.a("string").to.be.not.null;
        socketOneId = data.socketId;
        // console.log(data);
      });

      socketOne.on("joinLeaveEvent", (data) => {
        expect(data.roomJoined).to.be.a("boolean").to.be.equal(true);
        expect(data.roomName).to.be.a("string").to.be.equal(roomName);
        // console.log(data);
      });

      socketTwo.emit("room", roomName);

      socketTwo.on("clientJoinedRoom", (data) => {
        expect(data.socketId).to.be.a("string").to.be.not.null;
        socketTwoId = data.socketId;
        // console.log(data);
      });

      socketTwo.on("joinLeaveEvent", (data) => {
        expect(data.roomJoined).to.be.a("boolean").to.be.equal(true);
        expect(data.roomName).to.be.a("string").to.be.equal(roomName);
        // console.log(data);
        done();
      });
    });

    it("Validating game setup", function (done) {
      let socketOneId;
      let socketTwoId;
      socketOne.emit("room", roomName);

      socketOne.on("clientJoinedRoom", (data) => {
        expect(data.socketId).to.be.a("string").to.be.not.null;
        socketOneId = data.socketId;
        // console.log(data);
      });

      socketOne.on("joinLeaveEvent", (data) => {
        expect(data.roomJoined).to.be.a("boolean").to.be.equal(true);
        expect(data.roomName).to.be.a("string").to.be.equal(roomName);
        // console.log(data);
      });

      socketTwo.emit("room", roomName);

      socketTwo.on("clientJoinedRoom", (data) => {
        expect(data.socketId).to.be.a("string").to.be.not.null;
        socketTwoId = data.socketId;
        // console.log(data);
      });

      socketTwo.on("joinLeaveEvent", (data) => {
        expect(data.roomJoined).to.be.a("boolean").to.be.equal(true);
        expect(data.roomName).to.be.a("string").to.be.equal(roomName);
        // console.log(data);
        done();
      });
      socketOne.on("gameSetup", (data) => {
        expect(data.gameSetup.playerOne).to.be.a("string").to.not.be.null;
        expect(data.gameSetup.playerTwo).to.be.a("string").to.not.be.null;
        expect(data.gameSetup.nextPlayer).to.be.a("string").to.not.be.null;
      });
      socketTwo.on("gameSetup", (data) => {
        expect(data.gameSetup.playerOne).to.be.a("string").to.not.be.null;
        expect(data.gameSetup.playerTwo).to.be.a("string").to.not.be.null;
        expect(data.gameSetup.nextPlayer).to.be.a("string").to.not.be.null;
      });
    });
    it("Making a game move", (done) => {
      let socketOneId;
      let socketTwoId;
      socketOne.emit("room", roomName);

      socketOne.on("clientJoinedRoom", (data) => {
        expect(data.socketId).to.be.a("string").to.be.not.null;
        socketOneId = data.socketId;
        // console.log(data);
      });

      socketTwo.emit("room", roomName);

      socketTwo.on("clientJoinedRoom", (data) => {
        expect(data.socketId).to.be.a("string").to.be.not.null;
        socketTwoId = data.socketId;
        // console.log(data);
      });

      socketOne.on("gameSetup", (data) => {
        expect(data.gameSetup.playerOne).to.be.a("string").to.not.be.null;
        expect(data.gameSetup.playerTwo).to.be.a("string").to.not.be.null;
        expect(data.gameSetup.nextPlayer).to.be.a("string").to.not.be.null;

        if (socketOneId == data.gameSetup.nextPlayer) {
          socketOne.emit("gameEvent", {
            player: "something",
            playerID: socketOneId,
            squareClickedIn: 1,
          });
        }
      });
      socketTwo.on("gameSetup", (data) => {
        expect(data.gameSetup.playerOne).to.be.a("string").to.not.be.null;
        expect(data.gameSetup.playerTwo).to.be.a("string").to.not.be.null;
        expect(data.gameSetup.nextPlayer).to.be.a("string").to.not.be.null;

        if (socketTwoId == data.gameSetup.nextPlayer) {
          socketTwo.emit("gameEvent", {
            player: "something",
            playerID: socketTwoId,
            squareClickedIn: 2,
          });
        }
      });

      socketOne.on("gameMove", (data) => {
        expect(data.gameMove.gameSquare).to.be.a("array").to.not.be.null;
        expect(data.gameMove.squareIndex).to.be.a("number").to.not.be.null;
        expect(data.gameMove.nextPlayer).to.be.a("string").to.not.be.null;
        expect(data.gameMove.nextPlayerFigure).to.be.a("string").to.not.be.null;
      });
      socketTwo.on("gameMove", (data) => {
        expect(data.gameMove.gameSquare).to.be.a("array").to.not.be.null;
        expect(data.gameMove.squareIndex).to.be.a("number").to.not.be.null;
        expect(data.gameMove.nextPlayer).to.be.a("string").to.not.be.null;
        expect(data.gameMove.nextPlayerFigure).to.be.a("string").to.not.be.null;
        console.log(data.gameMove.gameSquare);
        done();
      });
    });
    //This test currently does not work, because somehow the game move does not get sent
    // it("Making a game move and player two exits", (done) => {
    //   let socketOneId;
    //   let socketTwoId;
    //   socketOne.emit("room", roomName);

    //   socketOne.on("clientJoinedRoom", (data) => {
    //     expect(data.socketId).to.be.a("string").to.be.not.null;
    //     socketOneId = data.socketId;
    //     // console.log(data);
    //   });

    //   socketTwo.emit("room", roomName);

    //   socketTwo.on("clientJoinedRoom", (data) => {
    //     expect(data.socketId).to.be.a("string").to.be.not.null;
    //     socketTwoId = data.socketId;
    //     // console.log(data);
    //   });

    //   socketOne.on("gameSetup", (data) => {
    //     expect(data.gameSetup.playerOne).to.be.a("string").to.not.be.null;
    //     expect(data.gameSetup.playerTwo).to.be.a("string").to.not.be.null;
    //     expect(data.gameSetup.nextPlayer).to.be.a("string").to.not.be.null;

    //     if (socketOneId == data.gameSetup.nextPlayer) {
    //       socketOne.emit("gameEvent", {
    //         player: "something",
    //         playerID: socketOneId,
    //         squareClickedIn: 1,
    //       });
    //     }
    //   });
    //   socketTwo.on("gameSetup", (data) => {
    //     expect(data.gameSetup.playerOne).to.be.a("string").to.not.be.null;
    //     expect(data.gameSetup.playerTwo).to.be.a("string").to.not.be.null;
    //     expect(data.gameSetup.nextPlayer).to.be.a("string").to.not.be.null;

    //     if (socketTwoId == data.gameSetup.nextPlayer) {
    //       socketTwo.emit("gameEvent", {
    //         player: "something",
    //         playerID: socketTwoId,
    //         squareClickedIn: 2,
    //       });
    //     }
    //   });

    //   socketOne.on("joinLeaveEvent", (data) => {
    //     console.log(data);
    //     expect(data.roomJoined).to.be.a("boolean").to.be.equal(true);

    //     if (data.otherPlayerLeft != undefined) {
    //       expect(data.otherPlayerLeft).to.be.a("boolean").to.be.equal(true);
    //       done();
    //     }
    //   });

    //   socketOne.on("gameMove", (data) => {
    //     console.log("gameMoveData");
    //     console.log(data);
    //     expect(data.gameMove.gameSquare).to.be.a("array").to.not.be.null;
    //     expect(data.gameMove.squareIndex).to.be.a("number").to.not.be.null;
    //     expect(data.gameMove.nextPlayer).to.be.a("string").to.not.be.null;
    //     expect(data.gameMove.nextPlayerFigure).to.be.a("string").to.not.be.null;
    //     console.log("game move one");
    //     try {
    //       socketTwo.disconnect();
    //     } catch (error) {
    //       console.log("socketTwo already disconnected");
    //     }
    //   });
    //   socketTwo.on("gameMove", (data) => {
    //     expect(data.gameMove.gameSquare).to.be.a("array").to.not.be.null;
    //     expect(data.gameMove.squareIndex).to.be.a("number").to.not.be.null;
    //     expect(data.gameMove.nextPlayer).to.be.a("string").to.not.be.null;
    //     expect(data.gameMove.nextPlayerFigure).to.be.a("string").to.not.be.null;
    //     console.log("game move two");
    //     console.log(data.gameMove.gameSquare);

    //     try {
    //       socketTwo.disconnect();
    //     } catch (error) {
    //       console.log("socketTwo already disconnected");
    //     }
    //   });
    // });
  });
});
