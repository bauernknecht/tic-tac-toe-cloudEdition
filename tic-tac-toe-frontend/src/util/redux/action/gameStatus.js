export const changeStatus = (gameStatus) => {
  return {
    type: "CHANGE_STATUS",
    payload: gameStatus,
  };
};
export const changeNextPlayerFigure = (nextPlayer) => {
  return {
    type: "CHANGE_NEXT_PLAYER_FIGURE",
    payload: nextPlayer,
  };
};
export const changeNextPlayerId = (nextPlayerId) => {
  return {
    type: "CHANGE_NEXT_PLAYER_ID",
    payload: nextPlayerId,
  };
};
export const changePlayerId = (playerId) => {
  return {
    type: "CHANGE_PLAYER_ID",
    payload: playerId,
  };
};
export const leaveGame = () => {
  return {
    type: "LEAVE_GAME",
  };
};
