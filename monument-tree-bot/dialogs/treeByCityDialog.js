
const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory, ActivityTypes, CardFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');
const { CosmosClient } = require("@azure/cosmos");
const endpoint = process.env["CosmosDbEndpoint"];
const key = process.env["CosmosDbAuthKey"];
const clientDB = new CosmosClient({ endpoint, key });

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
        const msg = MessageFactory.text("Inserisci il comune di interesse", "Inserisci la città di interesse", InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }

    async getTreeCity(stepContext) {

        
        //CosmosDB
        const { database } = await clientDB.databases.createIfNotExists({ id: "Alberi" });
   
        const { container } = await database.containers.createIfNotExists({ id: "Alberi" });

        var queri = "SELECT * FROM c WHERE LOWER(c.COMUNE) = '"+stepContext.result+"'";
        const reply = {
            type: ActivityTypes.Message
        };

        const { resources } = await container.items
        .query(queri)
        .fetchAll();

        if(resources.length == 0){
            const msg = MessageFactory.text("Non ci sono alberi monumentali nel comune di "+stepContext.result , "Non ci sono alberi monumentali nel comune di "+stepContext.result, InputHints.ExpectingInput);
            await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }else{
            for (const o of resources) {
                console.log("Alberi trovati:" + o.NOME_VOLGA);
                var alberoCard = CardFactory.thumbnailCard(
                    o.NOME_VOLGA,
                        [{
                            url: o.FOTO,
                        }],
                        [{
                            type: 'openUrl',
                            title: 'Link alla scheda dell\'albero',
                            value: o.SCHEDA,
                        }], {
                            subtitle: o.LOCALITA + ', ' + o.COMUNE,
                            text: o.DESCRIZIONE
                        }
                );
        
                reply.attachments = [alberoCard];
                await stepContext.context.sendActivity(reply);            
                //context.res = {
                    //status: 200, 
                    //body: o.numMask
                //};
                //break;
            }
            
        }

        return await stepContext.endDialog();
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.TreeByCityDialog = TreeByCityDialog;
module.exports.TREEBYCITY_DIALOG = TREEBYCITY_DIALOG;
