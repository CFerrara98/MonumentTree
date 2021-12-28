
const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory, ActivityTypes, CardFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const TEXT_PROMPT = 'TextPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const TREEBYCITY_DIALOG = 'TREEBYCITY_DIALOG';

class TreeByCityDialog extends CancelAndHelpDialog {
    constructor(userState) {
        super(TREEBYCITY_DIALOG);


        this/*addDialog(new TextPrompt(TEXT_PROMPT))
            .addDialog(new ConfirmPrompt(CONFIRM_PROMPT))
            .addDialog(new DateResolverDialog(DATE_RESOLVER_DIALOG))*/
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.askCity.bind(this),
                this.getTreeCity.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }    
    
    async askCity(stepContext) {
        const msg = MessageFactory.text("Inserisci la città di interesse", "Inserisci la città di interesse", InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }

    async getTreeCity(stepContext) {
        const reply = {
            type: ActivityTypes.Message
        };

        var alberoCard = CardFactory.thumbnailCard(
            'Nome albero',
                [{
                    url: 'http://agricoltura.regione.campania.it/foreste/monum/img/01.jpg'
                }],
                [{
                    type: 'openUrl',
                    title: 'Link alla scheda dell\'albero',
                    value: 'http://agricoltura.regione.campania.it/foreste/monum/scheda_01.html'
                }], {
                    subtitle: 'città',
                    text: 'descrizione'
                }
        );

        reply.attachments = [alberoCard];
        return await stepContext.context.sendActivity(reply);
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.TreeByCityDialog = TreeByCityDialog;
module.exports.TREEBYCITY_DIALOG = TREEBYCITY_DIALOG;
