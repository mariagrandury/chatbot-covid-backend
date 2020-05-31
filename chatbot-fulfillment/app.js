'use strict';

const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const {WebhookClient, Suggestion, Card, Image} = require('dialogflow-fulfillment');
const compression = require('compression');
const bodyParser = require('body-parser');
const cors = require('cors');

let express = require('express');

const router = express.Router();
const app = express();

let dialogflowSession;
let noMatchMessages = [];
let conversacion = [];

let onInit = true;

let provincia;
let comunidadAutonoma;
let fase;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function hola(agent) {
    conversacion.push('Intent: ' + agent.intent);
    if (onInit && agent.parameters.provincia) {
        provincia = agent.parameters.provincia;
        agent.add('Perfecto, muchas gracias.');
        agent.add('Le puedo explicar cómo interactuar conmigo si todavía no me conoce.');
        agent.add(new Suggestion('Explícame'));
        onInit = false;
        sugerenciasInicio(agent);
    } else {
        agent.add('¡Hola! Soy Aurora y estaré encantada de ayudarle a resolver todas sus dudas sobre el COVID-19.');
        agent.add('¿En qué puedo ayudarle?');
        sugerenciasInicio(agent);
    }
}

function explicacion(agent) {
    conversacion.push('Intent: ' + agent.intent);
    agent.add('Le puedo ayudar si tiene dudas respecto a los síntomas del COVID-19 y cómo actuar si los presenta.');
    agent.add('También le puedo informar sobres las características de las diferentes fases del plan de transición a una nueva normalidad y la situación de cada comunidad autónoma.');
    agent.add('Además, le puedo indicar qué medidas de seguridad tomar y la normativa a aplicar.');
    agent.add('Puede plantearme todas las dudas que tenga respecto al COVID-19 escribiendo en su teclado o selecionar alguna de las sugerencias que le propongo');
    agent.add('En todo momento puede escribir \"Menú\" para volver al menú inicial');
    agent.add('Toda la información la he recogido de la página oficial del Ministerio de Sanidad.');
    agent.add('¿En qué puedo ayudarle?');
    sugerenciasInicio(agent);
}

