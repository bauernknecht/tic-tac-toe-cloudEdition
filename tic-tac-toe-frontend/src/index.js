import "./web.config";
import React from "react";
import ReactDOM from "react-dom";
// import "./index.css";
import "./newIndex.css";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Play from "./components/Play/play";
import About from "./components/About/about";
import NavBar from "./components/NavBar/navBar";
import Header from "./components/Header/header";
import Home from "./components/Home/home";
import Lobby from "./components/Lobby/lobby";

import { useSelector } from "react-redux";

import { createStore } from "redux";
import allReducers from "./util/redux/allReducers";
import { Provider } from "react-redux";

const store = createStore(
  allReducers,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

const Game = (props) => {
  const game = useSelector((state) => state.gameRoom);

  return (
    <Router>
      <div>
        <Header />
        <NavBar />
        <Switch>
          <Route path="/" exact component={Home} />
          {game && <Route path="/play" exact component={Play} />}
          {/* <Route path="/leaderboard" exact component={Leaderboard} /> */}
          <Route path="/about" exact component={About} />
          <Route path="/lobby" exact component={Lobby} />
        </Switch>
        {/* <div className="game">
            <Gameboard />
            <div className="game-info"></div>
          </div> */}
      </div>
    </Router>
  );
};

// ========================================

ReactDOM.render(
  <Provider store={store}>
    <Game />
  </Provider>,
  document.getElementById("root")
);
