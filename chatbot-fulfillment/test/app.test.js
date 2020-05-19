let app = require('../app.js');
const chai = require('chai');
const chaiHttp = require('chai-http');
const nock = require('nock');
const sinon = require('sinon');

chai.use(chaiHttp);


describe("Testing", function () {
    describe("Integration test", function () {
        it("should provide the a title and the index view name", function () {
            chai.request(app)
                .post('/')
                .send({})
                .end(function (err, res) {
                    console.log(res);
                })
        });
    });

    describe("unit test", function () {

        beforeEach(function () {
            app = require('../app.js');
        });
        afterEach(function () {
            delete require.cache[require.resolve('../app.js')];
        });

        describe("hola", function () {
            it("debe preguntar qué puede hacer por el cliente", function () {
                let agentMessage = [];
                let fakeAgent = {
                    contexts: [],
                    setContext: sinon.spy(),
                    getContext: sinon.stub(),
                    add: function (message) {
                        agentMessage.push(message)
                    }
                };
                app.hola(fakeAgent);
                chai.expect(agentMessage[0]).to.equal('¡Hola! Soy Aurora, le intentaré ayudar con todas sus dudas sobre el COVID-19.');
                chai.expect(agentMessage[1]).to.equal('¿En qué puedo ayudarle?');

                /*
                agentMessage = [];
                fakeAgent.getContext.withArgs('hola-followup').returns(true);
                fakeAgent.getContext.withArgs('sicliente').returns(true);
                app.hola(fakeAgent);
                chai.expect(agentMessage[0]).to.equal('Perfecto, ¿en qué puedo ayudarle?');
                */
            });
        });

        describe("adios", function () {
            it("debe eliminar todos los contextos", function () {
                let fakeAgent = {
                    contexts: [],
                    setContext: sinon.spy(),
                    getContext: sinon.stub(),
                    add: sinon.stub()
                };

                app.adios(fakeAgent);
                let spyCall3 = fakeAgent.setContext.getCall(0);
                chai.expect(spyCall3.args[0]).to.deep.equal({name: 'cptrue', lifespan: -1});
                let spyCall4 = fakeAgent.setContext.getCall(1);
                chai.expect(spyCall4.args[0]).to.deep.equal({name: 'cpfalse', lifespan: -1});
            });
        });

        /*
        xdescribe("conexionInternet", function () {
            it("debe exponer la conexión en el CP: 1 municipio", async function () {
                let agentMessage = [];
                let fakeAgent = {
                    contexts: [],
                    setContext: sinon.spy(),
                    getContext: sinon.stub(),
                    add: function (message) {
                        agentMessage.push(message)
                    }
                };
                app.setCPtrue (true);
                app.setConexion({
                    'CP': '24402',
                    'Conexion': ['fibra óptica']
                });
                app.setMunicipios(['Ponferrada']);
                app.setMunicipiosFibraU(['Ponferrada']);
                await app.conexionInternet(fakeAgent);
                chai.expect(agentMessage[0]).to.equal('En Ponferrada ofrecemos fibra óptica.');
                chai.expect(agentMessage[1]).to.equal('Puedo informarle sobre las características de nuestra fibra o sobre las tarifas si lo desea.');
                chai.expect(agentMessage[2].replies[0]).to.equal('Fibra FTTH');
            });
            it("debe exponer la conexión en el CP: N municipios, 1 tipo de conexión", async function () {
                let agentMessage = [];
                let fakeAgent = {
                    contexts: [],
                    setContext: sinon.spy(),
                    getContext: sinon.stub(),
                    add: function (message) {
                        agentMessage.push(message)
                    }
                };
                app.setCPtrue (true);
                app.setConexion({
                    'CP': '32330',
                    'Conexion': ['internet por radio WIMAX']
                });
                app.setMunicipios(['Carballeda De Valdeorras', 'Sobradelo']);
                app.setMunicipiosWIMAX(['Carballeda De Valdeorras', 'Sobradelo']);
                await app.conexionInternet(fakeAgent);
                chai.expect(agentMessage[0]).to.equal('En Carballeda De Valdeorras y Sobradelo ofrecemos internet por WIMAX.');
                chai.expect(agentMessage[1]).to.equal('Puedo informarle sobre el servicio WIMAX o sobre nuestras tarifas si lo desea.');
                chai.expect(agentMessage[2].replies[0]).to.equal('WIMAX');
            });
            it("debe exponer la conexión en el CP: N municipios (1+2+8), 3 tipos de conexión (U,R,WIMAX)", async function () {
                let agentMessage = [];
                let fakeAgent = {
                    contexts: [],
                    setContext: sinon.spy(),
                    getContext: sinon.stub(),
                    add: function (message) {
                        agentMessage.push(message)
                    }
                };
                app.setCPtrue (true);
                app.setConexion({
                    'CP': '24415',
                    'Conexion': ['fibra óptica', 'fibra óptica propia', 'internet por radio WIMAX']
                });
                app.setMunicipios(['Villanueva De Valdueza', 'Montes De Valdueza', 'Otero', 'Ozuela', 'Peñalba De Santiago', 'San Adrian De Valdueza', 'San Clemente De La Valdueza', 'San Esteban De Valdueza', 'San Lorenzo', 'Valdecañada', 'Valdefrancos']);
                app.setMunicipiosFibraU(['Villanueva De Valdueza']);
                app.setMunicipiosFibraR(['Otero', 'San Lorenzo']);
                app.setMunicipiosWIMAX(['Montes De Valdueza', 'Ozuela', 'Peñalba De Santiago', 'San Adrian De Valdueza', 'San Clemente De La Valdueza', 'San Esteban De Valdueza', 'Valdecañada', 'Valdefrancos']);
                await app.conexionInternet(fakeAgent);
                chai.expect(agentMessage[0]).to.equal('En Villanueva De Valdueza ofrecemos fibra óptica.');
                chai.expect(agentMessage[1]).to.equal('En Otero y San Lorenzo ofrecemos fibra óptica propia.');
                chai.expect(agentMessage[2]).to.equal('En Montes De Valdueza, Ozuela, Peñalba De Santiago, San Adrian De Valdueza, San Clemente De La Valdueza, San Esteban De Valdueza, Valdecañada y Valdefrancos ofrecemos internet por WIMAX.');
                chai.expect(agentMessage[3]).to.equal('Puedo informarle sobre las características de nuestra fibra o sobre las tarifas si lo desea.');
                chai.expect(agentMessage[4].replies[0]).to.equal('Fibra FTTH');
            });
            it("debe exponer la conexión en el CP: N municipios (1+2), 2 tipos de conexión (R,WIMAX)", async function () {
                let agentMessage = [];
                let fakeAgent = {
                    contexts: [],
                    setContext: sinon.spy(),
                    getContext: sinon.stub(),
                    add: function (message) {
                        agentMessage.push(message)
                    }
                };
                app.setCPtrue (true);
                app.setConexion({
                    'CP': '24448',
                    'Conexion': ['fibra óptica propia', 'internet por radio WIMAX']
                });
                app.setMunicipios(['Priaranza Del Bierzo', 'Rimor', 'Toral De Merayo']);
                app.setMunicipiosFibraR(['Priaranza Del Bierzo']);
                app.setMunicipiosWIMAX(['Rimor', 'Toral De Merayo']);
                await app.conexionInternet(fakeAgent);
                chai.expect(agentMessage[0]).to.equal('En Priaranza Del Bierzo ofrecemos fibra óptica propia.');
                chai.expect(agentMessage[1]).to.equal('En Rimor y Toral De Merayo ofrecemos internet por WIMAX.');
                chai.expect(agentMessage[2]).to.equal('Puedo informarle sobre las características de nuestra fibra o sobre las tarifas si lo desea.');
                chai.expect(agentMessage[3].replies[0]).to.equal('Fibra FTTH');
            });
            it("debe exponer la conexión en el CP: N municipios (3), 1 tipo de conexión (WIMAX, na)", async function () {
                let agentMessage = [];
                let fakeAgent = {
                    contexts: [],
                    setContext: sinon.spy(),
                    getContext: sinon.stub(),
                    add: function (message) {
                        agentMessage.push(message)
                    }
                };
                app.setCPtrue (true);
                app.setConexion({
                    'CP': '24442',
                    'Conexion': ['internet por radio WIMAX']
                });
                app.setMunicipios(['Carucedo', 'Las Médulas']);
                app.setMunicipiosWIMAX(['Las Médulas']);
                await app.conexionInternet(fakeAgent);
                chai.expect(agentMessage[0]).to.equal('En Las Médulas ofrecemos internet por WIMAX.');
                chai.expect(agentMessage[1]).to.equal('Puedo informarle sobre el servicio WIMAX o sobre nuestras tarifas si lo desea.');
                chai.expect(agentMessage[2].replies[0]).to.equal('WIMAX');
            });
            it("debe exponer la conexión en el CP: N municipios (4), 1 tipo de conexión (WIMAX, na), info", async function () {
                let agentMessage = [];
                let fakeAgent = {
                    contexts: [],
                    setContext: sinon.spy(),
                    getContext: sinon.stub(),
                    add: function (message) {
                        agentMessage.push(message)
                    }
                };
                app.setCPtrue (true);
                app.setConexion({
                    'CP': '24391',
                    'Conexion': ['internet por radio WIMAX'],
                    'ConexionInfo': 'Se encargaron de la instalación nuestros compañeros de León.'
                });
                app.setMunicipios(['Quintana De Raneros', 'San Miguel Del Camino', 'Santovenia De La Valdoncina', 'Villanueva Del Carnero']);
                app.setMunicipiosWIMAX(['San Miguel Del Camino', 'Santovenia De La Valdoncina']);
                app.setMunicipiosInfo(['San Miguel Del Camino', 'Santovenia De La Valdoncina']);
                await app.conexionInternet(fakeAgent);
                chai.expect(agentMessage[0]).to.equal('En San Miguel Del Camino y Santovenia De La Valdoncina ofrecemos internet por WIMAX.');
                chai.expect(agentMessage[1]).to.equal('Se encargaron de la instalación nuestros compañeros de León.');
                chai.expect(agentMessage[2]).to.equal('Puedo informarle sobre el servicio WIMAX o sobre nuestras tarifas si lo desea.');
                chai.expect(agentMessage[3].replies[0]).to.equal('WIMAX');
            });
            it("debe responder que no encuentra info sobre la conexión correspondiente al CP", async function () {
                let agentMessage = [];
                let fakeAgent = {
                    contexts: [],
                    setContext: sinon.spy(),
                    getContext: sinon.stub(),
                    add: function (message) {
                        agentMessage.push(message)
                    }
                };
                app.setCPtrue (true);
                app.setCodigoPostal('24406');
                app.setConexion({'Conexion': 'Na de na, sorry bro'});
                await app.conexionInternet(fakeAgent);
                chai.expect(agentMessage[0]).to.equal('Lo siento, no encuentro información sobre el municipio correspondiente al CP 24406.');
                chai.expect(agentMessage[1]).to.equal('No dude en contactar a mis compañeros llamando al 987 41 44 44.');
                chai.expect(agentMessage[2]).to.equal('¿Le puedo ayudar en algo más?');
                chai.expect(agentMessage[3].replies[0]).to.equal('Productos');
            });
        });
         */

    });
});
