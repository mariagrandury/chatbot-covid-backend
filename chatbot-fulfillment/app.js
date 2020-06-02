'use strict';

const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware');
const {WebhookClient, Suggestion, Card, Image} = require('dialogflow-fulfillment');
const compression = require('compression');
const bodyParser = require('body-parser');
const cors = require('cors');

let express = require('express');

const router = express.Router();
const app = express();

// let xlsxFile = require('read-excel-file/node');

let dialogflowSession;
let noMatchMessages = [];

let onInit = true;

let provincia;
let faseCliente = 2;
let calificacion;

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function hola(agent) { // Wording: check
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (onInit && agent.parameters.provincia) {
        provincia = agent.parameters.provincia;
        console.log('CONVERSACION Provincia: ' + provincia);
        /*
        if (provincia) {
            try {
                await faseCliente = provinciasYfases();
                console.log('CONVERSACION Return de provinciasYfases: ', faseCliente);
                console.log('CONVERSACION Fase cliente: ', faseCliente);
            } catch (err) {
                console.log('CONVERSACION Hubo un problema al llamar provinciasYfases: ', err);
            }
        }*/
        agent.add('Perfecto, muchas gracias.');
        agent.add('Le puedo explicar cómo interactuar conmigo si todavía no me conoce.');
        agent.add(new Suggestion('Explícame 😊 ')); // TODO emoji
        agent.add(new Suggestion('Explicación de quién soy y cómo le puedo ayudar'));
        onInit = false;
        sugerenciasInicio(agent);
    } else {
        agent.add('¡Hola! Soy Aurora y estaré encantada de ayudarle a resolver todas sus dudas sobre la COVID-19.');
        agent.add('¿En qué puedo ayudarle?');
        sugerenciasInicio(agent);
    }
}

function explicacion(agent) { // Wording: check
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Mi creadora es María Grandury, soy su Trabajo Fin de Grado.'); // TODO Aurora mi bebé
    // agent.add('Todavía estoy aprendiendo, así que agradecería su opinión cuando finalice nuestra conversación.');
    agent.add('Puedo aclararle sus dudas respecto a:');
    agent.add('- 🌡️ Los síntomas de la COVID-19 y cómo actuar si los presenta');
    agent.add('- 🧼 Las medidas de higiene que debe respetar para su seguridad ');
    agent.add('- 🧾 ⚠ Las medidas de prevención que se deben adoptar en diferentes espacios, como restaurantes, centros culturales, hoteles, piscinas y playas ');
    agent.add('- 📉 La evolución de la pandemia en España y las características de las diferentes fases del plan de transición a una nueva normalidad');
    agent.add('Puede plantearme sus dudas escribiendo en su teclado o seleccionar alguna de las sugerencias que le propongo.');
    agent.add('En todo momento puede escribir \"Menú\" para volver al menú inicial.');
    agent.add('Toda la información la he recogido de la página oficial del Ministerio de Sanidad.');
    agent.add('Dicho esto, ¿en qué puedo ayudarle?');
    sugerenciasInicio(agent);
}

function sugerenciasInicio(agent) {
    if (agent.intent === 'Sintomas') {
        agent.add(new Suggestion('Cómo actuar ❔ 💭'));
        agent.add(new Suggestion('Cómo actuar si presenta síntomas'));
    } else {
        agent.add(new Suggestion('Síntomas 🌡️ ')); // 🤒
        agent.add(new Suggestion('Síntomas de la COVID-19'));
    }
    if (agent.intent !== 'Sintomas - Medidas higiene') {
        agent.add(new Suggestion('Medidas 🧼'));
        agent.add(new Suggestion('Medidas de higiene'));
    }
    agent.add(new Suggestion('Normativa 🧾 ⚠️ 🛑 ⛔️  🚫')); // TODO emoji
    agent.add(new Suggestion('Medidas de prevención adoptadas'));
    agent.add(new Suggestion('Evolución 📉'));
    agent.add(new Suggestion('Situacíon actual y fases de la desescalada'));
}

