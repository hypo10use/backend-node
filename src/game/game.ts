import { Participant } from "./participant";

export class Game {
    private wss;
    private state: string;
    private timerLobbyStarted: boolean = false;
    private participants: Participant[] = [];
    private waitingList: Participant[] = [];
    private lobbyTimeRemaining: number = 30;
    private lobbyTimerInterval;
    private timerGuessStarted: boolean = false;
    private guessTimeRemaining: number = 30;
    private guessTimerInterval;
    private timerResultStarted: boolean = false;
    private resultTimeRemaining: number = 30;
    private resultTimerInterval;

    constructor(wss) {
        this.state = "LOBBY";
        this.wss = wss;
    }

    public async start(): Promise<void> {
        return;
    }

    public join(participant: Participant) {
        if (this.state === "LOBBY") {
            this.participants.push(participant);

            if (this.participants.length >= 2 && !this.timerLobbyStarted) {
                this.startLobbyTimer();
            }
        } else {
            this.waitingList.push(participant);
        }
    }

    public leave(participant: Participant) {
        let idx= this.participants.indexOf(participant);
        if (idx > -1) {
            this.participants.splice(idx, 1);
        }

        idx= this.waitingList.indexOf(participant);
        if (idx > -1) {
            this.waitingList.splice(idx, 1);
        }
    }

    public getState(): string {
        return this.state;
    }

    public getParticipants(): Participant[] {
        return this.participants;
    }

    public getLobbyTimeRemaining(): number {
        return this.lobbyTimeRemaining;
    }

    public getParameters(address?) {
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

    public getWaitingList() {
        return this.waitingList;
    }

    private getParticipantByAddress(address): Participant {
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

    private getParticipantNames(): string[] {
        const names = [];
        this.participants.forEach((participant) => {
            names.push(participant.getName());
        });
        return names;
    }

    private getWaitingListNames(): string[] {
        const names = [];
        this.waitingList.forEach((participant) => {
            names.push(participant.getName());
        });
        return names;
    }

    private startLobbyTimer() {
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

    private startGuessTimer() {
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

    private startResultTimer() {
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

    private changeState(state) {
        this.state = state;
        this.sendMessageToAllParticipants({
            "event": "stateChanged",
            "state": this.state,
        });
    }

    private sendMessageToAllParticipants(msg) {
        this.participants.forEach((participant) => {
            participant.sendMessage(msg);
        });
    }

    private sendTick(remainingTime) {
        this.sendMessageToAllParticipants({
            "event": "tick",
            "timeRemaining": remainingTime,
        });
    }

    private resetParticipantsBets() {
        this.participants.forEach((participant) => {
            participant.reset();
        });
    }

    private evaluateAndSendResults() {
        const totalAmount = this.getTotalAmount();
        const winners: Participant[] = [];
        const losers: Participant[] = [];

        new Promise((resolve) => {
            this.participants.forEach((participant) => {
                if (participant.hasPlacedBet() && participant.hasGuessed()) {
                    if (participant.getGuess() === totalAmount) {
                        winners.push(participant);
                    } else {
                        losers.push(participant);
                    }
                }
            });
            return resolve(null)
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

    private getTotalAmount(): number {
        let amount = 0;
        this.participants.forEach((participant) => {
            if (participant.hasPlacedBet()) {
                amount += participant.getBet();
            }
        });
        return amount;
    }
}