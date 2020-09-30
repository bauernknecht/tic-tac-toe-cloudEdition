import React, { useState, useEffect } from "react";
import RoomListItem from "./RoomListItem/RoomListItem.js";

function RoomList(props) {
  const [roomList, setRoomList] = useState(props.roomList);

  useEffect(() => {
    setRoomList(props.roomList);
    // setRoomList([
    //   { roomStatus: "free", roomPlayer: "0", roomSize: "2" },
    //   { roomStatus: "playing", roomPlayer: "2", roomSize: "2" },
    // ]);
  }, [props]);

  return (
    <div className="RoomList">
      {roomList.map((item) => (
        <RoomListItem
          key={
            item.serverName + item.roomName + item.roomStatus + item.roomPlayer
          }
          serverName={item.serverName}
          roomName={item.roomName}
          roomStatus={item.roomStatus}
          roomPlayer={item.roomPlayer}
          roomSize={item.roomSize}
        />
      ))}
    </div>
  );
}

export default RoomList;
