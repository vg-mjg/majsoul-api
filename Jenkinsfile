pipeline {
  agent any
  withCredentials([
    file(credentialsId: 'majsoul_secrets', variable: 'MAJSOUL_SECRETS'),
    file(credentialsId: 'riichi_cert', variable: 'RIICHI_CERT'),
    file(credentialsId: 'riichi_key', variable: 'RIICHI_KEY')
  ]) {
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
}