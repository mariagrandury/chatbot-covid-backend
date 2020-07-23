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

let onInit = true;

let provincia;
let isla = false;
let faseCliente;
let faseCliente2;
let fasePorDefecto = 3;
let nuevaNormalidad = true;
let calificacion;
let opiniones = [];

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

async function hola(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (onInit && agent.parameters.provincia) {
        provincia = agent.parameters.provincia;
        console.log('CONVERSACION Provincia: ' + provincia);
        if (provincia) {
            provinciasYfases();
            console.log('CONVERSACION FaseCliente: ' + faseCliente);
        }
        agent.add('Perfecto, muchas gracias.');
        agent.add('Le puedo explicar cómo interactuar conmigo si todavía no me conoce.');
        agent.add(new Suggestion('Me presento 😊 '));
        agent.add(new Suggestion('Explicación de quién soy y cómo le puedo ayudar'));
        onInit = false;
        sugerenciasInicio(agent);
    } else {
        agent.add('¡Hola! Soy Aurora y estaré encantada de ayudarle a resolver todas sus dudas sobre la COVID-19.');
        agent.add('¿En qué puedo ayudarle?');
        sugerenciasInicio(agent);
    }
}

function explicacion(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Mi creadora es María Grandury, soy su Trabajo Fin de Grado.');
    agent.add('Le ofrezco información detallada sobre la COVID-19. Toda ella procede de la página oficial del Ministerio de Sanidad.');
     agent.add('Agradecería mucho su opinión cuando finalice nuestra conversación para seguir mejorando.');
    agent.add('Puedo aclararle sus dudas respecto a:');
    agent.add('🌡️ Los síntomas de la COVID-19 y cómo actuar si los presenta.');
    agent.add('🧼 Las medidas de higiene que debe respetar para su seguridad.');
    agent.add('🧾 Las medidas de prevención que se deben adoptar en diferentes espacios, como restaurantes, centros culturales, hoteles, piscinas y playas.');
    agent.add('📉 La evolución de la pandemia en España y las características de las diferentes fases del plan de transición a una nueva normalidad.');
    agent.add('Puede plantearme sus dudas escribiendo en su teclado o seleccionar alguna de las sugerencias que le propongo.');
    agent.add('Si está utilizando su móvil, mantenga pulsada una de dichas sugerencias para ver aclaraciones sobre los emoticonos.');
    agent.add('En todo momento puede escribir \"Inicio\" o pulsar el botón de la esquina superior derecha para volver al menú inicial.');
    agent.add('Dicho esto, ¿en qué puedo ayudarle?');
    sugerenciasInicio(agent);
}

function sugerenciasInicio(agent) {
    if (agent.intent === 'Sintomas') {
        agent.add(new Suggestion('Cómo actuar ❔ '));
        agent.add(new Suggestion('Cómo actuar si presenta síntomas'));
    } else {
        agent.add(new Suggestion('Síntomas 🌡️ '));
        agent.add(new Suggestion('Síntomas de la COVID-19'));
    }
    if (agent.intent !== 'Sintomas - Medidas higiene') {
        agent.add(new Suggestion('Prevención 🧼'));
        agent.add(new Suggestion('Medidas de higiene y prevención'));
    }
    agent.add(new Suggestion('Normativa 🧾 '));
    agent.add(new Suggestion('Medidas de seguridad adoptadas'));
    agent.add(new Suggestion('Evolución 📉'));
    agent.add(new Suggestion('Situacíon actual y fases de la desescalada'));
    if (agent.intent !== 'Internacional') {
        agent.add(new Suggestion('Internacional 🌍 '));
        agent.add(new Suggestion('Estadísticas de la COVID-19 en el mundo'));
    }
}

function inicio(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('¿Qué puedo hacer por usted?');
    sugerenciasInicio(agent);
}

function fallback(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    const respuestasPosibles = [
        'No he entendido a qué se refiere, ¿puede reformular su pregunta?',
        '¿Podría repetir su pregunta con otras palabras, por favor?',
        'Disculpe, no he entendido su petición. Reformule su duda.',
        'Perdone, no entiendo su pregunta. ¿Puede reformularla?',
        '¿Cómo? Formule de otra manera su pregunta, por favor.'
    ];
    agent.add(respuestasPosibles[Math.floor(Math.random() * respuestasPosibles.length)]);
    agent.add('También puede buscar su pregunta en el siguiente pdf:');
    agent.add(new Card({
            title: 'Preguntas frecuentes',
            buttonText: 'Preguntas frecuentes',
            buttonUrl: transicionFAQUrl
        })
    );
}

function gracias(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('De nada, es un placer. ¿Puedo hacer algo más por usted?');
    agent.add('Si no tiene más dudas, puede darme su opinión sobre su experiencia hablando conmigo.');
    sugerenciasInicio(agent);
    agent.add(new Suggestion('Opinión ⭐'));
    agent.add(new Suggestion('Ayúdeme a mejorar dándome su opinión'));
}

function adios(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Ha sido un placer ayudarle, ¡hasta pronto!');
    onInit = true; provincia = ''; isla = false; faseCliente = ''; faseCliente2 = '';
}

