import React, { useState, useEffect } from "react";
import "./lobby.css";
import RoomList from "../../util/RoomList/RoomList";
import socketMatchmaking from "../../util/sockets/socketMatchmaking";

function Lobby() {
  const [roomList, setRoomList] = useState([]);

  useEffect(() => {
    getRoomStatusFromMatchmaking();

    socketMatchmaking.on("roomStatus", (data) => {
      console.log("Received roomStatus: " + JSON.stringify(data, null, "\t"));
      let tempRoomList = [];

      data.forEach((server) => {
        server.serverGame.forEach((room) => {
          tempRoomList.push({
            serverName: server.serverName,
            roomName: room.roomName,
            roomStatus: room.game.gameStatus,
            roomPlayer: room.game.playerCount,
          });
        });
      });

      setRoomList(tempRoomList);
    });
    return () => {
      socketMatchmaking.removeAllListeners();
    };
  }, []);

  const getRoomStatusFromMatchmaking = () => {
    console.log("Emiiting getRoomStatus");
    socketMatchmaking.emit("getRoomStatus");
  };
  return (
    <div class="lobby">
      <RoomList roomList={roomList} />
    </div>
  );
}

export default Lobby;
