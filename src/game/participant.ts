import { Game } from "./game";

export class Participant {
    private game: Game;
    private id: string;
    private ws;
    private bet: number = 0;
    private guess: number = 0;

    constructor(game: Game, id, ws) {
        this.game = game;
        this.id = id;
        this.ws = ws;
    }

    public getId() {
        return this.id;
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
}