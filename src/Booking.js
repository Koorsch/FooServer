// src/Booking.js
var uniqid = require("uniqid");
const { observer } = require("./util/observer");
const { rndBetween } = require("./util/rnd");

class Booking {
  constructor(fest) {
    this.fest = fest;
    this.timeoutIds = [];
    this.areas = [
      {
        area: "Midgard",
        spots: 600,
        available: rndBetween(1, 600),
        direction: -1,
      },
      {
        area: "Vanaheim",
        spots: 400,
        available: rndBetween(1, 400),
        direction: -1,
      },
      {
        area: "Alfheim",
        spots: 200,
        available: rndBetween(1, 200),
        direction: -1,
      }
    ];
    const areaIndex = rndBetween(0, this.areas.length - 1);
    this.areas[areaIndex].available = 0;
    this.areas[areaIndex].direction = 1;
    this.tick.bind(this);
    observer.subscribe("TICK", () => this.tick());
  }

  getData() {
    return this.areas.map((oneArea) => ({
      area: oneArea.area,
      spots: oneArea.spots,
      available: oneArea.available,
    }));
  }

  reserveSpot(area, amount) {
    let cleanAmount = Number(amount);
    const thisArea = this.areas.filter((a) => a.area === area)[0];
    if (thisArea && thisArea.available >= cleanAmount) {
      thisArea.available -= cleanAmount;
      const timeoutId = setTimeout(() => {
        thisArea.available += cleanAmount;
        this.timeoutIds = this.timeoutIds.filter(t => t.id !== timeoutId);
      }, 5 * 60 * 1000); // 5 minutes

      const id = uniqid();
      this.timeoutIds.push({
        clearCallback: timeoutId,
        id: id,
        area: thisArea,
        expires: Date.now() + 5 * 60 * 1000,
        cleanAmount,
      });
      return {
        message: "Reserved",
        id,
        timeout: 5 * 60 * 1000,
      };
    } else {
      return {
        error: "Invalid area, expired id or not enough available spots",
        status: 500,
      };
    }
  }

  fullfillReservation(id) {
    const obj = this.timeoutIds.find((e) => e.id === id);
    if (obj !== undefined && obj.expires > Date.now()) {
      clearTimeout(obj.clearCallback);
      this.timeoutIds = this.timeoutIds.filter(t => t.id !== obj.clearCallback);
      return { message: "Reservation completed" };
    } else {
      return {
        message: "ID not found",
        status: 500,
      };
    }
  }

  cleanExpiredReservations() {
    const now = Date.now();
    this.timeoutIds = this.timeoutIds.filter((reservation) => {
      if (reservation.expires <= now) {
        reservation.area.available += reservation.cleanAmount;
        return false;
      }
      return true;
    });
    return { message: 'Expired reservations cleaned' };
  }

  tick() {
    if (Math.random() * 100 < this.fest.eventChance) {
      const areaIndex = rndBetween(0, this.areas.length - 1);
      this.areas[areaIndex].available += this.areas[areaIndex].direction;
      if (this.areas[areaIndex].available <= 0) {
        this.areas[areaIndex].direction = 1;
        this.areas[areaIndex].available = 0;
      } else if (this.areas[areaIndex].available > 20) {
        this.areas[areaIndex].direction = -1;
      }
    }
  }
}

module.exports = { Booking };
