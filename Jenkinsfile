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
                catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                    sh 'npm run test:coverage'
                }
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
                catchError(buildResult: 'UNSTABLE', stageResult: 'FAILURE') {
                    withCredentials([string(credentialsId: 'sonarcloud-token-frontend', variable: 'SONAR_TOKEN')]) {
                        sh '''
                            TASK_ID=$(grep -oP "(?<=ceTaskId=).+" .scannerwork/report-task.txt)
                            SONAR_URL=$(grep -oP "(?<=serverUrl=).+" .scannerwork/report-task.txt)

                            STATUS="PENDING"
                            for i in $(seq 1 30); do
                                RESPONSE=$(curl -s -u ${SONAR_TOKEN}: "${SONAR_URL}/api/ce/task?id=${TASK_ID}")
                                STATUS=$(echo "$RESPONSE" | grep -oP "(?<=\\"status\\":\\")[^\\"]+" | head -1)
                                echo "Task status: $STATUS"
                                if [ "$STATUS" = "SUCCESS" ] || [ "$STATUS" = "FAILED" ] \
                                    || [ "$STATUS" = "CANCELED" ]; then
                                    break
                                fi
                                sleep 10
                            done

                            if [ "$STATUS" != "SUCCESS" ]; then
                                echo "SonarQube analysis task did not succeed: $STATUS"
                                exit 1
                            fi

                            ANALYSIS_ID=$(echo "$RESPONSE" | grep -oP "(?<=\\"analysisId\\":\\")[^\\"]+")
                            QG_RESPONSE=$(curl -s -u ${SONAR_TOKEN}: "${SONAR_URL}/api/qualitygates/project_status?analysisId=${ANALYSIS_ID}")
                            QG_STATUS=$(echo "$QG_RESPONSE" | grep -oP "(?<=\\"status\\":\\")[^\\"]+" | head -1)
                            echo "Quality Gate status: $QG_STATUS"

                            if [ "$QG_STATUS" != "OK" ]; then
                                echo "Quality Gate failed: $QG_STATUS"
                                exit 1
                            fi
                        '''
                    }
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
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credential', usernameVariable: 'DOCKERHUB_USER', passwordVariable: 'DOCKERHUB_PASS')]) {
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
