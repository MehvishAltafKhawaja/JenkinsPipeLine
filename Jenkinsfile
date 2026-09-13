pipeline {

    agent none

    options {
        skipDefaultCheckout(true)
    }

    environment {
        BACKEND_IMAGE  = 'khawaja0011/app-backend'
        FRONTEND_IMAGE = 'khawaja0011/app-frontend'

        EC2_USER = 'ubuntu'
        EC2_HOST = '13.200.227.239'
    }


    stages {

        /* =====================================
           LINUX WORKER
        ===================================== */

        stage('Linux Worker') {

            agent {
                label 'java-linux-01'
            }

            stages {

                stage('Checkout') {
                    steps {
                        echo '===== CHECKOUT SOURCE CODE ====='
                        checkout scm
                    }
                }


                stage('Test Python Backend') {
                    steps {

                        dir('backend') {

                            sh '''
                                echo "===== PYTHON VERSION ====="

                                python3 --version

                                echo "===== CREATE VIRTUAL ENVIRONMENT ====="

                                python3 -m venv .venv

                                echo "===== UPGRADE PIP ====="

                                .venv/bin/python -m pip install --upgrade pip

                                echo "===== INSTALL BACKEND DEPENDENCIES ====="

                                .venv/bin/python -m pip install \
                                -r requirements.txt

                                echo "Python backend dependencies installed successfully"
                            '''
                        }
                    }
                }


                stage('Prepare Project') {
                    steps {

                        echo '===== STASH PROJECT FILES ====='

                        stash name: 'myproject-files',
                              includes: '**/*',
                              excludes: 'backend/.venv/**'
                    }
                }
            }
        }


        /* =====================================
           DOCKER AGENT
        ===================================== */

        stage('Docker Agent') {

            agent {
                label 'docker-agent'
            }

            stages {

                stage('Get Project') {
                    steps {

                        echo '===== GET PROJECT ON DOCKER AGENT ====='

                        deleteDir()

                        unstash 'myproject-files'
                    }
                }


                stage('Check Docker') {
                    steps {

                        sh '''
                            echo "===== DOCKER VERSION ====="

                            docker --version

                            echo "===== DOCKER COMPOSE VERSION ====="

                            docker compose version

                            echo "===== CURRENT CONTAINERS ====="

                            docker ps
                        '''
                    }
                }


                stage('Build Backend') {
                    steps {

                        echo '===== BUILD BACKEND IMAGE ====='

                        sh '''
                            docker build \
                            -t ${BACKEND_IMAGE}:${BUILD_NUMBER} \
                            ./backend
                        '''
                    }
                }


                stage('Build Frontend') {
                    steps {

                        echo '===== BUILD FRONTEND IMAGE ====='

                        sh '''
                            docker build \
                            -t ${FRONTEND_IMAGE}:${BUILD_NUMBER} \
                            ./frontend
                        '''
                    }
                }


                stage('Docker Hub Login') {
                    steps {

                        withCredentials([
                            usernamePassword(
                                credentialsId: 'dockerhub-credentials',
                                usernameVariable: 'DOCKER_USER',
                                passwordVariable: 'DOCKER_PASS'
                            )
                        ]) {

                            sh '''
                                echo "===== DOCKER HUB LOGIN ====="

                                echo "$DOCKER_PASS" | \
                                docker login \
                                -u "$DOCKER_USER" \
                                --password-stdin
                            '''
                        }
                    }
                }


                stage('Push Backend Image') {
                    steps {

                        echo '===== PUSH BACKEND IMAGE ====='

                        sh '''
                            docker push \
                            ${BACKEND_IMAGE}:${BUILD_NUMBER}
                        '''
                    }
                }


                stage('Push Frontend Image') {
                    steps {

                        echo '===== PUSH FRONTEND IMAGE ====='

                        sh '''
                            docker push \
                            ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        '''
                    }
                }


                stage('Create Latest Tags') {
                    steps {

                        echo '===== CREATE LATEST TAGS ====='

                        sh '''
                            docker tag \
                            ${BACKEND_IMAGE}:${BUILD_NUMBER} \
                            ${BACKEND_IMAGE}:latest


                            docker tag \
                            ${FRONTEND_IMAGE}:${BUILD_NUMBER} \
                            ${FRONTEND_IMAGE}:latest


                            echo "===== PUSH BACKEND LATEST ====="

                            docker push \
                            ${BACKEND_IMAGE}:latest


                            echo "===== PUSH FRONTEND LATEST ====="

                            docker push \
                            ${FRONTEND_IMAGE}:latest
                        '''
                    }
                }
            }
        }


        /* =====================================
           DEPLOY TO EC2
        ===================================== */

        stage('Deploy To EC2') {

            agent {
                label 'docker-agent'
            }

            steps {

                echo '===== DEPLOYING APPLICATION TO EC2 ====='

                sshagent(credentials: ['ec2-ssh-key']) {

                    sh '''
ssh \
-o StrictHostKeyChecking=no \
${EC2_USER}@${EC2_HOST} \
"BUILD_NUMBER=${BUILD_NUMBER} \
BACKEND_IMAGE=${BACKEND_IMAGE} \
FRONTEND_IMAGE=${FRONTEND_IMAGE} \
bash -s" <<'REMOTE'

mkdir -p ~/myproject

cd ~/myproject


echo "===== CREATE DOCKER COMPOSE FILE ====="

cat > docker-compose.yml <<EOF
services:

  backend:
    image: ${BACKEND_IMAGE}:${BUILD_NUMBER}
    container_name: myproject-backend

    ports:
      - "8000:8000"

    restart: unless-stopped

    networks:
      - app-network


  frontend:
    image: ${FRONTEND_IMAGE}:${BUILD_NUMBER}
    container_name: myproject-frontend

    ports:
      - "3000:3000"

    environment:
      BACKEND_URL: http://backend:8000/api

    depends_on:
      - backend

    restart: unless-stopped

    networks:
      - app-network


networks:

  app-network:
    driver: bridge

EOF


echo "===== PULL IMAGES ====="

docker compose pull


echo "===== REMOVE OLD VERSION ====="

docker compose down || true


echo "===== DEPLOY NEW VERSION ====="

docker compose up -d


echo "===== STATUS ====="

docker compose ps

REMOTE
                    '''
                }
            }
        }


        /* =====================================
           VERIFY EC2 DEPLOYMENT
        ===================================== */

        stage('Verify EC2 Deployment') {

            agent {
                label 'docker-agent'
            }

            steps {

                sshagent(credentials: ['ec2-ssh-key']) {

                    sh '''
                        ssh \
                        -o StrictHostKeyChecking=no \
                        ${EC2_USER}@${EC2_HOST} '

                            echo "===== EC2 RUNNING CONTAINERS ====="

                            docker ps

                            echo "===== BACKEND CONTAINER ====="

                            docker ps \
                            --filter name=myproject-backend

                            echo "===== FRONTEND CONTAINER ====="

                            docker ps \
                            --filter name=myproject-frontend
                        '
                    '''
                }
            }
        }
    }


    /* =====================================
       POST ACTIONS
    ===================================== */

    post {

        success {

            echo '================================='

            echo 'PIPELINE SUCCESSFUL'

            echo "Build Number: ${BUILD_NUMBER}"

            echo "Backend Image: ${BACKEND_IMAGE}:${BUILD_NUMBER}"

            echo "Frontend Image: ${FRONTEND_IMAGE}:${BUILD_NUMBER}"

            echo "Application deployed on EC2"

            echo "Frontend: http://${EC2_HOST}:3000"

            echo "Backend: http://${EC2_HOST}:8000"

            echo '================================='
        }


        failure {

            echo '===== PIPELINE FAILED ====='
        }


        always {

            echo '===== PIPELINE FINISHED ====='
        }
    }
}