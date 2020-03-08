const mosca = require('mosca');
const express = require('express');
const request = require('request');
// var keypress = require('keypress');
// const ioHook = require('iohook');
// const readline = require('readline');

const app = express();
const port = process.env.PORT || 3000;

const server1 = require('http').createServer(app);
const io = require('socket.io').listen(server1);
const PORT = 8081;
server1.listen(PORT);

/*const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, key) => {
  if (key.name === 'k') {
  	process.exit();
  }
})*/


var ascoltatore = {
    //type: 'redis',
    // redis: require('redis'),
    // db: 12,
    // port: 6379,
    return_buffers: true, // to handle binary payloads
    host: "185.189.112.173"
};

var moscaSettings = {
    port: 1881,
    //backend: ascoltatore,
    // host: "0.0.0.0", // specify an host to bind to a single interface
    host: "185.189.112.173", // specify an host to bind to a single interface
    id: 'BikeMaster', // used to publish in the $SYS/<id> topicspace
    // stats: true, // publish stats in the $SYS/<id> topicspace
    // logger: {
    //     level: 'info'
    // }
// persistence: {
//    factory: mosca.persistence.Redis
//  },
};

const server = new mosca.Server(moscaSettings);

const connections = [];
var topic = "state";
let payload = {state: "aa"};
let latlon;
let flag = false;
let flag1 = false;
let flag2 = true;
let payload1 = {state: "aa"};
var k = "a";
let i = 0;
let j = 0;

const publishData = (topic, payload) => {
    var message = {
        topic: topic,
        payload: Buffer.from(JSON.stringify(payload)),
        //payload: JSON.stringify(payload),
        qos: 2,
        retain: false
    };
    //console.log("message data: " + payload);
    server.publish(message, () => {
        console.log('published data!!!!');
    });
};

io.sockets.on('connection', (socket) => {
    connections.push(socket);
    console.log(' %s sockets is connected', connections.length);

    socket.on('disconnect', () => {
        connections.splice(connections.indexOf(socket), 1);
    });

    socket.on('sendQrCode', (message) => {
        console.log('Message is received :', message);

        if (!latlon.state) {

            if (message === "BikeSharing") {
                socket.emit('sendOpenLock', {message: true});
                //payload = {state: "a"};
                flag = true;
                k = "b";
            } else {
                socket.emit('sendOpenLock', {message: false});
                //payload = {state: "aa"};
                console.log("wrong QR code!!");
                flag = false;
            }
            //flag = true;
        } else {
            console.log("please stop trip!!");
        }
        //publishData(topic, payload);

        // broadcasting socket.io
        // io.sockets.emit('sendOpenLock', {message: message});
    });

    /*socket.on('closeOpen', message => {
        //console.log(message);
	if(message === 0){
            payload = {state: 0};
	}else{
            payload = {state: "a"};
	}

	flag = true;

        //publishData(topic, payload);
     });*/

});


// Accepts the connection if the username and password are valid
var authenticate = function (client, username, password, callback) {

    // console.log(client)
    console.log(username);
    console.log(password.toString());
    // console.log(callback)

    var shouldAuthenticate = false;

    if (username === "taher") {
        if (password.toString() === "1000") {
            shouldAuthenticate = true;
            // console.log('Authentication enabled');
        } else {
            // console.log('Authentication disabled');
        }
    } else if (username === "fattahi") {
        if (password.toString() === "100") {
            shouldAuthenticate = true;
            // console.log('Authentication enabled');

        } else {
            // console.log('Authentication disabled');

        }
    }

    // if(process.env.MQTT_USERNAME || password.toString() === "1000" ) {
    //     // shouldAuthenticate = true;
    //     console.log('Authentication enabled');
    // }else{
    //     console.log('Authentication disabled');
    // }
    if (shouldAuthenticate) {
        // console.log('Authenticating');
        var authorized = (username === process.env.MQTT_USERNAME && password.toString() === process.env.MQTT_PASSWORD);
        if (authorized) client.user = username;
        // callback(null, authorized);
        callback(null, true);
    } else {
        // callback(null, true);
        callback(null, false);
    }
};

const fixGeo = function (coord, cardinalPoint) {
    const convert = function (raw, sign) {
        let pointPos = raw.indexOf('.');
        let latlng = {
            deg: raw.substr(0, pointPos - 2),
            min: raw.substr(pointPos - 2, 2),
            sec: parseFloat('0.' + raw.substr(pointPos + 1, raw.length), 10)
        };
        latlng.deg = Math.abs(Math.round(latlng.deg * 1000000));
        latlng.min = Math.abs(Math.round(latlng.min * 1000000));
        latlng.sec = Math.abs(Math.round((latlng.sec * 60) * 1000000));
        return Math.round(latlng.deg + (latlng.min / 60) + (latlng.sec / 3600)) * sign / 1000000;
    };

    return convert(coord, (cardinalPoint === 'S' || cardinalPoint === 'W' ? -1 : 1));
};

function asyncPublish() {
    return new Promise(resolve => {
        //payload = {state: "a"};
        publishData(topic, payload);
    });
}

async function msg() {
    await asyncPublish();
    //console.log('Message:', msg);
}

