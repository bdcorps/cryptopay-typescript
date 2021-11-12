import { User } from "@prisma/client"
import axios, { AxiosRequestConfig } from "axios"
import qs from "qs";
import { AppResponse } from "./types"
import { Request, Response, NextFunction } from 'express';
import { upsertUser } from "./_db";

const CLIENT_ID = process.env.COINBASE_CLIENT_ID;
const CLIENT_SECRET = process.env.COINBASE_CLIENT_SECRET;
const CURRENCY = "BTC";

const createCBRequest = async (req: Request, config: AxiosRequestConfig, retried: boolean = false): Promise<AppResponse> => {
  const accessToken = req.session.user?.accessToken;

  config.headers = { 'Authorization': `Bearer ${accessToken}` }

  let result: AppResponse = { data: null, status: "LOADING" }
  try {
    const res = await axios(config)

    result = { data: res.data, status: "LOADED" };
  } catch (err) {
    if (retried) {
      console.log("Retried request after new refresh token failed", err.response.data?.errors)
    }
    else {
      if (err.response) {
        if (err.response.status === 401) {
          const response = await getRefreshedToken(req);
          if (response.status === "LOADED") {
            const { accessToken: newAccessToken } = response.data;

            config.headers = { 'Authorization': `Bearer ${newAccessToken}` }

            return await createCBRequest(req, config, true)
          } else {
            result.status = "FAILED"
            return result
          }
        }
        result.data = err.response.data?.errors[0]?.message;
      } else if (err.request) {
        result.data = "Request failed";
      } else {
        result.data = "Unknown error occured";
      }
    }
    result.status = "FAILED"
  }

  return result;
}


const getRefreshedToken = async (req: Request) => {
  const { email, refreshToken } = req.session.user;
  let result: AppResponse = { data: null, status: "LOADING" }

  const data = qs.stringify({
    'grant_type': 'refresh_token',
    'client_id': CLIENT_ID,
    'client_secret': CLIENT_SECRET,
    'refresh_token': refreshToken,
  });

  console.log("refreshing token", data)

  const config: AxiosRequestConfig = {
    method: 'post',
    url: 'https://api.coinbase.com/oauth/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data
  };

  try {
    const res = await axios(config)
    result = { data: res.data, status: "LOADED" };
    const { access_token: accessToken, refresh_token: refreshToken } = res.data
    await upsertUser({ email, accessToken, refreshToken });
  } catch (err) {
    if (err.response) {
      result.data = err.response.data?.error?.error_description;
    } else if (err.request) {
      result.data = "Request failed";
    } else {
      result.data = "Unknown error occured";
    }
  }
  return result;
}

const getCBUser = async (req: Request) => {
  const config: AxiosRequestConfig = {
    method: 'get',
    url: 'https://api.coinbase.com/v2/user'
  };

  let res: AppResponse = await createCBRequest(req, config)
  res.data = res.data?.data;
  return res;
}

const getCBAccount = async (req: Request) => {
  const config: AxiosRequestConfig = {
    method: 'get',
    url: `https://api.coinbase.com/v2/accounts/${CURRENCY}`
  };

  let res: AppResponse = await createCBRequest(req, config)
  res.data = res.data?.data;
  return res;
}

// const getAccount = async (accessToken) => {
//   var config = {
//     method: 'get',
//     url: 'https://api.coinbase.com/v2/accounts/BTC',
//     headers: {
//       'Authorization': `Bearer ${accessToken}`
//     }
//   };

//   try {
//     const res = await axios(config)
//     console.log("res", res)
//     return res?.data;
//   }
//   catch (e) {
//     console.log("res", e.response.message)
//     return null
//   }
// }

export { createCBRequest, getCBUser, getCBAccount }