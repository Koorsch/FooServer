// src/foofest.js
const { Schedule } = require("./Schedule.js");
const { Festival } = require("./Festival.js");
const { EventLog } = require("./EventLog");
const { Booking } = require("./Booking");
const Bands = require("./Bands.js");

function createFest(name) {
  const fest = new Festival(name);
  const schedule = new Schedule(fest);
  fest.schedule = schedule.slots;
  fest.bands = Bands;
  const eventLog = new EventLog();
  fest.eventLog = eventLog;
  fest.booking = new Booking(fest);
  fest.start();
  return fest;
}

const fest = createFest("FooFest");
module.exports = {
  FooFest: fest,
};
