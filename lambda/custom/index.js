/* eslint-disable  func-names */
/* eslint-disable  no-console */

const Alexa = require('ask-sdk-core');
const request = require('request-promise');
const errors = require('request-promise/errors');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const periods = await request({
      uri: 'http://us-central1-randomstudent-ba994.cloudfunctions.net/listClassPeriods',
      headers: {
        Authorization: `Bearer ${handlerInput.requestEnvelope.context.System.user.accessToken}`
      }
    }).then(body => {
      return response = JSON.parse(body).periods;
    });

    if (periods.length === 0) {
      return handlerInput.responseBuilder
        .speak(`You don't have any class periods set up yet. Please visit the website to add one.`)
        .getResponse();
    }

    if (periods.length === 1) {
      return await request({
        uri: 'http://us-central1-randomstudent-ba994.cloudfunctions.net/pickRandomStudent',
        qs: {
          class_period: periods[0]
        },
        headers: {
          Authorization: `Bearer ${handlerInput.requestEnvelope.context.System.user.accessToken}`
        }
      }).then(body => {
        const response = JSON.parse(body);
        return handlerInput.responseBuilder
          .speak(`${response.student}`)
          .getResponse();
      }).catch(errors.StatusCodeError, err => {
        if (err.statusCode === 400) {
          return handlerInput.responseBuilder
            .speak(`There are no students in period ${periods[0]}. Please visit the website to add some.`)
            .getResponse();
        } else {
          return handlerInput.responseBuilder
            .speak('Sorry, something went wrong. Please try again later.')
            .getResponse();
        }
      });
    } else {
      const speechText = 'From what period?';

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    }
  },
};

const FromPeriodIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'FromPeriodIntent';
  },
  async handle(handlerInput) {
    const classPeriod = handlerInput.requestEnvelope.request.intent.slots.classPeriod.resolutions.resolutionsPerAuthority[0].values[0].value.id;
    
    console.log(JSON.stringify(handlerInput.requestEnvelope, 2));
    return await request({
      uri: 'http://us-central1-randomstudent-ba994.cloudfunctions.net/pickRandomStudent',
      qs: {
        class_period: classPeriod
      },
      headers: {
        Authorization: `Bearer ${handlerInput.requestEnvelope.context.System.user.accessToken}`
      }
    }).then(body => {
      const response = JSON.parse(body);
      return handlerInput.responseBuilder
        .speak(`${response.student}`)
        .getResponse();
    }).catch(errors.StatusCodeError, err => {
      if (err.statusCode === 400) {
        return handlerInput.responseBuilder
          .speak(`There are no students in period ${classPeriod}. Please visit the website to add some.`)
          .getResponse();
      } else if (err.statusCode === 404) {
        return handlerInput.responseBuilder
          .speak(`You don't have a period ${classPeriod} set up. Please visit the website to add it.`)
          .getResponse();
      } else {
        return handlerInput.responseBuilder
          .speak('Sorry, something went wrong. Please try again later.')
          .getResponse();
      }
    });
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'Name a class period, and I will give you a random student.';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Hello World', speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak('Sorry, I can\'t understand the command. Please say again.')
      .reprompt('Sorry, I can\'t understand the command. Please say again.')
      .getResponse();
  },
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    FromPeriodIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
