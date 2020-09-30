import socketIOClient from "socket.io-client";
const ENDPOINT_Matchmaking = "http://localhost:6013";

const socketMatchmaking = socketIOClient(ENDPOINT_Matchmaking);

export default socketMatchmaking;
