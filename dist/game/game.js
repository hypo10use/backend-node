"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Game = void 0;
class Game {
    constructor(wss) {
        this.timerLobbyStarted = false;
        this.participants = [];
        this.waitingList = [];
        this.lobbyTimeRemaining = 30;
        this.timerGuessStarted = false;
        this.guessTimeRemaining = 30;
        this.timerResultStarted = false;
        this.resultTimeRemaining = 30;
        this.state = "LOBBY";
        this.wss = wss;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            return;
        });
    }
    join(participant) {
        if (this.state === "LOBBY") {
            this.participants.push(participant);
            if (this.participants.length >= 2 && !this.timerLobbyStarted) {
                this.startLobbyTimer();
            }
        }
        else {
            this.waitingList.push(participant);
        }
    }
    leave(participant) {
        let idx = this.participants.indexOf(participant);
        if (idx > -1) {
            this.participants.splice(idx, 1);
        }
        idx = this.waitingList.indexOf(participant);
        if (idx > -1) {
            this.waitingList.splice(idx, 1);
        }
    }
    getState() {
        return this.state;
    }
    getParticipants() {
        return this.participants;
    }
    getLobbyTimeRemaining() {
        return this.lobbyTimeRemaining;
    }
    getParameters(address) {
        const parameters = {
            state: this.state,
            participantsCount: this.participants.length,
            participants: this.getParticipantNames(),
            waitingListCount: this.waitingList.length,
            waitingList: this.getWaitingListNames(),
            timerLobbyStarted: this.timerLobbyStarted,
            lobbyTimeRemaining: this.lobbyTimeRemaining,
            timerGuessStarted: this.timerGuessStarted,
            guessTimeRemaining: this.guessTimeRemaining,
            timerResultStarted: this.timerResultStarted,
            resultTimeRemaining: this.resultTimeRemaining,
        };
        if (address) {
            const participant = this.getParticipantByAddress(address);
            if (participant) {
                parameters["me"] = participant.getParameters();
            }
        }
        return parameters;
    }
    getWaitingList() {
        return this.waitingList;
    }
    getParticipantByAddress(address) {
        let participantFound;
        this.participants.forEach((participant) => {
            if (participant.getId() === address) {
                participantFound = participant;
            }
        });
        if (!participantFound) {
            this.waitingList.forEach((participant) => {
                if (participant.getId() === address) {
                    participantFound = participant;
                }
            });
        }
        return participantFound;
    }
    getParticipantNames() {
        const names = [];
        this.participants.forEach((participant) => {
            names.push(participant.getName());
        });
        return names;
    }
    getWaitingListNames() {
        const names = [];
        this.waitingList.forEach((participant) => {
            names.push(participant.getName());
        });
        return names;
    }
    startLobbyTimer() {
        this.timerLobbyStarted = true;
        this.lobbyTimeRemaining = 30;
        this.lobbyTimerInterval = setInterval(() => {
            if (this.lobbyTimeRemaining <= 0) {
                clearInterval(this.lobbyTimerInterval);
                this.timerLobbyStarted = false;
                this.changeState("GUESS");
                this.startGuessTimer();
                return;
            }
            this.lobbyTimeRemaining -= 1;
            this.sendTick(this.lobbyTimeRemaining);
        }, 1000);
    }
    startGuessTimer() {
        this.timerGuessStarted = true;
        this.guessTimeRemaining = 30;
        this.guessTimerInterval = setInterval(() => {
            if (this.guessTimeRemaining <= 0) {
                clearInterval(this.guessTimerInterval);
                this.timerGuessStarted = false;
                this.changeState("RESULT");
                this.evaluateAndSendResults();
                this.startResultTimer();
                return;
            }
            this.guessTimeRemaining -= 1;
            this.sendTick(this.guessTimeRemaining);
        }, 1000);
    }
    startResultTimer() {
        this.timerResultStarted = true;
        this.resultTimeRemaining = 30;
        this.resultTimerInterval = setInterval(() => {
            if (this.resultTimeRemaining <= 0) {
                clearInterval(this.resultTimerInterval);
                this.timerResultStarted = false;
                this.changeState("LOBBY");
                this.participants = this.participants.concat(this.waitingList);
                this.waitingList = [];
                this.resetParticipantsBets();
                if (this.participants.length >= 2) {
                    this.startLobbyTimer();
                }
                return;
            }
            this.resultTimeRemaining -= 1;
            this.sendTick(this.resultTimeRemaining);
        }, 1000);
    }
    changeState(state) {
        this.state = state;
        this.sendMessageToAllParticipants({
            "event": "stateChanged",
            "state": this.state,
        });
    }
    sendMessageToAllParticipants(msg) {
        this.participants.forEach((participant) => {
            participant.sendMessage(msg);
        });
    }
    sendTick(remainingTime) {
        this.sendMessageToAllParticipants({
            "event": "tick",
            "timeRemaining": remainingTime,
        });
    }
    resetParticipantsBets() {
        this.participants.forEach((participant) => {
            participant.reset();
        });
    }
    evaluateAndSendResults() {
        const totalAmount = this.getTotalAmount();
        const winners = [];
        const losers = [];
        new Promise((resolve) => {
            this.participants.forEach((participant) => {
                if (participant.hasPlacedBet() && participant.hasGuessed()) {
                    if (participant.getGuess() === totalAmount) {
                        winners.push(participant);
                    }
                    else {
                        losers.push(participant);
                    }
                }
            });
            return resolve(null);
        }).then(() => {
            winners.forEach((winner) => {
                winner.sendMessage({
                    "event": "result",
                    "result": "WINNER",
                    "amount": totalAmount / winners.length,
                });
            });
            losers.forEach((loser) => {
                loser.sendMessage({
                    "event": "result",
                    "result": "LOSER",
                    "amount": 0,
                });
            });
        });
    }
    getTotalAmount() {
        let amount = 0;
        this.participants.forEach((participant) => {
            if (participant.hasPlacedBet()) {
                amount += participant.getBet();
            }
        });
        return amount;
    }
}
exports.Game = Game;
//# sourceMappingURL=game.js.map