function opinion(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('¿Qué le ha parecido la conversación?');
    agent.add('Puede elegir un número de estrellas de 1 a 5, siendo 5 la mejor calificación.');
    agent.add('También puede escribir su opinión si prefiere.');
    agent.add('Gracias por ayudarme a mejorar.');
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
    if (agent.getContext('1estrella')) { calificacion = '1';}
    else if (agent.getContext('2estrellas')) { calificacion = '2'; }
    else if (agent.getContext('3estrellas')) { calificacion = '3'; }
    else if (agent.getContext('4estrellas')) { calificacion = '4'; }
    else if (agent.getContext('5estrellas')) { calificacion = '5'; }
    console.log('CONVERSACION Calificación: ' + calificacion);
    agent.add('Muchas gracias por su valoración.');
    agent.add('Ha sido un placer ayudarle, ¡hasta pronto!');
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// SUGERENCIAS //////////////////////////////////////////////////////////

function sugMedidasHigiene(agent) {
    agent.add(new Suggestion('🧼 📏'));
    agent.add(new Suggestion('Medidas de higiene y prevención'));
}
function sugMedidasSociales(agent) {
    agent.add(new Suggestion('🚗 🙏'));
    agent.add(new Suggestion('Medidas sociales'));
}
function sugMedidasTrabajo(agent) {
    agent.add(new Suggestion('💻 💼'));
    agent.add(new Suggestion('Medidas en el trabajo'));
}

// COMERCIOS
function sugMedidasComercios(agent) {
    agent.add(new Suggestion('🛍️ 💳 '));
    agent.add(new Suggestion('Medidas en comercios'));
}
function sugComercio(agent) {
    agent.add(new Suggestion('🛍️ 💲'));
    agent.add(new Suggestion('Comercio y prestación de servicios'));
}

// HOSTELERIA
function sugMedidasHosteleria(agent) {
    agent.add(new Suggestion('🍴 ☕ '));
    agent.add(new Suggestion('Medidas en hostelería'));
}
function sugHosteleria(agent) {
    agent.add(new Suggestion('👩‍🍳 ☕️'));
    agent.add(new Suggestion('Hostelería y restauración'));
}

// CULTURA
function sugMedidasCentrosCulturales(agent) {
    agent.add(new Suggestion('📚 🎨 '));
    agent.add(new Suggestion('Medidas en centros culturales'));
}
function sugMedidasBibliotecas(agent) {
    agent.add(new Suggestion('📚 ✍️ '));
    agent.add(new Suggestion('Medidas en bibliotecas'));
}
function sugMedidasMuseos(agent) {
    agent.add(new Suggestion('🏺 🎨'));
    agent.add(new Suggestion('Medidas en exposiciones y museos'));
}
function sugMedidasMonumentos(agent) {
    agent.add(new Suggestion('🏛️ 🕍'));
    agent.add(new Suggestion('Medidas en monumentos'));
}
function sugMedidasCines(agent) {
    agent.add(new Suggestion('🎬 🎭'));
    agent.add(new Suggestion('Medidas en cines y teatros'));
}
function sugCultura(agent) {
    agent.add(new Suggestion('🎭 🎨 '));
    agent.add(new Suggestion('Actividades culturales'));
}
function sugEducacion(agent) {
    agent.add(new Suggestion('📚 🎓'));
    agent.add(new Suggestion('Educación'));
}

// TURISMO
function sugMedidasTurismo(agent) {
    agent.add(new Suggestion('🛎️ 🛏️'));
    agent.add(new Suggestion('Medidas en establecimientos turísticos'));
}
function sugTurismo(agent) {
    agent.add(new Suggestion('🛎️ 🌳'));
    agent.add(new Suggestion('Hoteles y actividades turísticas'));
}

// DEPORTE
function sugMedidasCentrosDeportivos(agent) {
    agent.add(new Suggestion('🏉 🏆'));
    agent.add(new Suggestion('Medidas en centros deportivos'));
}
function sugMedidasPiscinas(agent) {
    agent.add(new Suggestion('🏊‍♀️ 🤿'));
    agent.add(new Suggestion('Medidas en piscinas'));
}
function sugMedidasPlayas(agent) {
    agent.add(new Suggestion('☀️ ⛱️'));
    agent.add(new Suggestion('Medidas en playas'));
}
function sugDeporte(agent) {
    agent.add(new Suggestion('🏀 🏓'));
    agent.add(new Suggestion('Actividades deportivas'));
}
function sugPiscinasYplayas(agent) {
    agent.add(new Suggestion('🏊‍♀️ 🏖️️'));
    agent.add(new Suggestion('Piscinas y playas'));
}

// OCIO
function sugMedidasJuegosYapuestas(agent) {
    agent.add(new Suggestion('🎲 🍀'));
    agent.add(new Suggestion('Medidas en locales de juegos y apuestas'));
}
function sugJuegosYapuestas(agent) {
    agent.add(new Suggestion('🎲 🎰 '));
    agent.add(new Suggestion('Locales de juegos y apuestas'));
}
function sugTiempoLibre(agent) {
    agent.add(new Suggestion('🏕️ 🥳'));
    agent.add(new Suggestion('Actividades para niños y jóvenes'));
}

// SERVICIOS SOCIALES
function sugSS(agent) {
    agent.add(new Suggestion('👩‍🦳 👴'));
    agent.add(new Suggestion('Servicios sociales'));
}

// MAS INFO
function sugMasInfo1(agent) {
    agent.add(new Suggestion('➕ Fase 1️'));
    agent.add(new Suggestion('Pdf oficial de la fase 1'));
}
function sugMasInfo2(agent) {
    agent.add(new Suggestion('➕ Fase 2️'));
    agent.add(new Suggestion('Pdf oficial de la fase 2'));
}
function sugMasInfo3(agent) {
    agent.add(new Suggestion('➕ Fase 3️'));
    agent.add(new Suggestion('Pdf oficial de la fase 3'));
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// MINISTERIO DE SALUD, CONSUMO Y BIENESTAR ////////////////////////////////////////////

// ------------------------------------------------ SÍNTOMAS -----------------------------------------------------------
const sintomasImageUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/img/COVID19_sintomas.jpg';
const sintomasComoActuarUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/20200325_Decalogo_como_actuar_COVID19.pdf';

function sintomas(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Los síntomas más comunes de la COVID-19 incluyen:');
    agent.add('- Fiebre 🤒');
    agent.add('- Tos 🤧');
    agent.add('- Sensación de falta de aire 😶');
    agent.add('Otros síntomas pueden ser: disminución de olfato y del gusto, escalofríos, dolor de garganta, dolores musculares, dolor de cabeza, debilidad general, diarrea o vómitos, entre otros.');
    agent.add('¿Sabe cómo actuar si presenta síntomas? ¿Le puedo ayudar en algo más?');
    sugerenciasInicio(agent);
}

function sintomasComoActuar(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Si tiene síntomas, siga las instrucciones del siguiente pdf:');
    agent.add(new Card({
            title: 'Síntomas: Cómo actuar',
            buttonText: 'Síntomas: Cómo actuar',
            buttonUrl: sintomasComoActuarUrl
        })
    );
    agent.add('Si está usted trabajando y presenta síntomas:');
    agent.add('- Contacte de inmediato con el teléfono habilitado para ello por su comunidad autónoma o centro de salud.');
    agent.add('- Colóquese una mascarilla.');
    agent.add('- Abandone su puesto de trabajo hasta que su situación médica sea valorada por un profesional sanitario.');
    agent.add('¿Conoce el número de teléfono de su comunidad? ¿Sabe cuáles son los síntomas de la COVID-19? ¿Le puedo ayudar en algo más?');
    agent.add(new Suggestion('Tlf ☎️'));
    agent.add(new Suggestion('Teléfonos de información sobre la COVID-19'));
    agent.add(new Suggestion('Síntomas 🌡️ '));
    agent.add(new Suggestion('Síntomas de la COVID-19'));
    agent.add(new Suggestion('Prevención 🧼'));
    agent.add(new Suggestion('Medidas de higiene y prevención'));
    agent.add(new Suggestion('Normativa 🧾 '));
    agent.add(new Suggestion('Medidas de seguridad adoptadas'));
}

function medidasHigiene(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas de higiene y prevención establecidas por las autoridades sanitarias incluyen:'); // pdf fase 1
    agent.add('- Mantener una distancia interpersonal de 2 metros');
    agent.add('- Lavarse las manos frecuentemente con gel hidroalcohólico o agua y jabón');
    agent.add('- Usar mascarilla en la vía pública');
    agent.add('- Evitar tocarse los ojos, la nariz y la boca');
    agent.add('- Si tose o estornuda, cubrirse boca y nariz con el codo');
    agent.add('- Usar pañuelos desechables');
    agent.add('¿Le puedo ayudar con algo más?');
    agent.add(new Card({
            title: 'Uso de mascarillas',
            buttonText: 'Uso de mascarillas',
            buttonUrl: mascarillasUrl
        })
    );
    sugerenciasInicio(agent);
}

// ----------------------------------------- MEDIDAS DE SEGURIDAD ------------------------------------------------------

const hosteleriaUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/img/COVID19_Consejos_bares_terrazas.jpg';
const movilidadUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/COVID19_Movilidad_y_seguridad_vial.pdf';
const mascarillasUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/COVID19_Mascarillas_higienicas_poblacion_general.pdf';

function medidasSeguridad(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('¿Sobre qué medidas quiere que le informe en particular?');
    sugMedidasTrabajo(agent);
    sugMedidasComercios(agent);
    sugMedidasHosteleria(agent);
    sugMedidasCentrosCulturales(agent);
    sugMedidasTurismo(agent);
    sugMedidasCentrosDeportivos(agent);
    sugMedidasPiscinas(agent);
    sugMedidasPlayas(agent);
    sugMedidasJuegosYapuestas(agent);
}

function medidasTrabajo(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar en el trabajo incluyen:');
    agent.add('- Fomentar el teletrabajo.');
    agent.add('- Adoptar las medidas necesarias para cumplir las medidas de higiene y prevención para los trabajadores.');
    agent.add('- Elaborar protocolos de reincorporación presencial a la actividad detallando dichas medidas');
    agent.add('- Poner a disposición de los trabajadores geles hidroalcohólicos o desinfectantes.');
    agent.add('- Garantizar, en la medida de lo posible, la distancia de seguridad interpersonal de 2 metros o proporcionar a los trabajadores equipos de protección.');
    agent.add('- Sustituir el control horario mediante huella dactilar o limpiar el dispositivo tras cada uso.');
    agent.add('- Organizar el horario para evitar riesgo de coincidencia masiva de personas.');
    agent.add('- Limpiar especialmente las zonas de uso común y las superficies de contacto como pomos de puertas, mesas y teléfonos.');
    agent.add('- Limitar el uso de los ascensores y montacargas.');
    agent.add('- Fomentar el pago con tarjeta, evitando el uso de dinero en efectivo.');
    agent.add('¿Sabe cómo actuar si presenta síntomas en el trabajo? ¿Le puedo ayudar con algo más?');
    agent.add(new Suggestion('Cómo actuar ❔ '));
    agent.add(new Suggestion('Cómo actuar si presenta síntomas en el trabajo'));
    agent.add(new Suggestion('Prevención 🧼'));
    agent.add(new Suggestion('Medidas de higiene y prevención'));
    agent.add(new Suggestion('Normativa 🧾 '));
    agent.add(new Suggestion('Medidas de seguridad adoptadas'));
}

function medidasComercios(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar en los comercios incluyen:');
    agent.add('- Establecer un horario de atención con servicio prioritario para mayores de 65 años.');
    agent.add('- Ofrecer un sistema de reparto a domicilio preferente para colectivos determinados.');
    agent.add('- Garantizar que los productos comercializados no sean manipulados por parte de los consumidores.');
    agent.add('- Evitar poner a disposición de los clientes productos de prueba como cosméticos y productos de perfumería.');
    agent.add('- Desinfetar los productos de telecomunicaciones de prueba tras el uso de cada cliente.');
    agent.add('- Limitar el uso de probadores a una persona y desinfectarlos tras cada uso al igual que las prendas probadas.');
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Quiere que le informe sobre medidas adoptadas en otros ámbitos?');
    sugMedidasHigiene(agent);
    sugMedidasHosteleria(agent);
    sugMedidasCentrosCulturales(agent);
}

function medidasHosteleria(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar en hostelería y restauración incluyen:');
    agent.add('- Limpiar y desinfectar el equipamiento de la terraza entre un cliente y otro.');
    agent.add('- Priorizar la utilización de mantelería de un solo uso y poner a disposición del público dispensadores de desinfectantes.');
    agent.add('- Fomentar el pago con tarjeta y evitar el uso de cartas de menú de uso común.');
    agent.add('- Eliminar productos de autoservicio como servilleteros y priorizar monodosis desechables.');
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Quiere que le informe sobre medidas adoptadas en otros ámbitos?');
    agent.add(new Card({
            title: 'Recomendaciones en bares y restaurantes',
            buttonText: 'Recomendaciones en bares y restaurantes',
            buttonUrl: hosteleriaUrl
        })
    );
    sugMedidasHigiene(agent);
    sugMedidasCentrosCulturales(agent);
    sugMedidasTurismo(agent);
}

function medidasCentrosCulturales(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para el acceso a bibliotecas, salas de exposiciones y monumentos incluyen:');
    agent.add('- Instalar barreras físicas de protección en mostradores de información y atención al público.');
    agent.add('- Colgar carteles con normas y recomendaciones para el público.');
    agent.add('- Colocar vinilos para la señalización de la distancia de seguridad.');
    agent.add('- Evitar que se formen colas o aglomeraciones en la entrada y/o salida.');
    agent.add('- Limpiar y desinfectar los inmuebles antes de la reapertura.');
    agent.add('- No ofrecer servicios de guardarropa o consigna.');
    agent.add('Además, se deben añadir varias medidas en cada caso particular:');
    sugMedidasBibliotecas(agent);
    sugMedidasMuseos(agent);
    sugMedidasMonumentos(agent);
    sugMedidasCines(agent);
}

function medidasBibliotecas(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para la reapertura de bibliotecas incluyen:');
    agent.add('- Limpiar y desinfectar los puestos de lectura tras cada usuario.');
    agent.add('- Limpiar los ordenadores tras cada uso.');
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Quiere que le informe sobre medidas adoptadas en otros ámbitos?');
    sugMedidasHigiene(agent);
    sugMedidasMuseos(agent);
    sugMedidasCines(agent);
}

function medidasExposiciones(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para la reapertura de salas de exposiciones y museos incluyen:');
    agent.add('- Evitar la celebración de eventos de inauguración de exposiciones que puedan causar aglomeraciones.');
    agent.add('- Excluir de la visita pública los lugares donde no pueda garantizarse la seguridad de los visitantes.');
    agent.add('- Inhabilitar el uso de elementos expuestos diseñados para un uso táctil por el visitante, así como las audioguías y folletos.');
    agent.add('- Evitar la confluencia de trabajadores de distintas especialidades a la hora del montaje y desmontaje de exposiciones temporales.');
    agent.add('- Limpiar y desinfectar, al menos una vez al día, el interior de los vehículos de transporte y las herramientas utilizadas durante el montaje.');
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Quiere que le informe sobre medidas adoptadas en otros ámbitos?');
    sugMedidasHigiene(agent);
    sugMedidasMonumentos(agent);
    sugMedidasCines(agent);
}

function medidasMonumentos(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para la reapertura de monumentos incluyen:');
    agent.add('- Permitir únicamente visitas individuales o de convivientes.');
    agent.add('- No organizar ningún otro tipo de actividad cultural distinta a las visitas.');
    agent.add('- Evitar la confluencia de personal trabajador, investigador, residente o usuario de los inmuebles con los visitantes.');
    agent.add('- Establecer en recintos religiosos recorridos obligatorios para separar circulaciones.');
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Quiere que le informe sobre medidas adoptadas en otros ámbitos?');
    sugMedidasHigiene(agent);
    sugMedidasCines(agent);
    sugMedidasBibliotecas(agent);
}

function medidasCines(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para la reapertura de cines, teatros y auditorios incluyen:');
    agent.add('- Preasignar las butacas en la medida de lo posible.');
    agent.add('- Priorizar la venta online o telefónica de las entradas.');
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Quiere que le informe sobre medidas adoptadas en otros ámbitos?');
    sugMedidasHigiene(agent);
    sugMedidasBibliotecas(agent);
    sugMedidasMuseos(agent);
}

function medidasTurismo(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para la reapertura de hoteles y establecimientos turísticos incluyen:');
    agent.add('- Respetar las medidas establecidas en el ámbito de la hostelería y restauración.');
    agent.add('- Determinar el aforo de los distintos espacios comunes.');
    agent.add('- Ventilar los espacios cerrados donde se vayan a celebrar eventos dos horas antes de su uso.');
    agent.add('- Realizar actividades de animación preferentemente al aire libre y evitar el intercambio de objetos.');
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Quiere que le informe sobre medidas adoptadas en otros ámbitos?');
    sugMedidasHigiene(agent);
    sugMedidasHosteleria(agent);
    sugMedidasCentrosDeportivos(agent);
}

function medidasDeporte(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para la reapertura de instalaciones deportivas incluyen:');
    agent.add('- Limpiar y desinfectar las instalaciones frecuentemente.');
    agent.add('- Concertar cita previa para entrenamientos y competiciones.');
    agent.add('- No compartir ningún material de uso individual, si no es posible, desinfectar tras cada uso.');
    agent.add('- Reanudar competiciones de Ligas Profesionales sin público y a puerta cerrada.');
    agent.add('- Permitir la entrada de medios de comunicación únicamente a competiciones, no entrenamientos.');
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Quiere que le informe sobre medidas adoptadas en otros ámbitos?');
    sugMedidasHigiene(agent);
    sugMedidasPiscinas(agent);
    sugMedidasPlayas(agent);
}

function medidasPiscinas(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para la reapertura de piscinas recreativas incluyen:');
    agent.add('- Concertar cita previa para acceder a la piscina.');
    agent.add('- Colocar carteles con las normas de higiene y prevención o anunciarlas por megafonía.');
    agent.add('- Limpiar y desinfectar frecuentemente los equipos y materiales como barandillas y las taquillas.');
    agent.add('- Garantizar la distancia de seguridad entre usuarios mediante señales en el suelo.');
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Quiere que le informe sobre medidas adoptadas en otros ámbitos?');
    sugMedidasHigiene(agent);
    sugMedidasPlayas(agent);
    sugMedidasJuegosYapuestas(agent);
}

function medidasPlayas(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para la reapertura de playas incluyen:');
    agent.add('- Establecer limitaciones de acceso en caso necesario para asegurar la distancia entre bañistas.');
    agent.add('- Limitar la ocupación de duchas, aseos y vestuarios a una persona.');
    agent.add('- Ubicar objetos personales como toallas y tumbonas garantizando el perímetro de seguridad.');
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Quiere que le informe sobre medidas adoptadas en otros ámbitos?');
    sugMedidasHigiene(agent);
    sugMedidasJuegosYapuestas(agent);
    sugMedidasPiscinas(agent);
}

function medidasJuegosYapuestas(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Las medidas que se deben respetar para la reapertura de locales de juegos y apuestas incluyen:');
    agent.add('- Limpiar y desinfectar todas las máquinas, sillas y mesas entre un cliente y el siguiente.');
    agent.add('- Garantizar la higienización cada dos horas de las fichas, cartar y otros elementos de juego.');
    agent.add('- Ventilar las instalaciones, como mínimo dos veces al día.');
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Quiere que le informe sobre medidas adoptadas en otros ámbitos?');
    sugMedidasHigiene(agent);
    sugMedidasHosteleria(agent);
    sugMedidasTurismo(agent);
}

// --------------------------- PLAN PARA LA TRANSICIÓN A UNA NUEVA NORMALIDAD ------------------------------------------

const situacionActualUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/situacionActual.htm';
const situacionActualMapaUrl = 'https://cnecovid.isciii.es/covid19/';
const mapaTransicion8Junio = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/img/Mapa_de_Transicion_hacia_la_nueva_normalidad.jpg';
const transicionFase1Url = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/09052020_Plan_Transicion_Guia_Fase_1.pdf';
const loQuePuedesHacerFase1Url = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/img/Esto_es_lo_que_puedes_hacer_Fase-1.jpg';
const transicionFase2Url = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/Plan_Transicion_Guia_Fase_2.pdf';
const loQuePuedesHacerFase2Url = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/img/Esto_es_lo_que_puedes_hacer_Fase-2.jpg';
const transicionFAQUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/COVID19_Preguntas_y_respuestas_plan_nueva_normalidad.pdf';
const transicionFase3Url = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/documentos/Plan_Transicion_Guia_Fase_3.pdf';

function fases(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (nuevaNormalidad) {
        if (provincia) {
            if (isla) {
                agent.add('Actualmente la transmisión en el país ha descendido y su isla, ' + provincia + ', se encuentra en la nueva normalidad.');
            } else {
                agent.add('Actualmente la transmisión en el país ha descendido y su provincia, ' + provincia + ', se encuentra en la nueva normalidad.');
            }
        }
        agent.add('Han terminado las restricciones sociales y económicas, pero se mantiene la vigilancia epidemiológica, la capacidad reforzada del sistema sanitario y la autoprotección de la ciudadanía.');
    } else {
        agent.add('Su provincia, ' + provincia + ', se encuentra en la fase ' + faseCliente + ' flexibilizada.');
    }
        /*if (provincia) {
            if (faseCliente2) {
                agent.add(faseCliente2);
            } else if (isla) {
                agent.add('Su isla, ' + provincia + ', se encuentra en la fase ' + faseCliente + '.');
            } else {
                agent.add('Su provincia, ' + provincia + ', se encuentra en la fase ' + faseCliente + '.');
            }
        }
        agent.add('Si quiere conocer la fase de todas las provincias e islas haga click en el siguiente enlace:');
        agent.add(new Card({
                title: 'Mapa fases 8 Junio',
                buttonText: 'Mapa fases 8 Junio',
                buttonUrl: mapaTransicion8Junio
            })
        );
        agent.add('¿Sobre qué quiere que le informe?');*/
    agent.add('¿Sobre cuál de las fases de la transición a la nueva normalidad quiere que le informe?');
    agent.add(new Suggestion('Situación actual 📅'));
    agent.add(new Suggestion('Situación actual (Ministerio de Sanidad)'));
    agent.add(new Suggestion('Fase 1️⃣'));
    agent.add(new Suggestion('Información sobre la fase 1'));
    agent.add(new Suggestion('Fase 2️⃣'));
    agent.add(new Suggestion('Información sobre la fase 2'));
    agent.add(new Suggestion('Fase 3️⃣'));
    agent.add(new Suggestion('Información sobre la fase 3'));
}

function situacionActual(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('A día 23 de Julio, datos del Ministerio de Salud afirman que:');
    agent.add('El número de casos confirmados por COVID-19 en España es 267.551.');
    agent.add('El número de fallecidos es 28.426.');
    agent.add('Si quiere acceder a un mapa interactivo de la situación actual en España haga click en el siguiente enlace:');
    agent.add(new Card({
            title: 'Mapa situación actual',
            buttonText: 'Mapa situación actual',
            buttonUrl: situacionActualMapaUrl
        })
    );
    agent.add('¿En qué más le puedo ayudar?');
    sugerenciasInicio(agent);
}

function fasesInformacion(agent) {
    let nfase = agent.parameters.nfase;
    console.log('CONVERSACION Intent: ' + agent.intent + ', nfase: ' + nfase);
    if (nfase === 1) { fase1(agent); }
    else if (nfase === 2) { fase2(agent); }
    else if (nfase === 3) { fase3(agent);
    } else {
        agent.add('Actualmente la transmisión en el país ha descendido y la mayoría de las provincias se encuentran en la nueva normalidad.');
        agent.add('Han terminado las restricciones sociales y económicas, pero se mantiene la vigilancia epidemiológica, la capacidad reforzada del sistema sanitario y la autoprotección de la ciudadanía.');
        agent.add('El plan para la transición a una nueva normalidad incluía fases 1, 2 y 3.');
        agent.add('¿Sobre cuál de ellas quiere que le informe?');
    }
}

function fase1(agent) {
    console.log('CONVERSACION Function: Fase1');
    agent.add('En la fase 1 se puede, entre otros:');
    agent.add('- Circular por su provincia o isla en grupos de hasta 10 personas.');
    agent.add('- Comprar en mercadillos y tiendas de hasta 400m2, donde el aforo está limitado al 30%.');
    agent.add('- Ir a terrazas al aire libre limitadas al 50% de las mesas.');
    agent.add('- Acudir a lugares de culto.');
    agent.add('- Pasear y hacer deporte al aire libre.');
    agent.add(new Card({
            title: 'Qué se puede hacer en la fase 1',
            buttonText: 'Qué se puede hacer en la fase 1',
            buttonUrl: loQuePuedesHacerFase1Url
        })
    );
    agent.add('No dude en plantearme dudas más concretas o elegir una de las categorías sugeridas.');
    sugerenciasFases(agent, 1);
}

function fase2(agent) {
    console.log('CONVERSACION Funcion: Fase2');
    agent.add('En la fase 2 se puede, entre otros:');
    agent.add('- Circular por su provincia o isla en grupos de hasta 15 personas.');
    agent.add('- Comprar en tiendas y centros comerciales, donde el aforo está limitado al 40%.');
    agent.add('- Ir a bares y restaurantes para consumir en el local, con un aforo máximo del 40%, o en las terrazas, aforo máximo del 50%.');
    agent.add('- Acudir a centros culturales y deportivos.');
    agent.add('- Alojarse en un hotel e ir a piscinas y playas.');
    agent.add(new Card({
            title: 'Qué se puede hacer en la fase 2',
            buttonText: 'Qué se puede hacer en la fase 2',
            buttonUrl: loQuePuedesHacerFase2Url
        })
    );
    agent.add('No dude en plantearme dudas más concretas o elegir una de las categorías sugeridas.');
    sugerenciasFases(agent, 2);
}

function fase3(agent) {
    console.log('CONVERSACION Funcion: Fase3');
    agent.add('En la fase 3 se puede, entre otros:');
    agent.add('- Circular por su provincia o isla en grupos de hasta 20 personas y sin franjas horarias.');
    agent.add('- Comprar en tiendas, donde el aforo está limitado al 50%.');
    agent.add('- Ir a bares y restaurantes para consumir en el local, con un aforo máximo del 50%, o en las terrazas, aforo máximo del 75%.');
    agent.add('No dude en plantearme dudas más concretas o elegir una de las categorías sugeridas.');
    sugerenciasFases(agent, 3);
}

function sugerenciasFases(agent, fase) {
    sugMedidasSociales(agent);
    sugComercio(agent);
    sugHosteleria(agent);
    sugSS(agent);
    sugEducacion(agent);
    sugCultura(agent);
    sugDeporte(agent);
    sugTurismo(agent);
    if (fase === 1) {
        sugMasInfo1(agent);
    }
    if (fase === 2) {
        sugPiscinasYplayas(agent);
        sugMasInfo2(agent);
    }
    if (fase === 3) {
        sugJuegosYapuestas(agent);
        sugTiempoLibre(agent);
        sugMasInfo3(agent);
    }
}

function fasesMasInformacion(agent) {
    let nfase = agent.parameters.nfase;
    console.log('CONVERSACION Intent: ' + agent.intent + ', nfase: ' + nfase);
    agent.add('Si quiere información detallada sobre la fase ' + nfase + ', haga click en el siguiente enlace para acceder al pdf oficial:');
    if (nfase === 1) { masInfoFase1(agent); }
    else if (nfase === 2) { masInfoFase2(agent); }
    else if (nfase === 3) { masInfoFase3(agent); }
    else {
        agent.add('El plan para la transición a una nueva normalidad solo incluye fases 1, 2 y 3.');
        agent.add('¿Sobre cuál de ellas quiere que le informe?');
    }
    agent.add('¿Le puedo ayudar en algo más?');
    sugerenciasInicio(agent);
}
function masInfoFase1(agent) {
    agent.add(new Card({ title: 'Guía de la fase 1', buttonText: 'Guía de la fase 1', buttonUrl: transicionFase1Url }));
}
function masInfoFase2(agent) {
    agent.add(new Card({ title: 'Guía de la fase 2', buttonText: 'Guía de la fase 2', buttonUrl: transicionFase2Url }));
}
function masInfoFase3(agent) {
    agent.add(new Card({ title: 'Guía de la fase 3', buttonText: 'Guía de la fase 3', buttonUrl: transicionFase3Url }));
}

// ---------------------------------------------------------------------------------------------------------------------

function setFase(agent) {
    console.log('CONVERSACION Function: setFase');
    let setfase;
    if (agent.parameters.nfase) {
        setfase = agent.parameters.nfase;
        console.log('CONVERSACION nfase: ' + setfase);
    } else if (faseCliente) {
        setfase = faseCliente;
        console.log('CONVERSACION faseCliente: ' + setfase);
    } else {
        setfase = fasePorDefecto;
        console.log('CONVERSACION fasePorDefecto: ' + setfase);
    }
    return setfase;
}

// ---------------------------------------------------------------------------------------------------------------------

function medidasSociales(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase = setFase(agent);
    agent.add('En la fase ' + fase + ' se puede:');
    circulacion(agent, fase);
    velatorios(agent, fase);
    culto(agent, fase);
    if (fase !== 1) {
        bodas(agent, fase);
    }
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function circulacion(agent, fase = 0) {
    if (fase === 0) {
        fase = setFase(agent);
        agent.add('En la fase ' + fase + ' puede:');
        sugerenciasFases(agent, fase);
    }
    if (fase === 1) {
        agent.add('- Circular por su provincia o isla en grupos de máximo 10 personas.');
    } else if (fase === 2) {
        agent.add('- Circular por su provincia o isla en grupos de máximo 15 personas.');
        agent.add('- Las personas de hasta 70 años pueden realizar actividad\n' +
        'física no profesional en cualquier franja horaria excepto entre\n' +
        'las 10:00 y 12:00 horas y entre las 19:00 y 20:00 horas.')
    } else if (fase === 3) {
    agent.add('- Circular por su provincia o isla en grupos de máximo 20 personas.');
    agent.add('El desplazamiento a otra parte del territorio nacional solo se puede realizar por motivos:');
    agent.add('- Sanitarios');
    agent.add('- Laborales, profesionales o empresariales');
    agent.add('- Retorno al lugar de residencia familiar');
    agent.add('- Asistencia y cuidado de mayores, dependientes o personas con discapacidad');
    agent.add('- Causa de fuerza mayor o situación de necesidad');
    agent.add('Se eliminan las franjas horarias para todos los colectivos.');
}
}
function velatorios(agent, fase = 0) {
    if (fase === 0) {
        fase = setFase(agent);
        agent.add('En la fase ' + fase + ' se pueden:');
        sugerenciasFases(agent, fase);
    }
    if (fase === 1) {
        agent.add('- Realizar velatorios con un límite de 15 personas en espacios abiertos y 10 en cerrados.');
        agent.add('La comitiva para la despedida de la persona fallecida se restringe a un máximo de 15 personas.')
    } else if (fase === 2) {
        agent.add('- Realizar velatorios con un límite de 25 personas en espacios abiertos y 15 en cerrados.');
        agent.add('La comitiva para la despedida de la persona fallecida se restringe a un máximo de 25 personas.');
    } else if (fase === 3) {
        agent.add('- Realizar velatorios con un límite de 50 personas en espacios abiertos y 25 en cerrados.');
        agent.add('La comitiva para la despedida de la persona fallecida se restringe a un máximo de 50 personas.');
    }
}
function culto(agent, fase = 0) {
    if (fase === 0) {
        fase = setFase(agent);
        agent.add('En la fase ' + fase + ' se puede:');
        sugerenciasFases(agent, fase);
    }
    if (fase === 1 || fase === 2) {
        agent.add('- Asistir a lugares de culto siempre que no se supere 1/3 de su aforo.');
    } else if (fase === 3) {
        agent.add('- Asistir a lugares de culto siempre que no se supere el 75% de su aforo.');
        agent.add('En todo caso, el máximo de personas es de 150 en espacios al aire libre y 75 en espacios cerrados.');
    }
    agent.add('Dicho aforo debe publicarse en un lugar visible del espacio destinado al culto.');
}
function bodas(agent, fase = 0) {
    if (fase === 0) {
        fase = setFase(agent);
        if (fase === 1) { fase += 1; }
        agent.add('A partir de la fase ' + fase + ' se pueden:');
        sugerenciasFases(agent, fase);
    }
    if (fase === 2) {
        agent.add('- Celebrar ceremonias nupciales en todo tipo de instalaciones, siempre que no se supere el 50% de su aforo.');
        agent.add('Pueden asistir un máximo de 100 personas en espacios al aire libre o de 50 personas en espacios cerrados.');
    } else if (fase === 3) {
        agent.add('- Celebrar ceremonias nupciales en todo tipo de instalaciones, siempre que no se supere el 75% de su aforo.');
        agent.add('Pueden asistir un máximo de 150 personas en espacios al aire libre o de 75 personas en espacios cerrados.');
    }
}


function segundaResidencia(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Desde la fase 2 puede ir a su segunda residencia siempre que se encuentre dentro de la provincia en la que se ubica su domicilio habitual.');
    agent.add('Sin embargo, hasta superar la fase 3 no se permite viajar a provincias diferentes a aquella en la que reside, salvo por las causas justificadas.');
    agent.add('Debe esperar hasta que ambas provincias hayan superado la fase 3 y se entre en la nueva normalidad.');
    agent.add('¿Le puedo ayudar en algo más?');
    sugerenciasFases(agent);
}
function cambioDeProvincia(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Por regla general, los desplazamientos entre provincias no están permitidos hasta que no finalice el proceso de transición hacia la nueva normalidad.');
    agent.add('Sin embargo, sí se pueden realizar por motivos:');
    agent.add('- Sanitarios');
    agent.add('- Laborales, profesionales o empresariales');
    agent.add('- Retorno al lugar de residencia familiar');
    agent.add('- Asistencia y cuidado de mayores, dependientes o personas con discapacidad');
    agent.add('- Causa de fuerza mayor o situación de necesidad');
    agent.add('¿Le puedo ayudar en algo más?');
    sugerenciasFases(agent);
}
function grupos(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Desde la fase 1 se permite el contacto social entre personas sin ninguna patología previa y que no sean vulnerables.');
    agent.add('El número máximo de personas por grupo es:');
    agent.add('- 10 en la fase 1');
    agent.add('- 15 en la fase 2');
    agent.add('- 20 en la fase 3');
    agent.add('¿Le puedo ayudar en algo más?');
    sugerenciasFases(agent);
}
function transportePublico(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    agent.add('Tanto en transporte público como en un taxi es imprescindible el uso de mascarillas.');
    agent.add('¿Le puedo ayudar en algo más?');
    sugerenciasFases(agent);
}

// ---------------------------------------------------------------------------------------------------------------------

function comercio(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase = setFase(agent);
    agent.add('En la fase ' + fase + ', se permite la reapertura de:');
    locales(agent, fase);
    coches(agent, fase);
    plantas(agent, fase);
    mercadillos(agent, fase);
    if (fase !== 1) {
        centrosComerciales(agent, fase);
    }
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function locales(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        fase = setFase(agent);
        agent.add('En la fase ' + fase + ', se permite la reapertura de:');
        sugerenciasFases(agent, fase);
    }
    if (fase === 1) {
        agent.add('- Establecimientos de menos de 400m2 con un 30% del aforo total.');
    } else if (fase === 2) {
        agent.add('- Establecimientos de menos de 400m2 con un 40% del aforo total.');
    } else if (fase === 3) {
        agent.add('- Locales comerciales con un 50% del aforo total.');
    }
}
function coches(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('Desde la primera fase, se permite la reapertura de:');
    }
    agent.add('- Concesionarios y estaciones de ITV, preferentemente con cita previa.');
}
function plantas(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('Desde la primera fase, se permite la reapertura de:');
        sugerenciasFases(agent, fase);
    }
    agent.add('- Centros de jardinería y viveros de plantas, preferentemente con cita previa.');
}
function mercadillos(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        fase = setFase(agent);
        agent.add('En la fase ' + fase + ', se permite la reapertura de:');
        sugerenciasFases(agent, fase);
    }
    if (fase === 1) {
        agent.add('- Mercados al aire libre con el 25% de los puestos habituales y una afluencia de 1/3 del aforo habitual.');
    } else if (fase === 2) {
        agent.add('- Mercados al aire libre con 1/3 de los puestos habituales y una afluencia de 1/3 del aforo habitual.');
    } else if (fase === 3) {
        agent.add('- Mercados al aire libre con el 50% de los puestos habituales y limitando la afluencia para asegurar la distancia interpersonal.');
    }
}
function centrosComerciales(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        fase = setFase(agent);
        if (fase === 1) { fase += 1; }
        agent.add('A partir de la fase ' + fase + ' se permite la reapertura de:');
        sugerenciasFases(agent, fase);
    }
    if (fase === 2) {
        agent.add('- Centros y parques comerciales, limitando el aforo al 30% en las zonas comunes y al 40% en cada local.');
    } else if (fase === 3) {
        agent.add('- Centros y parques comerciales, limitando el aforo al 40% en las zonas comunes y al 50% en cada local.');
    }
}

