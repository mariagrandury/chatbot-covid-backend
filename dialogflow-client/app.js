exports.handler = async (params) => {
    if (params.queryText) {
        return callDialogFlow(params.queryText, params.sessionId);
    } else {
        return {
            error : 'no query text'
        };
    }
};

const dialogflow = require('dialogflow');
const uuid = require('uuid');

async function callDialogFlow(queryText, sessionId) {
    if (!sessionId) {
        sessionId = uuid.v4();
    }

    // Create a new session
    const sessionClient = new dialogflow.SessionsClient();
    const sessionPath = sessionClient.sessionPath('covid-bjncna', sessionId);

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: queryText,
                languageCode: 'es',
            },
        },
    };

    const detectedIntent = await sessionClient.detectIntent(request);
    if (detectedIntent[0] && detectedIntent[0].queryResult) {
        const queryResult = detectedIntent[0].queryResult;
        return {
            fulfillmentMessages : queryResult.fulfillmentMessages,
            fulfillmentText: queryResult.fulfillmentText,
            sessionId : sessionId
        };
    } else {
        return {
            error : 'no query result'
        };
    }
}

