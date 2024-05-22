const express = require("express");
const cron = require("node-cron");
const axios = require("axios");
const { FooFest } = require("./src/foofest");
const { initialSettings } = require("./src/static/settings");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  next();
});
app.use(express.static("public"));

app.get("/", function (req, res) {
  res.json({
    isMyServerLive: true,
    suggestions: "Try visiting /bands",
  });
});
app.get("/bands", function (req, res) {
  res.json(FooFest.bands);
});
app.get("/bands/:slug", function (req, res) {
  const slug = req.params.slug;
  res.json(FooFest.bands.find((band) => band.slug === slug));
});
app.get("/schedule", function (req, res) {
  res.json(FooFest.schedule);
});

app.get("/version", function (req, res) {
  res.json({ version: initialSettings.version });
});
app.get("/schedule/:day", function (req, res) {
  const day = parseInt(req.params.day);
  res.json(FooFest.schedule);
});
app.get("/events", function (req, res) {
  res.json(FooFest.eventLog.getEvents());
});
app.get("/available-spots", function (req, res) {
  res.json(FooFest.booking.getData());
});
app.post("/settings", function (req, res) {
  const structure = req.body;
  if (structure.eventFrequency) {
    FooFest.setEventFrequency(structure.eventFrequency);
  }
  if (structure.eventChance) {
    FooFest.setEventChance(structure.eventChance);
  }
  if (structure.reservationDuration) {
    FooFest.setReservationDuration(structure.reservationDuration);
  }

  if (
    !structure.eventFrequency &&
    !structure.eventChance &&
    !structure.reservationDuration
  ) {
    res.send({
      error:
        "Wrong data format supplied, need 'eventFrequency', 'reservationDuration', or 'eventChance'",
      status: 500,
    });
  } else {
    res.send({
      message: "Changed settings",
    });
  }
});

app.put("/reserve-spot", function (req, res) {
  if (Number(req.body.amount) < 1) {
    res.send({
      error: `Unable to reserve ${req.body.amount} spots`,
      status: 500,
    });
  }
  res.send(FooFest.booking.reserveSpot(req.body.area, req.body.amount));
});

app.post("/fullfill-reservation", function (req, res) {
  res.send(FooFest.booking.fullfillReservation(req.body.id));
});

// Cleanup endpoint
app.delete("/clean-expired-reservations", function (req, res) {
  try {
    const result = FooFest.booking.cleanExpiredReservations();
    res.status(200).json(result);
  } catch (error) {
    console.error('Error cleaning expired reservations:', error);
    res.status(500).json({ error: 'Failed to clean expired reservations' });
  }
});

// Schedule the cleanup function to run every minute
cron.schedule('* * * * *', async () => {
  try {
    await axios.delete('http://localhost:8080/clean-expired-reservations');
    console.log('Expired reservations cleaned');
  } catch (error) {
    console.error('Error cleaning expired reservations:', error);
  }
});

app.listen(process.env.PORT || 8080);
console.log(`Server started on port ${process.env.PORT || 8080}`);
