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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_ws_1 = __importDefault(require("express-ws"));
const game_1 = require("./game/game");
const participant_1 = require("./game/participant");
const body_parser_1 = require("body-parser");
const ergo_ts_1 = require("@coinbarn/ergo-ts");
const appBase = (0, express_1.default)();
const webSocket = (0, express_ws_1.default)(appBase);
const app = webSocket.app;
const port = process.env.PORT || 3000;
app.locals.game = new game_1.Game(webSocket.getWss());
app.use((0, body_parser_1.json)());
app.get("/status", (req, res) => {
    res.json(app.locals.game.getParameters());
});
app.get("/status/:address", (req, res) => {
    const address = req.params.address;
    res.json(app.locals.game.getParameters(address));
});
app.post("/bet", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const explorer = ergo_ts_1.Explorer.mainnet;
    const address = new ergo_ts_1.Address(req.body.address);
    const tokenId = req.body.tokenId;
    console.log(address, tokenId);
    const height = yield explorer.getCurrentHeight();
    res.json({
        height,
    });
}));
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
    const participant = new participant_1.Participant(app.locals.game, address, name, ws);
    // tslint:disable-next-line
    ws["participant"] = participant;
    app.locals.game.join(participant);
});
app.listen(port, () => {
    return console.log(`server is listening on ${port}`);
});
//# sourceMappingURL=index.js.map