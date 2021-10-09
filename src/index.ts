import express from 'express';
import expressWs from "express-ws";
import { Game } from "./game/game"
import { Participant } from "./game/participant";

const appBase = express();
const webSocket = expressWs(appBase);
const app = webSocket.app;
const port = 3000;

app.locals.game = new Game(webSocket.getWss());

app.get('/status', (req, res) => {
    res.json(app.locals.game.getParameters());
});

app.ws("/ws", (ws, req) => {
    const address = req.query.address;

    console.log("new connection with address: " + address);
    ws.on("message", (msg) => {
        switch (JSON.parse(msg.toString()).event) {
            case "bet":
                console.log("new bet");
        }
    });

    ws.on("close", () => {
        console.log("connection closed by: " + ws["participant"].getId());
        app.locals.game.leave(ws["participant"]);
    });

    const participant = new Participant(app.locals.game, req.query.address, ws);
    // tslint:disable-next-line
    ws["participant"] = participant;
    app.locals.game.join(participant);
});

app.listen(port, () => {
    return console.log(`server is listening on ${port}`);
});