import gameRoomReducer from "./reducer/gameRoom";
import { combineReducers } from "redux";
import gameStatusReducer from "./reducer/gameStatus";
import gameHistoryReducer from "./reducer/gameHistory";
import gameServerSocketReducer from "./reducer/gameServerSocket";

const allReducers = combineReducers({
  gameRoom: gameRoomReducer,
  gameStatus: gameStatusReducer,
  gameHistory: gameHistoryReducer,
  gameServerSocketGlobal: gameServerSocketReducer,
});

export default allReducers;
