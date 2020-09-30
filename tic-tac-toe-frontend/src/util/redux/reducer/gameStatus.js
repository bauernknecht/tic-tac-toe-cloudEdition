const gameStatusReducer = (state = null, action) => {
  switch (action.type) {
    case "CHANGE_STATUS":
      return {
        playerFigure: action.payload.playerFigure,
        enemyFigure: action.payload.enemyFigure,
        playerID: state.playerID,
        nextPlayer: action.payload.nextPlayer,
        nextPlayerFigure: action.payload.nextPlayerFigure,
        roomName: action.payload.roomName,
        serverName: action.payload.serverName,
      };
    case "LEAVE_GAME":
      return {
        playerFigure: null,
        enemyFigure: null,
        playerID: null,
        nextPlayer: null,
        nextPlayerFigure: null,
        roomName: null,
        serverName: null,
      };
    case "CHANGE_NEXT_PLAYER_FIGURE":
      return {
        playerFigure: state.playerFigure,
        enemyFigure: state.enemyFigure,
        playerID: state.playerID,
        nextPlayer: state.nextPlayer,
        nextPlayerFigure: action.payload,
        roomName: state.roomName,
        serverName: state.serverName,
      };
    case "CHANGE_NEXT_PLAYER_ID":
      return {
        playerFigure: state.playerFigure,
        enemyFigure: state.enemyFigure,
        playerID: state.playerID,
        nextPlayer: action.payload,
        nextPlayerFigure: state.nextPlayerFigure,
        roomName: state.roomName,
        serverName: state.serverName,
      };
    case "CHANGE_PLAYER_ID":
      return {
        playerFigure: state ? state.playerFigure : null,
        enemyFigure: state ? state.enemyFigure : null,
        playerID: action.payload,
        nextPlayer: state ? state.nextPlayer : null,
        nextPlayerFigure: state ? state.nextPlayerFigure : null,
        roomName: state ? state.roomName : null,
        serverName: state ? state.serverName : null,
      };
    default:
      return state;
  }
};
export default gameStatusReducer;
