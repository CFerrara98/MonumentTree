
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
        
        var messageText = 'Con questo bot puoi ottenere informazioni sui bellissimi alberi monumentali della regione Campania.\n';
        messageText += '\nEcco cosa puoi fare in Monument Tree:'
        messageText += '\n1. Cercare e visitare alberi monumentali partendo dal nome di una località'
        messageText += '\n2. Cercare e visitare un albero monumentale di tuo interesse inserendone il nome'
        messageText += '\n3. Scattare una foto ed effettuare una ricerca per similarità con tutti gli alberi in archivio\n\n'
        messageText += '\nCon le funzionalità di ricerca puoi anche ricevere una e-mail contenente la scheda dell\'albero che ti piace!'

        const msg = MessageFactory.text(messageText, messageText, InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }



    async luisStep(stepContext){
        
        const luisResult = await this.luisRecognizer.executeLuisQuery(stepContext.context);
        switch (LuisRecognizer.topIntent(luisResult,"",0.7)) {
            
                        case 'InformazioniByZona': {
                            return await stepContext.beginDialog(TREEBYCITY_DIALOG);              
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
                        const didntUnderstandMessageText = `Scusami non ho capito, prova a digitare un nuovo messaggio.`;
                        await stepContext.context.sendActivity(didntUnderstandMessageText, didntUnderstandMessageText, InputHints.IgnoringInput);
                        return await stepContext.replaceDialog(this.id);
                    }
                }


        

        const msg = MessageFactory.text("Errore", "Errore", InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }
    
    
    async loopStep(stepContex) {
        return await stepContex.replaceDialog(this.id);
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.OptionDialog = OptionDialog;
