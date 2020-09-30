export const addGameHistory = (historyItem) => {
  return {
    type: "ADD_GAME_HISTORY",
    payload: historyItem,
  };
};
export const resetGameHistory = () => {
  return {
    type: "RESET_GAME_HISTORY",
  };
};
