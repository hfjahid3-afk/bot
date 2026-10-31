
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const USERNAME = "meekisgoood";
const DEFAULT_GAME =
  "https://www.roblox.com/games/8737602449/PLS-DONATE";

app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

let settings = {
  gameLink: DEFAULT_GAME
};

let session = {
  active: false,
  startedAt: null,
  standClaimed: false
};

app.get("/api/profile", async (req, res) => {
  try {
    const response = await fetch(
      "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [USERNAME],
          excludeBannedUsers: false
        })
      }
    );

    if (!response.ok) throw new Error("Roblox API error");

    const result = await response.json();
    const user = result.data?.[0];

    if (!user) {
      return res.status(404).json({
        error: "Roblox user not found"
      });
    }

    const avatarResponse = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`
    );

    const avatarData = await avatarResponse.json();

    res.json({
      username: user.name,
      displayName: user.displayName,
      userId: user.id,
      profile:
        `https://www.roblox.com/users/${user.id}/profile`,
      avatar: avatarData.data?.[0]?.imageUrl || null
    });

  } catch {
    res.status(502).json({
      error: "Could not retrieve Roblox profile"
    });
  }
});

app.get("/api/game", (req, res) => {
  res.json(settings);
});

app.post("/api/game", (req, res) => {
  try {
    const url = new URL(req.body.link);

    if (
      !["roblox.com", "www.roblox.com"].includes(url.hostname) ||
      !url.pathname.startsWith("/games/")
    ) {
      throw new Error("Invalid Roblox game link");
    }

    settings.gameLink = url.toString();

    res.json({
      success: true,
      gameLink: settings.gameLink
    });

  } catch {
    res.status(400).json({
      error: "Enter a valid Roblox game URL"
    });
  }
});

app.get("/api/status", (req, res) => {
  const uptime = session.active
    ? Math.floor((Date.now() - session.startedAt) / 1000)
    : 0;

  res.json({
    active: session.active,
    uptime,
    standClaimed: session.standClaimed
  });
});

app.post("/api/start", (req, res) => {
  session = {
    active: true,
    startedAt: Date.now(),
    standClaimed: false
  };

  res.json({ success: true });
});

app.post("/api/stop", (req, res) => {
  session.active = false;
  res.json({ success: true });
});

app.post("/api/stand", (req, res) => {
  session.standClaimed = true;
  res.json({
    success: true,
    message: "Stand status updated manually"
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "online" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("PLS DONATE Cloud Dashboard started");
});
