'use strict';

const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const {WebhookClient, Suggestion, Card} = require('dialogflow-fulfillment');
const compression = require('compression');
const bodyParser = require('body-parser');
const cors = require('cors');

let express = require('express');

const router = express.Router();
const app = express();

let dialogflowSession;
let noMatchMessages = [];
let conversacion = [];

let codigoPostal;
let CPtrue = false;
let provincia;
let fase;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function hola(agent) {
    conversacion.push('Intent: ' + agent.intent);

    agent.add('¡Hola! Soy Aurora, le intentaré ayudar con todas sus dudas sobre el COVID-19.');
    agent.add('¿En qué puedo ayudarle?');
    sugerenciasInicio(agent);
}

function sugerenciasInicio(agent) {
    agent.add(new Suggestion ('Fases'));
    agent.add(new Suggestion ('Síntomas'));
    agent.add(new Suggestion ('Normativa'));
    agent.add(new Suggestion ('Medidas seguridad'));
    if (agent.intent !== 'A - Hola') {
        agent.add(new Suggestion('No, eso es todo'));
    }
}

function fallback(agent) {
    conversacion.push('Intent: ' + agent.intent);
    const respuestasPosibles = [
        'No he entendido a qué se refiere, ¿puede repetirlo?',
        '¿Podría repetir su pregunta, por favor?',
        'Disculpe, no he entendido su petición.',
        'Perdone, no entiendo su pregunta.',
        '¿Cómo?  Formule de otra manera su pregunta, por favor.'
    ];
    agent.add(respuestasPosibles[Math.floor(Math.random() * respuestasPosibles.length)]);
}

function gracias(agent) {
    conversacion.push('Intent: ' + agent.intent);
    agent.add('No hay de qué. ¿Puedo hacer algo más por usted?');
    sugerenciasInicio(agent);
}