// ---------------------------------------------------------------------------------------------------------------------

function hosteleria(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase = setFase(agent);
    agent.add('En la fase ' + fase + ', se permite la reapertura de:');
    terrazas(agent, fase);
    if (fase !== 1) {
        agent.add('Se permite también:');
        adomicilio(agent, fase);
    }
    if (fase === 3) {
        barra(agent, fase);
    }
    discotecas(agent, fase);
    agent.add('Recuerde priorizar el pago con tarjeta y respetar las medidas de higiene y prevención.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function terrazas(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        fase = setFase(agent);
        agent.add('En la fase ' + fase + ' se permite la reapertura de:');
        sugerenciasFases(agent, fase);
    }
    if (fase === 1 || fase === 2) {
        agent.add('- Terrazas al aire libre de los establecimientos de hostelería y restauración, limitando las mesas al 50% y la ocupación a 10 personas por mesa.');
    } else if (fase === 3) {
        agent.add('- Terrazas al aire libre de los establecimientos de hostelería y restauración, limitando las mesas al 75% y la ocupación a 20 personas por mesa.');
    }
}
function adomicilio(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 2, se permite:');
        sugerenciasFases(agent, fase);
    }
    agent.add('- El consumo dentro del local en mesas y preferentemente con reserva previa.');
    agent.add('- Encargar comida y bebida para llevar en el propio establecimiento.');
}
function barra(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 3, se permite:');
        sugerenciasFases(agent, fase);
    }
    agent.add('- El consumo en la barra si se garantiza la distancia interpersonal de 2 metros.');
}
function discotecas(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        fase = setFase(agent);
        sugerenciasFases(agent, fase);
    }
    if (fase === 3) {
        agent.add('A partir de la fase 3, se permite la reapertura de:');
        agent.add('- Discotecas y bares de ocio nocturno, con el aforo limitado al 33%.');
    } else {
        agent.add('No se permite la reapertura de discotecas y bares de ocio nocturno.');
    }
}

