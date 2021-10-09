import { Game } from "./game";

export class Participant {
    private game: Game;
    private id: string;
    private ws;

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
}