
const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory, ActivityTypes, CardFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');



const TEXT_PROMPT = 'TextPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const GOTOTREE_DIALOG = 'GOTOTREE_DIALOG';

const MAPS_DIALOG = 'MAPS_DIALOG';

const { CosmosClient } = require("@azure/cosmos");
const { MainDialog } = require('./mainDialog');
const { MapsDialog } = require('./mapsDialog');

const endpoint = process.env["CosmosDbEndpoint"];
const key = process.env["CosmosDbAuthKey"];
const clientDB = new CosmosClient({ endpoint, key });

const listanomi = [];

class GoToTreeDialog extends CancelAndHelpDialog {
    constructor(userState) {
        super(GOTOTREE_DIALOG);


        this.addDialog(new MapsDialog(MAPS_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.askName.bind(this),
                this.getTreeByName.bind(this),
                this.selectTreeOrNot.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async askName(stepContext) {
        const msg = MessageFactory.text("Inserisci il nome dell'albero che vorresti visitare", "Inserisci il nome dell'albero che vorresti visitare", InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }

    async getTreeByName(stepContext) {


        //CosmosDB
        const { database } = await clientDB.databases.createIfNotExists({ id: "Alberi" });

        const { container } = await database.containers.createIfNotExists({ id: "Alberi" });

        var query = "SELECT * FROM c WHERE LOWER(c.NOME_VOLGA) LIKE LOWER('%"+stepContext.result+"%')";
        const reply = {
            type: ActivityTypes.Message
        };


        const { resources } = await container.items
        .query(query)
        .fetchAll();

        if(resources.length == 0){
            const msg = MessageFactory.text("Non ci sono alberi monumentali denominati come "+stepContext.result , "Non ci sono alberi monumentali denominati come "+stepContext.result, InputHints.ExpectingInput);
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
                            text: '{"NomeAlbero": "'+ o.NOME_VOLGA +  '", "Latitudine": "'+  o.Latitudine + '", "Longitudine": "'+  o.Longitudine +'"}',
                            value: {albero: o._id}
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


    async selectTreeOrNot(stepContext){

        try {
            var string = stepContext.result;
            let parsed = JSON.parse(string);
    
            if(listanomi.includes(parsed.NomeAlbero)) {
                console.log("pippo");
    
                return await stepContext.beginDialog(MAPS_DIALOG, {"TreeName": parsed.NomeAlbero, "Latitude" : parsed.Latitudine, "Longitude" : parsed.Longitudine});
            } else{
                console.log("Pluto");
                return await stepContext.endDialog();
            }
        } catch (error) {
            console.log(stepContext.attachments);
            return await stepContext.endDialog();
        }
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.GoToTreeDialog = GoToTreeDialog;
module.exports.GOTOTREE_DIALOG = GOTOTREE_DIALOG;
