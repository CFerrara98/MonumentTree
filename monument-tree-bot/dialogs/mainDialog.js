// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { MessageFactory, InputHints } = require('botbuilder');

const { ComponentDialog, DialogSet, DialogTurnStatus, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { TREEBYCITY_DIALOG,
    TreeByCityDialog
} = require('./treeByCityDialog');

const MAIN_WATERFALL_DIALOG = 'mainWaterfallDialog';



class MainDialog extends ComponentDialog {

    optionDialog = null;
    constructor(luisRecognizer, optionDialog) {
        super('MainDialog');

        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        if (!optionDialog) throw new Error('[MainDialog]: Missing parameter \'optionDialog\' is required');

        this.optionDialog = optionDialog;
        // Define the main dialog and its related components.
        // This is a sample "book a flight" dialog.
        this.addDialog(new TextPrompt('TextPrompt'));
        this.addDialog(optionDialog);
        this.addDialog(new TreeByCityDialog());
        this.addDialog(new WaterfallDialog(MAIN_WATERFALL_DIALOG, [
                this.introStep.bind(this),
                this.actStep.bind(this),
                this.finalStep.bind(this)
            ]));

        this.initialDialogId = MAIN_WATERFALL_DIALOG;
    }

    /**
     * The run method handles the incoming activity (in the form of a TurnContext) and passes it through the dialog system.
     * If no dialog is active, it will start the default dialog.
     * @param {*} turnContext
     * @param {*} accessor
     */
    async run(turnContext, accessor) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(turnContext);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

    /**
     * First step in the waterfall dialog. Prompts the user for a command.
     * Currently, this expects a booking request, like "book me a flight from Paris to Berlin on march 22"
     * Note that the sample LUIS model will only recognize Paris, Berlin, New York and London as airport cities.
     */
    async introStep(stepContext) {
        if (!this.luisRecognizer.isConfigured) {
            const messageText = 'NOTE: LUIS is not configured. To enable all capabilities, add `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName` to the .env file.';
            await stepContext.context.sendActivity(messageText, null, InputHints.IgnoringInput);
            return await stepContext.next();
        }

        const messageText = stepContext.options.restartMsg ? stepContext.options.restartMsg : 'Ciao, cosa posso fare per aiutarti? Scrivi qualcosa per visualizzare le opzioni!\n';
        const promptMessage = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt('TextPrompt', { prompt: promptMessage });
    }

    /**
     * Second step in the waterfall.  This will use LUIS to attempt to extract the origin, destination and travel dates.
     * Then, it hands off to the bookingDialog child dialog to collect any remaining details.
     */
    async actStep(stepContext) {
        const optionDetails = {};

        if (this.luisRecognizer.isConfigured) {
            return await stepContext.beginDialog('optionsDialog');
                        
        }else if (!this.luisRecognizer.isConfigured) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');

        console.log('Option Details:' +  optionDetails);

        // Call LUIS and gather any potential booking details. (Note the TurnContext has the response to the prompt)
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
      

        return await stepContext.next();
    }


    /**
     * This is the final step in the main waterfall dialog.
     */
    async finalStep(stepContext) {
       
        // Restart the main dialog
        return await stepContext.replaceDialog(this.initialDialogId);
    }
}

module.exports.MainDialog = MainDialog;