function menu (agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('¿Qué puedo hacer por usted?');
    sugerenciasInicio(agent);
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
    agent.add('Si no tiene más dudas, puede darme su opinión sobre su experiencia hablando conmigo.'); // TODO wording
    sugerenciasInicio(agent);
    agent.add(new Suggestion('Opinión ⭐')); // TODO emoji
    agent.add(new Suggestion('Ayúdeme a mejorar dándome su opinión'));
}


function adios(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Ha sido un placer ayudarle, ¡hasta pronto!');
}

function opinion(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('¿Qué le ha parecido la conversación?');
    agent.add('Puede elegir un número de estrellas de 1 a 5, siendo 5 la mejor calificación.');
    // agent.add('También puede escribir su opinión si prefiere.'); // TODO FUTURO permitir que escriba la opinión
    agent.add('Gracias por ayudarme a mejorar');
    agent.add(new Suggestion('⭐'));
    agent.add(new Suggestion('Muy mal'));
    agent.add(new Suggestion('⭐⭐'));
    agent.add(new Suggestion('Mal'));
    agent.add(new Suggestion('⭐⭐⭐'));
    agent.add(new Suggestion('Regular'));
    agent.add(new Suggestion('⭐⭐⭐⭐'));
    agent.add(new Suggestion('Bien'));
    agent.add(new Suggestion('⭐⭐⭐⭐⭐'));
    agent.add(new Suggestion('Muy bien'));
}

function opinionRecibida(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (agent.getContext('1estrella')) {
        calificacion = '1';
    } else if (agent.getContext('2estrellas')) {
        calificacion = '2';
    } else if (agent.getContext('3estrellas')) {
        calificacion = '3';
    } else if (agent.getContext('4estrellas')) {
        calificacion = '4';
    } else if (agent.getContext('5estrellas')) {
        calificacion = '5';
    }
    console.log('CONVERSACION Calificación: ' + calificacion);

    agent.add('Muchas gracias por su valoración.');
    agent.add('Ha sido un placer ayudarle, ¡hasta pronto!');
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
    sugerenciasInicio(agent);
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
    agent.add('¿Conoce el número de teléfono de su comunidad? ¿Sabe cuáles son los síntomas de la COVID-19? ¿Le puedo ayudar en algo más?');
    sugerenciasInicio(agent);
}

function medidasHigiene(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas de higiene y prevención establecidas por las autoridades sanitarias son:'); // pdf fase 1
    agent.add('- Distancia interpersonal de 2 metros');
    agent.add('- Higiene de manos: gel hidroalcohólico o desinfectante con actividad virucida');
    agent.add('- Etiqueta respiratoria');
    agent.add('¿Le puedo ayudar con algo más?');
    sugerenciasInicio(agent);
}

// ----------------------------------------- MEDIDAS DE SEGURIDAD ------------------------------------------------------

