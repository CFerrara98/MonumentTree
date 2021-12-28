
const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory, ActivityTypes, CardFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const TEXT_PROMPT = 'TextPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const TREEBYCITY_DIALOG = 'TREEBYCITY_DIALOG';

const MAPS_DIALOG = 'MAPS_DIALOG';

const { CosmosClient } = require("@azure/cosmos");
const { MainDialog } = require('./mainDialog');
const { MapsDialog } = require('./mapsDialog');

const endpoint = process.env["CosmosDbEndpoint"];
const key = process.env["CosmosDbAuthKey"];
const clientDB = new CosmosClient({ endpoint, key });

const listanomi = [];

class TreeByCityDialog extends CancelAndHelpDialog {
    constructor(userState) {
        super(TREEBYCITY_DIALOG);


        this.addDialog(new MapsDialog(MAPS_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.askCity.bind(this),
                this.getTreeCity.bind(this),
                this.selectTreeOrNot.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }    
    
    async askCity(stepContext) {
        const msg = MessageFactory.text("Inserisci la città di interesse", "Inserisci la città di interesse", InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }

    async getTreeCity(stepContext) {

        
        //CosmosDB
        const { database } = await clientDB.databases.createIfNotExists({ id: "Alberi" });
   
        const { container } = await database.containers.createIfNotExists({ id: "Alberi" });

        var query = "SELECT * FROM c WHERE LOWER(c.COMUNE) LIKE LOWER('%"+stepContext.result+"%')";
        const reply = {
            type: ActivityTypes.Message
        };


        const { resources } = await container.items
        .query(query)
        .fetchAll();

        if(resources.length == 0){
            const msg = MessageFactory.text("Non ci sono alberi monumentali nel comune di "+stepContext.result , "Non ci sono alberi monumentali nel comune di "+stepContext.result, InputHints.ExpectingInput);
            await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
            return await stepContext.endDialog();
        }else{
            for (const o of resources) {
                listanomi.push(o.NOME_VOLGA);    
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
                        },
                        {
                            type: 'messageBack',
                            title: "Raggiungi l\'albero",
                            displayText: o.NOME_VOLGA,
                            text: o.NOME_VOLGA,
                            value: {dalbero: o._id}
                        }], {
                            subtitle: o.LOCALITA + ', ' + o.COMUNE,
                            text: o.DESCRIZIONE
                        }
                );
        
                reply.attachments = [alberoCard];
                await stepContext.context.sendActivity(reply);            
                
            }
            
        }

        

        const msg = MessageFactory.text("Clicca Raggiungi un'albero in una delle card oppure scrivi qualcos'altro per andare indietro!" , "", InputHints.ExpectingInput);
        return  await stepContext.prompt(TEXT_PROMPT, { prompt: msg });

    }


    async selectTreeOrNot(stepContext){;
        if(listanomi.includes(stepContext.result)) {
            console.log("pippo");
            return await stepContext.beginDialog(MAPS_DIALOG);
        }
        else{
            console.log("Pluto");
            return await stepContext.endDialog();
        } 
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.TreeByCityDialog = TreeByCityDialog;
module.exports.TREEBYCITY_DIALOG = TREEBYCITY_DIALOG;
