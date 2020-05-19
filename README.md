# Chatbot Backend
This project was generated with Serverless Framework’s Open Source CLI and AWS.

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

## Setting up AWS
To run serverless commands that interface with your AWS account, you will need to setup your AWS account credentials on your machine.

First, [install AWS CLI version 2](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2-windows.html). Then, you have to [set up your AWS CLI installation](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) running
```
aws configure
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-west-2
Default output format [None]: json
```
The AWS Access Key ID and AWS Secret Access Key are your AWS credentials. They are associated with an AWS Identity and Access Management (IAM) user or role that determines what permissions you have.

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

## Gracias
