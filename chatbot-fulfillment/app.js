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
let faseCliente = 1;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function hola(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (onInit && agent.parameters.provincia) {
        provincia = agent.parameters.provincia;
        agent.add('Perfecto, muchas gracias.');
        agent.add('Le puedo explicar cómo interactuar conmigo si todavía no me conoce.');
        agent.add(new Suggestion('Explícame'));
        agent.add(new Suggestion('Explicación de cómo le puedo ayudar'));
        onInit = false;
        sugerenciasInicio(agent);
    } else {
        agent.add('¡Hola! Soy Aurora y estaré encantada de ayudarle a resolver todas sus dudas sobre el COVID-19.');
        agent.add('¿En qué puedo ayudarle?');
        sugerenciasInicio(agent);
    }
    console.log('CONVERSACION Provincia: ' + provincia);
}

function explicacion(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Le puedo ayudar si tiene dudas respecto a:');
    agent.add(' - Los síntomas de la COVID-19 y cómo actuar si los presenta.');
    agent.add(' - Las características de las diferentes fases del plan de transición a una nueva normalidad y la situación de cada comunidad autónoma.');
    agent.add(' - Las medidas de seguridad se deben tomar en diferentes ámbitos.');
    agent.add('Puede plantearme sus dudas escribiendo en su teclado o selecionar alguna de las sugerencias que le propongo.');
    agent.add('En todo momento puede escribir \"Menú\" para volver al menú inicial.');
    agent.add('Toda la información la he recogido de la página oficial del Ministerio de Sanidad.');
    agent.add('¿En qué puedo ayudarle?');
    sugerenciasInicio(agent);
}

function sugerenciasInicio(agent) {
    agent.add(new Suggestion('Síntomas'));
    agent.add(new Suggestion('Síntomas de la COVID-19'));
    agent.add(new Suggestion('Fases'));
    agent.add(new Suggestion('Fases de la desescalada'));
    agent.add(new Suggestion('Medidas'));
    agent.add(new Suggestion('Medidas de seguridad'));
    //if (agent.intent !== 'A - Hola') {
    //    agent.add(new Suggestion('No, eso es to do'));
    //}
}

function fallback(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
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
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('De nada, es un placer. ¿Puedo hacer algo más por usted?');
    sugerenciasInicio(agent);
}

function menu (agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('¿Qué puedo hacer por usted?');
    sugerenciasInicio(agent);
}

