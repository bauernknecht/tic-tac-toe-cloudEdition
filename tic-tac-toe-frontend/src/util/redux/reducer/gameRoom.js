const gameRoomReducer = (state = null, action) => {
  switch (action.type) {
    case "CHANGE_GAME":
      return {
        serverName: action.payload.serverName,
        serverAdress: action.payload.serverAdress,
        roomName: action.payload.roomName,
        player: action.payload.player,
      };
    default:
      return state;
  }
};
export default gameRoomReducer;
