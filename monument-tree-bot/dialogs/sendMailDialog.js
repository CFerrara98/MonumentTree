const { TimexProperty } = require('@microsoft/recognizers-text-data-types-timex-expression');
const { InputHints, MessageFactory} = require('botbuilder');
const { WaterfallDialog } = require('botbuilder-dialogs');
const { CancelAndHelpDialog } = require('./cancelAndHelpDialog');

const sgMail = require('@sendgrid/mail')
const sgApiKey = process.env["SendGridApiKey"];
sgMail.setApiKey(sgApiKey);

const request = require('request');


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
        var descrizione = stepContext._info.options.descrizione;
        var localita = stepContext._info.options.localita;
        var image = stepContext._info.options.image;
        var scheda = stepContext._info.options.scheda;


        var message = {

            from: { 
          
              email : "magicgamer88@gmail.com"
          
            },
          
            reply_to: {
          
              email: intestatario,
          
            },
          
            personalizations: [
          
            {
          
            to: [
          
              {
                email : "magicgamer88@gmail.com"
          
              }
          
             ],
          
            dynamic_template_data:{
              "nome": nome,
              "descrizione": descrizione,
              "localita": localita,
              "image": image,
              "scheda": scheda
            }
          
          }
          
          ],
          
          template_id: "d-d412892e0998477a962ae1cf00369fef"
        }


        var header = {
          'Authorization': 'Bearer ' + sgApiKey,
          'Content-Type': 'application/json'  
        };
          
        var rest_call = {
          url: 'https://api.sendgrid.com/v3/mail/send',
          method: 'POST',
          headers: header,
          body: JSON.stringify(message)  
        }

        var success;

        console.log(intestatario);
        request(rest_call, (err, response, body) => {

          if (!err) {
            success = true;
          
          } else {

            success = false;

          }
        
        });

        if (success) {
          const msg = MessageFactory.text("Scheda dell'albero " + nome + " inviata all'indirizzo: " + intestatario, InputHints.ExpectingInput);
          return await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        
        } else {
          const msg = MessageFactory.text("Errore nell'invio del messaggio!", InputHints.ExpectingInput);
          return  await stepContext.prompt(TEXT_PROMPT, { prompt: msg });
        }

    }

    



    isAmbiguous(timex) {
        const timexPropery = new TimexProperty(timex);
        return !timexPropery.types.has('definite');
    }

   
}

module.exports.SendMailDialog = SendMailDialog;
