# Monumental Tree

È un Servizio Chatbot, che nasce con lo scopo di soddisfare nelle proprie visite culturali gli appassionati di Storia Naturale e delle piccole curiosità di storia locale, 
offrendo loro in via diversa la più ampia raccolta di informazioni ufficiali sugli alberi monumentali, presenti nell'archivio della regione Campania: http://agricoltura.regione.campania.it/

<p align="center"><img src="./monument-tree-bot/documents/Diagramma Architetturale.png" /></p>

Il nostro Bot è stato sviluppato come progetto per il corso di Cloud Computing 2021/2022, e realizza le seguenti funzionalità:

<ol>
  <li>Ricerca dal catalogo regionale per tipo di albero</li>
  <li>Ricerca dal catalogo regionale per specifico comune</li>
  <li>Ricerca per similarità data una foto in input</li>
</ol>

Le prime due funzionalità, permettono di ricevere informazioni circa la posizione dell'albero tramite il servizio azure Map e salvare i dettagli di un albero tramite il servizio Tullio Sendgrid.

#Come far partire il bot Monumental Tree:

Per far partire il progetto in locale, è importante dopo aver scaricato il progetto, andare a creare al suo interno il file .env (nella directory principale), i cui parametri dovranno essere:

- MicrosoftAppId
- MicrosoftAppPassword
- MicrosoftAppTenantId
- MicrosoftAppType

- LuisAppId
- LuisAPIKey
- LuisAPIHostName

- CosmosDbEndpoint
- CosmosDbAuthKey
- CosmosDbDatabaseId
- CosmosDbContainerId

- SendGridApiKey
- AZURE_MAPS_KEY


Cioè appunto tutte le chiavi di accesso necessarie per far funzionare con tutti i servizi ad esso connessi.

Al fine di far partire il progetto sarà necessario configurare sul portale Azure, i seguenti servizi (preferibilmente nello stesso resource group):

1. Un'istanza del servizio Cosmos DB, per il salvataggio dei dati dall'archivio regionale;
2. Un'istanza del motore NLU LUIS, al fine di fornire al bot il modo di riconoscere i prinicipali intenti da comprendere e permettere la navigazione tra le sue funzionalità;
3. Un'istanza di SendGrid Web Mailer e la configurazione di un template per le mail;
4. Un'istanza del servizio Azure Maps per le mappe di Preview fornite dal Bot;
5. Un'Istanza del servizio Azure Web App dall'App Service, per l'hosting del Sorgente, con relativo Piano Tariffario;
6. Un'Istanza del servizio Azure Bot per la definizione dei canali di comunicazione.

Seguono ora alcune note di configurazione dei servizi principali del Bot
#Configurazione del modello LUIS
<br>
Il modello luis di cui fa utilizzo il Bot Monumental Tree, è strettamente formato da 3 intent principali da creare tramite il portale (Esterno al portale Azure) di luis:
 1.InformazioniByZona <br>
 2.PosizioneByAlbero <br>
 3.SearchByImg <br>
 
 I seguenti intenti vanno creati riempiti con delle specifiche Utterance relative alle 3 principali feature del bot, in modo tale da accedere ai Dialog principali del Bot!
 
 Una volta creati gli intent, sarà necessario addestrare il modello lius e pubblicarlo (da questo momento sarà accessibile dalle app che ne faranno utilizzo tramite l'API key).
 
 #Configurazione del database Cosmos
 <br>
Una volta creato il servizio, sarà necessario creare uno specifico container e una specifica raccolta dati per il Bot (per semplicità, noi abbiamo chiamato sia il container che la collezione "Alberi"), in seguito, tramite le impostazioni del portale Cosmos, sarà necessario importare la collezione ./documents/DBStart/Campania.json (raccolta di alberi monumentali), presente sulla repository. Copiando nel file env tutte le chiavi richieste, sarà possibile accedere alla raccolta dati dal'applicativo!



 #Configurazione e creazione del Servizio Sendgrid
 <br>
 Per la creazione del servizio Servizio di Mailing, sarà necessario ovviamente, instanziare la risorsa Sendgrid Account, dal portale Azure, in seguito, sarà necessario, seguendo la documentazine del portale esterno di Sendgrid, andare a definire da quale mail il bot invierà le mail automatizzate, in seguito sarà necessario definire il template della mail, dalla sezione apposita!
 
 Attenzione, nel template della Mail è importante definire campi variabili per i campi: nome, localita, image (URL) e scheda che il sorgente invieerà per la costruzione della Mail da fornire.
 
 #Configurazione e creazione del Servizio AzureMap
 <br>
 Al fine di far funzionare l'interazione con Azure Maps, sarà semplicemente necessario reportare l'API Key, nel file .env del progetto
 
 #Deploy
 <br>
 Per la creazione dei servizi Web App e Azure Bot (dopo aver creato le risorse), è opportuno segure nei minimi dettagli la documentazione Microsoft: https://docs.microsoft.com/it-it/azure/bot-service/bot-builder-deploy-az-cli?view=azure-bot-service-4.0&tabs=csharp
 
 In particolare è estremamente importante che i comandi di configurazione e caricamento dello zip sulla web app, seguino la strutturazione espressa nel file  "command-for-deploy.txt" nella root principale del progetto (sostituendo opportunamente nomi del resource group, web app, file zip, application plan e quant'altro secondo le proprie risorse).
 
#Creazione del canale Line Messages
 <br>
 Per la creazione del canale tramite il servizio di messagistica Line, una volta creato l'azure Bot e deployata correttamente la web app, basterà seguire in maniera opportuna la documentazione di creazione del canale Line Messages sul sito Microsoft: https://docs.microsoft.com/it-it/azure/bot-service/bot-service-channel-connect-line?view=azure-bot-service-4.0
 
