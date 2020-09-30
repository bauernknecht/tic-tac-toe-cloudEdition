import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useHistory } from "react-router";
import { useDispatch } from "react-redux";
import { changeGame } from "../../util/redux/action/gameRoom";
import "./home.css";

function Home(props) {
  const dispatch = useDispatch();
  const history = useHistory();

  const handleMatchmakingButtonOnClick = () => {
    console.log("player clicked matchmaking button");

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };
    fetch("http://51.116.115.199:6012/getRandomMatch", requestOptions)
      .catch((error) => {
        console.log(error);
        return;
      })
      .then((response) => response.json())
      .then((data) => redirectToPlay(data));
  };

  const redirectToPlay = (serverData) => {
    console.log("redirecting to play page");
    console.log(serverData);
    dispatch(
      changeGame({
        serverName: serverData.serverName,
        serverAdress: "data.serverAdress",
        roomName: serverData.roomName,
        player: "something",
      })
    );
    history.push("/play");
  };

  return (
    <div class="mainPage">
      <div className="playGameButtons">
        <div class="joinLobby">
          <div className="joinLobbyTextContent">
            <h2>See all available lobbies!</h2>
            <span>Click to choose an existing lobby to join</span>
          </div>
          <br />
          <div className="joinLobbyLinkDiv">
            <Link to="/lobby">
              <input
                id="viewLobbiesButton"
                type="button"
                value="See all lobbies"
              />
            </Link>
          </div>
        </div>
        <div class="joinMatchmaking">
          <div className="joinMatchmakingTextContent">
            <h2>Join the Matchmaking!</h2>
            <span>Simply press the button and get thrown into a match!</span>
          </div>
          <br />
          <div className="joinMatchmakingLinkDiv">
            <Link onClick={handleMatchmakingButtonOnClick}>
              <input
                id="joinMatchmakingButton"
                type="button"
                value="Join matchmaking"
              />
            </Link>
          </div>
        </div>
      </div>
      <div class="centerContent">
        <div class="generalInformation">
          <h1>Welcome to the Tic-Tac-Toe CloudEdition</h1>
          <span>
            To play a game, simply press one of the buttons on the right. You
            can choose between just joining a random match via the '
            <span className="strongText">Join matchmaking</span>' button, or you
            can select your own game via the '
            <span className="strongText">See all lobbies</span>' button.
          </span>
        </div>
      </div>
      {/* <div class="lastGamesPage">
        <span>lastGamesPage</span>
      </div> */}
    </div>
  );
}

export default Home;
