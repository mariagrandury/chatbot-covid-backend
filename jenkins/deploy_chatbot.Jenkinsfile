def GET_USER = ''
pipeline {
    agent any

    options {
        // Only keep the 5 most recent builds
        buildDiscarder(logRotator(numToKeepStr:'5'))
        ansiColor colorMapName: 'XTerm'
    }

    parameters {
        choice(name: "env", choices: "dev\nprod", description: "What environment?")
        string(name: 'SLACK_CHANNEL',
            description: 'Default Slack channel to send messages to',
            defaultValue: '#chatbot-deploy')
    }

    environment {
        AWS_CRED = credentials("aws_jenkins")
        // Slack configuration
        SLACK_COLOR_DANGER  = '#E01563'
        SLACK_COLOR_INFO    = '#6ECADC'
        SLACK_COLOR_WARNING = '#FFC300'
        SLACK_COLOR_GOOD    = '#3EB991'
    }

    stages {
        stage("Install modules npm for fulfillment") {


            steps {
                  wrap([$class: 'BuildUser']) {
                        script {
                                GET_USER = sh ( script: 'echo "${BUILD_USER}"', returnStdout: true).trim()
                               }
                         }
                 dir ('chatbot-fulfillment') {
                  sh 'npm install'

                }
             }
        }

            stage("Install modules npm for dialogflow-client") {


                    steps {
                            dir ('dialogflow-client') {
                            sh 'npm install'
                            }
                          }
                }


            stage("deploy chatbot") {

                steps {

                      sh 'serverless config credentials --provider aws --key $AWS_CRED_USR --secret $AWS_CRED_PSW --overwrite'
                      sh "serverless deploy --stage ${params.env}"
                }
            }
        }

    post {
        success {
            echo "Sending message to Slack"
            slackSend (color: "${env.SLACK_COLOR_GOOD}",
                channel: "${params.SLACK_CHANNEL}",
                message: "*SUCCESS Deploy ${params.env} :* Job ${env.JOB_NAME} build ${env.BUILD_NUMBER} by ${GET_USER}\n More info at: ${env.BUILD_URL}")
        }

        failure {
            echo "Sending message to Slack"
            slackSend (color: "${env.SLACK_COLOR_DANGER}",
                channel: "${params.SLACK_CHANNEL}",
                message: "*FAILED Deploy ${params.env} :* Job ${env.JOB_NAME} build ${env.BUILD_NUMBER} by ${GET_USER}\n More info at: ${env.BUILD_URL}")
        }
    }
}