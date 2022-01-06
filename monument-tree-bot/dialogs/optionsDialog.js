
const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
//const { myStorage } = require('../index');


const CONFIRM_PROMPT = 'confirmPrompt';
const DATE_RESOLVER_DIALOG = 'dateResolverDialog';
const TEXT_PROMPT = 'TextPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';

const { LuisRecognizer } = require('botbuilder-ai');
const { 
    TREEBYCITY_DIALOG,
    TreeByCityDialog
} = require("./treeByCityDialog");

const { 
    GOTOTREE_DIALOG,
    GoToTreeDialog
} = require("./gotoTreeDialog");

const {
    SEARCHBYIMG_DIALOG,
    SearchByImgDialog
} = require('./searchByImgDialog');

class OptionDialog extends CancelAndHelpDialog {
    constructor(id, luisRecognizer) {
        super(id || 'optionsDialog');

        
        if (!luisRecognizer) throw new Error('[MainDialog]: Missing parameter \'luisRecognizer\' is required');
        this.luisRecognizer = luisRecognizer;

        this.addDialog(new TreeByCityDialog());
        this.addDialog(new GoToTreeDialog());
        this.addDialog(new SearchByImgDialog());
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.optionsStep.bind(this),
                this.luisStep.bind(this),
                this.loopStep.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }




    

    async optionsStep(stepContext){
        
        var messageText = 'Cosa puoi fare in Monument Tree';
        messageText += '\n1. Cercare alberi monumentali per località ed ottenere info'
        messageText += '\n2. Raggiungere uno specifico albero monuentale'
        messageText += '\n3. Cerca alberi simili caricando una foto';

        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }



    async luisStep(stepContext){
        
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        switch (LuisRecognizer.topIntent(luisResult)) {
            
                        case 'InformazioniByZona': {
                            return await stepContext.beginDialog(TREEBYCITY_DIALOG);              
                        }
                
                        case 'AlberiByPhoto': {
                            // We haven't implemented the GetWeatherDialog so we just display a TODO message.
                            const msg = MessageFactory.text("Mi hai chiesto gli alberi data una foto!", "Mi hai chiesto gli alberi data una foto!", InputHints.ExpectingInput);
                            return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });

                        }

                        case 'PosizioneByAlbero': {
                            // We haven't implemented the GetWeatherDialog so we just display a TODO message.
                            const msg = MessageFactory.text("Vuoi raggiungere uno specifico albero!", "Vuoi raggiungere uno specifico albero!", InputHints.ExpectingInput);
                            return await stepContext.beginDialog(GOTOTREE_DIALOG);
                        }

                        case 'SearchByImg': {
                            // We haven't implemented the GetWeatherDialog so we just display a TODO message.
                            const msg = MessageFactory.text("Vuoi caricare una foto di un albero!", "Vuoi caricare una foto di un albero!", InputHints.ExpectingInput);
                            return await stepContext.beginDialog(SEARCHBYIMG_DIALOG);
                        }
                
                    default: {
                        // Catch all for unhandled intents
                        const didntUnderstandMessageText = `Sorry, I didn't get that. Please try asking in a different way (intent was ${ LuisRecognizer.topIntent(luisResult) })`;
                        await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
                    }
                }


        

        const msg = MessageFactory.text("Errore", "Errore", InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }
    
    
    async loopStep(step) {
        return await step.replaceDialog(this.id);
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.OptionDialog = OptionDialog;
