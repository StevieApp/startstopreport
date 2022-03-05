// function startservers() {
//     alert('nemo')
// }

// startservers();
var express = require('express');
var socket = require('socket.io');
const cors = require('cors')
const corsOptions = {
        origin: '*',
        optionsSuccessStatus: 200
    }
    //const { Server } = require("socket.io");
var app = express();
app.use(express.static(__dirname + '/public')); //__dir and not _dir
var port = 8000; // you can use any port
app.use(cors(corsOptions))
var server = app.listen(port);
const Stopwatch = require('statman-stopwatch');
//const io = new Server(server);
var socketed = require('socket.io')(server, { cors: { origin: '*' } });
socketed.on('connection', (sockets) => {
    var myJSON = JSON.parse('{}');
    var servers;
    var reported = false;

    function makeid(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!~@_-';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    }
    console.log(makeid(15));
    var started = false;
    sockets.emit('connected', { client: 'client', socket: sockets.id });
    sockets.emit('timing', { time: new Date().toDateString() + ' ' + new Date().toLocaleTimeString() });
    var interv = setInterval(() => {
        sockets.emit('timing', { time: new Date().toDateString() + ' ' + new Date().toLocaleTimeString() });
    }, 1000);
    console.log('connect', sockets.id);
    sockets.on('disconnect', function(data) {
        console.log('client disconnected', data);
        clearInterval(interv);
    });
    sockets.on('sendMessage', (data) => {
        //console.log('received');
        sockets.emit('messageReceive', {
            date: new Date().toDateString() + ' ' + new Date().toLocaleTimeString(),
            data: data.message
        });
    });
    myJSON.inactiveservers = [];
    myJSON.activeservers = [];
    myJSON.reports = [];
    sockets.on('startstopwatch', (data) => {
        if (started == false) {
            reported = false;
            const randomnumber = numberGen(20, 10);
            for (var i = 0; i < randomnumber; i++) {
                var newserver = {
                    id: makeid(12),
                    created_at: new Date(),
                    name: "server_" + makeid(6)
                }
                myJSON.activeservers.push(newserver);
            }
            servers = myJSON.activeservers.length;
            //console.log(myJSON.activeservers);
            started = true;
            const stopwatch = new Stopwatch();
            stopwatch.start();
            sockets.emit('stopwatchstarted', {
                date: new Date().toDateString() + ' ' + new Date().toLocaleTimeString(),
                activeservers: myJSON.activeservers,
                inactiveservers: myJSON.inactiveservers
            });
            sockets.emit('stopwatchtime', {
                time: countdown(stopwatch.time('1ms'))
            });
            var intervor = setInterval(() => {
                sockets.emit('stopwatchtime', {
                    time: countdown(stopwatch.time('1ms')),
                    activeservers: myJSON.activeservers,
                    inactiveservers: myJSON.inactiveservers
                });
            }, 10);
            sockets.on('stopstopwatch', data => {
                clearInterval(intervor);
                if (reported == false) {
                    started = false;
                    reported = true;
                    myJSON.activeservers = myJSON.activeservers.map(obj => {
                        obj.stopped_at = new Date();
                        return obj;
                    });
                    myJSON.inactiveservers = myJSON.inactiveservers.concat(myJSON.activeservers);
                    myJSON.reports.push("Created at " + myJSON.inactiveservers[0].created_at + " and Stopped at " + new Date() +
                        " for " + servers + " servers.");
                    myJSON.reports = [...new Set(myJSON.reports)];
                    myJSON.activeservers = [];
                    sockets.emit('stopwatchstopped', {
                        date: new Date().toDateString() + ' ' + new Date().toLocaleTimeString(),
                        activeservers: myJSON.activeservers,
                        inactiveservers: myJSON.inactiveservers
                    });
                }
            });
            sockets.on('disconnect', function(data) {
                console.log('disconnect stopped watch', data);
                clearInterval(intervor);
            });
            sockets.on('requestreport', (data) => {
                sockets.emit('thereport', {
                    reports: myJSON.reports
                });
            });
        }
    });
});

function numberGen(max, min) {
    //var number = Math.floor((Math.random() * (maximum - minimum + 1)) + minimum);
    var number = Math.floor((Math.random() * (max - min + 1)) + min);
    return number;
}

function countdown(countDownDate) {
    var distance = countDownDate;
    var g;

    // Time calculations for days, hours, minutes and seconds
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    var ms = Math.floor((distance % (1000))); //* 60

    function addzero() {
        if (hours < 10) {
            hours = "0" + hours;
        }
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
        if (seconds < 10) {
            seconds = "0" + seconds;
        }
    }

    // Display the result in the element with id="demo"
    if (days != 0) {
        g = days + "d " + hours + ":" +
            minutes + ":" +
            seconds + " " + ms;
        // + "ms";
    } else if (days == 0 && hours != 0) {
        g = hours + ":" +
            minutes + ":" +
            seconds + " " + ms;
        //+ "ms";
    } else if (days == 0 && hours == 0 && minutes != 0) {
        addzero();
        g = "00:" + minutes + ":" +
            seconds + " " + ms;
        //+ "ms";
    } else if (days == 0 && hours == 0 && minutes == 0 && seconds != 0) {
        addzero();
        g = "00:00:" + seconds + " " + ms;
        //+ "ms";
    } else if (days == 0 && hours == 0 && minutes == 0 && seconds == 0 && ms != 0) {
        addzero();
        g = "00:00:00 " + ms;
        //+ "ms";
    }
    // If the count down is finished, write some text
    if (distance < 0) {
        return "less than zero";
    } else {
        return g;
    }
}
console.log('server on ' + port);