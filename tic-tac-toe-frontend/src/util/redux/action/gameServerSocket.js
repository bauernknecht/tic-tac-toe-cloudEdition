export const setGameServerSocket = (socket) => {
  return {
    type: "SET_SOCKET",
    payload: socket,
  };
};
export const deleteGameServerSocket = () => {
  return {
    type: "DELETE_SOCKET",
  };
};
