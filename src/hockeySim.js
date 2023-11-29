/**
 * @type {GameEvent[]}
 */
const gameLog = [];
const eventProbability = {
  goal: 40,
  sog: 2,
  penalty: -4,
};


class Penalty {
  constructor(playerNum, time) {
    this.player = playerNum;
    this.timeLeft = time;
  }

  tick() {
    this.timeLeft--;

    if (this.timeLeft <= 0) {
      return this.player;
    }

    return false;
  }
}

class Chances {
  sog;
  goal;
  penalty;

  constructor(skill) {
    this.reset(skill);
  }

  reset(skill) {
    let left = 200;

    const goal = Math.round(skill / 10);
    left -= goal;
    const sog = Math.round(left / 1.25);
    left -= sog;
    const penalty = left;
    left -= penalty;

    this.sog = sog;
    this.goal = goal;
    this.penalty = penalty;
  }
}

class GameEvent {
  constructor(name, teamNum) {
    this.name = name;
    this.teamNum = teamNum;
  }

  toString() {
    return this.name + " by team " + this.teamNum;
  }
}

function randRange(max) {
  return Math.floor(Math.random() * max) + 1;
}


class Team {
  /** @type {Array<Penalty>} */
  #penalties = [];
  num;
  chances;
  #players = [];

  stats = {
    goals: 0,
    sog: 0,
    morale: 0,
  };

  /**
   * @param {number} tNum team number
   * @param {number} skillLvl skill level
   */
  constructor(tNum, skillLvl) {
    this.name = "TEAM " + tNum;
    this.chances = new Chances(skillLvl);
    this.num = tNum;
    this.stats.morale = skillLvl;

    while (this.#players.length < 20) {
      const newNum = randRange(99);
      if (newNum == 69) continue;

      this.#players.push(newNum);
    }
  }

  givePenalty(pnum) {
    this.#penalties.push(
      new Penalty(pnum, this.#penalties.length, 90)
    );

    this.#penalties.shift();
    this.updateMorale(-4);
  }

  removePenalty(pnum) {
    this.#players.push(pnum);

    this.updateMorale(4);
  }


  /**
   * @param {GameEvent} evt
   */
  onEvt(evt) {
    if (evt.teamNum == this.num) {
      // not penalty, so goal or sog
      if (evt.name != 'penalty') {
        this.stats[evt.name]++;
        // add to gamelog
        gameLog.push(evt);

        if (evt.name == 'goal') {
          this.updateMorale(3);
        }

        return;
      }

      // penalty
      this.givePenalty(this.#players[0]);
      return;
    }
    // after this, all events have to be of the 
    // other team because the teamNum can't be equal
    if (evt.name == 'goal') {
      // decrement this Team's morale
      this.updateMorale(-3);

      return;
    }
    if (evt.name == 'penalty') {
      // increase this Team's morale
      this.updateMorale(2);
    }
  }

  updateMorale(by, force = false) {
    if (this.stats.morale <= 10 && by < 0 && !force) return;
    this.stats.morale += by;
    this.chances.reset(this.stats.morale);
  }

  tick() {
    /** @type {number|boolean} */
    let res;
    this.#penalties.forEach(p => res = p.tick());
    if (res != false)
      this.removePenalty(res);
  }
}

function maybe(num) {
  return randRange(num) == randRange(num);
}


function run() {
  // we can use [1] and [2] to refer to them by setting
  // index [0] to null
  const TEAMS = [null, new Team(1, 10), new Team(2, 10)];
  let zone = randRange(2);

  // Minimum separation between events 
  const MIN_EVT_SEP = 10;
  let tickSinceLastSep = 0;

  // game loop (period 1200 ticks inside game loop three periods)
  for (let period = 1; period < 4; period++) {
    for (let tick = 0; tick < 1200; tick++) {
      if (tickSinceLastSep < MIN_EVT_SEP) {
        tickSinceLastSep++;
        continue;
      }

      // randrange(can be 0 or 1 -> 1 or 2) gets captured by team selector
      const team = TEAMS[randRange(2)];
      let keepGoing = true;

      ['goal', 'sog', 'penalty'].forEach(name => {
        if (!keepGoing) return;
        if (maybe(eventProbability[name])) {
          console.log('zone ', zone);
          console.log('tick ', tick);
          team.onEvt(new GameEvent(name, team.num));
          tickSinceLastSep = 0;
          keepGoing = false;
        }
      });

      if (maybe(3)) {
        TEAMS[zone].updateMorale(-10, true);
        zone = zone == 1 ? 2 : 1;
        TEAMS[zone].updateMorale(10, true);
      }
    }
  }

  console.log(gameLog);
  document.getElementById("output").innerText =
    gameLog.reduce((prev, cur) => prev + "\n" + cur.toString(), "");
}

document.getElementById("runBtn").addEventListener("click", run);
