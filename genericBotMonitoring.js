/**
 * This is the Rest Service, it will communicate to Bot Platform via Web Socket
 * 
 * Reference :: https://github.com/websockets/ws
 */
/////////////////////////   config   //////////////////////////
var config = require('./config.json');
var host = config.host;
var botName = config.botName;
var streamId = config.streamId;
var identity = config.identity;
var clientId = config.appClientId;
var clientSecret = config.appClientSecret;
var isAnonymous = true;
//var aud =  "https://idproxy.kore.com/authorize";
var fName = config.firstName; 
var lName = config.lastName;
////////////////////////////////////////////////////////////////

var bodyParser = require('body-parser');
const express = require('express');
var template = require('url-template');

var Promise = require('bluebird');
var request = require('request-promise');
var jwt = require('jsonwebtoken');

var ws;
var message;
var accessToken = "";
var jwtToken = "";

var startAPI_URL = host + "/api/1.1/rtm/start";
var JWT_GRANT_API = host + "/api/1.1/oAuth/token/jwtgrant";

var state = 'idle',
    response;
var wsState;

const http = require('http');
const url = require('url');
const WebSocket = require('ws');
//const app = express();
var clientRes;
var count = 1;
var callB ="";

var pingPayload = {
    "type": "ping",
    "resourceid": "/bot.message",
    "botInfo": {
        "chatBot": botName,
        "taskBotId": streamId,
        token: {}
    },
    "client": "sdk",
    "meta": {
        "timezone": "Asia/Kolkata",
        "locale": "en-GB"
    },
    "id": count
}

/**
 * Very first we need to get the jwt token by using jsonwebtoken module
 */
getJWTToken();

/**
 * Once the JWT Toke  available with that need to get the access/Bearer Toekn before initializing the websocket
 */

/**
 * Get the WebSocket API and initializ the Web Socket
 */
var init = function(callback) {
    //console.log("cbb"+callback)
    return new Promise(function (resolve, reject) {
        try {
        
		getBearerToken(callback).then(function(resp) { getStartAPI(resp.callback).then(function(res) {
            console.log("Inside websocket init@@@@@@@:   ",res.url);
			webSocketInit(res.url, res.callback);
			//console.log(ws);
         		resolve("done");
                });});
	}catch(err){
	    reject(err);	

        }

    });

}


/**
 * Ping - pong needed to keep alive the web-socket
 */
var initPingPong = function(time) {
    setTimeout(function timeout() {
        //console.log(JSON.stringify(pingPayload));
        ws.send(JSON.stringify(pingPayload));
    }, time);
}

initPingPong(40000);

	/**
 * Getting the JsonWebToken
 */
function getJWTToken(){
    var options = {
    "iat": new Date().getTime(),
    "exp": new Date(new Date().getTime() + 24 * 60 * 60 * 1000).getTime(),
    //"aud": aud,
    "iss": clientId,
    "sub": identity,
    "isAnonymous": isAnonymous
    }
    var headers = {};
    if(fName || lName) {
    headers.header = {
    "fName" : fName,
    "lName" : lName
    }
    }
    var token = jwt.sign(options, clientSecret, headers);
    jwtToken = token;
    console.log("jwt token"+token);
}

/**
 * Get the Authentication/Bearer Token and initialize the
 */

 function getBearerToken(callback){
    var url = template.parse(JWT_GRANT_API).expand({});
    
    var _body = {
        "assertion": jwtToken,   
        "botInfo": {
            "chatBot": botName,
            "taskBotId": streamId
        },
        "token": {}
      };
    
    var options = {
        method: 'POST',
        uri: url,
        headers: {
            'Content-Type': "application/json"
        },

        body: JSON.stringify(_body)
    };
    return request(options).then(function(res) {
	var resp = JSON.parse(res);
        var _token = JSON.parse(res);
        accessToken = _token.authorization.accessToken;
            console.log("access token"+accessToken);
            resp.callback = callback;
	//init();
        return Promise.resolve(resp);
    }).catch(function(err) {
        return Promise.reject(err);
    })

 }


/**
 * Get the Web Socket API from this 
 */
function getStartAPI(callback) {  
           

    var url = template.parse(startAPI_URL).expand({});
    var _body = {
        "botInfo": {
            "chatBot": botName,
            "taskBotId": streamId
        },
        "token": {}
    };
    var options = {
        method: 'POST',
        uri: url,
        headers: {
            'Content-Type': "application/json",
            'Authorization': "bearer " + accessToken
        },

        body: JSON.stringify(_body)
    };
    return request(options).then(function(res) {
        var resp = JSON.parse(res);
        resp.callback = callback;
        return Promise.resolve(resp);
    }).catch(function(err) {
        return Promise.reject(err);
    })
}


/**
 * WebSocket Initialization
 */
function webSocketInit(url, callback) {
    ws = new WebSocket(url);
    var startTime , stopTime, respTime;
    console.log("call back .."+callback);
    ws.on('open', function open() {
       console.log('Connected ' + new Date());
	   wsState = 'open';
       startTime = new Date();
       console.log('Start time: ' + startTime);
    });
    ws.on('close', function close() {
        console.log('disconnected ' + new Date());

    });

    ws.on('message', function incoming(message) {
        console.log("Message!!!!### "+ message + " " + new Date());
        count = count + 1;
        var _msg = JSON.parse(message);
        console.log("type."+_msg.type);
        if (_msg.type === 'bot_response') {
            stopTime = new Date();
            respTime = stopTime - startTime;
            state = 'done';
            //response = _msg.message[0].component.payload.text;
            //callback(null,response); 
            //return _msg;
            console.log('Stop time: ' + stopTime);
            _msg.responseTimeMs = respTime;
            callback.send(_msg);
            ws.close();
        }

        if (message.indexOf("pong") > -1) {
            initPingPong(50000);
        }
    });
}

/** 
 * This is to send data to Web Socket
 */
function webSocketSend(msg) {
    var reqPayload = {
        "clientMessageId":1519890390169,
        "message":{"body":msg},
        "resourceid":"/bot.message",
        "botInfo":{"chatBot": botName,"taskBotId": streamId,
        "client":"sdk","meta":{"timezone":"Asia/Kolkata","locale":"en-US"},
        "id":1519890390169}};
    console.log("Request Payload: "+JSON.stringify(reqPayload));
    return Promise.resolve(ws.send(JSON.stringify(reqPayload)));
}

function printResponse(response) {
  console.log("..printing response..");
  console.log("Print response: ",response);
}

var app = express();

app.get('/send', function(req, res){
    console.log(req.query.message);
    init(res).then(function(){
        setTimeout(function(){webSocketSend(req.query.message).then(setTimeout(function(){ws.close()},2000))}, 2000);
    });
    
});

app.listen(3000);


