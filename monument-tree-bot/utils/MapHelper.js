const { ActivityTypes, InputHints } = require('botbuilder');
const fetch = require('node-fetch');

class MapHelper {

    constructor() {
    }    
    

  async getMap(context, latitude, longitude) {
    var requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      redirect: 'follow'
    };

    const result = await fetch(`https://atlas.microsoft.com/map/static/png?subscription-key=${ process.env.AZURE_MAPS_KEY }&api-version=1.0&layer=basic&zoom=13&center=${ longitude },${ latitude }&language=en-US&pins=default|al.67|la12 3|lc000000||'You!'${ longitude } ${ latitude }&format=png`, requestOptions)
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
        await context.sendActivity(reply, null, InputHints.IgnoringInput);
      })
      .catch(error => {
        if (error) throw new Error(error);
      });

    return result;
  };
};

module.exports.MapHelper = MapHelper;