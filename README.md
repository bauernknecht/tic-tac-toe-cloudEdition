# tic-tac-toe-cloudEdition

Tic Tac Toe browser based game designed and thought to work with cloud services.

The article describing the development process can be found [here](https://link).

# Installing node-modules

To install all the node-packages, run this command in the root directory of the project:

`npm run installAll`

# Starting the application

Starting the application needs to be done in a specific order:

1. start the master server in "./tic-tac-toe-masterServer"

   `node ./masterserver.js`

2. start the matchmaking server in "./tic-tac-toe-matchmakingServer"

   `node ./matchmaking.js --gameserverPort 6012 --frontendPort 6013 --masterServerAddress http://localhost:7010`

3. start a game server in "./tic-tac-toe-gameServer"

   `node ./gameserver.js --portGame 5032 --portStatus 5033 --masterServerAddress http://localhost:7010`

4. start the frontend in "./tic-tac-toe-frontend"

   `npm start`

# Running the test cases

Testcases are available for the game server, the master server and the matchmaking server. In order to run the test cases without any issues, shut down any operating servers.

- master server test cases:
  - navigate to "./tic-tac-toe-masterServer"
  - run `npm run testConfig`
- game server test cases
  - navigate to "./tic-tac-toe-gameServer"
  - run `npm run testConfig`
- matchmaking server test cases
  - navigate to "./tic-tac-toe-matchmakingServer"
  - run `npm run testConfig`
