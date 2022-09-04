pipeline {
  agent any

  environment {
    MAJSOUL_SECRETS = credentials('majsoul_secrets')
    RIICHI_CERT = credentials('riichi_cert')
    RIICHI_KEY = credentials('riichi_key')
    MONGO_CREDS = credentials('mongo_creds')
  }

  stages {
    stage('docker compose') {
      steps {
        sh 'touch majsoul.env'
        sh 'docker compose build'
      }
    }

    stage('docker down') {
      steps {
        sh 'docker stack down majsoul'
        sh '''
          until [ -z "$(docker service ls --filter label=com.docker.stack.namespace=majsoul -q)" ] || [ "$limit" -lt 0 ]; do
            sleep 1;
          done

          until [ -z "$(docker network ls --filter label=com.docker.stack.namespace=majsoul -q)" ] || [ "$limit" -lt 0 ]; do
            sleep 1;
          done
        '''
      }
    }

    stage('docker stack') {
      steps {
        sh 'cp ${MAJSOUL_SECRETS} secrets.json'
        sh 'cp ${RIICHI_CERT} riichi.crt.pem'
        sh 'cp ${RIICHI_KEY} riichi.key.pem'
        sh 'cp ${MONGO_CREDS} mongo-creds'
        sh 'docker stack up -c docker-compose.yaml majsoul'
      }
    }
  }
}
