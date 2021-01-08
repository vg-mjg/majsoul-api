pipeline {
  agent any

  environment {
    MAJSOUL_SECRETS = credentials('majsoul_secrets')
    RIICHI_CERT = credentials('riichi_cert')
    RIICHI_KEY = credentials('riichi_key')
  }

  stages {
    stage('docker compose') {
      steps {
        sh 'touch majsoul.env'
        sh 'docker-compose build'
      }
    }

    stage('docker stack') {
      steps {
        sh 'cp ${MAJSOUL_SECRETS} majsoul.json'
        sh 'cp ${RIICHI_CERT} riichi.crt.pem'
        sh 'cp ${RIICHI_KEY} riichi.key.pem'
        sh 'docker stack up -c docker-compose.yaml majsoul'
      }
    }
  }
}