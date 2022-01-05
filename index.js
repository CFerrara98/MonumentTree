// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// index.js is used to setup and configure your bot

// Import required packages
const path = require('path');

// Note: Ensure you have a .env file and include LuisAppId, LuisAPIKey and LuisAPIHostName.
const ENV_FILE = path.join(__dirname, '.env');
require('dotenv').config({ path: ENV_FILE });

const restify = require('restify');

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const {
    CloudAdapter,
    ConfigurationServiceClientCredentialFactory,
    ConversationState,
    createBotFrameworkAuthenticationFromConfiguration,
    InputHints,
    MemoryStorage,
    UserState
} = require('botbuilder');

const { MonumentTreeRecognizer } =  require('./dialogs/monumentTreeRecognizer')

// This bot's main dialog.
const { DialogAndWelcomeBot } = require('./bots/dialogAndWelcomeBot');
const { MainDialog } = require('./dialogs/mainDialog');

// the bot's option dialog
const { OptionDialog } = require('./dialogs/optionsDialog');
const OPTIONDIALOG = 'optionsDialog';

//cosmosDB
const { CosmosDbPartitionedStorage } = require('botbuilder-azure');

const myStorage = new CosmosDbPartitionedStorage({
    cosmosDbEndpoint: "https://cosmosmonumentreetbot.documents.azure.com:443/",
    authKey: "Gf1kQr3AGRY1ne9UplCcyYYrhLxKJLieenqP21ETfNn6LkefG1lM15G0iObdYPhLMOPNNe2yHF4cjKfytM5B6A==",
    databaseId: "Alberi",
    containerId: "Alberi",
    compatibilityMode: false
});


const Telegraf = require('telegraf')
const bot = new Telegraf('5032715184:AAHG-BZpaLE2BzxDN9kX-uXp7MIDuFlsRiw')
const EXCHANGE=1.125

bot.start((message) => {
  	return message.reply('Il bot è avviato')
})
bot.command('eur', context=> {
        msg=context.update.message
	importo=msg.text.split(' ')[1]
	dollari=EXCHANGE*importo
	context.reply(`${dollari} USD`)
})
bot.command('usd', context=> {
        msg=context.update.message
	importo=msg.text.split(' ')[1]
	euro=importo/EXCHANGE
	context.reply(`${euro} EUR`)
})
bot.launch()

//the bot's secondary dialog
const { TreeByCityDialog } = require('./dialogs/treeByCityDialog');
const TREEBYCITY_DIALOG = 'treeByCityDialog';

const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: "",
    MicrosoftAppPassword: "",
    MicrosoftAppType: "",
    MicrosoftAppTenantId: ""
});

const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    console.log("1");
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );
    console.log("2");

    // Send a message to the user
    let onTurnErrorMessage = 'The bot encountered an error or bug.';
    await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
    onTurnErrorMessage = 'To continue to run this bot, please fix the bot source code.';
    await context.sendActivity(onTurnErrorMessage, onTurnErrorMessage, InputHints.ExpectingInput);
    // Clear out state
    await conversationState.delete(context);
};

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Define a state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

const LuisAppId = "66db2016-4de7-435c-a4a9-abe157fc6d2a";
const LuisAPIKey = "71f5289adef143a2b6883a184421f4af";
const LuisAPIHostName = "westeurope.api.cognitive.microsoft.com";
const luisConfig = { applicationId: LuisAppId, endpointKey: LuisAPIKey, endpoint: `https://${ LuisAPIHostName }` };

const luisRecognizer = new MonumentTreeRecognizer(luisConfig);

// Create the main dialog.
const optionDialog = new OptionDialog(OPTIONDIALOG, luisRecognizer);
const dialog = new MainDialog(luisRecognizer, optionDialog);
const bot = new DialogAndWelcomeBot(conversationState, userState, dialog);
const treebycitydialog = new TreeByCityDialog(TREEBYCITY_DIALOG);

// Create HTTP server
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, function() {
    console.log(`\n${ server.name } listening to ${ server.url }`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
    console.log("3");
});

// Listen for incoming activities and route them to your bot main dialog.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res, (context) => bot.run(context));
});

// Listen for Upgrade requests for Streaming.
server.on('upgrade', async (req, socket, head) => {
    // Create an adapter scoped to this WebSocket connection to allow storing session data.
    const streamingAdapter = new CloudAdapter(botFrameworkAuthentication);

    // Set onTurnError for the CloudAdapter created for each connection.
    streamingAdapter.onTurnError = onTurnErrorHandler;

    await streamingAdapter.process(req, socket, head, (context) => bot.run(context));
});
console.log("");
module.exports.myStorage = myStorage;
