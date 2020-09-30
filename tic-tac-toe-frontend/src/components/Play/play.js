import React, { useState, useEffect } from "react";
import Gameboard from "../../util/GameBoard/Gameboard";
import GameStatus from "../GameStatus/gameStatus";
import "./play.css";
import socketMatchmaking from "../../util/sockets/socketMatchmaking.js";
import socketIOClient from "socket.io-client";
import { useSelector, useDispatch } from "react-redux";
import { leaveGame } from "../../util/redux/action/gameStatus";
import { changeGame } from "../../util/redux/action/gameRoom";
import { resetGameHistory } from "../../util/redux/action/gameHistory";

let socketGameserver = null;

const Play = (props) => {
  const game = useSelector((state) => state.gameRoom);
  const [socketAvailable, setSocketAvailable] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (game !== null) {
      console.log("Game data is not null");
      setupMatchmakingSockets();
    }
    return () => {
      console.log("play got dismountet");
      resetGameDataOnLeave();
      dispatch(resetGameHistory({ something: "somethings" }));
    };
  }, []);

  const resetGameDataOnLeave = () => {
    socketMatchmaking.removeAllListeners();
    if (socketGameserver !== null) {
      socketGameserver.removeAllListeners();
      socketGameserver.close();
      socketGameserver = null;
      console.log("socket got reset");
    }

    //resetting the global state when user leaves the game
    dispatch(
      changeGame({
        serverName: null,
        serverAdress: null,
        roomName: null,
        player: null,
      })
    );

    dispatch(
      leaveGame({
        playerFigure: null,
        enemyFigure: null,
        playerID: null,
        nextPlayer: null,
        roomName: null,
        serverName: null,
      })
    );
    console.log("game data got reset");
  };

  const setupMatchmakingSockets = () => {
    socketMatchmaking.emit("getRoomData", {
      serverName: game.serverName,
      roomName: game.roomName,
    });

    socketMatchmaking.on("clientJoinRoomData", (data) => {
      console.log("Received room data: " + JSON.stringify(data, null, "\t"));
      //join the room on the gameserver -> create a socket with the gameserver
      if (socketGameserver == null) {
        console.log("RoomName: " + data.roomName);
        console.log("ServerAddress: " + data.serverAddress);
        createGameServerSocket(data.serverAddress, data.roomName);
        // console.log("socket after setting it" + socketGameserver);
      }
      // console.log("socket after setting it" + socketGameserver);

      socketGameserver.emit("room", data.roomName);
      //setupGameServerSockets(socketGameserver);
    });
  };

  const createGameServerSocket = (adress, roomName) => {
    if (adress !== null && roomName !== null) {
      socketGameserver = new socketIOClient(adress, {
        reconnection: false,
        query: "roomName=" + roomName,
        // query: "roomName=testtest",
      });
      setSocketAvailable(true);
      console.log("socket directly after creating it.");
      console.log(socketGameserver);
      //dispatch(setGameServerSocket(socketGameserver));
    }
  };

  return (
    <div>
      <div className="mainPageForPlay">
        <div className="gamePage">
          <div className="gameInformation">
            <div className="gameInformationContent">
              <h1>How to play</h1>
              <span>Wait for the enemy to connect</span>
              <br />
              <span>Make your move</span>
              <br />
              <span>???</span>
              <br />
              <span>Win!</span>
            </div>
          </div>
          <div className="gameArea">
            {socketAvailable && (
              <Gameboard socketGameserver={socketGameserver} />
            )}
          </div>
        </div>
        <div className="gameInformationPage">
          <GameStatus socketGameserver={socketGameserver}></GameStatus>
        </div>
      </div>
    </div>
  );
};

export default Play;
