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
exports.getCBAccount = exports.getCBUser = exports.createCBRequest = void 0;
const axios_1 = __importDefault(require("axios"));
const qs_1 = __importDefault(require("qs"));
const _db_1 = require("./_db");
const CLIENT_ID = process.env.COINBASE_CLIENT_ID;
const CLIENT_SECRET = process.env.COINBASE_CLIENT_SECRET;
const CURRENCY = "BTC";
const createCBRequest = (req, config, retried = false) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const accessToken = (_a = req.session.user) === null || _a === void 0 ? void 0 : _a.accessToken;
    config.headers = { 'Authorization': `Bearer ${accessToken}` };
    let result = { data: null, status: "LOADING" };
    try {
        const res = yield (0, axios_1.default)(config);
        result = { data: res.data, status: "LOADED" };
    }
    catch (err) {
        if (retried) {
            console.log("Retried request after new refresh token failed", (_b = err.response.data) === null || _b === void 0 ? void 0 : _b.errors);
        }
        else {
            if (err.response) {
                if (err.response.status === 401) {
                    const response = yield getRefreshedToken(req);
                    if (response.status === "LOADED") {
                        const { accessToken: newAccessToken } = response.data;
                        config.headers = { 'Authorization': `Bearer ${newAccessToken}` };
                        return yield createCBRequest(req, config, true);
                    }
                    else {
                        result.status = "FAILED";
                        return result;
                    }
                }
                result.data = (_d = (_c = err.response.data) === null || _c === void 0 ? void 0 : _c.errors[0]) === null || _d === void 0 ? void 0 : _d.message;
            }
            else if (err.request) {
                result.data = "Request failed";
            }
            else {
                result.data = "Unknown error occured";
            }
        }
        result.status = "FAILED";
    }
    return result;
});
exports.createCBRequest = createCBRequest;
const getRefreshedToken = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _e, _f;
    const { email, refreshToken } = req.session.user;
    let result = { data: null, status: "LOADING" };
    const data = qs_1.default.stringify({
        'grant_type': 'refresh_token',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'refresh_token': refreshToken,
    });
    console.log("refreshing token", data);
    const config = {
        method: 'post',
        url: 'https://api.coinbase.com/oauth/token',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data
    };
    try {
        const res = yield (0, axios_1.default)(config);
        result = { data: res.data, status: "LOADED" };
        const { access_token: accessToken, refresh_token: refreshToken } = res.data;
        yield (0, _db_1.upsertUser)({ email, accessToken, refreshToken });
    }
    catch (err) {
        if (err.response) {
            result.data = (_f = (_e = err.response.data) === null || _e === void 0 ? void 0 : _e.error) === null || _f === void 0 ? void 0 : _f.error_description;
        }
        else if (err.request) {
            result.data = "Request failed";
        }
        else {
            result.data = "Unknown error occured";
        }
    }
    return result;
});
const getCBUser = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _g;
    const config = {
        method: 'get',
        url: 'https://api.coinbase.com/v2/user'
    };
    let res = yield createCBRequest(req, config);
    res.data = (_g = res.data) === null || _g === void 0 ? void 0 : _g.data;
    return res;
});
exports.getCBUser = getCBUser;
const getCBAccount = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _h;
    const config = {
        method: 'get',
        url: `https://api.coinbase.com/v2/accounts/${CURRENCY}`
    };
    let res = yield createCBRequest(req, config);
    res.data = (_h = res.data) === null || _h === void 0 ? void 0 : _h.data;
    return res;
});
exports.getCBAccount = getCBAccount;
//# sourceMappingURL=_coinbase.js.map