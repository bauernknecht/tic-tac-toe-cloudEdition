const io = require("socket.io-client");
const { expect } = require("chai");
const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const assert = require("chai").assert;
chai.use(require("chai-json"));
chai.use(chaiHttp);

describe("MatchMaking server tests", () => {
  beforeEach(function (done) {
    socket = io.connect("http://localhost:6013", {
      "reconnection delay": 0,
      "reopen delay": 0,
      "force new connection": true,
    });
    socket.on("connect", function () {
      console.log("worked...");
      done();
    });
    socket.on("disconnect", function () {
      console.log("disconnected...");
    });
  });

  afterEach(function (done) {
    // Cleanup
    if (socket.connected) {
      //   console.log("disconnecting...");
      socket.disconnect();
    } else {
      // There will not be a connection unless you have done() in beforeEach, socket.on('connect'...)
      console.log("no connection to break...");
    }
    if (socket.connected) {
      //   console.log("disconnecting...");
      socket.disconnect();
    } else {
      // There will not be a connection unless you have done() in beforeEach, socket.on('connect'...)
      console.log("no connection to break...");
    }
    setTimeout(() => {
      done();
    }, 1500);
  });
  describe("connect to matchmaking server", () => {
    it("get RoomStatus from Matchmaking-Server", (done) => {
      //   socket.emit("getRoomStatus", "nothing");

      let roomName;

      socket.on("roomStatus", (roomStatus) => {
        console.log(roomStatus[0].serverGame[0]);
        // done();
        roomName = roomStatus[0].serverGame[0].roomName;
      });

      socket.emit("getRoomData", roomName);

      socket.on("clientJoinRoomData", (roomStatus) => {
        console.log(roomStatus);
        done();
      });
    });
  });
});
