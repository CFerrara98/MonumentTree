const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory, ActivityTypes, CardFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const TEXT_PROMPT = 'TextPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const MAPS_DIALOG = 'MAPS_DIALOG';

const { CosmosClient } = require("@azure/cosmos");
const { MainDialog } = require('./mainDialog');
const endpoint = process.env["CosmosDbEndpoint"];
const key = process.env["CosmosDbAuthKey"];
const clientDB = new CosmosClient({ endpoint, key });

const listanomi = [];

class MapsDialog extends CancelAndHelpDialog {
    constructor(userState) {
        super(MAPS_DIALOG);


        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.searchPath.bind(this),
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }    
    
    async searchPath(stepContext) {
        const msg = MessageFactory.text("Vuoi Raggiungere l'albero: ", "", InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }

   

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.MapsDialog = MapsDialog;
module.exports.MAPS_DIALOG = MAPS_DIALOG;