function sugerenciasInicio(agent) {
    agent.add(new Suggestion('Síntomas'));
    agent.add(new Suggestion('Síntomas del COVID-19'));
    agent.add(new Suggestion('Fases'));
    agent.add(new Suggestion('Fases de la desescalada'));
    agent.add(new Suggestion('Medidas'));
    agent.add(new Suggestion('Medidas de seguridad'));
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

function menu (agent) {
    conversacion.push('Intent: ' + agent.intent);
    agent.add('¿Puedo hacer algo más por usted?');
    sugerenciasInicio(agent);
}

function adios(agent) {
    conversacion.push('Intent: ' + agent.intent);
    agent.add('Ha sido un placer ayudarle, ¡hasta pronto!');

    if (comunidadAutonoma) {
        console.log('Comunidad Autónoma: ', comunidadAutonoma);
    }
    console.log('Session: ' + dialogflowSession, conversacion);
    console.log('No match messages: ', noMatchMessages);

    comunidadAutonoma = '';
    dialogflowSession = '';
    conversacion = [];
    noMatchMessages = [];
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// MINISTERIO DE SALUD, CONSUMO Y BIENESTAR ////////////////////////////////////////////

// ------------------------------------------------ SÍNTOMAS -----------------------------------------------------------
const sintomasImageUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/img/COVID19_sintomas.jpg';
const sintomasComoActuarUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/20200325_Decalogo_como_actuar_COVID19.pdf';

function sintomas (agent) {
    conversacion.push('Intent: ' + agent.intent);
    agent.add('Los síntomas más comunes de la COVID-19 incluyen');
    agent.add('- Fiebre 🤒');
    agent.add('- Tos 🤧');
    agent.add('- Sensación de falta de aire 😶');
    agent.add('Otros síntomas pueden ser: disminución de olfato y del gusto, escalofríos, dolor de garganta, dolores musculares, dolor de cabeza, debilidad general, diarrea o vómitos, entre otros.');
    agent.add('¿Sabe cómo actuar si presenta síntomas? ¿Le puedo ayudar en algo más?');
    agent.add(new Suggestion('Cómo actuar'));
    agent.add(new Suggestion('Cómo actuar'));
    agent.add(new Suggestion('Fases'));
    agent.add(new Suggestion('Fases de la desescalada'));
    agent.add(new Suggestion('Medidas'));
    agent.add(new Suggestion('Medidas de seguridad'));
}

function sintomasComoActuar (agent) {
    conversacion.push('Intent: ' + agent.intent);
    agent.add('Si tiene síntomas, siga las instrucciones del siguiente pdf:');
    agent.add(new Card({
            title: 'Síntomas: Cómo actuar (25/03/2020)',
            buttonText: 'Síntomas: Cómo actuar (25/03/2020)',
            buttonUrl: sintomasComoActuarUrl
        })
    );
    agent.add('¿Sabe cuáles son los sintomas de la COVID-19? ¿Le puedo ayudar en algo más?');
    sugerenciasInicio(agent);
}

// ----------------------------------------- MEDIDAS DE SEGURIDAD ------------------------------------------------------
function medidasSeguridad (agent) {
    conversacion.push('Intent: ' + agent.intent);
    agent.add('Las medidas de seguridad que debe adoptar son...');
    agent.add('¿Sobre qué medidas quiere que le informe en particular?');
    agent.add(new Suggestion('💻 💼')); // Medidas en el trabajo
    agent.add(new Suggestion('Medidas en el trabajo'));
    agent.add(new Suggestion('👩‍⚕️ 🧼 📏')); // Medidas de higiene y prevención
    agent.add(new Suggestion('Medidas de higiene y prevención'));
}

function medidasTrabajo (agent) {
    conversacion.push('Intent: ' + agent.intent);
    agent.add('Las medidas en el trabajo son...');
    sugerenciasInicio(agent);
}

function medidasHigiene (agent) {
    conversacion.push('Intent: ' + agent.intent);
    agent.add('Las medidas de higiene y prevención son...');
    sugerenciasInicio(agent);
}

// -------------------------------------------- SITUACIÓN ACTUAL -------------------------------------------------------
const situacionActualUrl = 'https://cnecovid.isciii.es/covid19/';

function situacionActual (agent) {
    conversacion.push('Intent: ' + agent.intent);
    agent.add('Si quiere conocer la situación actual en España haga click en el siguiente enlace:');
    agent.add(new Card({
            title: 'Situación actual',
            buttonText: 'Situación actual',
            buttonUrl: situacionActualUrl
        })
    );
    agent.add('¿En qué más le puedo ayudar?');
    sugerenciasInicio();
}

// --------------------------- PLAN PARA LA TRANSICIÓN A UNA NUEVA NORMALIDAD ------------------------------------------

const transicionUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/PlanTransicionNuevaNormalidad.pdf';
const transicionFase1Url = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/09052020_Plan_Transicion_Guia_Fase_1.pdf';
const transicionFase2Url = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/Plan_Transicion_Guia_Fase_2.pdf';
const transicionFAQUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/COVID19_Preguntas_y_respuestas_plan_nueva_normalidad.pdf';

function fasesInformacion (agent) {
    let nfase = agent.parameters.nfase;
    conversacion.push('Intent: ' + agent.intent + ', fase: ' + nfase);
    console.log('Intent: ' + agent.intent + ', fase: ' + nfase);
    if (nfase === 1) {
        fase1(agent);
    } else if (nfase === 2) {
        fase2(agent);
    } else if (nfase === 3) {
        // fase3(agent);
    } else {
        agent.add('El plan para la transición a una nueva normalidad solo incluye fases 1, 2 y 3.');
        agent.add('¿Sobre cuál de ellas quiere que le informe?');
    }
}

function fase1 (agent) {
    conversacion.push('Function: Fase1');
    agent.add('En la fase 1 se permite:');
    agent.add('- Circular por su provincia o isla en grupos de hasta 10 personas.');
    agent.add('- Apertura de locales y establecimientos minoristas de hasta 400m2 y con un aforo del 30%.');
    agent.add('- Apertura de las terrazas al aire libre limitadas al 50% de las mesas.');
    agent.add('No dude en plantearme una duda más concreta sobre la fase 1 o elegir una de las categorías sugeridas.');
    agent.add('También puede hacer click en el siguiente enlace para acceder al pdf oficial:');
    agent.add(new Card({
            title: 'Guía de la fase 1',
            buttonText: 'Guía de la fase 1',
            buttonUrl: transicionFase1Url
        })
    );

    agent.add(new Suggestion('😄🚗'));
    agent.add(new Suggestion('Medidas sociales'));
    agent.add(new Suggestion('👕🛍️💲💰'));
    agent.add(new Suggestion('Comercio y prestación de servicios'));
    agent.add(new Suggestion('👩‍🍳 🍴 ☕️'));
    agent.add(new Suggestion('Hostelería y restauración'));
    agent.add(new Suggestion('👩‍🦳👴'));
    agent.add(new Suggestion('Servicios sociales'));
    agent.add(new Suggestion('📚 🎓'));
    agent.add(new Suggestion('Educación'));
    agent.add(new Suggestion('🎭 🎨 💃 🎷'));
    agent.add(new Suggestion('Actividades culturales'));
    agent.add(new Suggestion('🏀🏐🏉'));
    agent.add(new Suggestion('Actividades deportivas'));
    agent.add(new Suggestion('🛏️ 🛎️ 🏨 '));
    agent.add(new Suggestion('Hoteles y establecimientos turísticos'));
}

function fase2 (agent) {
    conversacion.push('Funcion: Fase2');
    agent.add('En la fase 2 está permitido:');
    agent.add('- Circular por su provincia o isla en grupos de hasta 15 personas.');
    agent.add('- Apertura de locales y establecimientos minoristas con un aforo máximo del 40%.');
    agent.add('- Apertura de establecimientos de hostelería y restauración para consumo en el local, con un aforo máximo del 40%.');
    agent.add('No dude en plantearme una duda más concreta sobre la fase 2 o elegir una de las categorías sugeridas.');
    agent.add('También puede hacer click en el siguiente enlace para acceder al pdf oficial:');
    agent.add(new Card({
            title: 'Guía de la fase 2',
            buttonText: 'Guía de la fase 2',
            buttonUrl: transicionFase2Url
        })
    );
    agent.add(new Suggestion('😄🚗'));
    agent.add(new Suggestion('Medidas sociales'));
    agent.add(new Suggestion('👕🛍️💲💰'));
    agent.add(new Suggestion('Comercio y prestación de servicios'));
    agent.add(new Suggestion('👩‍🍳 🍴 ☕️'));
    agent.add(new Suggestion('Hostelería y restauración'));
    agent.add(new Suggestion('👩‍🦳👴'));
    agent.add(new Suggestion('Servicios sociales'));
    agent.add(new Suggestion('🎭 🎨 💃 🎷'));
    agent.add(new Suggestion('Actividades culturales'));
    agent.add(new Suggestion('🏀🏐🏉'));
    agent.add(new Suggestion('Actividades deportivas'));
    agent.add(new Suggestion('🛏️ 🛎️ 🏨 '));
    agent.add(new Suggestion('Hoteles y establecimientos turísticos'));
    agent.add(new Suggestion('🏊‍♀️ 🌅 ☀️'));
    agent.add(new Suggestion('Piscinas y playas'));
}

function faseCA (agent) {
    conversacion.push('Intent: ' + agent.intent);
    let ca = '';
    if (agent.parameters.ccaaFase0) {
        ca = agent.parameters.ccaaFase0;
        agent.add('La comunidad autónoma de ' + ca + ' está en la fase 0.');
    } else if (agent.parameters.ccaaFase01) {
        ca = agent.parameters.ccaaFase01;
        agent.add('En la comunidad autónoma de ' + ca + ' hay provincias que están en la fase 0 y otras que han pasado a la 1.');
    } else if (agent.parameters.ccaaFase1) {
        ca = agent.parameters.ccaaFase2;
        agent.add('La comunidad autónoma de ' + ca + ' está en la fase 2.');
    } else {
        agent.add('¿De qué comunidad autónoma quiere saber la fase?');
    }
    console.log('CA : ' + ca);
}

// ------------------------------------- INFORMACIÓN PARA LA CIUDADANÍA ------------------------------------------------
// https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/ciudadania.htm
const telefonosInfoUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/telefonos.htm';

function telefonosInfo (agent) {
    let ca = agent.parameters.ca;
    let tlf;
    if (ca === 'Asturias') {
        tlf = '900 878 232'; // 984 100 400 / 112 marcando 1
    }
    agent.add('El teléfono de información en ' + ca + ' es ' + tlf + '.');
    agent.add('¿Le puedo ayudar en algo más?');
    sugerenciasInicio();
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////// MINISTERIO DE TRABAJO Y ECONOMÍA SOCIAL /////////////////////////////////////////

const ministeriorTrabajoUrl = 'https://www.sepe.es/HomeSepe/COVID-19.html';





// -------------------------------------------------- TESTS ------------------------------------------------------------
function setCA (fakeCA) {comunidadAutonoma = fakeCA;}
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
    intentMap.set('A - Explicacion', explicacion);
    intentMap.set('Fallback', fallback);
    intentMap.set('A - Gracias', gracias);
    intentMap.set('A - Menu', menu);
    intentMap.set('A - Adios', adios);

    intentMap.set('Sintomas', sintomas);
    intentMap.set('Sintomas - Como actuar', sintomasComoActuar);

    intentMap.set('Medidas seguridad', medidasSeguridad);

    intentMap.set('Situacion actual', situacionActual);
    intentMap.set('Fases - Informacion', fasesInformacion);
    intentMap.set('Fases - CA', faseCA);
    intentMap.set('Medidas trabajo', medidasTrabajo);

    intentMap.set('CCAA - Tlf', telefonosInfo);

    agent.handleRequest(intentMap);
});

app.use('/', router);

module.exports = app;
module.exports.hola = hola;
module.exports.adios = adios;

module.exports.setCA = setCA;
module.exports.setFase = setFase;
