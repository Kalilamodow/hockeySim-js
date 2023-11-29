/**
 * @type {GameEvent[]}
 */
const gameLog = [];


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
    this.adjust(skill);
  }

  reset(skill) {
    let left = 100;

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
  constructor(name, teamNum, pts) {
    this.name = name;
    this.teamNum = teamNum;
    this.pts = pts;
  }
}

function randRange(max) {
  return Math.random() * (max);
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
    skill: 0,
  };

  /**
   * @param {number} tNum team number
   * @param {number} skillLvl skill level
   */
  constructor(tNum, skillLvl) {
    this.name = "TEAM " + tNum;
    this.chances = new Chances(skillLvl);
    this.num = tNum;
    this.stats.skill = skillLvl;

    while (this.#players.length < 20) {
      const newNum = randRange(99);
      if (newNum == 69) continue;

      this.#players.push(newNum);
    }
  }

  givePenalty(num) {
    this.#penalties.push(
      new Penalty(num, this.#penalties.length, 90)
    );
    this.#penalties.shift();

    this.stats.skill -= 2;
    this.chances.reset(this.stats.skill);
  }

  removePenalty(pnum) {
    this.#players.push(pnum);
    this.stats.skill += 2;
    this.chances.reset(this.stats.skill);
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
        return;
      }

      // penalty
      this.givePenalty(this.#players[0]);
    }
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
  num = Math.sqrt(num);
  return randRange(num) == randRange(num);
}


function run() {
  // we can use [1] and [2] to refer to them by setting
  // index [0] to null
  const TEAMS = [null, new Team(1, 10), new Team(2, 10)];

}


if (typeof window === 'undefined')  // if node, run directly
  run();
else
  document.getElementById('runBtn').addEventListener('click', run);   // if browser, add evt listener to ui
