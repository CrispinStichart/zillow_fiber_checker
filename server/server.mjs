"use strict";

import express from "express";
const app = express();

import { google_fiber_available } from "./checker.mjs";

app.use(express.urlencoded({ extended: false }));

app.get("/", function (req, res, next) {
  let address = req.query?.address;
  console.log(address);
  if (!address) {
    throw new Error("Address parameter wasn't provided!");
  }

  google_fiber_available(address).then((available) =>
    res.send(available.toString())
  );
});

/* istanbul ignore next */
app.listen(3000);
console.log("Express started on port 3000");
