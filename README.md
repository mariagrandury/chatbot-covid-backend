# Chatbot COVID-19: Backend

AURORA is a chatbot that understands and answers questions (in Spanish) about the COVID-19: symptoms, prevention, regulation, the situation in Spain.
Don't hesitate to chat with [AURORA!](https://d3g60fts6ncstu.cloudfront.net/)

<p align="center">
  <img src="chatbot-covid-preview.png" alt="drawing" width="300"/>
</p>

## Motivation

In March 2020, a virus appeared to seriously threaten our health. These were days of widespread confusion, uncertainty, and doubt. The infoxication or generation of many answers to these doubts by the media and social networks (many of which turned out to be false) caused even more unrest in the Spaniards.

At that precise moment, the idea of developing this chatbot was born to generate certainties and a sense of control in the citizens based on truthful information from the Ministry of Health.

With AURORA, a virtual assistant that solves doubts about the COVID-19, it is intended that citizens exercise control over what is in their hands to protect themselves and their loved ones. 

## Technologies

The backend of the chatbot was developed using:

- Dialogflow

- Serverless Framework’s Open Source CLI

- AWS Lambda


## Installing Node.js
Serverless is a Node.js CLI tool so the first thing you need to do is to install Node.js on your machine.

Go to the official [Node.js](https://nodejs.org/en/) website, download and follow the installation instructions to install Node.js on your local machine.

Note: Serverless runs on Node v6 or higher.

You can verify that Node.js is installed successfully by running in your terminal `node --version`.

This project uses Nose v12.14.0


## Installing Serverless Framework
Next, install the Serverless Framework via npm which was already installed when you installed Node.js.

Open up a terminal and type
```
npm install -g serverless
```

To check wich version you have installed run `serverless --version`. In this project,
- Framework Core: 1.69.0
- Plugin: 3.6.9
- SDK: 2.3.0
- Components: 2.30.4

## Setting up Authentication
To set up [authentication](https://cloud.google.com/dialogflow/docs/quick/setup) with a service account:

1. Click on the gear icon, to the right of the agent name.

2. Under the GOOGLE PROJECT section, click on the name of the Service Account.

3. Click on the menu button in the upper left hand corner and click on IAM & admin.

4. Click on Service Accounts in the left hand menu.

5. Click on the Create Service Account button at the top of the page.

6. In the pop up, enter a name for the service account (Dialogflow Client).

7. Click on Role. Under the Dialogflow category, select the desired role (client).

8. Check the Furnish a new private key option and make sure JSON is selected for Key type.

9. Click the Create button.

10. Download of the JSON file will start. Choose a location to save it and confirm.

Caution: You can only download this JSON file once, so make sure to save the file and keep it somewhere safe. If you lose this key or it becomes compromised, you can use the same process to create another.

11. Once complete, you'll see a pop up with a confirmation message. Click Close.

In this project, the keys are in **dialogflow-client/chatbotauth.json**.

Remember to update the project ID in **dialogflow-client/app.js**.

## Setting up AWS
To run serverless commands that interface with your AWS account, you will need to setup your AWS account credentials on your machine.

First, [install AWS CLI version 2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-windows.html). Then, you have to [set up your AWS CLI installation](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) running
```
$ aws configure
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-west-2
Default output format [None]: json
```

The AWS CLI stores this information in a profile (a collection of settings) named default. The information in the default profile is used any time you run an AWS CLI command that doesn't explicitly specify a profile to use.

You can create additional configurations that you can refer to with a name by specifying the --profile option and assigning a name. You can specify credentials from a completely different account and Region than the other profiles.
```
$ aws configure --profile chatbotcovid
AWS Access Key ID [None]: AKIAI44QH8DHBEXAMPLE
AWS Secret Access Key [None]: je7MtGbClwBF/2Zp9Utk/h3yCo8nvbEXAMPLEKEY
Default region name [None]: us-west-1
Default output format [None]: json
```
Then, when you run a command, you can omit the --profile option and use the credentials and settings stored in the default profile. Or you can specify a --profile profilename and use the credentials and settings stored under that name.

The AWS Access Key ID and AWS Secret Access Key are your AWS credentials. They are associated with an AWS Identity and Access Management (IAM) user or role that determines what permissions you have.

In this project, the keys are in **aws/accessKeys.csv**.

## Serverless Deployment
When you deploy a [Service](https://www.serverless.com/framework/docs/providers/aws/guide/services/), all of the Functions, Events and Resources in your serverless.yml are translated to an AWS CloudFormation template and deployed as a single CloudFormation stack.

To deploy a service, first cd into the relevant service directory
```
cd my-service
```
Then use the deploy command
```
serverless deploy
```
You can specify the profile which should be used via the aws-profile option like this:
```
serverless deploy --aws-profile chatbotcovid
```
To specify a default profile to use, you can add a profile setting to your provider configuration in **serverless.yml**.

## Create AWS Lambda's from scratch
To start developing the backend Lambdas (using the Dialogflow frontend) you can create the lambda functions [from scratch](https://medium.com/faun/building-chatbot-with-google-dialogflow-with-aws-lambda-e19872e1589).

## Gracias