// fired when a message is received
server.on('published', function (packet, client) {
    var topic = packet.topic;
    var buffer = packet.payload;
    let ms;
    try {
        console.log("topic:+++++++++++:::" + topic + ", message:", buffer.toString());

        if (!buffer.toString().includes("topic")) {
            //let message = JSON.parse(buffer.toString());
            //console.log("kaz++++" + message);

            if (buffer.toString().includes("lon")) {
                ms = buffer.toString();
                if (ms[ms.lastIndexOf("}")] !== "}") {
                    ms = buffer.toString() + "}";
                }
                var latlonJson = JSON.parse(ms);
                latlon = latlonJson;
                //console.log("bike++++++" + latlonJson);
                //if(latlonJson.lon){
                var lat = latlonJson.lat;
                var lon = latlonJson.lon;
                if (lat > 0) {
                    latlonJson.lat = fixGeo(Math.abs(latlonJson.lat).toString(), 'N')
                }
                if (lon > 0) {
                    latlonJson.lon = fixGeo(Math.abs(latlonJson.lon).toString(), 'E')
                }
                if (lat < 0) {
                    latlonJson.lat = fixGeo(Math.abs(latlonJson.lat).toString(), 'S')
                }
                if (lon < 0) {
                    latlonJson.lon = fixGeo(Math.abs(latlonJson.lon).toString(), 'W')
                }

                if (latlonJson.state) {
                    latlonJson.state = 1;
                    //payload = {state: "a"};
                } else {
                    latlonJson.state = 0;
                    //payload = {state: 0};
                }

                // if(!flag){
                if (!latlonJson.state) {

                    if (latlonJson.userID !== 0) {
                        if (latlonJson.userID === 9167080) {
                            //if(!latlonJson.state){
                            //        payload = {state: 0};
                            //	flag1 = false;
                            //}else{
                            if (!flag1) {
                                if (!latlonJson.state) {
                                    payload = {state: "a"};
                                    flag1 = true;
                                } else {
                                    payload = {state: "aa"};
                                    flag1 = true;
                                }
                                //payload = {state: "a"};
                                //latlonJson.state = 1;
                                //flag1 = true;
                            } else {
                                if (!latlonJson.state) {

                                    if (i >= 2) {
                                        payload = {state: 0};
                                        flag1 = false;
                                        i = 0;
                                    } else {
                                        i = i + 1;
                                        payload = {state: "aa"};
                                    }
                                } else {
                                    //
                                    payload = {state: "aa"};
                                    //flag1 = true;
                                }
                            }
                            //}
                        } else {
                            payload = {state: "aa"};
                            console.log("wrong RFID code!!!!");
                            //latlonJson.state = 0;
                        }
                    } else {
                        if (flag) {
                            payload = {state: "a"};
                            flag = false;
                        } else {
                            if (k === "b") {
                                if (j >= 2) {
                                    payload = {state: 0};
                                    j = 0;
                                    //flag = true;
                                    k = "a";
                                } else {
                                    j = j + 1;
                                    payload = {state: "aa"};
                                }
                            } else {
                                payload = {state: "aa"};
                            }

                        }
                    }
                } else {
                    payload = {state: "aa"};
                    console.log("please stop trip!!");
                }
                //}else{
                //   flag = false;
                //}

                //}

                if (!flag2) {
                    payload = payload1;
                    flag2 = false;
                }


                io.sockets.emit('latlon', latlonJson);

                msg();

//    payload = {state: "a"};
//    publishData(topic, payload);
                /*
                request
                  .get('http://185.189.112.173:3000/close')
                  .on('response', function(response) {
                    console.log(response.statusCode) // 200
                    //console.log(response.headers['content-type']) // 'image/png'
                  })
                */


// payload = {state: 0};
// publishData(topic, payload);

            }


        }

    } catch (err) {
        console.log(err);
    }

});


server.on('subscribed', function (topic, client) {
    console.log("subscribed:++++", topic);
});

server.on('unsubscribed', function (topic, client) {
    console.log("unsubcribed:", topic);
});

server.on('clientConnected', function (client) {
    var clientId = client.id;
    console.log('client connected:', clientId);
});

server.on('clientDisconnected', function (client) {
    console.log('client disConnected:', client.id);
});

server.on('unsubscribed', function (topic, client) {
    console.log('unsubscribed:', topic);
});

server.on('clientDisconnecting', function (client) {
    console.log('clientDisconnecting:', client.id);
});

server.on('clientDisconnected', function (client) {
    console.log('clientDisconnected :', client.id);
});

// Server is Ready
// server.on('ready', () => {
//     console.log('Mosca server is up and running');
// });

function setup() {
    // server.authenticate = authenticate;
    console.log('Mosca server listening on port: ' + 1881)
}

server.on('ready', setup);


app.get('/', function (req, res, next) {
    topic = req.query.topic;
    payload = req.query.payload;
    //console.log(payload)
    //if(topic === "sample"){
    //	flag = true;
    //}else{
    //	flag = false;
    //}
    publishData(topic, JSON.stringify(payload));
    res.status(200).send(`Published ${topic} to ${payload}`);
});

app.get('/close', (req, res) => {
    // res.send('index')
    // io.sockets.emit('latlon', {});


    payload1 = {state: 0};
    flag2 = false;
    //publishData(topic, payload);

    res.status(200).send('ok');
});


app.get('/open', (req, res) => {
    // res.send('index')
    // io.sockets.emit('latlon', {});

    payload1 = {state: "a"};
    //publishData(topic, payload);
    flag2 = false;
    res.status(200).send('ok');
});

app.listen(port, () => {
    console.log(`Express server listening on port : ${port} -- socket.io on port ${8081}`)
});

