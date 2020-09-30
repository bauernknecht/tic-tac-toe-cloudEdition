const gameSocketServerReducer = (state = { socket: null }, action) => {
  switch (action.type) {
    case "SET_SOCKET":
      return {
        socket: action.payload,
      };
    case "DELETE_SOCKET":
      return {
        socket: null,
      };
    default:
      return state;
  }
};
export default gameSocketServerReducer;
