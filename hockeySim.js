class Penalty {
    constructor(playerNum, time) {
        this.player = playerNum;
        this.timeLeft = time;
    }

    tick() {
        this.timeLeft--;
    }
}

class Chances {
    sog;
    goal;
    penalty;

    constructor(skill) {
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

    release() {
        return {
            name: this.name,
            teamNum: this.teamNum,
            pts: this.pts,
        }
    }
}


class Team {
    /** @type {Array<Penalty>} */
    #penalties = []
    chances;

    constructor(tNum, skillLvl) {
        this.name = "TEAM " + tNum;
        this.skill = skillLvl;
        this.chances = new Chances(skillLvl);
    }

    givePenalty(num, time) {
        this.#penalties.push(new Penalty(num, time));
    }

    onEvt(evt) {

    }

    tick() {
        this.#penalties.forEach(p => p.tick());
    }
}

function maybe(num) {
    function randRange(max) {
        return Math.random() * (max);
    }

    num = Math.sqrt(num);
    return randRange(num) == randRange(num);
}


function run() {
    // we can use [1] and [2] to refer to them by setting
    // index [0] to null
    const TEAMS = [null, new Team(1, 10), new Team(2, 10)]
    
}


document.getElementById('runBtn').addEventListener('click', run);