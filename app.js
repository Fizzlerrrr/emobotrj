var restify = require('restify');
var builder = require('botbuilder');
let https = require ('https');

let accessKey = '2da990e859714a8eb2ead6284c1b2c6e';
let uri = 'westus.api.cognitive.microsoft.com';
let path = '/text/analytics/v2.0/sentiment';

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

//默认dialog

bot.dialog('/', //basicQnAMakerDialog);
    [
        function (session) {
            var qnaKnowledgebaseId = QnAKnowledgebaseId;
            var qnaAuthKey = QnAAuthKey || process.env.QnASubscriptionKey;
            var endpointHostName = QnAEndpointHostName;
//            session.send(session.message);
            session.replaceDialog('basicQnAMakerDialog');

//            session.send(get_sentiments(session.message));
        }
    ]);


bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id === message.address.bot.id) {
                var reply = new builder.Message()
                    .address(message.address)
                    .text('医生你好，我来是因为 1. 正畸效果不好😠 2. 牙龈肿痛😔 3. 日常检查😀 0. 结束治疗✌️');
                bot.send(reply);
            }
        });
    }
});


