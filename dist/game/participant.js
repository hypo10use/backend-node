"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Participant = void 0;
class Participant {
    constructor(game, id, name, ws) {
        this.bet = 0;
        this.guess = 0;
        this.game = game;
        this.id = id;
        this.name = name;
        this.ws = ws;
    }
    getId() {
        return this.id;
    }
    getName() {
        return this.name;
    }
    sendMessage(msg) {
        this.ws.send(JSON.stringify(msg));
    }
    placeBet(bet) {
        if (bet > 0 && bet <= 5 && this.game.getState() === "LOBBY") {
            console.log(this.id + ": placed bet " + bet);
            this.bet = bet;
        }
    }
    hasPlacedBet() {
        return this.bet > 0;
    }
    hasGuessed() {
        return this.guess > 0;
    }
    doGuess(amount) {
        if (this.game.getState() === "GUESS" && this.hasPlacedBet()) {
            console.log(this.id + ": guessed " + amount);
            this.guess = amount;
        }
    }
    getBet() {
        return this.bet;
    }
    getGuess() {
        return this.guess;
    }
    reset() {
        this.bet = 0;
        this.guess = 0;
    }
    isWaiting() {
        let waiting = false;
        this.game.getWaitingList().forEach((participant) => {
            if (participant.getId() === this.id) {
                waiting = true;
            }
        });
        return waiting;
    }
    getParameters() {
        return {
            name: this.name,
            address: this.id,
            bet: this.bet,
            guess: this.guess,
            waitingList: this.isWaiting(),
        };
    }
}
exports.Participant = Participant;
//# sourceMappingURL=participant.js.map