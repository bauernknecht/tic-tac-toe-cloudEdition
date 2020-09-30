const gameHistoryReducer = (state = { historyItems: [] }, action) => {
  switch (action.type) {
    case "ADD_GAME_HISTORY":
      return {
        ...state,
        historyItems: [...state.historyItems, action.payload],
      };
    case "RESET_GAME_HISTORY":
      return {
        historyItems: [],
      };
    default:
      return state;
  }
};
export default gameHistoryReducer;
