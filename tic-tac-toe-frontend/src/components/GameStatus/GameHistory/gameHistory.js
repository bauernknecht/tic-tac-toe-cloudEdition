import React, { useState, useEffect } from "react";
import HistoryItem from "./HistoryItem.js";
import { useSelector } from "react-redux";

function GameHistory(props) {
  const [historyList, setHistoryList] = useState([]);

  const gameHistory = useSelector((state) => state.gameHistory);

  useEffect(() => {
    setHistoryList(gameHistory.historyItems);
  }, [gameHistory]);

  const historyListMock = [
    {
      status: "Ready",
      info: "Player is ready",
      color: "red",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "blue",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "yellow",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "red",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "red",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "blue",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "yellow",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "red",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "red",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "blue",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "yellow",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "red",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "red",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "blue",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "yellow",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "red",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "red",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "blue",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "yellow",
    },
    {
      status: "Ready",
      info: "Player is ready",
      color: "red",
    },
  ];

  return (
    <div className="GameStatus">
      {historyList.map((item) => (
        <HistoryItem
          statusName={item.status}
          infoName={item.info}
          color={item.color}
        />
      ))}
    </div>
  );
}

export default GameHistory;
