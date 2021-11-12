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
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const qs_1 = __importDefault(require("qs"));
const _coinbase_1 = require("./_coinbase");
const _db_1 = require("./_db");
const express_session_1 = __importDefault(require("express-session"));
const app = (0, express_1.default)();
const port = 3006;
const CLIENT_ID = process.env.COINBASE_CLIENT_ID;
const CLIENT_SECRET = process.env.COINBASE_CLIENT_SECRET;
const SECRET = "SECURE_KEY";
const REDIRECT_URI = "http://localhost:3006/callback";
const CURRENCY = "BTC";
// app.set('trust proxy', 1)
app.use((0, express_session_1.default)({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true }
}));
app.set("views", path_1.default.join(__dirname, "views"));
app.set("view engine", "ejs");
const errorHandler = (err, req, res, next) => {
    console.log("error caught", err);
};
app.use(errorHandler);
app.get("/", (req, res) => {
    res.send(req.session);
});
app.get("/callback", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code, state } = req.query;
    if (state === SECRET) {
        const data = qs_1.default.stringify({
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'redirect_uri': REDIRECT_URI
        });
        const config = {
            method: 'post',
            url: 'https://api.coinbase.com/oauth/token',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data
        };
        const response = yield (0, _coinbase_1.createCBRequest)(req, config);
        if (response.status === "LOADED") {
            const { access_token: accessToken, refresh_token: refreshToken } = response.data;
            req.session.user = { name: '', email: '', accessToken, refreshToken, createdAt: null, updatedAt: null, id: null };
            const response2 = yield (0, _coinbase_1.getCBUser)(req);
            if (response2.status === "LOADED") {
                const { email, name } = response2.data;
                console.log({ response2 });
                const user = yield (0, _db_1.upsertUser)({ email, name, accessToken, refreshToken });
                const response3 = yield (0, _coinbase_1.getCBAccount)(req);
                if (response3.status === "LOADED") {
                    try {
                        const account = yield (0, _db_1.createAccount)(user.id, response3.data.id);
                    }
                    catch (e) {
                        console.log(e);
                    }
                }
                req.session.user = user;
                res.send({ user });
            }
        }
        else {
            res.send({ error: response.data });
        }
    }
}));
app.get("/accounts", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield (0, _coinbase_1.getCBAccount)(req);
    console.log(response);
    res.send({ response });
}));
app.listen(port, () => {
    // tslint:disable-next-line:no-console
    console.log(`server started at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map