function adios(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Ha sido un placer ayudarle, ¡hasta pronto!');

    if (provincia) {
        console.log('Provincia: ', provincia);
    }
    if (comunidadAutonoma) {
        console.log('Comunidad Autónoma: ', comunidadAutonoma);
    }
    if (faseCliente) {
        console.log('Fase: ', faseCliente);
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
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Los síntomas más comunes de la COVID-19 incluyen:');
    agent.add('- Fiebre 🤒');
    agent.add('- Tos 🤧');
    agent.add('- Sensación de falta de aire 😶');
    agent.add('Otros síntomas pueden ser: disminución de olfato y del gusto, escalofríos, dolor de garganta, dolores musculares, dolor de cabeza, debilidad general, diarrea o vómitos, entre otros.');
    agent.add('¿Sabe cómo actuar si presenta síntomas? ¿Le puedo ayudar en algo más?');
    agent.add(new Suggestion('Cómo actuar'));
    agent.add(new Suggestion('Cómo actuar si presenta síntomas'));
    agent.add(new Suggestion('Fases'));
    agent.add(new Suggestion('Fases de la desescalada'));
    agent.add(new Suggestion('Medidas'));
    agent.add(new Suggestion('Medidas de seguridad'));
}

function sintomasComoActuar (agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Si tiene síntomas, siga las instrucciones del siguiente pdf:');
    agent.add(new Card({
            title: 'Síntomas: Cómo actuar (25/03/2020)',
            buttonText: 'Síntomas: Cómo actuar (25/03/2020)',
            buttonUrl: sintomasComoActuarUrl
        })
    );
    agent.add('Si está usted trabajando y presenta síntomas:');
    agent.add('- Contacte de inmediato con el teléfono habilitado para ello por su comunidad autónoma o centro de salud.');
    agent.add('- Colóquese una mascarilla');
    agent.add('- Abandone su puesto de trabajo hasta que su situación médica sea valorada por un profesional sanitario.');
    agent.add('¿Conoce el número de teléfono de su comunidad? ¿Sabe cuáles son los sintomas de la COVID-19? ¿Le puedo ayudar en algo más?');
    sugerenciasInicio(agent);
}

// ----------------------------------------- MEDIDAS DE SEGURIDAD ------------------------------------------------------
function medidasSeguridad (agent) { // TODO que el chatbot entienda los emojis
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('¿Sobre qué medidas quiere que le informe en particular?');
    agent.add(new Suggestion('🧼 📏'));
    agent.add(new Suggestion('Medidas de higiene y prevención'));
    agent.add(new Suggestion('💻 💼'));
    agent.add(new Suggestion('Medidas en el trabajo'));
    agent.add(new Suggestion('🍴 ☕'));
    agent.add(new Suggestion('Medidas en hostelería'));
}

function medidasHigiene(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas de seguridad e higiene establecidas por las autoridades sanitarias:'); // pdf fase 1
    agent.add('- Distancia interpersonal de 2 metros');
    agent.add('- Higiene de manos: gel hidroalcohólico o desinfectante con actividad virucida');
    agent.add('- Etiqueta respiratoria');
    agent.add('¿Le puedo ayudar con algo más?');
    sugerenciasInicio(agent);
}

function medidasTrabajo(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar en el trabajo son:');
    agent.add('- Fomentar el teletrabajo.');
    agent.add('- Adoptar las medidas necesarias para cumplir las medidas de higiene y/o prevención para los trabajadores.');
    agent.add('- Poner a disposición de los trabajadores geles hidroalcohólicos o desinfectantes.');
    agent.add('- Garantizar, en la medida de lo posible, la distancia de seguridad interpersonal de 2m o proporcionar a los trabajadores equipos de protección.');
    agent.add('- Sustituir el control horario mediante huella dactilar o limpiar el dispositivo tras cada uso.');
    agent.add('- Organizar el horario para evitar riesgo de coincidencia masiva de personas.');
    agent.add('¿Sabe cómo actuar si presenta síntomas en el trabajo? ¿Le puedo ayudar con algo más?');
    agent.add(new Suggestion('Cómo actuar'));
    agent.add(new Suggestion('Cómo actuar si presenta síntomas en el trabajo'));
    agent.add(new Suggestion('Medidas higiene'));
    agent.add(new Suggestion('Medidas de higiene y prevención'));
    agent.add(new Suggestion('Fases'));
    agent.add(new Suggestion('Fases de la desescalada'));
}

function medidasHosteleria(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar en hostelería y restauración son:');
    agent.add('- Limpiar y desinfectar el equipamiento de la terraza entre un cliente y otro.');
    agent.add('- Priorizar la utilización de mantelería de un solo uso y poner a disposición del público dispensadores de desinfectantes.');
    agent.add('- Fomentar el pago con tarjeta y evitar el uso de cartas de menú de uso común.');
    agent.add('- Eliminar productos de autoservicio como servilleteros y priorizar monodosis desechables.');
    agent.add('¿Le puedo ayudar con algo más?');
    sugerenciasInicio(agent);
}

// -------------------------------------------- SITUACIÓN ACTUAL -------------------------------------------------------
const situacionActualUrl = 'https://cnecovid.isciii.es/covid19/';

function situacionActual (agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Si quiere conocer la situación actual en España haga click en el siguiente enlace:');
    agent.add(new Card({
            title: 'Situación actual',
            buttonText: 'Situación actual',
            buttonUrl: situacionActualUrl
        })
    );
    agent.add('¿En qué más le puedo ayudar?');
    sugerenciasInicio(agent);
}

// --------------------------- PLAN PARA LA TRANSICIÓN A UNA NUEVA NORMALIDAD ------------------------------------------

const transicionUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/PlanTransicionNuevaNormalidad.pdf';
const transicionFase1Url = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/09052020_Plan_Transicion_Guia_Fase_1.pdf';
const transicionFase2Url = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/Plan_Transicion_Guia_Fase_2.pdf';
const transicionFAQUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/COVID19_Preguntas_y_respuestas_plan_nueva_normalidad.pdf';

function fases (agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Usted se encuentra en la fase ... '); // TODO fase del cliente
    agent.add('¿Quiere que le informe sobre su fase u otra?');
    agent.add(new Suggestion('Fase 1'));
    agent.add(new Suggestion('Información sobre la fase 1'));
    agent.add(new Suggestion('Fase 2'));
    agent.add(new Suggestion('Información sobre la fase 2'));
}

function fasesInformacion (agent) {
    let nfase = agent.parameters.nfase;
    console.log('CONVERSACION Intent: ' + agent.intent + ', nfase: ' + nfase);
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
    console.log('CONVERSACION Function: Fase1');
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
    sugerenciasFases(agent, 1);
}

function fase2 (agent) {
    console.log('CONVERSACION Funcion: Fase2');
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
    sugerenciasFases(agent, 2);
}

function sugerenciasFases(agent, fase) { // TODO seleccionar emojis
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
    if (fase === 2) {
        agent.add(new Suggestion('🏊‍♀️ 🌅 ☀️'));
        agent.add(new Suggestion('Piscinas y playas'));
    }
}

function faseCA (agent) { // TODO REVISAR da problemas !!
    console.log('CONVERSACION Intent: ' + agent.intent);
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
    console.log('CONVERSACION Comunidad autónoma: ' + ca);
}

// ---------------------------------------------------------------------------------------------------------------------

// TODO idea: añadir un tercer argumento a las funciones peques para que si se pregunta directamente por ellas se dé más info

function medidasSociales (agent) {
    console.log('Intent: ' + agent.intent);
    let fase;
    if (agent.parameters.nfase) {
        fase = agent.parameters.nfase;
        console.log('nfase: ' + fase);
    } else if (faseCliente) {
        fase = faseCliente;
        console.log('faseCliente: ' + fase);
    }
    agent.add('En la fase ' + fase + ':');
    circulacion(agent, fase);
    velatorios(agent, fase);
    culto(agent, fase);
    if (fase === 2) {
        bodas(agent, fase);
        turismoActivo(agent, fase);
        congresos(agent, fases);
    }
    agent.add('Recuerde respetar siempre las medidas de seguridad e higiene establecidas');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function circulacion (agent, fase = 0) {
    if (fase === 0) {
        if (agent.parameters.nfase) {
            fase = agent.parameters.nfase;
        } else if (faseCliente) {
            fase = faseCliente;
        }
        agent.add('En la fase ' + fase + ':');
    }
    if (fase === 1) {
        agent.add('- Puede circular por su provincia o isla en grupos de máximo 10 personas.');
    } else if (fase === 2) {
        agent.add('- Puede circular por su provincia o isla en grupos de máximo 15 personas.');
        agent.add('- Las personas de hasta 70 años podrán realizar actividad\n' +
        'física no profesional en cualquier franja horaria excepto entre\n' +
        'las 10:00 y 12:00 horas y entre las 19:00 y 20:00 horas.')
    }
}
function velatorios (agent, fase = 0) {
    if (fase === 0) {
        if (agent.parameters.nfase) {
            fase = agent.parameters.nfase;
        } else if (faseCliente) {
            fase = faseCliente;
        }
        agent.add('En la fase ' + fase + ':');
    }
    if (fase === 1) {
        agent.add('- Pueden realizarse velatorios con un límite de 15 personas en espacios abiertos y 10 en cerrados.');
        agent.add('- La comitiva para la despedida de la persona fallecida se restringe a un máximo de 15 personas.')
    } else if (fase === 2) {
        agent.add('- Pueden realizarse velatorios con un límite de 25 personas en espacios abiertos y 15 en cerrados.');
        agent.add('- La comitiva para la despedida de la persona fallecida se restringe a un máximo de 25 personas')
    }
}
function culto (agent, fase = 0) {
    if (fase === 0) {
        agent.add('Desde la fase 1:')
    }
    agent.add('- Puede asistir a lugares de culto siempre que no se supere 1/3 de su aforo.');
    agent.add('- El aforo máximo deberá publicarse en lugar visible del espacio destinado al culto. ');
}
function bodas (agent, fase = 0) {
    if (fase === 0) {
        agent.add('A partir de la fase 2:');
    }
    agent.add('- Las ceremonias nupciales podrán realizarse en todo tipo de instalaciones, siempre que no se supere el 50% de su aforo.');
    agent.add('- Podrán asistir un máximo de 100 personas en espacios al aire libre o de 50 personas en espacios cerrados.');
}
function turismoActivo (agent, fase = 0) {
    if (fase === 0) {
        agent.add('A partir de la fase 2:');
    }
    agent.add('- Se podrán a realizar actividades de turismo activo y de naturaleza en grupos de hasta 20 personas, debiendo concertarse estas actividades preferentemente mediante cita previa.')
}
function congresos(agent, fase = 0) {
    if (fase === 0) {
        agent.add('A partir de la fase 2:');
    }
    agent.add('- Se permitirá la realización de congresos, encuentros, reuniones de negocio y conferencias promovidos por cualesquiera entidades de naturaleza pública o privada. ');
}

// ---------------------------------------------------------------------------------------------------------------------

function comercio(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase;
    if (agent.parameters.nfase) {
        fase = agent.parameters.nfase;
        console.log('CONVERSACION nfase: ' + fase);
    } else if (faseCliente) {
        fase = faseCliente;
        console.log('CONVERSACION faseCliente: ' + fase);
    }
    agent.add('En la fase ' + fase + ', se permite la reapertura de:');
    locales(agent, fase);
    cochesYplantas(agent, fase);
    mercadillos(agent, fase);
    if (fase === 2) {
        centrosComerciales(agent, fase);
        centrosFormacion(agent, fase);
    }
    agent.add('Recuerde respetar siempre las medidas de seguridad e higiene establecidas');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function locales(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        if (agent.parameters.nfase) {
            fase = agent.parameters.nfase;
        } else if (faseCliente) {
            fase = faseCliente;
        }
        agent.add('En la fase ' + fase + ', se permite la reapertura de:');
    }
    if (fase === 1) {
        agent.add('- Establecimientos de menos de 400m2 con un aforo de un 30%.');
    } else if (fase === 2) {
        agent.add('- Establecimientos de menos de 400m2 con un aforo de un 40%.');
    }
}
function cochesYplantas(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('Desde la fase 1, se permite la reapertura de:');
    }
    agent.add('- Concesionarios, estaciones de ITV y viveros, preferentemente con cita previa.');
}
function mercadillos(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        if (agent.parameters.nfase) {
            fase = agent.parameters.nfase;
        } else if (faseCliente) {
            fase = faseCliente;
        }
        agent.add('En la fase ' + fase + ', se permite la reapertura de:');
    }
    if (fase === 1) {
        agent.add('- Mercados al aire libre con el 25% de los puestos habituales y una afluencia de 1/3 del aforo habitual.');
    } else if (fase === 2) {
        agent.add('- Mercados al aire libre con 1/3 de los puestos habituales y una afluencia de 1/3 del aforo habitual.');
    }
}
function centrosComerciales(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 2, se permite la reapertura de:');
    }
    agent.add('- Centros y parques comerciales, limitando el aforo al 30% en las zonas comunes y al 40% en cada establecimiento. ');
}
function centrosFormacion(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 2, se permite la reapertura de:');
    }
    agent.add('- Centros educativos no universitarios y de formación. ');
    agent.add('- Academias y autoescuelas, limitando su aforo a 1/3 y priorizando la formación online. ');
}

