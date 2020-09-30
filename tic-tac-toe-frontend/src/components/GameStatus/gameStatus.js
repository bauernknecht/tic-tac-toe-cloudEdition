import React, { useState, useEffect } from "react";
import GameHistory from "./GameHistory/gameHistory";
import { useSelector, useDispatch } from "react-redux";
import "./gameStatus.css";

function GameStatus(props) {
  const [playerFigure, setPlayerFigure] = useState(null);
  const [enemyFigure, setEnemyFigure] = useState(null);
  const [nextPlayer, setNextPlayer] = useState(null);
  const [nextPlayerFigure, setNextPlayerFigure] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [serverName, setServerName] = useState(null);
  const [roomName, setRoomName] = useState(null);

  const status = useSelector((state) => state.gameStatus);
  const nextPlayerState = useSelector((state) => state.nextPlayer);

  useEffect(() => {
    if (status !== null) {
      setPlayerFigure(status.playerFigure);
      setEnemyFigure(status.enemyFigure);
      setPlayerId(status.playerID);
      setNextPlayer(status.nextPlayer);
      setNextPlayerFigure(
        status.nextPlayer == status.playerID ? "Me" : "Enemy"
      );
      setServerName(status.serverName);
      setRoomName(status.roomName);
    }
  }, [status]);

  return (
    <div className="GameStatus">
      <div className="gameStatusHeading">
        <h2>Game Status information</h2>
      </div>
      <div className="gameStatusInformation">
        <table>
          <tr>
            <td>Server name:</td>
            <td>{serverName}</td>
          </tr>
          <tr>
            <td>Room name:</td>
            <td>{roomName}</td>
          </tr>
          <tr>
            <td>Your figure:</td>
            <td>{playerFigure}</td>
          </tr>
          <tr>
            <td>Next Player:</td>
            <td>{nextPlayerFigure}</td>
          </tr>
        </table>
        {/* <span>Server name: {serverName}</span>
        <br />
        <span>Room name: {roomName}</span>
        <br />
        <span>Your figure is: {playerFigure}</span>
        <br />
        <span>Enemys figure is: {enemyFigure}</span>
        <br />
        <span>Player ID: {playerId}</span>
        <br />
        <span>Next Player ID: {nextPlayer}</span>
        <br />
        <span>Next Player Figure: {nextPlayerFigure}</span> */}
      </div>
      <div className="gameStatusHistory">
        <GameHistory />
      </div>
    </div>
  );
}

export default GameStatus;