// ---------------------------------------------------------------------------------------------------------------------

function serviciosSociales(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase = setFase(agent);
    if (fase === 1) {
        agent.add('En la fase 1, se permite la reapertura de:');
        agent.add('- Centros de terapia o rehabilitación');
        agent.add('- Centros de atención temprana y atención diurna');
        agent.add('El objetivo es atender presencialmente a personas con discapacidad y/o en situación de dependencia.');
    }
    if (fase === 2 || fase === 3) {
        agent.add('Desde la fase 2, se permiten las visitas concertadas a residentes de:');
        agent.add('- Viviendas tuteladas');
        agent.add('- Centros residenciales de personas con discapacidad');
        agent.add('- Centros residenciales de personas mayores');
    }
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}

// ---------------------------------------------------------------------------------------------------------------------

function educacion(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase = setFase(agent);
    agent.add('En la fase ' + fase + ', se permite la reapertura de:');
    bibliotecas(agent, fase);
    laboratorios(agent, fase);
    congresos(agent, fase);
    if (fase !== 1) {
        centrosFormacion(agent, fase);
        agent.add('Además, se permite a alumnado no universitario volver a la educación presencial de manera voluntaria. Pregúnteme si quiere más información.');
    }
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function bibliotecas(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        fase = setFase(agent);
        agent.add('En la fase ' + fase + ', se permite la reapertura de:');
        sugerenciasFases(agent, fase);
    }
    if (fase === 1) {
        agent.add('- Bibliotecas públicas y privadas para préstamo y devolución de obras, así como para lectura en sala con una reducción del aforo al 30%.');
    } else if (fase === 2) {
        agent.add('- Bibliotecas públicas y privadas para préstamo y devolución de obras, así como para lectura en sala con una reducción del aforo al 30%. También se puede hacer uso de los ordenadores.');
    } else if (fase === 3) {
        agent.add('- Bibliotecas públicas y privadas para préstamo y devolución de obras, así como para lectura en sala con una reducción del aforo al 50%. También se puede hacer uso de los ordenadores y organizar actividades culturales.');
    }
}
function laboratorios(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('Desde la fase 1, se permite la reapertura de:');
        sugerenciasFases(agent, fase);
    }
    agent.add('- Laboratorios universitarios y entidades públicas y privadas que desarrollen actividades de investigación, desarrollo e innovación.');
}
function congresos(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        fase = setFase(agent);
        agent.add('En la fase ' + fase + ', se permite la realización de:');
        sugerenciasFases(agent, fase);
    }
    if (fase === 1) {
        agent.add('- Congresos, encuentros, eventos y seminarios con un máximo de 30 asistentes y manteniendo la distancia física de dos metros. Deberá fomentarse la participación no presencial.');
    } else if (fase === 2) {
        agent.add('- Congresos, encuentros, reuniones de negocio y conferencias promovidos por cualesquiera entidades de naturaleza pública o privada.');
    } else if (fase === 3) {
        agent.add('- Congresos, encuentros, reuniones de negocio y conferencias con un máximo de 80 asistentes.');
        agent.add('- Actividades y talleres en el ámbito de la investigación, el desarrollo y la innovación con un máximo de 80 asistentes.');
    }
}
function centrosFormacion(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 2, se permite la reapertura de:');
        sugerenciasFases(agent, fase);
    }
    agent.add('- Centros educativos no universitarios y de formación.');
    agent.add('- Academias y autoescuelas, limitando su aforo a 1/3 y priorizando la formación online.');
}
function educacionPresencial(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 2, pueden volver a la educación presencial de manera voluntaria:');
        sugerenciasFases(agent, fase);
    }
    agent.add('- Los menores de educación infantil y primaria (de 0 a 6 años), si sus progenitores acreditan que deben trabajar fuera de casa.');
    agent.add('- Estudiantes de las etapas de fin de ciclo (4º de ESO, 2º BACH y 2º FP) en grupos de 15 por aula.');
    agent.add('- Alumnos de cualquier etapa educativa (Primaria, ESO, BACH y FP) que, a juicio del claustro de profesores, necesitan actividades de refuerzo educativo. Siempre en grupos de 15.');
    agent.add('- Alumnados de centros de educación especial.');
    agent.add('- Alumnos que vayan a realizar la EBAU.');
    agent.add('¿Le puedo ayudar en algo más?');
    sugerenciasFases(agent, fasePorDefecto);
}