function medidasSeguridad (agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('¿Sobre qué medidas quiere que le informe en particular?');
    agent.add(new Suggestion('💻 💼'));
    agent.add(new Suggestion('Medidas en el trabajo'));
    agent.add(new Suggestion('🍴 ☕'));
    agent.add(new Suggestion('Medidas en hostelería'));
    agent.add(new Suggestion('📚 🎨 '));
    agent.add(new Suggestion('Medidas en centros culturales'));
    agent.add(new Suggestion('🏀🏐🏉🎾🏓'));
    agent.add(new Suggestion('Medidas en centros deportivos'));
    agent.add(new Suggestion('🛎️ 🛏️'));
    agent.add(new Suggestion('Medidas en establecimientos turísticos'));
    agent.add(new Suggestion('🏊‍♀️'));
    agent.add(new Suggestion('Medidas en piscinas'));
    agent.add(new Suggestion('🌅 ⛱️🏖️'));
    agent.add(new Suggestion('Medidas en playas'));
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

function medidasCentrosCulturales(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para el acceso a bibliotecas, salas de exposiciones y monumentos son:');
    agent.add('- Instalar barreras físicas de protección en mostradores de información y atención al público.');
    agent.add('- Colgar carteles con normas y recomendaciones para el público.');
    agent.add('- Colocar vinilos para la señalización de la distancia de seguridad.');
    agent.add('- Evitar que se formen colas o aglomeraciones en la entrada y/o salida.');
    agent.add('- Limpiar y desinfectar los inmuebles antes de la reapertura.');
    agent.add('- No ofrecer servicios de guardarropa o consigna.');
    agent.add('Además, se deben añadir varias medidas en cada caso particular:');
    agent.add(new Suggestion('📚 🖋️'));
    agent.add(new Suggestion('Medidas en bibliotecas'));
    agent.add(new Suggestion('🏺 🎨'));
    agent.add(new Suggestion('Medidas en exposiciones y museos'));
    agent.add(new Suggestion('🎬 🎭'));
    agent.add(new Suggestion('Medidas en cines y teatros'));
}

function medidasBibliotecas(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para la reapertura de bibliotecas son:');
    agent.add('- Limpiar y desinfectar los puestos de lectura tras cada usuario.');
    agent.add('- Limpiar los ordenadores tras cada uso.');
}

function medidasExposiciones(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para la reapertura de salas de exposiciones y museos son:');
    agent.add('- Evitar la celebración de eventos de inauguración de exposiciones que puedan causar aglomeraciones.');
    agent.add('- Excluir de la visita pública los lugares donde no pueda garantizarse la seguridad de los visitantes.');
    agent.add('- Inhabilitar el uso de elementos expuestos diseñados para un uso táctil por el visitante, así como las audioguías y folletos.');
    agent.add('- Evitar la confluencia de trabajadores de distintas especialidades a la hora del montaje y desmontaje de exposiciones temporales.');
    agent.add('- Limpiar y desinfectar, al menos una vez al día, el interior de los vehículos de transporte y las herramientas utilizadas durante el montaje.');
}

function medidasMonumentos(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para la reapertura de monumentos son:');
    agent.add('- Permitir únicamente visitas individuales o de convivientes.');
    agent.add('- No organizar ningún otro tipo de actividad cultural distinta a las visitas.');
    agent.add('- Evitar la confluencia de personal trabajador, investigador, residente o usuario de los inmuebles con los visitantes.');
    agent.add('- Establecer en recintos religiosos recorridos obligatorios para separar circulaciones.');
}

function medidasCines(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para la reapertura de cines, teatros y auditorios son:');
    agent.add('- Preasignar las butacas en la medida de lo posible.');
    agent.add('- Priorizar la venta online o telefónica de las entradas.');
}

// --------------------------- PLAN PARA LA TRANSICIÓN A UNA NUEVA NORMALIDAD ------------------------------------------

const situacionActualUrl = 'https://cnecovid.isciii.es/covid19/';
const mapaTransicion1Junio = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/img/Mapa_de_Transicion_hacia_la_nueva_normalidad.jpg';
const transicionUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/PlanTransicionNuevaNormalidad.pdf';
const transicionFase1Url = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/09052020_Plan_Transicion_Guia_Fase_1.pdf';
const loQuePuedesHacerFase1Url = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/img/Esto_es_lo_que_puedes_hacer_Fase-1.jpg';
const transicionFase2Url = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/Plan_Transicion_Guia_Fase_2.pdf';
const loQuePuedesHacerFase2Url = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/img/Esto_es_lo_que_puedes_hacer_Fase-2.jpg';
const transicionFAQUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/COVID19_Preguntas_y_respuestas_plan_nueva_normalidad.pdf';

function fases (agent) { // TODO wording
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Usted se encuentra en la fase ... '); // TODO fase del cliente
    agent.add('¿Quiere que le informe sobre su fase u otra?');
    agent.add(new Suggestion('Situación actual 📅'));
    agent.add(new Suggestion('Situación actual en España'));
    agent.add(new Suggestion('Mapa fases'));
    agent.add(new Suggestion('Mapa fases desescalada'));
    agent.add(new Suggestion('Fase 1️⃣'));
    agent.add(new Suggestion('Información sobre la fase 1'));
    agent.add(new Suggestion('Fase 2️⃣'));
    agent.add(new Suggestion('Información sobre la fase 2'));
}

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

function mapaFases(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Si quiere conocer la fase de cada provincia haga click en el siguiente enlace:');
    agent.add(new Card({
            title: 'Mapa fases 1 Junio',
            buttonText: 'Mapa fases 1 Junio',
            buttonUrl: mapaTransicion1Junio
        })
    );
    agent.add('¿En qué más le puedo ayudar?');
    sugerenciasInicio(agent);
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
    /*agent.add(new Card({
            title: 'Qué puede hacer en la fase 1',
            buttonText: 'Qué puede hacer en la fase 1',
            buttonUrl: loQuePuedesHacerFase1Url
        })
    );
    agent.add(new Card({
            title: 'Qué puede hacer en la fase 1',
            imageUrl: loQuePuedesHacerFase1Url,
            text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`
        })
    );
    agent.add('También puede hacer click en el siguiente enlace para acceder al pdf oficial:');*/
    agent.add('Puede hacer click en el siguiente enlace para acceder al pdf oficial:');
    agent.add(new Card({
            title: 'Guía de la fase 1',
            buttonText: 'Guía de la fase 1',
            buttonUrl: transicionFase1Url
        })
    );
    agent.add('No dude en plantearme dudas más concretas o elegir una de las categorías sugeridas.');
    sugerenciasFases(agent, 1);
}

function fase2 (agent) {
    console.log('CONVERSACION Funcion: Fase2');
    agent.add('En la fase 2 está permitido:');
    agent.add('- Circular por su provincia o isla en grupos de hasta 15 personas.');
    agent.add('- Apertura de locales y establecimientos minoristas con un aforo máximo del 40%.');
    agent.add('- Apertura de establecimientos de hostelería y restauración para consumo en el local, con un aforo máximo del 40%.');
    /*agent.add(new Card({
            title: 'Qué puede hacer en la fase 2',
            buttonText: 'Qué puede hacer en la fase 2',
            buttonUrl: loQuePuedesHacerFase2Url
        })
    );
    agent.add('También puede hacer click en el siguiente enlace para acceder al pdf oficial:');*/
    agent.add('Puede hacer click en el siguiente enlace para acceder al pdf oficial:');
    agent.add(new Card({
            title: 'Guía de la fase 2',
            buttonText: 'Guía de la fase 2',
            buttonUrl: transicionFase2Url
        })
    );
    agent.add('No dude en plantearme dudas más concretas o elegir una de las categorías sugeridas.');
    sugerenciasFases(agent, 2);
}

function sugerenciasFases(agent, fase) { // TODO seleccionar emojis
    agent.add(new Suggestion('🚗🙏'));
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
    agent.add(new Suggestion('🏀🏐🏉🎾🏓'));
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
    }
    agent.add('Recuerde respetar siempre las medidas de seguridad e higiene establecidas.');
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
    }
    agent.add('Recuerde respetar siempre las medidas de seguridad e higiene establecidas.');
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

