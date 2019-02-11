const axios = require("axios");
const cheerio = require('cheerio')
const ROUND = require('./round');

class ROOM {
    constructor(options) {
        this.id = options.id;
        this.name = options.name;
        this.isPrivate = options.isPrivate || false;
        this.password = options.password || "";
        this.maxUsers = options.maxUsers || 8;
        this.users = options.users || [];
        this.points = options.points || {};
        this.names = options.names || {};
        this.painter = null;
        this.created = true;
        this.round = null;
        // this.clock = {
        //     interval: null,
        //     timeout: null
        // }
    }

    async getWord() {
        let word = await axios.get('http://www.kalambury.org/lib/generate.php?fbclid=IwAR0jEZum7uQ8tSN8ZzpMt3c1ZXwe5KJYYuJRiay2sqyTfx_3pnjyEKAxDL4');
        word = cheerio.load(word.data.trim()).text();
        return word;
    }

    async initRound() {
        let words = [await this.getWord(), await this.getWord(), await this.getWord()];
        this.setPainter();
        io.to(this.painter).emit("round_initialized", words);

        //TODO Clock timeout after 20 s
    }

    // countDown(time, callback) {
    //     io.to(this.id).emit('countdown', time);
    //    // this.clock.timeout = setTimeout(callback, time * 1000)
    //     this.clock.interval = setInterval(() => {
    //         time--;
    //         io.to(this.id).emit('countdown', time);
    //     }, 1000);

    // }

    startRound(word) {
        this.round = new ROUND(word);
        io.to(this.id).emit("round_started");
        CHAT.sendServerMessage(this.id, `Round started!`);
        //this.countDown(120, this.stopRound);
    }

    stopRound() {
        this.round = null
        this.clearBoard();
        io.to(this.id).emit("round_stopped");
        // clearTimeout(this.clock.interval);
        // clearInterval(this.clock.timeout);

        // Restart
        this.initRound();
    }

    clearBoard() {
        if (this.round != null) {
            this.round.clearLines();
        }
        io.to(this.id).emit('clear');
    }

    setPainter() {
        // Getting users except current painter
        let users = this.users.filter(user => user != this.painter);
        // Setting random user a painter
        let newPainter = users[Math.floor(Math.random() * Math.floor(users.length))];
        this.painter = newPainter;

        io.to(this.id).emit("painter_changed", newPainter);
        io.to(this.painter).emit("receive_server_message", 'You are a new painter!');

        return newPainter;
    }

    getPainter() {
        for (let user of this.users) {
            if (user == this.painter) {
                return user;
            }
        }
        return false;
    }

    getUsers() {
        let usrs = [];
        for (let user of this.users) {
            usrs.push({
                id: user,
                points: this.points[user] || 0,
                name: this.names[user] || user
            });
        }
        return usrs;
    }
}

module.exports = ROOM;