// ---------------------------------------------------------------------------------------------------------------------

function cultura(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase = setFase(agent);
    agent.add('En la fase ' + fase + ', se permite la reapertura de:');
    museos(agent, fase);
    espectaculos(agent, fase);
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function museos(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        fase = setFase(agent);
        agent.add('En la fase ' + fase + ', se permite la reapertura de:');
        sugerenciasFases(agent, fase);
    }
    if (fase === 1) {
        agent.add('- Museos a 1/3 de su aforo. Tenga en cuenta que los recorridos podrían estar alterados por medidas de seguridad.');
    } else if (fase === 2) {
        agent.add('- Museos, salas de exposiciones y monumentos, siempre que no se supere 1/3 del aforo y se adopten las medidas necesarias para el control de las aglomeraciones.');
    } else if (fase === 3) {
        agent.add('- Museos, salas de exposiciones y monumentos, siempre que no se supere el 50% del aforo y se adopten las medidas necesarias para el control de las aglomeraciones. Se pueden realizar visitas en grupos de hasta 20 personas.');
    }
}
function espectaculos(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        fase = setFase(agent);
        agent.add('En la fase ' + fase + ', se permite la reapertura de:');
        sugerenciasFases(agent, fase);
    }
    if (fase === 1) {
        agent.add(' - Locales y establecimientos para actos y espectáculos culturales. El aforo máximo es de 30 personas en lugares cerrados y 200 personas al aire libre.');
    } else if (fase === 2) {
        agent.add('- Locales y establecimientos para actos y espectáculos culturales. El aforo máximo es de 50 personas en lugares cerrados y 400 personas al aire libre.');
        agent.add('- Cines, teatros y auditorios si cuentan con butacas preasignadas y no se supera 1/3 del aforo.');
        agent.add('Intente comprar su entrada online o por teléfono si es posible.')
    } else if (fase === 3) {
        agent.add('- Locales y establecimientos para actos y espectáculos culturales. El aforo máximo es de 80 personas en lugares cerrados y 800 personas al aire libre.');
        agent.add('- Cines, teatros, auditorios y circos si cuentan con butacas preasignadas y no se supera el 50% del aforo.');
        agent.add('Intente comprar su entrada online o por teléfono si es posible.')
    }
}

