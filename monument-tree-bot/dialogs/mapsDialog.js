const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory, ActivityTypes, CardFactory } = require('botbuilder');
const { ConfirmPrompt, TextPrompt, WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const TEXT_PROMPT = 'TextPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const MAPS_DIALOG = 'MAPS_DIALOG';

const { CosmosClient } = require("@azure/cosmos");
const endpoint = process.env["CosmosDbEndpoint"];
const key = process.env["CosmosDbAuthKey"];
const clientDB = new CosmosClient({ endpoint, key });

const fetch = require('node-fetch');


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
        const msg = MessageFactory.text("Vuoi Raggiungere l'albero: " + stepContext._info.options.TreeName, "", InputHints.ExpectingInput);
        await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        
        var Latitude = stepContext._info.options.Latitude;
        var Longitude = stepContext._info.options.Longitude;
        var Name = stepContext._info.options.TreeName;

        await this.getMap(stepContext,  Latitude, Longitude, Name);

        const reply = {
            type: ActivityTypes.Message
        };



       const redirect = CardFactory.heroCard('',
        undefined,[
            {
                type: 'openUrl',
                title: 'Open in google maps',
                value: 'http://www.google.com/maps/place/' + Latitude+ ','+ Longitude
            }]);

        reply.attachments = [redirect];
        await stepContext.context.sendActivity(reply);

        return await stepContext.endDialog();

    }

    async getMap(stepContext, latitude, longitude, name) {
        var requestOptions = {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          redirect: 'follow'
        };
    
        
        const result = await fetch(`https://atlas.microsoft.com/map/static/png?subscription-key=${ process.env.AZURE_MAPS_KEY }&api-version=1.0&layer=basic&zoom=13&center=${ longitude },${ latitude }&language=en-US&pins=default|al.67|la12 3|lc000000||'${name}!'${ longitude } ${ latitude }&format=png`, requestOptions)
          .then(response => response.arrayBuffer())
          .then(async result => {
            const bufferedData = Buffer.from(result, 'binary');
            const base64 = bufferedData.toString('base64');
            const reply = { type: ActivityTypes.Message };
            const attachment = {
              contentType: 'image/png',
              contentUrl: `data:image/png;base64,${ base64 }`
            };
    
            reply.attachments = [attachment];
            await stepContext.context.sendActivity(reply, null, InputHints.IgnoringInput);
          })
          .catch(error => {
            if (error) throw new Error(error);
          });
    
        return result;
      };



    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }

   
}

module.exports.MapsDialog = MapsDialog;
module.exports.MAPS_DIALOG = MAPS_DIALOG;
