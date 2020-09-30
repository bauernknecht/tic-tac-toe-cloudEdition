import React, { useState, useEffect } from "react";
import "./RoomListItem.css";
import { useDispatch } from "react-redux";
import { changeGame } from "../../redux/action/gameRoom";
import { Link } from "react-router-dom";
import socketMatchmaking from "../../sockets/socketMatchmaking";

function RoomListItem(props) {
  // { roomStatus: "free", roomPlayer: "0", roomSize: "2" },
  const [serverName, setServerName] = useState(props.serverName);
  const [roomName, setRoomName] = useState(props.roomName);
  const [roomStatus, setRoomStatus] = useState(props.roomStatus);
  const [roomPlayer, setRoomPlayer] = useState(props.roomPlayer);
  const [roomSize, setRoomSize] = useState(props.roomSize);
  const [roomStatusColor, setRoomStatusColor] = useState();
  const dispatch = useDispatch();

  useEffect(() => {
    if (roomStatus == "playing") {
      setRoomStatusColor("orangered");
    } else if (roomStatus == "waiting for player") {
      setRoomStatusColor("yellow");
    } else {
      setRoomStatusColor("yellowgreen");
    }

    return () => {
      socketMatchmaking.removeAllListeners("clientJointRoomData");
      console.log("cleanup");
    };
  }, []);

  const onClickHandler = () => {
    console.log(
      "Clicked on RoomListItem: " +
        serverName +
        " " +
        roomName +
        " " +
        roomStatus
    );

    dispatch(
      changeGame({
        serverName: serverName,
        serverAdress: "data.serverAdress",
        roomName: roomName,
        player: roomStatus,
      })
    );
  };

  return (
    <Link key={serverName + roomName} to="/play" onClick={onClickHandler}>
      <div
        className="RoomListItem"
        //   style={{ backgroundColor: statusBackgroundColor }}
      >
        <span
          className="roomStatusColor"
          style={{ backgroundColor: roomStatusColor }}
        ></span>
        <span className="roomNameAndServer">
          Server: {serverName} Name: {roomName}
        </span>
        <span className="roomStatus"> Status: {roomStatus}</span>
        <span className="roomPlayer">Current Players: {roomPlayer}</span>
        {/* <span className="roomSize">Roomsize: {roomSize}</span> */}
      </div>
    </Link>
  );
}

export default RoomListItem;
