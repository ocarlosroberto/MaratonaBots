var restify = require('restify');
var builder = require('botbuilder');
var cognitiveservices = require('botbuilder-cognitiveservices');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
bot.set('storage', new builder.MemoryBotStorage());         // Register in-memory state storage
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

var recognizer = new cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId: '5cdab6c4-52e3-4bd5-a601-79e7098eac77',
    subscriptionKey: 'ff1aeeeefefc4922961947a82616b29c',
    top: 3});

var qnaMakerTools = new cognitiveservices.QnAMakerTools();
bot.library(qnaMakerTools.createLibrary());

var basicQnAMakerDialog = new cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
    defaultMessage: 'Desculpe, não entendi! Poderia repetir a pergunta com outras palavras?',
    qnaThreshold: 0.3,
    feedbackLib: qnaMakerTools
});

basicQnAMakerDialog.respondFromQnAMakerResult = (session, qnaMakerResult) =>
{
    const primeiraResposta = qnaMakerResult.answers[0].answer;
    const respostaComposta = primeiraResposta.split(';');
    if(respostaComposta.length === 1)
    {
        return session.send(primeiraResposta);
    }
    //const [title, description, url, image] = respostaComposta;
    const resposta = respostaComposta;
    const card = new builder.HeroCard(session)
        .title(resposta[0])
        .text(resposta[1])
        .images([builder.CardImage.create(session, resposta[3].trim())])
        .buttons([builder.CardAction.openUrl(session, resposta[2].trim(), 'Comprar agora')]);
    const reply = new builder.Message(session).addAttachment(card);
    session.send(reply);
}

bot.dialog('/', basicQnAMakerDialog);