function adios(agent) {
    conversacion.push('Intent: ' + agent.intent);
    agent.add('Ha sido un placer ayudarle, ¡hasta pronto!');

    agent.setContext({'name': 'cptrue', 'lifespan': -1});
    agent.setContext({'name': 'cpfalse', 'lifespan': -1});

    if (codigoPostal) {
        console.log('CP: ' + codigoPostal);
    }
    if (provincia) {
        console.log('Provincia: ', provincia);
    }
    console.log('Session: ' + dialogflowSession, conversacion);
    console.log('No match messages: ', noMatchMessages);
    codigoPostal = '';
    CPtrue = false;
    provincia = '';
    dialogflowSession = '';
    conversacion = [];
    noMatchMessages = [];
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
async function verificarFaseCP() {
    conversacion.push('Function: verificarFaseCP con CP ' + codigoPostal);
    let conex = {'CP': '', 'Conexion': [], 'ConexionInfo': ''};
    if (codigoPostal) {
        let rows;
        try {
            rows = await xlsxFile('chatbot-fulfillment/pueblosLeon.xlsx');
            for (let i in rows) {
                if (rows[i][1] == codigoPostal) {
                    conversacion.push('Function: verificarFaseCP: CP encontrado');
                    municipios.push(rows[i][0]);
                    if (rows[i][2] === 'True') {
                        municipiosFibraU.push(rows[i][0]);
                        conex.Conexion.push('fibra óptica');
                    } else if (rows[i][3] === 'True') {
                        municipiosFibraR.push(rows[i][0]);
                        conex.Conexion.push('fibra óptica propia');
                    } else if (rows[i][4] === 'True') {
                        municipiosWIMAX.push(rows[i][0]);
                        conex.Conexion.push('internet por WIMAX');
                    }
                    if (rows[i][5] !== '-') {
                        municipiosInfo.push(rows[i][0]);
                        if (rows[i][5] === 'LEON') {
                            conex.ConexionInfo = 'Se encargaron de la instalación nuestros compañeros de León.';
                        } else {
                            conex.ConexionInfo = '¡Qué suerte! Instalamos el servicio justo el pasado mes de marzo.';
                        }
                    }
                    conex.CP = rows[i][1];
                }
            }
            if (!conex) {
                conex.Conexion = 'Na de na, sorry bro';
            }
            console.log(municipios);
            console.log(municipiosFibraU);
            console.log(municipiosFibraR);
            console.log(municipiosWIMAX);
            console.log(municipiosInfo);
            console.log(conex);
        } catch(err) {
            console.log('Function: verificarFaseCP: ha ocurrido un problema al leer el excel' + err);
            conversacion.push('Function: verificarFaseCP: ha ocurrido un problema al leer el excel' + err);
        }
    }
    return conex;
}
*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*
async function faseInfo (agent) {
    conversacion.push('Intent: ' + agent.intent);

    if (agent.getContext('cpfalse')) {
        conversacion.push('Context CPfalse: ' + agent.getContext('cpfalse').lifespan);
        if (agent.getContext('cpfalse').lifespan) {
            CPtrue = false;
            provincia = '';
        }
    }
    if (agent.getContext('cptrue')) {
        conversacion.push('Context CPtrue: ' + agent.getContext('cptrue').lifespan);
        if (agent.getContext('cptrue').lifespan) {
            CPtrue = true;
        }
    }

    conversacion.push('CPtrue: ' + CPtrue);
    if (!CPtrue) {
        codigoPostal = agent.parameters.codigoPostal;
        conversacion.push('CP Actualizado: ' + codigoPostal);
    }
    if (codigoPostal && !CPtrue) {
        conversacion.push('ENTRO EN 1');
        try {
            provincia = await verificarFaseCP();
            conversacion.push('Return de verificarFaseCP: ', provincia);
        } catch (err) {
            console.log('Hubo un problema al llamar verificarFaseCP:', err);
            conversacion.push('Hubo un problema al llamar verificarFaseCP:', err);
        }
    } else if (provincia && provincia.fase && CPtrue) {
        conversacion.push('ENTRO EN 2');
        CPtrue = true;
        agent.setContext({'name': 'cptrue', 'lifespan': 10});
        // agent.setContext({'name': 'cpfalse', 'lifespan': -1});
        if (fase === 'fase 1') {
            fase1();
        } else if (fase === 'fase 2') {
            fase2();
        } else if (fase === 'fase 3') {
            fase3();
        }
    } else if (provincia && !provincia.fase && CPtrue) { // TODO quiere realizar otra búsqueda?
        conversacion.push('ENTRO EN 3');
        agent.add('Lo siento, no encuentro información sobre la fase correspondiente a la provincia ' + provincia + '.');
        agent.add('No dude en visitar la página web de su servicio de salud.');
        // agent.add('Si quiere buscar la conexión que ofrecemos en otro municipio, escriba el CP.');
        agent.add('¿Le puedo ayudar en algo más?');
        agent.add(new Suggestion('Síntomas'));
        agent.add(new Suggestion('Normativa'));
        agent.add(new Suggestion('No, eso es todo'));
    } else if (!provincia) {
        conversacion.push('ENTRO EN 4');
        agent.add('Lo siento, no encuentro información sobre la fase correspondiente a la provincia ' + provincia + '.');
        agent.add('No dude en visitar la página web de su servicio de salud.');
        agent.add('¿Le puedo ayudar con algo más?');
        agent.add(new Suggestion('Síntomas'));
        agent.add(new Suggestion('Normativa'));
        agent.add(new Suggestion('No, eso es todo'));
    }
}
 */

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function card (agent) {
    agent.add(new Card({
            title: 'Título link',
            buttonText: 'Título link',
            buttonUrl: 'https://www.google.com'
        })
    );
    agent.add('Blablabla.');
    sugerenciasInicio(agent);
}

function setCPtrue (fakeCPtrue) {CPtrue = fakeCPtrue;}
function setCodigoPostal (fakeCodigoPostal) {codigoPostal = fakeCodigoPostal;}
function setProvincia (fakeProvincia) {provincia = fakeProvincia;}
function setFase (fakeFase) {fase = fakeFase;}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.use(compression());
router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));
router.use(awsServerlessExpressMiddleware.eventContext());

