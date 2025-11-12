import express, { json } from "express";
import { randomBytes, createHash } from "crypto";
import axios from "axios";
import cookieParser from "cookie-parser";
import { stringify } from "qs";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cookieParser());
app.use(json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const REDIRECT_URI = process.env.REDIRECT_URI;
const SN_INTANCE = process.env.SN_INTANCE;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const authEndpoint = `${SN_INTANCE}/oauth_auth.do`;
const tokenEndpoint = `${SN_INTANCE}/oauth_token.do`;

// in real-life we would use Redis here
const tokenStore = new Map();

function base64url(buf) {
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

app.get("/auth/login", (req, res) => {
  const verifier = base64url(randomBytes(32));
  const challenge = base64url(createHash("sha256").update(verifier).digest());
  const state = base64url(randomBytes(16));
  const sessionId = base64url(randomBytes(24));

  tokenStore.set(sessionId, {
    code_verifier: verifier,
    state: state,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  res.cookie("sid", sessionId, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
    maxAge: Date.now() + 15 * 60 * 1000,
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state: state,
  });

  res.redirect(`${authEndpoint}?${params.toString()}`);
});

app.get("/auth/callback", async (req, res) => {
  const { code, state } = req.query;
  const sid = req.cookies.sid;
  const session = tokenStore.get(sid);

  if (!session) return res.status(400).send("Bad session");
  if (session.state !== state) return res.status(400).send("State Mismatch");

  const data = {
    grant_type: "authorization_code",
    code: code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: session.code_verifier,
    client_secret: CLIENT_SECRET,
  };

  const resp = await axios.post(tokenEndpoint, stringify(data), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  tokenStore.set(sid, { ...session, ...resp.data, obtained_at: Date.now() });
  res.redirect("http://localhost:5173/");
});

app.get("/auth/status", (req, res) => {
  const sid = req.cookies.sid;
  const session = tokenStore.get(sid);
  if (!session || !session.access_token)
    return res.json({ authenticated: false });
  return res.json({ authenticated: true });
});

app.get("/auth/logout", (req, res) => {
  const sid = req.cookies.sid;
  if (sid) {
    tokenStore.delete(sid);
    res.clearCookie("sid", { path: "/" });
  }
  res.json({ ok: true });
});

app.get("/api/incidents", async (req, res) => {
  const sid = req.cookies.sid;
  const session = tokenStore.get(sid);

  if (!session.access_token) return res.status(401).send("Not authenticated");

  try {
    const r = await axios.get(
      `${SN_INTANCE}/api/now/table/incident?sysparm_display_value=true&sysparm_fields=sys_id%2Cnumber%2Cstate%2Cpriority%2Cshort_description`,
      {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }
    );
    res.json(r.data);
  } catch (e) {
    if (e.response.status == 401 && session.refresh_token) {
      const data = {
        grant_type: "refresh_token",
        refresh_token: session.refresh_token,
        client_id: CLIENT_ID,
      };

      try {
        const refresh = await axios.post(tokenEndpoint, stringify(data), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        tokenStore.set(sid, { ...session, ...refresh.data });

        const retry = await axios.get(
          `${SN_INTANCE}/api/now/table/incident?sysparm_display_value=true&sysparm_fields=number%2Cstate%2Cpriority%2Cshort_description`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
        res.json(r.data);
      } catch (e) {
        res.status(401).send("Session Expired");
      }
      res.status(e.response.status || 500).send("Upstream error");
    }
  }
});

// Update an incident in ServiceNow
app.put("/api/incidents/:id", async (req, res) => {
  const sid = req.cookies.sid;
  const session = tokenStore.get(sid);

  if (!session || !session.access_token) return res.status(401).send("Not authenticated");

  const { id } = req.params;
  const payload = req.body || {};

  try {
    const r = await axios.patch(
      `${SN_INTANCE}/api/now/table/incident/${id}`,
      payload,
      {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }
    );

    // update local store copy if present
    tokenStore.set(sid, { ...session, last_update: Date.now() });

    res.json(r.data);
  } catch (e) {
    // try to refresh token on 401
    if (e.response && e.response.status === 401 && session.refresh_token) {
      const data = {
        grant_type: "refresh_token",
        refresh_token: session.refresh_token,
        client_id: CLIENT_ID,
      };

      try {
        const refresh = await axios.post(tokenEndpoint, stringify(data), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        tokenStore.set(sid, { ...session, ...refresh.data });

        const retry = await axios.patch(
          `${SN_INTANCE}/api/now/table/incident/${id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${refresh.data.access_token}` },
          }
        );

        res.json(retry.data);
        return;
      } catch (refreshErr) {
        return res.status(401).send("Session Expired");
      }
    }

    console.error(e?.response?.data || e.message || e);
    res.status(e.response?.status || 500).send("Upstream error");
  }
});

// Delete an incident in ServiceNow
app.delete("/api/incidents/:id", async (req, res) => {
  const sid = req.cookies.sid;
  const session = tokenStore.get(sid);

  if (!session || !session.access_token) return res.status(401).send("Not authenticated");

  const { id } = req.params;

  try {
    const r = await axios.delete(`${SN_INTANCE}/api/now/table/incident/${id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    tokenStore.set(sid, { ...session, last_update: Date.now() });
    res.json(r.data);
  } catch (e) {
    if (e.response && e.response.status === 401 && session.refresh_token) {
      const data = {
        grant_type: "refresh_token",
        refresh_token: session.refresh_token,
        client_id: CLIENT_ID,
      };

      try {
        const refresh = await axios.post(tokenEndpoint, stringify(data), {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });

        tokenStore.set(sid, { ...session, ...refresh.data });

        const retry = await axios.delete(`${SN_INTANCE}/api/now/table/incident/${id}`, {
          headers: { Authorization: `Bearer ${refresh.data.access_token}` },
        });

        res.json(retry.data);
        return;
      } catch (refreshErr) {
        return res.status(401).send("Session Expired");
      }
    }

    console.error(e?.response?.data || e.message || e);
    res.status(e.response?.status || 500).send("Upstream error");
  }
});

app.listen(3001, () => console.log("BFF on 3001"));
