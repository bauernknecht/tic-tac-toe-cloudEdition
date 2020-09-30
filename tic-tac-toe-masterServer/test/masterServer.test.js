const { expect } = require("chai");
const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const assert = require("chai").assert;
chai.use(require("chai-json"));
chai.use(chaiHttp);

describe("MasterServer general tests", () => {
  it("get serverlist without any servers", (done) => {
    chai
      .request("localhost:7010")
      .get("/serverlist")
      .end((err, res) => {
        res.should.have.status(200);
        // console.log(res.text);
        res.text.should.be.a("string");
        assert.equal(res.text, "Here is the serverlist!: []");
        done();
      });
  });
  it("get root without success", (done) => {
    chai
      .request("localhost:7010")
      .get("/")
      .end((err, res) => {
        res.should.have.status(404);
        done();
      });
  });
});
describe("GameServer registration tests", () => {
  it("get gameServer registration data", (done) => {
    chai
      .request("localhost:7010")
      .post("/registerGameserver")
      .send({
        key: "secretGameserverRegKey",
      })
      .end((err, res) => {
        res.should.have.status(200);
        // console.log(res.body);
        res.body.should.have.property("response");
        res.body.should.have.property("serverName");
        res.body.should.have.property("serverAddress");
        res.body.should.have.property("roomSize");
        res.body.should.have.property("roomNames");

        res.body.should.have
          .property("response")
          .eql("GameServer authenticated");
        res.body.should.have.property("serverAddress").eql("127.0.0.1");

        // console.log(res.body.should.have.property("serverName"));
        res.body.should.have.property("serverName").that.is.a("string").and.not
          .null.and.not.empty;
        res.body.should.have.property("serverAddress").that.is.a("string").and
          .not.null.and.not.empty;
        res.body.should.have.property("roomSize").that.is.a("number").and.not
          .null;
        expect(JSON.parse(res.body.roomNames))
          .to.be.an("array")
          .to.have.lengthOf(res.body.roomSize);
        // res.body.should.have.property("roomNames").that.is.a("array").and.not
        //   .null.and.not.empty;
        done();
      });
  });
  it("wrongfully get gameServer registration data", (done) => {
    chai
      .request("localhost:7010")
      .post("/registerGameserver")
      .send({
        key: "wrongKey",
      })
      .end((err, res) => {
        res.should.have.status(200);
        // console.log(res.body);
        expect(res.body).to.be.an("object").to.deep.equal({
          response: "GameServer could not be authenticated",
        });
        done();
      });
  });
  it("register gameServer on masterServer", (done) => {
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
        done();
      });
  });
  it("get gameServerNames from masterServer", (done) => {
    chai
      .request("localhost:7010")
      .post("/getGameserverNames")
      .end((err, res) => {
        res.should.have.status(200);
        // console.log(res.text);
        res.body.should.be.a("object");
        res.body.should.have.property("gameServerNames").that.is.a("array").and
          .not.null.and.not.empty;
        expect(res.body.gameServerNames)
          .to.be.an("array")
          .to.deep.equal(["testServer"]);
        done();
      });
  });
  it("get gameServerData from masterServer", (done) => {
    chai
      .request("localhost:7010")
      .post("/getGameServerData")
      .send({
        serverName: "testServer",
      })
      .end((err, res) => {
        res.should.have.status(200);
        // console.log(res.text);
        expect(JSON.parse(res.body))
          .to.be.an("object")
          .to.deep.equal({
            serverName: "testServer",
            serverAddress: "testAddress",
            serverGamePort: 9090,
            serverStatusPort: 9095,
            gameRooms: ["TestRoom1", "TestRoom2", "TestRoom3", "TestRoom4"],
          });
        done();
      });
  });
  it("checkGameserver to check that its not alive", (done) => {
    chai
      .request("localhost:7010")
      .post("/checkGameserver")
      .send({
        serverAddress: "testAddress",
      })
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.be.a("object");
        res.body.should.have.property("response").that.is.a("string").and.not
          .null.and.not.empty;
        expect(res.body.response)
          .to.be.an("string")
          .to.deep.equal("GameServer not alive");
        done();
      });
  });
  it("get serverlist without any servers", (done) => {
    chai
      .request("localhost:7010")
      .get("/serverlist")
      .end((err, res) => {
        res.should.have.status(200);
        // console.log(res.text);
        res.text.should.be.a("string");
        assert.equal(res.text, "Here is the serverlist!: []");
        done();
      });
  });
});
describe("MatchMaking Server registration tests", () => {
  it("register as matchmaking server", (done) => {
    chai
      .request("localhost:7010")
      .post("/registerMatchmakingServer")
      .send({
        key: "registerMatchmakingKey",
      })
      .end((err, res) => {
        res.should.have.status(200);
        // console.log(res.body);
        res.body.should.have.property("response");
        res.body.should.have.property("serverName");
        res.body.should.have.property("serverAddress");
        res.body.should.have.property("serverList");

        res.body.should.have
          .property("response")
          .eql("MatchmakingServer authenticated");
        res.body.should.have.property("serverAddress").eql("127.0.0.1");

        // console.log(res.body.should.have.property("serverName"));
        res.body.should.have.property("serverName").that.is.a("string").and.not
          .null.and.not.empty;
        res.body.should.have.property("serverAddress").that.is.a("string").and
          .not.null.and.not.empty;
        expect(res.body.serverList).to.be.an("array").to.have.lengthOf(0);
        done();
      });
  });
  it("register wrongfully as matchmaking server", (done) => {
    chai
      .request("localhost:7010")
      .post("/registerMatchmakingServer")
      .send({
        key: "wrongKey",
      })
      .end((err, res) => {
        res.should.have.status(200);
        // console.log(res.body);
        expect(res.body).to.be.an("object").to.deep.equal({
          response: "MatchmakingServer could not be authenticated",
        });
        done();
      });
  });
  it("register gameserver on masterserver for matchmaking serverlist", (done) => {
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
        done();
      });
  });
  it("register as matchmaking server with filled serverlist", (done) => {
    chai
      .request("localhost:7010")
      .post("/registerMatchmakingServer")
      .send({
        key: "registerMatchmakingKey",
      })
      .end((err, res) => {
        res.should.have.status(200);
        // console.log(res.body);
        res.body.should.have.property("response");
        res.body.should.have.property("serverName");
        res.body.should.have.property("serverAddress");
        res.body.should.have.property("serverList");

        res.body.should.have
          .property("response")
          .eql("MatchmakingServer authenticated");
        res.body.should.have.property("serverAddress").eql("127.0.0.1");

        // console.log(res.body.should.have.property("serverName"));
        res.body.should.have.property("serverName").that.is.a("string").and.not
          .null.and.not.empty;
        res.body.should.have.property("serverAddress").that.is.a("string").and
          .not.null.and.not.empty;
        expect(res.body.serverList).to.be.an("array").to.have.lengthOf(1);
        done();
      });
  });
});