// ---------------------------------------------------------------------------------------------------------------------

function deporte(agent) { // POSIBLE: dar menos información si preguntan por deporte en general, hay demasiada info en deportes 2 y 3
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase = setFase(agent);
    if (fase === 1) {
        agent.add('En la fase 1 se permite la reapertura de:');
        agent.add('- Centros de Alto Rendimiento');
        agent.add('- Instalaciones deportivas al aire libre');
        agent.add('- Centros deportivos para la práctica deportiva individual y el entrenamiento medio en ligas profesionales');
    } else {
        agent.add('En la fase ' + fase + ' se permite la reanudación de:');
        entrenamiento(agent, fase);
        competicion(agent, fase);
        agent.add('Además, se permite el acceso a:');
        piscinasDeportivas(agent, fase);
        agent.add('Por último, se pueden realizar:');
        turismoActivo(agent, fase);
    }
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function entrenamiento(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        fase = setFase(agent);
        if (fase === 1) { fase += 1; }
        agent.add('En la fase ' + fase + ' se permite la reanudación de:');
        sugerenciasFases(agent, fase);
    }
    agent.add('- Entrenamientos de deportistas profesionales y no profesionales federados.');
    agent.add('- Entrenamientos de carácter físico y técnico individuales.');
    if (fase === 2) {
        agent.add('- Entrenamientos tácticos en grupos de hasta 14 personas.');
        agent.add('- Reuniones técnicas de trabajo en grupos de hasta 15 personas.');
        agent.add('En la medida de lo posible, se debe evitar compartir ningún material y limitar el aforo a un 30%.');
    } else {
        agent.add('- Entrenamientos tácticos en grupos de hasta 20 personas.');
        agent.add('- Reuniones técnicas de trabajo en grupos de hasta 20 personas.');
        agent.add('En la medida de lo posible, se debe evitar compartir ningún material y limitar el aforo a un 50%.');
    }
    agent.add('Pueden acceder a las instalaciones (incluyendo vestuarios) deportistas alto nivel, de alto rendimiento, profesionales, federados, personal técnico y árbitros.');
    agent.add('Los medios de comunicación no pueden asistir a las sesiones de entrenamiento.');
}
function competicion(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 2 se permite la reanudación de:');
        sugerenciasFases(agent, fase);
    }
    agent.add('- Competiciones de Ligas Profesionales, sin público y a puerta cerrada.');
    agent.add('Se permite la entrada de medios de comunicación para la retransmisión de la competición.');
}
function entrenamientoYcompeticion(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        fase = setFase(agent);
        agent.add('A partir de la fase 2 se permite la reanudación de:');
        sugerenciasFases(agent, fase);
    }
    entrenamiento(agent, fase);
    competicion(agent, fase);
}
function piscinasDeportivas(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        agent.add('A partir de la fase 2 se permite la reapertura de:');
        sugerenciasFases(agent, fase);
    }
    agent.add('- Piscinas al aire libre o cubiertas para la realización de actividades deportivas.');
    agent.add('- Los vestuarios correspondientes.');
    agent.add('El aforo máximo es del 30% y se debe pedir cita previa.');
    agent.add('Tenga en cuenta que tienen acceso preferente los deportistas federados en especialidades que se desarrollen en el medio acuático.');
    agent.add('Solo puede acceder con el deportista un entrenador en caso de ser necesario y estar acreditado.');
}

function turismoActivo(agent, fase = 0) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    if (fase === 0) {
        fase = setFase(agent);
        agent.add('A partir de la fase ' + fase + ' se pueden realizar:');
        sugerenciasFases(agent, fase);
    }
    if (fase === 2) {
        agent.add('- Actividades de turismo activo y de naturaleza en grupos de hasta 20 personas, debiendo concertarse estas actividades preferentemente mediante cita previa.')
    } else if (fase === 3) {
        agent.add('- Actividades de turismo activo y de naturaleza en grupos de hasta 30 personas, debiendo concertarse estas actividades preferentemente mediante cita previa.')
    }
}

// ---------------------------------------------------------------------------------------------------------------------

