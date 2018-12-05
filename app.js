"use strict";
var restify = require('restify');
var builder = require('botbuilder');
var https = require('https');
var rp = require('request-promise');
var motivation = require("motivation");

var header = {'Content-Type':'application/json', 'Ocp-Apim-Subscription-Key':'2da990e859714a8eb2ead6284c1b2c6e'}
var requestUrl = 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment';
var task;

var builder_cognitiveservices = require("botbuilder-cognitiveservices");

var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector);

server.post('/api/messages', connector.listen());

var QnAAuthKey = '4ffdbcc6-2b58-4606-a186-b6008b0a9874';
var QnAKnowledgebaseId = '06b6bed1-c2ef-4a07-b8c7-6eb1318073fa';
var QnAEndpointHostName = 'https://emoqna.azurewebsites.net/qnamaker';

var recognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: QnAKnowledgebaseId,
    authKey: QnAAuthKey,
    endpointHostName: QnAEndpointHostName
});

var basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: '你说什么？',
    qnaThreshold: 0.1
}
);

bot.dialog('basicQnAMakerDialog', basicQnAMakerDialog);

bot.on('conversationUpdate', function (message) {
    if (message.membersAdded[0].id === message.address.bot.id) {
        var reply = new builder.Message()
                .address(message.address)
                .text(
                    '欢迎试用MedEmo医患情绪沟通模拟训练系统' + '<br/>'
                          +'医生你好，我来是因为'+ '<br/>' 
                          +'1. 正畸效果不好😠' + '<br/>'
                          +'2. 牙龈肿痛😔 ' + '<br/>'
                          +'3. 日常检查😀 ' + '<br/>'
                );
        bot.send(reply);
    }
});

bot.dialog('/', function(session) {
    
    
        sendGetSentimentRequest(session.message.text).then(function (parsedBody) {                    
            console.log(parsedBody);
            var score = parsedBody.documents[0].score.toString();
            session.send('Your score: '+ score);
//            if(score > 0.80) {                    // happy
//			         session.beginDialog("/happy");
//             } else if(score > 0.1) {             // stressed
//			         session.beginDialog("/stressed");
//             } else {                             // crisis
//               session.beginDialog("/crisis");
//             }
        })
        .catch(function (err) {
            console.log("POST FAILED: " + err);
        });

            var qnaKnowledgebaseId = QnAKnowledgebaseId;
            var qnaAuthKey = QnAAuthKey || process.env.QnASubscriptionKey;
            var endpointHostName = QnAEndpointHostName;
            session.beginDialog('basicQnAMakerDialog');
    
    
  });

function sendGetSentimentRequest(message) {
    var options = {
        method: 'POST',
        uri: requestUrl,
        body: {
            documents:[{id:'1', language: 'en', text:message}]
        },
        json: true, // Automatically stringifies the body to JSON,
        headers: header
    };
    return rp(options);
}