router.post('/', (request, response) => {
    const agent = new WebhookClient({request, response});
    console.log('Dialogflow Request headers : ' + JSON.stringify(request.headers));
    console.log('Dialogflow Request body : ' + JSON.stringify(request.body));
    dialogflowSession = request.body.session;
    if (request.body.queryResult.action === 'input.unknown') {
        noMatchMessages.push(request.body.queryResult.queryText);
    }

    if (request.body.queryResult.queryText === 'Hola Max, conozco a tu mamá') {
        agent.add('¡Ay, qué guay!💃 ¿Sabías que le encantan los Lacasitos? Podías regalarle unos poquitos 🙄🤭');
        agent.add('¡Ha sido un placer! Pero tengo que volver al curro...');
    }
    if (request.body.queryResult.queryText === 'Hola Max, ¿sabes cómo naciste?') {
        agent.add('Pues me han contado la movida de la cigüeña pero en realidad sé que fue porque mi mamá se aburría mucho durante la cuarentena del Covid 🔞');
        agent.add('¡Ha sido un placer! Pero tengo que volver al curro...');
    }
    if (request.body.queryResult.queryText === 'Hola Max, soy Marquitu') {
        agent.add('Ay, mi mamá me dijo que si pasabas a verme te diera este recado:');
        agent.add('Te quiero mucho porque eres mi hermanito y te quiero mucho 🥰');
        agent.add('¡Ha sido un placer, tío! Ahora tengo que volver al curro...');
    }
    if (request.body.queryResult.queryText === 'Hola Max, soy Lú Yatusabeh') {
        agent.add('¡Ay, mi mamá me ha hablado mucho de ti!');
        agent.add('Yo sé que no te lo dice mucho pero... TE QUIERE UN MONTÓN 💜💜💜');
        agent.add('¡Ha sido un placer Lu! Ahora tengo que volver al curro...');
    }
    if (request.body.queryResult.queryText === 'Hola Max, soy Mar Carmena Blanco') {
        agent.add('¡Ay, mi mamá me ha hablado mucho de ti!');
        agent.add('Yo sé que no te lo dice mucho pero... TE QUIERE UN MONTÓN 💜💜💜');
        agent.add('¡Ha sido un placer Babu! Ahora tengo que volver al curro...');
    }
    if (request.body.queryResult.queryText === 'Hola Max, soy clara.yeah.123') {
        agent.add('¡Ay, mi mamá me ha hablado mucho de ti!');
        agent.add('Yo sé que no te lo dice mucho pero... TE QUIERE UN MONTÓN 💜💜💜');
        agent.add('¡Ha sido un placer Clara! Ahora tengo que volver al curro...');
    }
    if (request.body.queryResult.queryText === 'Hola Max, soy Marinita') {
        agent.add('¡Ay, mi mamá me ha hablado mucho de ti!');
        agent.add('Tú tranqui que no se le olvida el viaje a Marruecos que tenéis pendiente 💜');
        agent.add('¡Ha sido un placer Marinita! Ahora tengo que volver al curro...');
    }
    if (request.body.queryResult.queryText === 'Hola Max, soy Purpurino') {
        agent.add('¡Ay, mi mamá me ha hablado mucho de ti! Me pidió que si te pasabas a verme te diera un recado:');
        agent.add('Ñam ñam');
        agent.add('¡Ha sido un placer 🧀! Ahora tengo que volver al curro...');
    }
    if (request.body.queryResult.queryText === 'Hola Max, soy el bestjugadorderugbyever') {
        agent.add('¡Ay, mi mamá me ha hablado mucho de ti! 😄');
        agent.add('¿Sabes qué hago cuando nadie habla conmigo y me aburro?');
        agent.add(new Card({
                title: '¡Veo este vídeo en bucle!',
                buttonText: '¡Veo este vídeo en bucle!',
                buttonUrl: 'https://youtu.be/9A4oKO99NbE'
            })
        );
        agent.add('¡Ha sido un placer Carva! Ahora tengo que volver al curro...');
    }
    if (request.body.queryResult.queryText === 'Hola Max, soy el tolay que tenía que haber empezado a subir vídeos a youtube hace media vida') {
        agent.add('¡Ay, mi mamá me ha hablado mucho de ti! 😄');
        agent.add('¿Sabes qué hago cuando nadie habla conmigo y me aburro?');
        agent.add(new Card({
                title: 'Veo los vídeos de este canal en bucle',
                buttonText: 'Veo los vídeos de este canal en bucle',
                buttonUrl: 'https://www.youtube.com/channel/UCjuhW3D1QYmws1En3Z852cQ'
            })
        );
        agent.add('Te lo recomiendo, los temas están to guapos.');
        agent.add('¡Agur Iker! Tengo que volver al curro...');
    }

    let intentMap = new Map();
    intentMap.set('A - Hola', hola);
    intentMap.set('Fallback', fallback);
    intentMap.set('A - Gracias', gracias);
    intentMap.set('A - Adios', adios);

    agent.handleRequest(intentMap);
});

app.use('/', router);

module.exports = app;
module.exports.hola = hola;
module.exports.adios = adios;

module.exports.setCPtrue = setCPtrue;
module.exports.setCodigoPostal = setCodigoPostal;
module.exports.setProvincia = setProvincia;
module.exports.setFase = setFase;
