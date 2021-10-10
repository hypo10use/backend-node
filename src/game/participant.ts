import { Game } from "./game";

export class Participant {
    private game: Game;
    private id: string;
    private name: string;
    private ws;
    private bet: number = 0;
    private guess: number = 0;

    constructor(game: Game, id, name, ws) {
        this.game = game;
        this.id = id;
        this.name = name;
        this.ws = ws;
    }

    public getId() {
        return this.id;
    }

    public getName() {
        return this.name;
    }

    public sendMessage(msg) {
        this.ws.send(JSON.stringify(msg));
    }

    public placeBet(bet: number) {
        if (bet > 0 && bet <= 5 && this.game.getState() === "LOBBY") {
            console.log(this.id + ": placed bet " + bet);
            this.bet = bet;
        }
    }

    public hasPlacedBet(): boolean {
        return this.bet > 0;
    }

    public hasGuessed(): boolean {
        return this.guess > 0;
    }

    public doGuess(amount: number) {
        if (this.game.getState() === "GUESS" && this.hasPlacedBet()) {
            console.log(this.id + ": guessed " + amount);
            this.guess = amount;
        }
    }

    public getBet(): number {
        return this.bet;
    }

    public getGuess(): number {
        return this.guess;
    }

    public reset() {
        this.bet = 0;
        this.guess = 0;
    }

    public isWaiting() {
        let waiting = false;
        this.game.getWaitingList().forEach((participant) => {
            if (participant.getId() === this.id) {
                waiting = true;
            }
        });
        return waiting;
    }

    public getParameters() {
        return {
            name: this.name,
            address: this.id,
            bet: this.bet,
            guess: this.guess,
            waitingList: this.isWaiting(),
        };
    }
}