function turismo(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase = setFase(agent);
    if (fase === 1) {
        agent.add('En la fase 1:');
        agent.add('- El servicio de restauración de hoteles está reservado para los clientes hospedados.');
        agent.add('- No está permitida la utilización de piscinas, spas, gimnasios, miniclubs, zonas infantiles, discotecas y espacios de eventos.');
        agent.add('- La utilización de ascensores está limitada y la ocupación máxima es de una persona.');
    } else if (fase === 2 || fase === 3) {
        agent.add('En la fase ' + fase + ', se permite la reapertura de:');
        if (fase === 2) {
            agent.add('- Zonas comunes de hoteles y alojamientos turísticos, a 1/3 del aforo.');
        } else {
            agent.add('- Zonas comunes de hoteles y alojamientos turísticos, al 50% del aforo.');
        }
        agent.add('- Piscinas y spas de hoteles y establecimientos turísticos.');
        agent.add('- Parques naturales y teleféricos, con limitaciones de aforo.');
        if (fase === 3) {
            agent.add('- Zoológicos y acuarios, limitando el aforo total al 50% y el de cada atracción a 1/3.');
        }
        agent.add('Además, se pueden organizar:');
        agent.add('- Actividades de animación y clases grupales, con un aforo máximo de 20 personas y principalmente al aire libre.');
        if (fase === 3) {
            agent.add('- Tours guiados, en grupos de un máximo de 20 personas y concertados mediante cita previa.');
        }
    }
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}

// ---------------------------------------------------------------------------------------------------------------------

function piscinasYplayas(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);
    let fase = setFase(agent);
    if (fase === 1) {
        agent.add('A partir de la fase 2, se permite el acceso a:');
    } else if (fase === 2) {
        agent.add('En la fase 2, se permite el acceso a:');
    }
    piscinasRecreativas(agent, fase);
    playas(agent, fase);
    agent.add('Recuerde respetar siempre las medidas de higiene y prevención establecidas.');
    agent.add('¿Tiene más dudas referentes a la fase ' + fase + '?');
    sugerenciasFases(agent, fase);
}
function piscinasRecreativas(agent, fase = 0) {
    if (fase === 0) {
        agent.add('A partir de la fase 2 se permite la reapertura de:');
        sugerenciasFases(agent, fase);
    }
    agent.add('- Piscinas recreativas, con un aforo de un 30% y pidiendo cita previamente.');
    agent.add('Tenga en cuenta que no se pueden usar las duchas de los vestuarios ni las fuentes de agua.');
}
function playas(agent, fase = 0) {
    if (fase === 0 ) {
        agent.add('A partir de la fase 2 se permite el acceso a:');
        sugerenciasFases(agent, fase);
    }
    agent.add('- Playas de su misma provincia o isla, en grupos de máximo 15 personas y con las limitaciones de acceso establecidas por cada ayuntamiento.');
    agent.add('Tenga en cuenta que el uso de duchas, aseos y vestuarios está limitado a la ocupación de una persona.');
    agent.add('Además, en la playa está permitida la práctica de actividades deportivas, profesionales o de recreo, siempre que se puedan desarrollar individualmente y sin contacto físico, permitiendo mantener una distancia mínima de dos metros entre los participantes.')
}

// ---------------------------------------------------------------------------------------------------------------------

function tiempoLibre(agent, fase = 0) {
    if (fase === 0) {
        agent.add('En la fase 3 se permite el desarrolo de:');
        sugerenciasFases(agent, fase);
    }
    agent.add('- Actividades de tiempo libre para niños y jóvenes');
    agent.add('Al aire libre, el número de participantes se debe limitar al 50%, con un máximo de 200.');
    agent.add('En espacios cerrados se debe limitar a 1/3, con un máximo de 80 participantes.');
    agent.add('Durante el desarrollo de las actividades se deben realizar grupos de un máximo de 10 personas.');
}

function juegosYapuestas(agent, fase = 0) {
    if (fase === 0) {
        agent.add('En la fase 3 se permite la reapertura de:');
        sugerenciasFases(agent, fase);
    }
    agent.add('- Establecimientos y locales de juegos y apuestas, con un aforo limitado al 50% sin poder superar las 50 personas en total en el local.');
}

//////////////////////////////////////// INFORMACIÓN PARA LA CIUDADANÍA ////////////////////////////////////////////////
// https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/ciudadania.htm
const telefonosInfoUrl = 'https://www.mscbs.gob.es/profesionales/saludPublica/ccayes/alertasActual/nCov-China/telefonos.htm';

function telefonosInfo(agent) {
    console.log('CONVERSACION Intent: ' + agent.intent);

    let tlf;

    if (provincia === 'Huelva' || provincia === 'Sevilla' || provincia === 'Córdoba' || provincia === 'Jaén' || provincia === 'Granada' || provincia === 'Almería' || provincia === 'Málaga' || provincia === 'Cádiz') { tlf = '900 400 061 / 955 545 060'; }
    if (provincia === 'Huesca' || provincia === 'Zaragoza' || provincia === 'Teruel') { tlf = '976 696 382'; }
    if (provincia === 'Asturias') {tlf = '900 878 232 / 984 100 400 / 112 marcando 1'; }
    if (provincia === 'Cantabria') { tlf = '900 612 112'; }
    if (provincia === 'Toledo' || provincia === 'Ciudad Real' || provincia === 'Cuenca' || provincia === 'Guadalajara' || provincia === 'Albacete') { tlf = '900 122 112'; }
    if (provincia === 'León' || provincia === 'Zamora' || provincia === 'Salamanca' || provincia === 'Valladolid' || provincia === 'Palencia' || provincia === 'Burgos' || provincia === 'Soria' || provincia === 'Segovia' || provincia === 'Ávila') { tlf = '900 222 000'; }
    if (provincia === 'Lérida' || provincia === 'Gerona' || provincia === 'Barcelona' || provincia === 'Tarragona') { tlf = '061'; }
    if (provincia === 'Ceuta') { tlf = '900 720 692'; }
    if (provincia === 'Madrid') { tlf = '900 102 112'; }
    if (provincia === 'Castellón' || provincia === 'Valencia' || provincia === 'Alicante') { tlf = '900 300 555'; }
    if (provincia === 'Cáceres' || provincia === 'Badajoz') { tlf = '112'; }
    if (provincia === 'A Coruña' || provincia === 'Lugo' || provincia === 'Pontevedra' || provincia === 'Orense') { tlf = '900 400 116'; }
    if (provincia === 'Mallorca' || provincia === 'Menorca' || provincia === 'Cabrera' || provincia === 'Ibiza' || provincia === 'Formentera') { tlf = '061'; }
    if (provincia === 'El Hierro' || provincia === 'La Gomera' || provincia === 'La Palma' || provincia === 'Tenerife' || provincia === 'Fuerteventura' || provincia === 'Gran Canaria' || provincia === 'Lanzarote' || provincia === 'La Graciosa') { tlf = '900 112 061'; }
    if (provincia === 'La Rioja') { tlf = '941 298 333'; }
    if (provincia === 'Melilla') { tlf = '112'; }
    if (provincia === 'Murcia') { tlf = '900 121 212'; }
    if (provincia === 'Navarra') { tlf = '948 290 290'; }
    if (provincia === 'Vizcaya' || provincia === 'Guipúzcoa' || provincia === 'Álava') { tlf = '900 203 050'; }

    agent.add('El teléfono en su comunidad autónoma es:');
    agent.add(tlf);

    agent.add('Haga click en el siguiente enlace para acceder a la lista de teléfonos de información sobre la COVID-19:');
    agent.add(new Card({
            title: 'Teléfonos COVID-19',
            buttonText: 'Teléfonos COVID-19',
            buttonUrl: telefonosInfoUrl
        })
    );
    agent.add('¿Le puedo ayudar en algo más?');
    sugerenciasInicio(agent);
}


////////////////////////////////////////////// PROVINCIAS Y FASES  /////////////////////////////////////////////////////

const provinciasFase2 = ['Huesca', 'Zaragoza'];

/*const provinciasFase3 = ['El Hierro', 'La Gomera', 'La Graciosa', 'Formentera',
    'La Palma', 'Tenerife', 'Fuerteventura', 'Gran Canaria', 'Lanzarote', 'Mallorca', 'Menorca', 'Cabrera', 'Ibiza',
    'Cantabria', 'Navarra', 'La Rioja', 'Asturias', 'Murcia', 'Melilla', 'Asturias', 'Asturias',
    'A Coruña', 'Lugo', 'Orense', 'Pontevedra',
    'Álava', 'Vizcaya', 'Gipúzcoa',
    'Cáceres', 'Badajoz',
    'Huesca', 'Zaragoza', 'Teruel',
    'Huelva', 'Sevilla', 'Córdoba', 'Jaén', 'Granada', 'Almería', 'Málaga', 'Cádiz',
    'Cuenca', 'Guadalajara'
];*/

const islas = [
    /* Provincia de Santa Cruz de Tenerife: */ 'El Hierro', 'La Gomera', 'La Palma', 'Tenerife',
    /* Provincia de Las Palmas: */ 'Fuerteventura', 'Gran Canaria', 'Lanzarote', 'La Graciosa',
    /* Baleares: */ 'Mallorca', 'Menorca', 'Cabrera', 'Ibiza', 'Formentera'
];

