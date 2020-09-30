import socketIOClient from "socket.io-client";
const ENDPOINT_Gameserver = "http://127.0.0.1:50252";

const socket = socketIOClient(ENDPOINT_Gameserver);

export default socket;