// ---------------------------------------------------------------------------------------------------------------------

function serviciosSociales(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase;
    if (agent.parameters.nfase) {
        fase = agent.parameters.nfase;
        console.log('CONVERSACION nfase: ' + fase);
    } else if (faseCliente) {
        fase = faseCliente;
        console.log('CONVERSACION faseCliente: ' + fase);
    }
    if (fase === 1) {
        agent.add('En la fase 1, se permite la reapertura de:');
        agent.add('- Todos los centros recogidos en el Catálogo de Referencia de Servicios Sociales.');
        agent.add('El objetivo es que se pueda llevar a cabo la atención\n' +
            'presencial de aquellos ciudadanos que lo necesiten,\n' +
            'prestando especial atención a los servicios de terapia,\n' +
            'rehabilitación, atención temprana y atención diurna para\n' +
            'personas con discapacidad y/o en situación de dependencia.');
    }
    if (fase === 2) {
        agent.add('En la fase 2, se permiten las visitas a residentes de:');
        agent.add('- Viviendas tuteladas');
        agent.add('- Centros residenciales de personas con discapacidad');
        agent.add('- Centros residenciales de personas mayores ');
        agent.add('Deberá cumplir con las normas establecidas por su Comunidad Autónoma y concertar previamente la visita con la vivienda tutelada o el centro residencial.');
    }
    agent.add('Recuerde respetar siempre las medidas de seguridad e higiene establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}

// ---------------------------------------------------------------------------------------------------------------------

function educacion(agent) {
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
    bibliotecas(agent, fase);
    laboratorios(agent, fase);
    congresos(agent, fase);
    centrosFormacion(agent, fase);
    agent.add('Recuerde respetar siempre las medidas de seguridad e higiene establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function bibliotecas(agent, fase) {
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
        agent.add('- Bibliotecas públicas y privadas para préstamo y devolución de obras, así como para lectura en sala con una reducción del aforo al 30%.');
   } else if (fase === 2) {
        agent.add('- Bibliotecas públicas y privadas para préstamo y devolución de obras, así como para lectura en sala con una reducción del aforo al 30%. También se puede hacer uso de los ordenadores.');
    }
}
function laboratorios(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('Desde la fase 1, se permite la reapertura de:');
    }
    agent.add('- Laboratorios universitarios y entidades públicas y privadas que desarrollen actividades de investigación, desarrollo e innovación.');
}
function congresos(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        if (agent.parameters.nfase) {
            fase = agent.parameters.nfase;
        } else if (faseCliente) {
            fase = faseCliente;
        }
        agent.add('En la fase ' + fase + ', se permite la realización de:');
    }
    if (fase === 1) { // Cultura fase 1
        agent.add('- Congresos, encuentros, eventos y seminarios con un máximo de 30 asistentes y manteniendo la distancia física de dos metros. Deberá fomentarse la participación no presencial.');
    } else if (fase === 2) {// Medidas sociales fase 2
        agent.add('- Congresos, encuentros, reuniones de negocio y conferencias promovidos por cualesquiera entidades de naturaleza pública o privada. ');
    }
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

function cultura(agent) {
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
    museos(agent, fase);
    espectaculos(agent, fase);
    agent.add('Recuerde respetar siempre las medidas de seguridad e higiene establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function museos(agent, fase = 0) {
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
        agent.add('- Museos a 1/3 de su aforo. Tenga en cuenta que los recorridos podrían estar alterados por medidas de seguridad.');
    } else if (fase === 2) {
        agent.add('- Museos, salas de exposiciones y monumentos, siempre que no se supere 1/3 del aforo y se adopten las medidas necesarias para el control de las aglomeraciones.');
    }
}
function espectaculos(agent, fase = 0) {
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
        agent.add(' - Locales y establecimientos para actos y espectáculos culturales. El aforo máximo es de 30 personas en lugares cerrados y 200 personas al aire libre.');
    } else if (fase === 2) {
        agent.add('- Locales y establecimientos para actos y espectáculos culturales. El aforo máximo es de 50 personas en lugares cerrados y 400 personas al aire libre.');
        agent.add('- Cines, teatro y auditorios siempre que cuenten con butacas preasignadas y no se supere 1/3 del aforo.');
        agent.add('Intente comprar su entrada online o por teléfono si es posible.')
    }
}