// ---------------------------------------------------------------------------------------------------------------------

function hosteleria(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase;
    if (agent.parameters.nfase) {
        fase = agent.parameters.nfase;
        console.log('CONVERSACION nfase: ' + fase);
    } else if (faseCliente) {
        fase = faseCliente;
        console.log('CONVERSACION faseCliente: ' + fase);
    }
    agent.add('En la fase ' + fase + ', se permite la reapertura de:');
    terrazas(agent, fase);
    if (fase === 2) {
        agent.add('Se permite:');
        adomicilio(agent, fase);
    }
    agent.add('Recuerde priorizar el pago con tarjeta y respetar las medidas de seguridad e higiene.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function terrazas(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('Desde la fase 1, se permite la reapertura de:');
    }
    agent.add('- Terrazas al aire libre de los establecimientos de hostelería y restauración, limitando las mesas al 50% y la ocupación a 10 personas por mesa.');
}
function adomicilio(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 2, se permite:');
    }
    agent.add('- El consumo dentro del local sentado en mesa y preferentemente mediante reserva previa.');
    agent.add('- Encargar comida y bebida para llevar en el propio establecimiento.');
}
function discotecas(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Todavía no se permite la apertura de discotecas y bares de ocio nocturno.');
}

// ------------------------------------- INFORMACIÓN PARA LA CIUDADANÍA ------------------------------------------------
// https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/ciudadania.htm
const telefonosInfoUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/telefonos.htm';