function provinciasYfases() {
    for (let i = 0; i<provinciasFase2.length; i++) {
        if (provinciasFase2[i] === provincia) { nuevaNormalidad = false; faseCliente = 2; }
        //else {
            /*for (let i = 0; i<provinciasFase3.length; i++) {
            if (provinciasFase3[i] === provincia) { faseCliente = 3; }
            if (provincia === 'Tarragona') {faseCliente2 = 'Su provincia, Tarragona, se encuentra en la fase 2, exceptuando Alt Pirineu i Aran, Terres de l\'Ebre y Camp de Tarragona que han pasado a la 3.'; }
            */
            //faseCliente = 4;
        //}
    }

    for (let i = 0; i<islas.length; i++) {
        if (islas[i] === provincia) {
            isla = true;
        }
    }
}


///////////////////////////////////////////////// INTERNACIONAL ////////////////////////////////////////////////////////
// Estadísticas de la COVID-19 en el mundo (info: OMS)

function internacional(agent) { // TODO poner banderas
    /*
    agent.add('A día 8 de junio, los 10 países con más afectados por la COVID-19 son:');
    agent.add('A: Afectados, F: Fallecidos, C: Curados');
    agent.add('1. EEUU:');
    agent.add('A: 1.942.363 - F: 110.514 - C: 506.367');
    agent.add('2. Brasil:');
    agent.add('A: 691.758 - F: 36.455 - C: 283.952');
    agent.add('3. Rusia:');
    agent.add('A: 467.073 - F: 5.851 - C: 226.272');
    agent.add('4. Reino Unido:');
    agent.add('A: 467.073 - F: 40.625 - C 1.239');
    agent.add('5. India:');
    agent.add('A: 257.486 - F: 7.207 - C: 123.848');
    agent.add('6. España:');
    agent.add('A: 241.550 - F:27.136 - C: 150.376');
    agent.add('7. Italia:');
    agent.add('A: 234.998 - F: 33.899 - C: 165.837');
    agent.add('8. Perú:');
    agent.add('A: 196.515 - F: 5.465 - C: 86.219');
    agent.add('9. Francia:');
    agent.add('A: 191.102 - F: 29.158 - C: 70.961');
    agent.add('10. Alemania:');
    agent.add('A: 185.750 - F: 8.685 - C: 169.224');
     */
    agent.add('A día 23 de Julio, datos de la OMS afirman que:');
    agent.add('- Hay 14.971.036 casos confirmados por COVID-19 en el mundo.');
    agent.add('- El número de muertos asciende a 618.017.');
    agent.add('- EEUU es el país con más casos, 3.868.453.');
    agent.add('- En Brasil hay 2.159.654 casos.');
    agent.add('- En India hay 1.238.635 casos.');
    agent.add('Para acceder al mapa interactivo y las estadísticas de la OMS, haga click en el siguiente enlace:');
    agent.add(new Card({
            title: 'Mapa interactivo OMS',
            buttonText: 'Mapa interactivo OMS',
            buttonUrl: 'https://covid19.who.int/'
        })
    );
    agent.add('¿Le puedo ayudar en algo más?');
    sugerenciasInicio(agent);
}


// -------------------------------------------------- TESTS ------------------------------------------------------------
// function setFaseTest(fakeFase) {faseCliente = fakeFase;}

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
    if (request.body.queryResult.action === 'A-Opinion.A-Opinion-fallback') {
        opiniones.push(request.body.queryResult.queryText);
        console.log('CONVERSACION Opinión: ' + request.body.queryResult.queryText);
    }
    if (request.body.queryResult.queryText === 'Soy amigo de Marcos') {
        agent.add('Pues de mi parte, te debe un chupito jeje');
        agent.add('¡Ha sido un placer! Pero tengo que volver al curro...');
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
    // D: ejemplos suficientes Dialogflow, W: wording checked, S: suggestions, E: emojis checked
    intentMap.set('A - Hola', hola);
    intentMap.set('A - Provincia', hola);
    intentMap.set('A - Explicacion', explicacion);
    intentMap.set('Fallback', fallback);
    intentMap.set('A - Gracias', gracias);
    intentMap.set('A - Menu', inicio);
    intentMap.set('A - Adios', adios);
    intentMap.set('A - Opinion', opinion);
    intentMap.set('A - Opinion 1 estrella', opinionRecibida);
    intentMap.set('A - Opinion 2 estrellas', opinionRecibida);
    intentMap.set('A - Opinion 3 estrellas', opinionRecibida);
    intentMap.set('A - Opinion 4 estrellas', opinionRecibida);
    intentMap.set('A - Opinion 5 estrellas', opinionRecibida);
    intentMap.set('A - Opinion - fallback', opinionRecibida);

    intentMap.set('Sintomas', sintomas); // D W S E
    intentMap.set('Sintomas - Como actuar', sintomasComoActuar); // D W S
    intentMap.set('Sintomas - Medidas higiene', medidasHigiene); // D W S

    intentMap.set('Medidas seguridad', medidasSeguridad);
    intentMap.set('Medidas seguridad - Trabajo', medidasTrabajo);
    intentMap.set('Medidas seguridad - Comercios', medidasComercios); // D
    intentMap.set('Medidas seguridad - Hosteleria', medidasHosteleria);
    intentMap.set('Medidas seguridad - Centros culturales', medidasCentrosCulturales);
    intentMap.set('Medidas seguridad - Bibliotecas', medidasBibliotecas);
    intentMap.set('Medidas seguridad - Exposiciones', medidasExposiciones);
    intentMap.set('Medidas seguridad - Monumentos', medidasMonumentos);
    intentMap.set('Medidas seguridad - Cines', medidasCines);
    intentMap.set('Medidas seguridad - Deporte', medidasDeporte);
    intentMap.set('Medidas seguridad - Turismo', medidasTurismo);
    intentMap.set('Medidas seguridad - Piscinas', medidasPiscinas);
    intentMap.set('Medidas seguridad - Playas', medidasPlayas);
    intentMap.set('Medidas seguridad - Juegos y apuestas', medidasJuegosYapuestas);

    intentMap.set('Fases', fases);
    intentMap.set('Situacion actual', situacionActual);
    intentMap.set('Fases - Informacion', fasesInformacion);
    intentMap.set('Fases - Mas informacion', fasesMasInformacion);

    // Añadir "aforo" en dialogfow
    intentMap.set('Medidas sociales', medidasSociales); // D W
    intentMap.set('Medidas sociales - Circulacion', circulacion); // D W
    intentMap.set('Medidas sociales - Velatorios', velatorios); // D
    intentMap.set('Medidas sociales - Culto', culto); // D
    intentMap.set('Medidas sociales - Bodas', bodas); // D
    intentMap.set('Medidas sociales - Segunda residencia', segundaResidencia);
    intentMap.set('Medidas sociales - Cambio provincia', cambioDeProvincia);
    intentMap.set('Medidas sociales - Grupos', grupos);
    intentMap.set('Medidas sociales - Transporte publico', transportePublico);

    intentMap.set('Comercio', comercio); // D
    intentMap.set('Comercio - Locales', locales); // D
    intentMap.set('Comercio - Mercadillos', mercadillos); // D
    intentMap.set('Comercio - Coches', coches); // D
    intentMap.set('Comercio - Plantas', plantas); // D
    intentMap.set('Comercio - Centros comerciales', centrosComerciales); // D

    intentMap.set('Hosteleria', hosteleria); // D
    intentMap.set('Hosteleria - Terrazas', terrazas); // D
    intentMap.set('Hosteleria - A domicilio', adomicilio); // D
    intentMap.set('Hosteleria - Barra', barra); // D
    intentMap.set('Hosteleria - Discotecas', discotecas); // D

    intentMap.set('Servicios sociales', serviciosSociales); // D

    intentMap.set('Educacion', educacion); // D
    intentMap.set('Educacion - Bibliotecas', bibliotecas); // D aforo
    intentMap.set('Educacion - Laboratorios', laboratorios); // D
    intentMap.set('Educacion - Congresos', congresos); // D
    intentMap.set('Educacion - Centros formacion', centrosFormacion); // D
    intentMap.set('Educacion - Educacion presencial', educacionPresencial);

    intentMap.set('Cultura', cultura); // D
    intentMap.set('Cultura - Museos', museos); // D aforo
    intentMap.set('Cultura - Espectaculos', espectaculos); // D aforo

    intentMap.set('Deporte', deporte); // D
    intentMap.set('Deporte - Entrenamiento', entrenamiento); // D aforo
    intentMap.set('Deporte - Competicion', competicion); // D aforo
    intentMap.set('Deporte - Entrenamiento y competicion', entrenamientoYcompeticion);
    intentMap.set('Deporte - Piscinas deportivas', piscinasDeportivas); // D aforo
    intentMap.set('Deporte - Turismo activo', turismoActivo); // D

    intentMap.set('Turismo', turismo); // D

    intentMap.set('Piscinas y playas', piscinasYplayas);
    intentMap.set('Piscinas recreativas', piscinasRecreativas);
    intentMap.set('Playas', playas);

    intentMap.set('Tiempo libre', tiempoLibre); // D
    intentMap.set('Juegos y apuestas', juegosYapuestas); // D aforo

    intentMap.set('Telefonos informacion', telefonosInfo);
    intentMap.set('Internacional', internacional);

    agent.handleRequest(intentMap);
});

app.use('/', router);

module.exports = app;
module.exports.hola = hola;
module.exports.adios = adios;

// module.exports.setFase = setFase;
