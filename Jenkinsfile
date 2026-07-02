pipeline {
    agent any

    tools {
        nodejs 'NodeJS_20'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKERHUB_NAMESPACE   = 'CHANGE_ME'
        IMAGE_NAME            = "${DOCKERHUB_NAMESPACE}/tasklist-frontend"
        IMAGE_TAG             = "${env.BUILD_NUMBER}"
        DEPLOY_HOST           = 'CHANGE_ME'
        DEPLOY_USER           = 'CHANGE_ME'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Unit tests') {
            steps {
                sh 'npm run test:coverage'
            }
            post {
                always {
                    junit 'reports/junit.xml'
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('SonarQube analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'npx sonar-scanner'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Docker build') {
            steps {
                sh "docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:latest ."
            }
        }

        stage('Docker push') {
            steps {
                sh 'echo "$DOCKERHUB_CREDENTIALS_PSW" | docker login -u "$DOCKERHUB_CREDENTIALS_USR" --password-stdin'
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${IMAGE_NAME}:latest"
            }
            post {
                always {
                    sh 'docker logout'
                }
            }
        }

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sshagent(credentials: ['deploy-server-ssh']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no \$DEPLOY_USER@\$DEPLOY_HOST '
                            docker pull ${IMAGE_NAME}:latest &&
                            docker stop tasklist-frontend || true &&
                            docker rm tasklist-frontend || true &&
                            docker run -d --name tasklist-frontend --restart unless-stopped \
                                -p 80:80 \
                                ${IMAGE_NAME}:latest
                        '
                    """
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
            cleanWs()
        }
    }
}
