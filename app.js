const express = require("express");
require("dotenv").config();
const app = express();
const routes = require("./route/index.js");
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use("/v1", routes);

module.exports = app;
