import React, { useState, useEffect } from "react";
import "./HistoryItem.css";

function Status(props) {
  const [statusName, setStatusName] = useState(props.statusName);
  const [infoName, setInfoName] = useState(props.infoName);
  const [statusBackgroundColor, setStatusBackgroundColor] = useState(
    props.color
  );

  useEffect(() => {}, []);

  return (
    <div
      className="statusContainer"
      style={{ backgroundColor: statusBackgroundColor }}
    >
      <span className="statusItem">{statusName}</span>
      <span className="infoItem">{infoName}</span>
    </div>
  );
}

export default Status;