// ---------------------------------------------------------------------------------------------------------------------

function deporte(agent) { // TODO dar menos información si preguntan por deporte en general
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase;
    if (agent.parameters.nfase) {
        fase = agent.parameters.nfase;
        console.log('CONVERSACION nfase: ' + fase);
    } else if (faseCliente) {
        fase = faseCliente;
        console.log('CONVERSACION faseCliente: ' + fase);
    }
    if (fase === 1) {
        agent.add('En la fase 1, se permite la reapertura de:');
        agent.add('- Centros de Alto Rendimiento');
        agent.add('- Instalaciones deportivas al aire libre');
        agent.add('- Centros deportivos para la práctica deportiva individual y el entrenamiento medio en ligas profesionales');
    } else if (fase === 2) {
        agent.add('En la fase2, se permite la reanudación de:');
        entrenamiento(agent, fase);
        competicion(agent, fase);
        agent.add('Además, se permite el acceso a:');
        instalacionesCubiertas(agent, fase);
        piscinasDeportivas(agent, fase);
        agent.add('Por último, se pueden realizar:');
        turismoActivo(agent, fase);
    }
    agent.add('Recuerde respetar siempre las medidas de seguridad e higiene establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function entrenamiento(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 2 se permite la reanudación de:');
    }
    agent.add('- Entrenamientos de deportistas profesionales y no profesionales, de manera individual.');
    agent.add('- Entrenamientos dirigidos a la fase previa de la competición en grupos de hasta 14 personas.');
    agent.add('- Reuniones técnicas de trabajo en grupos de hasta 15 personas, incluyendo al técnico.');
    agent.add('En la medida de lo posible, no se debe compartir ningún material de uso individual.');
    agent.add('Pueden acceder a las instalaciones (incluyendo vestuarios) deportistas, personal técnico y árbitros.');
    agent.add('Los medios de comunicación no pueden asistir a las sesiones de entrenamiento.');
}
function competicion(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 2 se permite la reanudación de:');
    }
    agent.add('- Competiciones de las Ligas Profesionales, sin público y a puerta cerrada.');
    agent.add('Se permite la entrada de medios de comunicación para la retransmisión de la competición.');
    agent.add('El Consejo Superior de Deportes determinará el número de personas que pueden acceder al estadio antes del inicio de la competición.');
}
function instalacionesCubiertas(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 2 se permite la reapertura de:');
    }
    agent.add('- Instalaciones cubiertas, en las que se podrán reanudar competiciones sin público y a puerta cerrada');
    agent.add('Se permite el acceso únicamente a deportistas de alto nivel, de alto rendimiento, profesionales, federados, árbitros o jueces y personal técnico federado.');
    agent.add('El límite del aforo es un 30% y se requiere concertar cita previa.');
}
function piscinasDeportivas(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 2 se permite la reapertura de:');
    }
    agent.add('- Piscinas al aire libre o cubiertas para la realización de actividades deportivas.');
    agent.add('- Los vestuarios correspondientes.');
    agent.add('El aforo máximo es del 30% y se debe pedir cita previa.');
    agent.add('Tenga en cuenta que tienen acceso preferente los deportistas federados en especialidades que se desarrollen en el medio acuático.');
    agent.add('Solo puede acceder con el deportista un entrenador en caso de ser necesario y estar acreditado.');
}

