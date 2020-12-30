pipeline {
  agent any
  stages {
    stage('docker compose') {
      steps {
        sh 'touch majsoul.env'
        sh 'docker-compose build'
      }
    }

    stage('docker stack') {
      steps {
        sh '''
docker stack up -c docker-compose.yaml majsoul'''
      }
    }

  }
}