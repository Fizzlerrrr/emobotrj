var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
var builder_cognitiveservices = require("botbuilder-cognitiveservices");
var https = require('https');
var rp = require('request-promise');
var motivation = require("motivation");

var header = {'Content-Type':'application/json', 'Ocp-Apim-Subscription-Key':'2da990e859714a8eb2ead6284c1b2c6e'}
var requestUrl = 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment';
var task;

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

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);

var recognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: process.env.QnAKnowledgebaseId,
    authKey: process.env.QnAAuthKey || process.env.QnASubscriptionKey, // Backward compatibility with QnAMaker (Preview)
    endpointHostName: process.env.QnAEndpointHostName
});

var basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: 'No match! Try changing the query terms!',
    qnaThreshold: 0.3
}
);

bot.dialog('basicQnAMakerDialog', basicQnAMakerDialog);

//bot.dialog('/', //basicQnAMakerDialog);
//    [
//        function (session) {
//            var qnaKnowledgebaseId = process.env.QnAKnowledgebaseId;
//            var qnaAuthKey = process.env.QnAAuthKey || process.env.QnASubscriptionKey;
//            var endpointHostName = process.env.QnAEndpointHostName;
//            session.beginDialog('basicQnAMakerDialog');
//            
//        }
//    ]);

bot.dialog('/', function(session) {
    
    
        sendGetSentimentRequest(session.message.text).then(function (parsedBody) {                    
            console.log(parsedBody);
            var score = parsedBody.documents[0].score.toString();
            session.send('Your score: '+ score);
//            if(score > 0.80) {                    // happy
//			         session.send('happy' + score);
//             } else if(score > 0.1) {             // stressed
//			         session.send('stressed' + score);
//             } else {                             // crisis
//                   session.send('crisis' + score);
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
            documents:[{id:'1', language: 'zh', text:message}]
        },
        json: true, // Automatically stringifies the body to JSON,
        headers: header
    };
    return rp(options);
}







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