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
        DOCKERHUB_NAMESPACE = 'hugolucas529'
        IMAGE_NAME          = 'tasklist-frontend'
        IMAGE_TAG           = "${env.BUILD_NUMBER}"
        FULL_IMAGE          = "${DOCKERHUB_NAMESPACE}/${IMAGE_NAME}"
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
                withSonarQubeEnv(installationName: 'SonarQube', credentialsId: 'sonarcloud-token-frontend') {
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
                sh 'docker build -t $FULL_IMAGE:$IMAGE_TAG -t $FULL_IMAGE:latest .'
            }
        }

        stage('Trivy security scan') {
            steps {
                sh '''
                    mkdir -p reports/trivy
                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        -v trivy-cache:/root/.cache/ \
                        -v "$WORKSPACE/reports/trivy:/reports" \
                        aquasec/trivy image \
                        --format table \
                        --severity CRITICAL,HIGH \
                        --exit-code 0 \
                        -o /reports/trivy-report-frontend.txt \
                        $FULL_IMAGE:$IMAGE_TAG
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/trivy/*.txt', allowEmptyArchive: true
                }
            }
        }

        stage('SBOM generation (SPDX)') {
            steps {
                sh '''
                    mkdir -p reports/sbom
                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        -v trivy-cache:/root/.cache/ \
                        -v "$WORKSPACE/reports/sbom:/reports" \
                        aquasec/trivy image \
                        --format spdx-json \
                        -o /reports/sbom-frontend.spdx.json \
                        $FULL_IMAGE:$IMAGE_TAG
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'reports/sbom/*.json', allowEmptyArchive: true
                }
            }
        }

        stage('Docker push (Docker Hub)') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
                    sh '''
                        echo "$DOCKERHUB_PASS" | docker login -u "$DOCKERHUB_USER" --password-stdin
                        docker push $FULL_IMAGE:$IMAGE_TAG
                        docker push $FULL_IMAGE:latest
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy (local Docker)') {
            when {
                branch 'main'
            }
            steps {
                sh '''
                    docker stop tasklist-frontend || true
                    docker rm tasklist-frontend || true
                    docker run -d --name tasklist-frontend --restart unless-stopped \
                        -p 80:80 \
                        $FULL_IMAGE:latest
                '''
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
