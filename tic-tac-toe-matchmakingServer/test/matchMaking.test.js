const io = require("socket.io-client");
const { expect } = require("chai");
const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const assert = require("chai").assert;
chai.use(require("chai-json"));
chai.use(chaiHttp);

describe("MatchMaking server tests", () => {
  // beforeEach(function (done) {
  //   // socket = io.connect("http://localhost:6013", {
  //   //   "reconnection delay": 0,
  //   //   "reopen delay": 0,
  //   //   "force new connection": true,
  //   // });
  //   // socket.on("connect", function () {
  //   //   console.log("worked...");
  //   //   done();
  //   // });
  //   // socket.on("disconnect", function () {
  //   //   console.log("disconnected...");
  //   // });
  // });

  // afterEach(function (done) {
  //   // Cleanup
  //   // if (socket.connected) {
  //   //   //   console.log("disconnecting...");
  //   //   socket.disconnect();
  //   // } else {
  //   //   // There will not be a connection unless you have done() in beforeEach, socket.on('connect'...)
  //   //   console.log("no connection to break...");
  //   // }
  //   setTimeout(() => {
  //     done();
  //   }, 1500);
  // });
  describe("connect to matchmaking server", () => {
    it("get Status from matchmaking server", (done) => {
      chai
        .request("localhost:6012")
        .get("/status")
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("status");
          res.body.should.have.property("listOfGameservers");
          res.body.should.have.property("listOfRooms");
          done();
        });
    });
    // currently not working due to errors establishing a mocked game server
    it("set up gameserver an watch for events", (done) => {
      //   socket.emit("getRoomStatus", "nothing");

      chai
        .request("localhost:7010")
        .post("/completeRegisterGameserver")
        .send({
          key: "registerKey",
          serverList: {
            serverName: "testServer",
            serverAddress: "testAddress",
            serverGamePort: 9090,
            serverStatusPort: 9095,
            gameRooms: ["TestRoom1", "TestRoom2", "TestRoom3", "TestRoom4"],
          },
        })
        .end((err, res) => {
          res.should.have.status(200);
          // console.log(res.body);

          chai
            .request("localhost:6012")
            .get("/status")
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.have.property("status").that.is.a("string").and
                .not.null.and.not.empty;
              res.body.should.have
                .property("listOfGameservers")
                .that.is.a("array").and.not.null;
              res.body.should.have.property("listOfRooms").that.is.a("array")
                .and.not.null;
              done();
            });
        });
    });
  });
});
