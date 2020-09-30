import React, { useState, useEffect } from "react";
import Square from "./Square/Square.js";
import socketMatchmaking from "../sockets/socketMatchmaking.js";
// import GameStatus from "./GameStatus.js";
import { useSelector, useDispatch } from "react-redux";
import {
  changeStatus,
  changeNextPlayerFigure,
  changeNextPlayerId,
  changePlayerId,
  leaveGame,
} from "../redux/action/gameStatus";
import { addGameHistory, resetGameHistory } from "../redux/action/gameHistory";
import { changeGame } from "../redux/action/gameRoom";
import { useHistory } from "react-router-dom";

//this needs to be here in order to get one socket for the whole component
let socketGameserver = null;

const Gameboard = (props) => {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [gameFigure, setGameFigure] = useState(null);
  // const [gameStatus, setGameStatus] = useState(null);
  // const [winnerGame, setWinnerGame] = useState(null);
  const [myPlayerID, setMyPlayerID] = useState();
  const [nextPlayer, setNextPlayer] = useState(null);
  const [playerOne, setPlayerOne] = useState(null);
  const [roomJoined, setRoomJoined] = useState(true);
  const [nextRoundButtonDisabled, setNextRoundButtonDisabled] = useState(true);
  const [leaveButtonDisabled, setLeaveButtonDisabled] = useState(false);
  const [myPlayerScore, setMyPlayerScore] = useState(0);
  const [enemyPlayerScore, setEnemyPlayerScore] = useState(0);
  const [myPlayerUnderline, setMyPlayerUnderline] = useState("none");
  const [enemyPlayerUnderline, setEnemyPlayerUnderline] = useState("none");

  const dispatch = useDispatch();
  const game = useSelector((state) => state.gameRoom);
  const gameStatus = useSelector((state) => state.gameStatus);
  //const nextPlayerState = useSelector((state) => state.nextPlayer);
  // const [socketGameserver, setSocketGameserver] = useState(null);

  const history = useHistory();

  const routeChangeLeaveGame = () => {
    let path = `/`;
    history.push(path);
  };

  var emitGameEvent = (event) => {
    // console.log("socket before using it");
    // console.log(socketGameserver);
    socketGameserver.emit("gameEvent", event);
  };

  useEffect(() => {
    console.log("GameRoom from redux: " + game);
    //console.log("Props from play: " + JSON.stringify(props, null, "\t"));
    console.log(props);

    setupGameServerSockets(props.socketGameserver);
    socketGameserver = props.socketGameserver;

    // if (game !== null) {
    //   console.log("Game data is not null");
    //   setupMatchmakingSockets();
    // }

    return () => {
      resetGameDataOnLeave();
      resetGameHistory();
    };
  }, [myPlayerID]);

  const setupGameServerSockets = (socketGameserver) => {
    socketGameserver.on("gameEvent", (data) => {
      console.log("Received game data from SOCKET: " + JSON.stringify(data));

      if (data.gameReset) {
        console.log("Game has been reset");
        setSquares(Array(9).fill(null));
        setNextPlayer(data.nextPlayer);
        addItemToGameHistory({
          status: "Game",
          info: "Game has been reset",
          color: "purple",
        });
      }

      if (data.gameFinished) {
        console.log("Game has finished");
        setNextPlayer(null);
        addItemToGameHistory({
          status: "Game",
          info: "Game has finished",
          color: "green",
        });
        setNextRoundButtonDisabled(false);
      }
    });

    socketGameserver.on("clientJoinedRoom", (data) => {
      if (data) {
        console.log("Getting my player id : " + data.socketId);

        setMyPlayerID(data.socketId);
        dispatch(changePlayerId(data.socketId));
        console.log("MyPlayerID : " + myPlayerID);
      }
    });

    socketGameserver.on("gameMove", (data) => {
      console.log("MyPlayerID : " + myPlayerID);
      if (data.gameMove) {
        console.log("Game move received");
        setMyPlayerUnderline(
          data.gameMove.nextPlayer == myPlayerID ? "underline" : "none"
        );
        setEnemyPlayerUnderline(
          data.gameMove.nextPlayer != myPlayerID ? "underline" : "none"
        );
        setSquares(data.gameMove.gameSquare);
        console.log(data.gameMove.gameSquare);
        console.log("Next Player: " + data.gameMove.nextPlayer);
        setNextPlayer(data.gameMove.nextPlayer);

        dispatch(
          changeNextPlayerFigure(nextPlayer === myPlayerID ? "Me" : "Enemy")
        );
        dispatch(changeNextPlayerId(data.gameMove.nextPlayer));

        console.log(
          "Figure movement in: " +
            JSON.stringify(data.gameMove.squareIndex, null, "\t")
        );
        addItemToGameHistory({
          status: "Player",
          info: "Player placed figure in square: " + data.gameMove.squareIndex,
          color: "yellow",
        });
      }
    });

    socketGameserver.on("gameSetup", (gameSetupData) => {
      console.log(
        "gameSetup data: " + JSON.stringify(gameSetupData, null, "\t")
      );
      setPlayerOne(gameSetupData.gameSetup.playerOne.player);
      // setPlayerTwo(gameSetupData.gameSetup.playerTwo);
      setNextPlayer(gameSetupData.gameSetup.nextPlayer);
      setGameFigure(
        myPlayerID == nextPlayer && myPlayerID == playerOne ? "X" : "O"
      );
      setSquares(Array(9).fill(null));

      setMyPlayerUnderline(
        gameSetupData.gameSetup.nextPlayer == myPlayerID ? "underline" : "none"
      );
      setEnemyPlayerUnderline(
        gameSetupData.gameSetup.nextPlayer != myPlayerID ? "underline" : "none"
      );

      console.log(
        "MyFigure: " + myPlayerID == nextPlayer && myPlayerID == playerOne
          ? "X"
          : "O"
      );
      console.log(
        "EnemyFigure: " + myPlayerID == nextPlayer && myPlayerID == playerOne
          ? "O"
          : "X"
      );

      setNextRoundButtonDisabled(true);

      dispatch(
        changeStatus({
          playerFigure:
            myPlayerID == nextPlayer && myPlayerID == playerOne ? "X" : "O",
          enemyFigure:
            myPlayerID == nextPlayer && myPlayerID == playerOne ? "O" : "X",
          playerID: myPlayerID,
          nextPlayer: gameSetupData.gameSetup.nextPlayer,
          nextPlayerFigure:
            gameSetupData.gameSetup.nextPlayer == myPlayerID ? "Me" : "Enemy",
          roomName: game.roomName,
          serverName: game.serverName,
        })
      );
    });

    socketGameserver.on("disconnect", () => {
      console.log("Client disconnected from GameServer");
      resetGameDataOnLeave();
      // TODO: clear gamehistory
    });

    socketGameserver.on("joinLeaveEvent", (data) => {
      console.log(
        "joinLeaveEvent triggered: " + JSON.stringify(data, null, "t")
      );
      setRoomJoined(data.roomJoined);
      if (data.roomJoined && !data.otherPlayerLeft) {
        addItemToGameHistory({
          status: "Player",
          info: "Player joined the room",
          color: "green",
        });
      }

      if (data.roomLeft) {
        addItemToGameHistory({
          status: "Player",
          info: "Player left the room",
          color: "red",
        });
      }

      if (data.otherPlayerLeft) {
        addItemToGameHistory({
          status: "Player",
          info: "Other player left the room",
          color: "orange",
        });
      }
      setMyPlayerScore(0);
      setEnemyPlayerScore(0);
    });

    socketGameserver.on("playerPoints", (data) => {
      console.log(
        "playerPoints has been received." + JSON.stringify(data, null, "\t")
      );
      console.log("MyPlayerID: " + myPlayerID);
      setMyPlayerScore(
        data.playerOneId == myPlayerID
          ? data.playerOnePoints
          : data.playerTwoPoints
      );
      setEnemyPlayerScore(
        data.playerOneId != myPlayerID
          ? data.playerOnePoints
          : data.playerTwoPoints
      );
    });

    socketGameserver.on("FromUserCount", (data) => {
      console.log("Clientslength: " + data.clientsLength);
    });

    socketGameserver.on("nextRoundGetsPlayed", (data) => {
      console.log("next round gets played");
      dispatch(resetGameHistory());
      addItemToGameHistory({
        status: "Game",
        info: "The next round started!",
        color: "blue",
      });
    });
  };

  let renderSquare = (i) => {
    return <Square value={squares[i]} onClick={() => handleClick(i)} />;
  };

  const handleClick = (i) => {
    console.log(
      "handleClick triggered. Game Figure: " +
        gameFigure +
        " nextPlayer: " +
        nextPlayer +
        " playerID: " +
        myPlayerID +
        " roomJoined: " +
        roomJoined
    );
    if (gameFigure && nextPlayer === myPlayerID && roomJoined) {
      console.log("player can click");
      const squares_ = squares.slice();
      if (squares_[i]) {
        console.log("squaare already clicked");
        return;
      }

      emitGameEvent({
        player: gameFigure,
        playerID: myPlayerID,
        squareClickedIn: i,
      });
    }
  };

  const leaveGameButtonHandler = () => {
    console.log("leaveGameButton clicked");
    resetGameDataOnLeave();
    routeChangeLeaveGame();
  };

  const nextRoundButtonHandler = () => {
    console.log("nextRoundButton clicked");

    socketGameserver.emit("playerReadyForNextRound", {
      playerWantsNextRound: true,
    });
  };

  const addItemToGameHistory = (historyItem) => {
    dispatch(addGameHistory(historyItem));
  };

  const resetGameDataOnLeave = () => {
    socketMatchmaking.removeAllListeners();
    if (socketGameserver !== null) socketGameserver.removeAllListeners();

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
  };

  return (
    <div className="game">
      <div className="gameBoardHeading">
        <h1>
          <span id="yourPlayer" style={{ textDecoration: myPlayerUnderline }}>
            You ({myPlayerScore})
          </span>
          <span> VS </span>
          <span
            id="enemyPlyer"
            style={{ textDecoration: enemyPlayerUnderline }}
          >
            Enemy ({enemyPlayerScore})
          </span>
        </h1>
      </div>
      <div className="gameBoard">
        <div className="board-row">
          {renderSquare(0)}
          {renderSquare(1)}
          {renderSquare(2)}
        </div>
        <div className="board-row">
          {renderSquare(3)}
          {renderSquare(4)}
          {renderSquare(5)}
        </div>
        <div className="board-row">
          {renderSquare(6)}
          {renderSquare(7)}
          {renderSquare(8)}
        </div>
      </div>
      <div className="gameBoardControl">
        <input
          id="gameBoardControlNextRound"
          type="button"
          value="Next Round"
          disabled={nextRoundButtonDisabled}
          onClick={nextRoundButtonHandler}
        />
        <input
          id="gameBoardControlLeaveGame"
          type="button"
          value="Leave Game"
          disabled={leaveButtonDisabled}
          onClick={leaveGameButtonHandler}
        />
      </div>
    </div>
  );
};

export default Gameboard;
