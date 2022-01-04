const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory} = require('botbuilder');
const { WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const sgMail = require('@sendgrid/mail')
const sgApiKey = process.env["SendGridApiKey"];
sgMail.setApiKey(sgApiKey);

const request = require('request');
const { default: axios } = require('axios');



const TEXT_PROMPT = 'TextPrompt';
const WATERFALL_DIALOG = 'waterfallDialog';
const SENDMAILDIALOG = 'SENDMAIL_DIALOG';


class SendMailDialog extends CancelAndHelpDialog {
    constructor(userState) {
        super(SENDMAILDIALOG);

        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
                this.getIntestatario.bind(this),
                this.sendEmail.bind(this)
            ]));

        this.initialDialogId = WATERFALL_DIALOG;
    }    
    
    async getIntestatario(stepContext) {
      const msg = MessageFactory.text("Sto per inviarti le info via mail.\nScrivimi il tuo indirizzo Email!", InputHints.ExpectingInput);
      return  await stepContext.prompt(TEXT_PROMPT, { prompt: msg });

    }
    
    
    async sendEmail(stepContext) {

        var intestatario = stepContext.result;
        
        var nome = stepContext._info.options.nome;
        var localita = stepContext._info.options.localita;
        var image = stepContext._info.options.image;
        var scheda = stepContext._info.options.scheda;


        var message = {

            from: { 
          
              email : "magicgamer88@gmail.com"
          
            },
          
            reply_to: {
          
              email: "magicgamer88@gmail.com"
          
            },
          
            personalizations: [
          
            {
          
            to: [
          
              {
                email : intestatario
              }
          
             ],
          
            dynamic_template_data:{
              "nome": nome,
              "localita": localita,
              "image": image,
              "scheda": scheda
            }
          
          }
          
          ],
          
          template_id: "d-334e67626b3d418586076e2ec23dd1f1"
        }


        var headers = {
          'Authorization': 'Bearer ' + sgApiKey,
          'Content-Type': 'application/json'  
        };
          
      


      console.log(intestatario);

        axios.post('https://api.sendgrid.com/v3/mail/send', JSON.stringify(message), { headers }).then(res => {
            console.log(`statusCode: ${res.status}`)
            console.log(res)

        }).catch(error => {
            console.error(error)

            throw new Error("Mail non inviata!");
        });

        
      const msg = MessageFactory.text("Scheda dell'albero " + nome + " inviata all'indirizzo: " + intestatario, InputHints.ExpectingInput);
      return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });

    }

    



    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }

   
}

module.exports.SendMailDialog = SendMailDialog;