function turismoActivo (agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 2, se pueden realizar:');
    }
    agent.add('- Actividades de turismo activo y de naturaleza en grupos de hasta 20 personas, debiendo concertarse estas actividades preferentemente mediante cita previa.')
}

// ---------------------------------------------------------------------------------------------------------------------

function turismo(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase;
    if (agent.parameters.nfase) {
        fase = agent.parameters.nfase;
        console.log('CONVERSACION nfase: ' + fase);
    } else if (faseCliente) {
        fase = faseCliente;
        console.log('CONVERSACION faseCliente: ' + fase);
    }
    agent.add('En la fase ' + fase + ':');
    if (fase === 1) {
        agent.add('- El servicio de restauración de hoteles está reservado para los clientes hospedados.');
        agent.add('- No está permitida la utilización de piscinas, spas, gimnasios, miniclubs, zonas infantiles, discotecas y espacios de eventos.');
        agent.add('- La utilización de ascensores está limitada y la ocupación máxima es de una persona.');
    } else if (fase === 2) {
        agent.add('- Se permite la reapertura de las zonas comunes de hoteles y alojamientos turísticos, a 1/3 del aforo.');
        agent.add('- Las actividades de animación o clases grupales están organizadas con un aforo máximo de 20 personas y se celebrarán principalmente al aire libre.');
        agent.add('- Se permite la reapertura de parques naturales y teleféricos, con limitaciones de aforo.');
        agent.add('- Se permite también la reapertura de piscinas y spas.');
    }
    agent.add('Recuerde respetar siempre las medidas de seguridad e higiene establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}

// ---------------------------------------------------------------------------------------------------------------------

function piscinasYplayas(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase;
    if (agent.parameters.nfase) {
        fase = agent.parameters.nfase;
        console.log('CONVERSACION nfase: ' + fase);
    } else if (faseCliente) {
        fase = faseCliente;
        console.log('CONVERSACION faseCliente: ' + fase);
    }
    if (fase === 1) {
        agent.add('A partir de la fase 2, se permite el acceso a:');
    } else if (fase === 2) {
        agent.add('En la fase 2, se permite el acceso a:');
    }
    piscinasRecreativas(agent, fase);
    playas(agent, fase);
    agent.add('Recuerde respetar siempre las medidas de seguridad e higiene establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function piscinasRecreativas(agent, fase = 0) {
    if (fase === 0) {
        agent.add('En la fase 2 se permite la reapertura de:');
    }
    agent.add('- Piscinas recreativas, con un aforo de un 30% y pidiendo cita previamente.');
    agent.add('Tenga en cuenta que no se pueden usar las duchas de los vestuarios ni las fuentes de agua.');
}
function playas(agent, fase = 0) {
    if (fase === 0 ) {
        agent.add('En la fase 2 se permite el acceso a:');
    }
    agent.add('- Playas de su misma provincia o isla, en grupos de máximo 15 personas y con las limitaciones de acceso establecidas por cada ayuntamiento.');
    agent.add('Tenga en cuenta que el uso de duchas, aseos y vestuarios está limitado a la ocupación de una persona.');
    agent.add('Además, en la playa está permitida la práctica de actividades deportivas, profesionales o de recreo, siempre que se puedan desarrollar individualmente y sin contacto físico, permitiendo mantener una distancia mínima de dos metros entre los participantes.')
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
    agent.add(new Card({
            title: 'Teléfonos COVID-19',
            buttonText: 'Teléfonos COVID-19',
            buttonUrl: telefonosInfoUrl
        })
    );
    agent.add('El teléfono de información en ' + ca + ' es ' + tlf + '.');
    agent.add('¿Le puedo ayudar en algo más?');
    sugerenciasInicio(agent);
}


////////////////////////////////////////////// PROVINCIAS Y FASES  /////////////////////////////////////////////////////

/*
async function provinciasYfases() {
    console.log('CONVERSACION Function: provinciasYfases con ' + provincia);
    let faseProv;
    if (provincia) {
        let rows;
        try {
            rows = await xlsxFile('chatbot-fulfillment/provincias.xlsx');
            for (let i in rows) {
                if (rows[i][0] == provincia) {
                    console.log('CONVERSACION Function: provinciasYfases: provincia encontrada');
                    faseProv = rows[i][1];
                }
            }
            console.log(provincia);
            console.log(faseProv);
        } catch(err) {
            console.log('Function: provinciasYfases: ha ocurrido un problema al leer el excel' + err);
        }
    }
    return faseProv;
}
*/


// -------------------------------------------------- TESTS ------------------------------------------------------------
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
    // console.log('CONVERSACION Dialogflow session: ' + dialogflowSession);
    if (request.body.queryResult.action === 'input.unknown') {
        noMatchMessages.push(request.body.queryResult.queryText);
        console.log('CONVERSACION No match message: ' + request.body.queryResult.queryText);
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
    intentMap.set('A - Opinion', opinion);
    intentMap.set('A - Opinion 1 estrella', opinionRecibida);
    intentMap.set('A - Opinion 2 estrellas', opinionRecibida);
    intentMap.set('A - Opinion 3 estrellas', opinionRecibida);
    intentMap.set('A - Opinion 4 estrellas', opinionRecibida);
    intentMap.set('A - Opinion 5 estrellas', opinionRecibida);

    intentMap.set('Sintomas', sintomas);
    intentMap.set('Sintomas - Como actuar', sintomasComoActuar);
    intentMap.set('Sintomas - Medidas higiene', medidasHigiene);

    intentMap.set('Medidas seguridad', medidasSeguridad);
    intentMap.set('Medidas seguridad - Trabajo', medidasTrabajo);
    intentMap.set('Medidas seguridad - Hosteleria', medidasHosteleria);
    intentMap.set('Medidas seguridad - Centros culturales', medidasCentrosCulturales);
    intentMap.set('Medidas seguridad - Bibliotecas', medidasBibliotecas);
    intentMap.set('Medidas seguridad - Exposiciones', medidasExposiciones);
    intentMap.set('Medidas seguridad - Monumentos', medidasMonumentos);
    intentMap.set('Medidas seguridad - Cines', medidasCines);


    intentMap.set('Fases', fases);
    intentMap.set('Situacion actual', situacionActual);
    intentMap.set('Fases - Mapa', mapaFases);
    intentMap.set('Fases - Informacion', fasesInformacion);
    intentMap.set('Fases - CA', faseCA);

    intentMap.set('Medidas sociales', medidasSociales);
    intentMap.set('Medidas sociales - Circulacion', circulacion);
    intentMap.set('Medidas sociales - Velatorios', velatorios);
    intentMap.set('Medidas sociales - Culto', culto);
    intentMap.set('Medidas sociales - Bodas', bodas);

    intentMap.set('Comercio', comercio);
    intentMap.set('Comercio - Locales', locales);
    intentMap.set('Comercio - Mercadillos', mercadillos);
    intentMap.set('Comercio - Coches y plantas', cochesYplantas);
    intentMap.set('Comercio - Centros comerciales', centrosComerciales);

    intentMap.set('Hosteleria', hosteleria);
    intentMap.set('Hosteleria - Terrazas', terrazas);
    intentMap.set('Hosteleria - A domicilio', adomicilio);
    intentMap.set('Hosteleria - Discotecas', discotecas);

    intentMap.set('Servicios sociales', serviciosSociales);

    intentMap.set('Educacion', educacion);
    intentMap.set('Educacion - Bibliotecas', bibliotecas);
    intentMap.set('Educacion - Laboratorios', laboratorios);
    intentMap.set('Educacion - Congresos', congresos);
    intentMap.set('Educacion - Centros formacion', centrosFormacion);

    intentMap.set('Cultura', cultura);
    intentMap.set('Cultura - Museos', museos);
    intentMap.set('Cultura - Espectáculos', espectaculos);

    intentMap.set('Deporte', deporte);
    intentMap.set('Deporte - Entrenamiento', entrenamiento);
    intentMap.set('Deporte - Competicion', competicion);
    intentMap.set('Deporte - Instalaciones cubiertas', instalacionesCubiertas);
    intentMap.set('Deporte - Piscinas deportivas', piscinasDeportivas);
    intentMap.set('Deporte - Turismo activo', turismoActivo);

    intentMap.set('Turismo', turismo);

    intentMap.set('Piscinas y playas', piscinasYplayas);
    intentMap.set('Piscinas recreativas', piscinasRecreativas);
    intentMap.set('Playas', playas);


    intentMap.set('CCAA - Tlf', telefonosInfo);

    agent.handleRequest(intentMap);
});

app.use('/', router);

module.exports = app;
module.exports.hola = hola;
module.exports.adios = adios;

module.exports.setFase = setFase;
