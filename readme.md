# backend

```bash
npm install
npm build
npm start
```

## Outgoing events

### `tick`
Gets emitted on every participant every second a countdown counts down.

```json
{
  "event": "tick",
  "timeRemaining": 10
}
```

### `stateChanged`
Gets emitted if the state of the round changes. Possible states are `LOBBY`, `GUESS` and `RESULT`.

```json
{
  "event": "stateChanged",
  "state": "GUESS"
}
```

### `participantJoined`
Gets emitted when a new participant joins the game.

```json
{
  "event": "participantJoined",
  "name": "P1"
}
```

### `participantLeft`
Gets emitted when a participant leaves the game.

```json
{
  "event": "participantLeft",
  "name": "P1"
}
```

### `result`
Gets emitted after the guessing round is ofer and tells the participant if he won or lost the game. Values are `WINNER` and `LOSER` and the amount.

```json
{
  "event": "result",
  "result": "WINNER",
  "amount": 80
}
```


## Incoming events

### `bet`
Event the server can receive to place a bet.

```json
{
  "event": "bet",
  "amount": 2
}
```

### `guess`
Event the server can receive in state `GUESS` to guess the sum of all bets.

```json
{
  "event": "guess",
  "amount": 40
}
```
