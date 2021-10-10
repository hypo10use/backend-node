import express from 'express';
import expressWs from "express-ws";
import { Game } from "./game/game"
import { Participant } from "./game/participant";
import { json } from "body-parser";
import { Address, Explorer } from "@coinbarn/ergo-ts";

const appBase = express();
const webSocket = expressWs(appBase);
const app = webSocket.app;
const port = process.env.PORT || 3000;

app.locals.game = new Game(webSocket.getWss());

app.use(json());

app.get("/status", (req, res) => {
    res.json(app.locals.game.getParameters());
});

app.get("/status/:address", (req, res) => {
    const address = req.params.address;

    res.json(app.locals.game.getParameters(address));
});

app.post("/bet", async (req, res) => {
    const explorer = Explorer.mainnet;
    const address = new Address(req.body.address);
    const tokenId = req.body.tokenId;

    console.log(address, tokenId);

    const height = await explorer.getCurrentHeight();
    res.json({
        height,
    })
});

app.ws("/ws", (ws, req) => {
    const address = req.query.address;
    const name = req.query.name;

    console.log("new connection with address: " + address);
    ws.on("message", (msg) => {
        const parsedMsg = JSON.parse(msg.toString());
        switch (parsedMsg.event) {
            case "bet":
                ws["participant"].placeBet(parsedMsg.amount);
                break;
            case "guess":
                ws["participant"].doGuess(parsedMsg.amount);
                break;
        }
    });

    ws.on("close", () => {
        console.log("connection closed by: " + ws["participant"].getId());
        app.locals.game.leave(ws["participant"]);
    });

    const participant = new Participant(app.locals.game, address, name, ws);
    // tslint:disable-next-line
    ws["participant"] = participant;
    app.locals.game.join(participant);
});

app.listen(port, () => {
    return console.log(`server is listening on ${port}`);
});