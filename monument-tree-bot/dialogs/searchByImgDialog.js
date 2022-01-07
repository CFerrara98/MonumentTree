
const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory, ActivityTypes, CardFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const TEXT_PROMPT = 'TextPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const SEARCHBYIMG_DIALOG = 'SEARCHBYIMG_DIALOG';
const MAPS_DIALOG = 'MAPS_DIALOG';
const SENDMAIL_DIALOG = 'SENDMAIL_DIALOG';

const { CosmosClient } = require("@azure/cosmos");
const { MainDialog } = require('./mainDialog');
const { MapsDialog } = require('./mapsDialog');
const {SendMailDialog} = require('./sendMailDialog');

const endpoint = process.env["CosmosDbEndpoint"];
const key = process.env["CosmosDbAuthKey"];
const clientDB = new CosmosClient({ endpoint, key });
const deepai = require('deepai');
const fs = require('fs');
const { Console } = require('console');
deepai.setApiKey('959272fd-773e-4cd4-a2e0-843c2a2b495f');

const listaurl = [];


class SearchByImgDialog extends CancelAndHelpDialog {
    constructor(userState) {
        super(SEARCHBYIMG_DIALOG);
        this.addDialog(new MapsDialog(MAPS_DIALOG))
            .addDialog(new SendMailDialog(SENDMAIL_DIALOG))
            .addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.selectFoto.bind(this),
                this.searchTree.bind(this)
                //this.selectTreeOrNot.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }

    async selectFoto(stepContext) {
        const msg = MessageFactory.text("Carica una foto", "Carica una foto", InputHints.ExpectingInput);
        return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }

    async searchTree(stepContext) {

        var bestFit = 100;
        var bestFitUrl = "";

        //CosmosDB
        const { database } = await clientDB.databases.createIfNotExists({ id: "Alberi" });
        const { container } = await database.containers.createIfNotExists({ id: "Alberi" });

        var query = "SELECT * FROM c";
        const { resources } = await container.items
        .query(query)
        .fetchAll();
        console.log(resources);
        for (const o of resources) {
            listaurl.push(o.FOTO);
        }


        var i, imgurl; 
        for ( i = 0; i < 1 ; i++) {

            imgurl = listaurl[Math.floor(Math.random() * listaurl.length) - 1];

            var resp = await deepai.callStandardApi("image-similarity", {
                image1: fs.createReadStream("C:/Users/carmi/Desktop/Cloud/20022016_albero-monumentale_03.jpg"),
                image2: imgurl,
            });
            var similarity = parseInt(JSON.stringify(resp.output.distance));
            console.log("risposta: " + similarity);
            if (similarity < bestFit) {
                bestFit = similarity;
                bestFitUrl = imgurl;
            }
            console.log("Best similar image: " + bestFitUrl);
        }

        query = "SELECT * FROM c WHERE c.FOTO ='"+bestFitUrl+"'" ;
        const {resources2} = await container.items.query(query).fetchAll();

        for (const o of resources2) {
            var msg = MessageFactory.text("Ho eseguito l\'algoritmo di similarità! E\' stata trovata una similarità del " + bestFit + " con l\'albero: " + o.SCHEDA, "Ho eseguito l\'algoritmo di similarità!", InputHints.ExpectingInput);
            await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }

        var msg = MessageFactory.text("Fratelli e Sorelle Carissimi!, Buon Pranzo!!", InputHints.ExpectingInput);
        return  await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
    }

    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }
}

module.exports.SearchByImgDialog = SearchByImgDialog;
module.exports.SEARCHBYIMG_DIALOG = SEARCHBYIMG_DIALOG;
