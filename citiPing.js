/**
 * This is the Rest Service, it will communicate to Bot Platform via Web Socket
 * 
 * Reference :: https://github.com/websockets/ws
 */
/////////////////////////   config   //////////////////////////
var config = require('./config.json');
var botName = config.botName;
var streamId = config.streamId;
var clientSecret = config.clientSecret;
var isAnonymous = true;
var retrieveTokenUrl = config.retrieveTokenUrl;
var socketUrl = config.socketUrl;
var covaClientId = config.covaClientId;
////////////////////////////////////////////////////////////////
var schedular = require('node-schedule');
var bodyParser = require('body-parser');
const express = require('express');
var template = require('url-template');

var Promise = require('bluebird');
var request = require('request-promise');
var jwt = require('jsonwebtoken');

var ws;
var message;

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
 * Get the WebSocket API and initializ the Web Socket
 */
var init = function(callback) {
    //console.log("cbb"+callback)
    return new Promise(function (resolve, reject) {
        try {
        
		retrieveToken(callback).then(function(resp) { getStartAPI(resp.ssgAuthorization.access_token, resp.authorization.accessToken, resp.callback).then(function(res) {
			webSocketInit(res, res.callback);
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

//initPingPong(40000);

function retrieveToken(callback){
    var url = retrieveTokenUrl+'/gcgapi/uat3/api/prelogin/digital/users/chatBot/koreServices/tokenAndUserInfo/retrieve';
    console.log(url);
    var _body = {
        "botInfo": {
            "chatBot": botName,
            "taskBotId": streamId
        } 
    };    
    var options = {
        method: 'POST',
        uri: url,
        headers: {
            'Content-Type': "application/json",
            'channelid': 'CRSDESKTOP',
            'siteid': 'PLCN_HOMEDEPOT',
            'client_id': covaClientId,
            'businesscode': 'CRS'
        },

        body: JSON.stringify(_body)
    };
    return request(options).then(function(res) {
        var resp = JSON.parse(res);
        var _token = JSON.parse(res);
        accessToken = _token.ssgAuthorization.access_token;
        authToken = _token.authorization.accessToken;
        console.log("access token##### "+accessToken);
        resp.callback = callback;
        return Promise.resolve(resp);         
    }).catch(function(err) {
        return Promise.reject(err);
    })
}



/**
 * Get the Web Socket API from this 
 */
function getStartAPI(accessToken,authToken, callback) {  
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
    var url = "https://"+socketUrl+"/Fusion/api/rtm/start?Auth="+accessToken;
    console.log("SOA url: ", url);
    var _body = {"botInfo":{"chatBot":"THE HOME DEPOT","taskBotId": streamId,"customData":{"productName":"The Home Depot® Consumer Credit Card","changedueDateFlag":"","isUserCops":""},"tenanturl":{}},"token":{}};    
    var options = {
        method: 'POST',
        uri: url,
        headers: {
            'Content-Type': "application/json",
            'Authorization': 'bearer '+authToken,
            'Kore_Authorization': 'bearer '+authToken,
            'accept': 'application/json',
            'Host': socketUrl,
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site'
        },
    
        body: JSON.stringify(_body)
    };
    return request(options).then(function(res) {
        var resp = JSON.parse(res);
        resp.callback = callback;
        resp.acessToken = accessToken;
        console.log("Response from the start api: ", resp);
        return Promise.resolve(resp);
    }).catch(function(err) {
        return Promise.reject(err);
    })
}


/**
 * WebSocket Initialization
 */
function webSocketInit(newObj, callback) {
    console.log("Inside ws init");
    console.log(newObj.url);
    var newUrl = newObj.url.split('?');
    newUrl = newUrl[1];
    var accessToken = newObj.acessToken;
    newUrl = "wss://"+socketUrl+"/Fusion/rtm/bot?"+newUrl+"&Auth="+accessToken;
    ws = new WebSocket(newUrl);
    console.log("url .."+newUrl);
    ws.on('open', function open() {
    console.log('Connected ' + new Date());
	wsState = 'open';
    });
    ws.on('close', function close() {
    console.log('disconnected ' + new Date());
    });

    ws.on('message', function incoming(message) {
        console.log(message + " " + new Date());
        console.log("Bot Message: ",message);
        count = count + 1;
        var _msg = JSON.parse(message);
        console.log("type."+_msg.type);
        if (_msg.type === 'bot_response') {
            state = 'done';
            response = _msg.message[0].component.payload.text;
		    //callback(null,response); 
            //return _msg;
            callback.send(_msg);
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