const gameLog = [];
const eventProbability = {
  goal: 11500,
  sog: 1250,
  penalty: 3000,
};

class Scoreboard {
  team1 = {
    goal: 0,
    sog: 0,
    penalty: 0,
  };

  team2 = {
    goal: 0,
    sog: 0,
    penalty: 0,
  };

  updateBy(team, prop, change) {
    if (team == 1) {
      this.team1[prop] += change;
    } else {
      this.team2[prop] += change;
    }
  }
}

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

  reset(newMorale) {
    const sog = eventProbability.sog / newMorale;
    const goal = eventProbability.goal / newMorale;
    const penalty = eventProbability.penalty + (newMorale * 5);

    this.sog = sog;
    this.goal = goal;
    this.penalty = penalty;
  }
}

class GameEvent {
  name; teamNum; tick;

  constructor(name, teamNum, tick) {
    this.name = name;
    this.teamNum = teamNum;
    this.tick = tick;
  }

  fmt() {
    if (this.name == 'sog')
      return {
        'text': 'Shot on goal by Team ' + this.teamNum,
        'style': ''
      };
    if (this.name == 'goal')
      return {
        'text': 'Goal by Team ' + this.teamNum,
        'style': 'color: blue; font-weight: bold;'
      };
    if (this.name == 'penalty')
      return {
        'text': 'Penalty by Team ' + this.teamNum,
        'style': 'color: red;'
      };
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
      // add to gamelog
      gameLog.push(evt);
      if (evt.name != 'penalty') {
        this.stats[evt.name]++;

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

function formatTick(ttick) {
  const pad = c =>
    `${c.toString().length != 2 ? '0' : ''}${c.toString()}`;

  const period = Math.floor(ttick / 1200) + 1;
  const ptick = ttick - (period - 1) * 1200;

  const minutes = Math.floor(ptick / 60);
  const seconds = ptick - minutes * 60;

  return `${19 - minutes}:${pad(Math.abs(60 - seconds))} left in period ${period}`;
}


function run() {
  // ONLY CONFIG HERE
  const SKILLS = {
    1: 20,
    2: 15,
  };

  // check if one is higher than the other. If so, subtract
  if (SKILLS[1] != SKILLS[2]) {
    if (SKILLS[1] > SKILLS[2]) {
      SKILLS[1] -= SKILLS[2] - 1;
      SKILLS[2] -= SKILLS[2] - 1
    } else {
      // ELSE IF SKILLS 2 > SKILLS 1
      SKILLS[2] -= SKILLS[1] - 1;
      SKILLS[1] -= SKILLS[1] - 1;
    }
  }

  document.getElementById("odds").innerHTML = SKILLS[1] + ':' + SKILLS[2];

  // we can use [1] and [2] to refer to them by setting
  // index [0] to null
  const TEAMS = [null, new Team(1, SKILLS[1]), new Team(2, SKILLS[2])];
  const scoreboard = new Scoreboard();
  let zone = randRange(2);

  // Minimum separation between events 
  const MIN_EVT_SEP = 7;
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

      // loop through possible actions
      ['goal', 'sog', 'penalty'].forEach(name => {
        if (!keepGoing) return;
        if (maybe(team.chances[name])) {
          team.onEvt(new GameEvent(name, team.num, (period - 1) * 1200 + tick));
          scoreboard.updateBy(team.num, name, 1);
          tickSinceLastSep = 0;
          keepGoing = false;

          if (name == 'goal') {
            // also update shots on goal on goal
            scoreboard.updateBy(team.num, 'sog', 1);
          }
        }
      });

      // switch zone?
      if (maybe(3)) {
        TEAMS[zone].updateMorale(-10, true);
        zone = zone == 1 ? 2 : 1;
        TEAMS[zone].updateMorale(10, true);
      }
    }
  }

  // set output
  document.getElementById("output").innerHTML = "";
  const output = document.createElement('div');
  gameLog.forEach(evt => {
    const ele = document.createElement('div');
    const fmt = evt.fmt();
    ele.className = 'event';
    ele.style = fmt.style;


    ele.innerHTML = `${fmt.text}<div>${formatTick(evt.tick)}</div>`;

    output.appendChild(ele);
  });

  gameLog.splice(0, gameLog.length);
  document.getElementById("output").innerHTML = output.innerHTML;

  document.querySelector('#scoreboardGoals>td:first-child').innerHTML = scoreboard.team1.goal;
  document.querySelector('#scoreboardSog>td:first-child').innerHTML = scoreboard.team1.sog;
  document.querySelector('#scoreboardPenalty>td:first-child').innerHTML = scoreboard.team1.penalty;

  document.querySelector('#scoreboardGoals>td:last-child').innerHTML = scoreboard.team2.goal;
  document.querySelector('#scoreboardSog>td:last-child').innerHTML = scoreboard.team2.sog;
  document.querySelector('#scoreboardPenalty>td:last-child').innerHTML = scoreboard.team2.penalty;

  function getGoalieSVP(shots, goals) {
    if (shots == 0) return 'shut';
    const res = goals / shots * -100 + 100;
    return Math.round(res * 100) / 100;
  }

  // save% counted by opposite team
  document.querySelector('#scoreboardGSV>td:first-child').innerHTML =
    getGoalieSVP(scoreboard.team2.sog, scoreboard.team2.goal).toString() + '%';

  document.querySelector('#scoreboardGSV>td:last-child').innerHTML =
    getGoalieSVP(scoreboard.team1.sog, scoreboard.team1.goal).toString() + '%';
}

document.getElementById("runBtn").addEventListener("click", () => {
  try {
    run();
  } catch (e) {
    alert(e);
  }
});