function telefonosInfo(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let ca = agent.parameters.ca;
    let tlf;
    if (ca === 'Asturias') {
        tlf = '900 878 232'; // 984 100 400 / 112 marcando 1
    }
    agent.add('El teléfono de información en ' + ca + ' es ' + tlf + '.');
    agent.add('¿Le puedo ayudar en algo más?');
    sugerenciasInicio(agent);
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////// MINISTERIO DE TRABAJO Y ECONOMÍA SOCIAL /////////////////////////////////////////

const ministeriorTrabajoUrl = 'https://www.sepe.es/HomeSepe/COVID-19.html';


// -------------------------------------------------- TESTS ------------------------------------------------------------
function setCA(fakeCA) {comunidadAutonoma = fakeCA;}
function setFase(fakeFase) {faseCliente = fakeFase;}

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
    intentMap.set('A - Provincia', hola);
    intentMap.set('A - Explicacion', explicacion);
    intentMap.set('Fallback', fallback);
    intentMap.set('A - Gracias', gracias);
    intentMap.set('A - Menu', menu);
    intentMap.set('A - Adios', adios);

    intentMap.set('Sintomas', sintomas);
    intentMap.set('Sintomas - Como actuar', sintomasComoActuar);

    intentMap.set('Medidas seguridad', medidasSeguridad);
    intentMap.set('Medidas seguridad - Trabajo', medidasTrabajo);
    intentMap.set('Medidas seguridad - Higiene', medidasHigiene);
    intentMap.set('Medidas seguridad - Hosteleria', medidasHosteleria);

    intentMap.set('Situacion actual', situacionActual);
    intentMap.set('Fases', fases);
    intentMap.set('Fases - Informacion', fasesInformacion);
    intentMap.set('Fases - CA', faseCA);

    intentMap.set('Medidas sociales', medidasSociales);
    intentMap.set('Medidas sociales - Circulacion', circulacion);
    intentMap.set('Medidas sociales - Velatorios', velatorios);
    intentMap.set('Medidas sociales - Culto', culto);
    intentMap.set('Medidas sociales - Bodas', bodas);
    intentMap.set('Medidas sociales - Turismo activo', turismoActivo);
    intentMap.set('Medidas sociales - Congresos', congresos);

    intentMap.set('Comercio', comercio);
    intentMap.set('Comercio - Locales', locales);
    intentMap.set('Comercio - Mercadillos', mercadillos);
    intentMap.set('Comercio - Coches y plantas', cochesYplantas);
    intentMap.set('Comercio - Centros comerciales', centrosComerciales);
    intentMap.set('Comercio - Centros formacion', centrosFormacion);

    intentMap.set('Hosteleria', hosteleria);
    intentMap.set('Hosteleria - Terrazas', terrazas);
    intentMap.set('Hosteleria - A domicilio', adomicilio);
    intentMap.set('Hosteleria - Discotecas', discotecas);

    intentMap.set('CCAA - Tlf', telefonosInfo);

    agent.handleRequest(intentMap);
});

app.use('/', router);

module.exports = app;
module.exports.hola = hola;
module.exports.adios = adios;

module.exports.setCA = setCA;
module.exports.setFase = setFase;
