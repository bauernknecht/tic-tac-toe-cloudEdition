import React, { useState, useEffect } from "react";
import "./navBar.css";
import socketIOClient from "socket.io-client";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { leaveGame } from "../../util/redux/action/gameStatus";
import { changeGame } from "../../util/redux/action/gameRoom";

function NavBar() {
  const gameServerSocket = useSelector((state) => state.gameServerSocketGlobal);

  const dispatch = useDispatch();
  const navBarOnClickHandler = () => {
    //gameServerSocket.removeAllListeners();
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
    <div class="navBar">
      <div>
        <ul class="navBarElementGroup">
          <Link to="/" onClick={navBarOnClickHandler}>
            <li>Home</li>
          </Link>
          {/* <Link to="/play" onClick={navBarOnClickHandler}>
            <li>Play</li>
          </Link> */}
          {/* <Link to="/leaderboard" onClick={navBarOnClickHandler}>
            <li>Leaderboard</li>
          </Link> */}
          <Link to="/about" onClick={navBarOnClickHandler}>
            <li>About</li>
          </Link>
        </ul>
      </div>
    </div>
  );
}

export default NavBar;
