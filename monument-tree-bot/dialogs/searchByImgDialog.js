
const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory, ActivityTypes, CardFactory, ActivityHandler, ActionTypes } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, AttachmentPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const TEXT_PROMPT = 'TextPrompt';
const ATTACHMENT_PROMPT = 'AttachmentPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const SEARCHBYIMG_DIALOG = 'SEARCHBYIMG_DIALOG';
const MAPS_DIALOG = 'MAPS_DIALOG';
const SENDMAIL_DIALOG = 'SENDMAIL_DIALOG';

const { CosmosClient } = require("@azure/cosmos");
const { MainDialog } = require('./mainDialog');
const { MapsDialog } = require('./mapsDialog');
const {SendMailDialog} = require('./sendMailDialog');
const http = require('http');

const endpoint = process.env["CosmosDbEndpoint"];
const key = process.env["CosmosDbAuthKey"];
const clientDB = new CosmosClient({ endpoint, key });
const deepai = require('deepai');
const fs = require('fs');
const { Console } = require('console');
deepai.setApiKey('959272fd-773e-4cd4-a2e0-843c2a2b495f');

const listaurl = [];
const listaschede = [];


class SearchByImgDialog extends CancelAndHelpDialog {
    constructor(userState) {
        super(SEARCHBYIMG_DIALOG);
        this.addDialog(new MapsDialog(MAPS_DIALOG))
            .addDialog(new AttachmentPrompt('AttachmentPrompt'))
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
        return await stepContext.prompt(ATTACHMENT_PROMPT, { prompt: msg });
    }

    async searchTree(stepContext) {

        
        
        var Attachment = stepContext.result;
        console.log("foto: "+ Attachment[0].contentUrl);
        const imgSend = Attachment[0].contentUrl;

        var bestFit = 100;
        var bestFitUrl = "";
        var bestschedaUrl = "";

       /* 
       da usare per il servizio DeepLearn in locale
       const https = require('https');

        const file = fs.createWriteStream("./file.jpg");
        const request = http.get(imgSend, function(response) {
        response.pipe(file);
        });
        console.log("File: "+JSON.stringify(file));*/
        
        //CosmosDB
        const { database } = await clientDB.databases.createIfNotExists({ id: "Alberi" });
        const { container } = await database.containers.createIfNotExists({ id: "Alberi" });

        var query = "SELECT * FROM c";
        const {resources} = await container.items
        .query(query)
        .fetchAll();
        for (const o of resources) {
            listaurl.push(o.FOTO);
            listaschede.push(o.SCHEDA);
        }
        
        var i, imgurl, schedaurl, index;

        for ( i = 0; i < 15 ; i++) {

            index = Math.floor(Math.random() * listaurl.length) - 1;
            imgurl = listaurl[index];
            schedaurl = listaschede[index];

            var resp = await deepai.callStandardApi("image-similarity", {
                /*
                locale
                image1: fs.createReadStream("./file.jpg"),
                */
                image1: imgSend,
                image2: imgurl,
            });
            var similarity = parseInt(JSON.stringify(resp.output.distance));
            console.log("risposta: " + similarity);
            if (similarity < bestFit) {
                bestFit = similarity;
                bestFitUrl = imgurl;
                bestschedaUrl = schedaurl;
            }
            console.log("Best similar image: " + bestFitUrl);
        }
        
        msg = MessageFactory.text("Ho eseguito l\'algoritmo di similarità! E\' stata trovata una maggior similarità con l\'albero: " + bestschedaUrl, "Ho eseguito l\'algoritmo di similarità!", InputHints.ExpectingInput);
        await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        return await stepContext.endDialog();
    }
}

module.exports.SearchByImgDialog = SearchByImgDialog;
module.exports.SEARCHBYIMG_DIALOG = SEARCHBYIMG_DIALOG;
