import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const resources = new Map<string, any>();

let clientContext: ClientContext | null = null;

app.post("/mcp/handshake", (req, res) => {
  clientContext = req.body;
  res.json({ status: "ok" });
});

let f4dataConfig: any = null;
app.post("/mcp/client/config", (req, res) => {
  f4dataConfig = req.body.config;
  res.json({ status: "config loaded" });
});
