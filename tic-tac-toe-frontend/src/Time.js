import React, { useState, useEffect } from "react";
import socketIOClient from "socket.io-client";
const ENDPOINT = "http://127.0.0.1:4001";
let socket = null;

export default function Time() {
  const [response, setResponse] = useState("");
  const [clientLength, setClientLength] = useState("");

  useEffect(() => {
    socket = socketIOClient(ENDPOINT);
    socket.on("FromAPI", (data) => {
      setResponse(data);
    });

    socket.on("FromUserCount", (data) => {
      setClientLength(data);
      console.log(data + " Users connected");
    });

    socket.on("connect", function () {
      socket.emit("room", "test room");
    });

    socket.on("message", function (data) {
      console.log("Incoming message:", data);
    });

    // socket.on("created", function (room, clientId) {
    //   console.log("Created room", room, "- my client ID is", clientId);
    // });

    // socket.on("joined", function (room, clientId) {
    //   console.log(
    //     "This peer has joined room",
    //     room,
    //     "with client ID",
    //     clientId
    //   );
    // });

    // socket.on("full", function (room) {
    //   alert('Room "' + room + '" is full. We will create a new room for you.');
    //   //window.location.hash = "";
    //   //window.location.reload();
    // });
  }, []);

  return (
    <div>
      <p>
        It's <time dateTime={response}>{response}</time>
      </p>
      <p>There are {clientLength} Users connected</p>
    </div>
  );
}
