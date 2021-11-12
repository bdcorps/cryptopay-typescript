import 'dotenv/config'

import axios, { AxiosRequestConfig } from "axios";
import express, { ErrorRequestHandler } from "express";
import path from "path";
import qs from "qs";
import { createCBRequest, getCBAccount, getCBUser } from "./_coinbase";
import { createAccount, upsertUser } from './_db';
import { AppResponse } from "./types"
import session from 'express-session';

const app = express();
const port = 3006;

const CLIENT_ID = process.env.COINBASE_CLIENT_ID;
const CLIENT_SECRET = process.env.COINBASE_CLIENT_SECRET;
const SECRET = "SECURE_KEY"
const REDIRECT_URI = "http://localhost:3006/callback"
const CURRENCY = "BTC"


// app.set('trust proxy', 1)
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: true }
}))

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");



const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.log("error caught", err)
};

app.use(errorHandler);

app.get("/", (req, res) => {
  res.send(req.session);
});

app.get("/callback", async (req, res) => {
  const { code, state } = req.query;
  if (state === SECRET) {
    const data = qs.stringify({
      'grant_type': 'authorization_code',
      'code': code,
      'client_id': CLIENT_ID,
      'client_secret': CLIENT_SECRET,
      'redirect_uri': REDIRECT_URI
    });
    const config: AxiosRequestConfig = {
      method: 'post',
      url: 'https://api.coinbase.com/oauth/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data
    };

    const response: AppResponse = await createCBRequest(req, config);

    if (response.status === "LOADED") {
      const { access_token: accessToken, refresh_token: refreshToken } = response.data;


      req.session.user = { name: '', email: '', accessToken, refreshToken, createdAt: null, updatedAt: null, id: null };
      const response2: AppResponse = await getCBUser(req);
      if (response2.status === "LOADED") {
        const { email, name } = response2.data;
        console.log({ response2 })
        const user = await upsertUser({ email, name, accessToken, refreshToken });

        const response3: AppResponse = await getCBAccount(req);
        if (response3.status === "LOADED") {
          try {
            const account = await createAccount(user.id, response3.data.id)
          }
          catch (e) {
            console.log(e)
          }
        }

        req.session.user = user;

        res.send({ user });
      }


    } else {
      res.send({ error: response.data })
    }
  }
});

app.get("/accounts", async (req, res) => {
  const response: AppResponse = await getCBAccount(req);

  console.log(response)
  res.send({ response })
})




app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`server started at http://localhost:${port}`);
});