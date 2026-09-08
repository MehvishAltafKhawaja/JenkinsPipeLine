pipeline {
    agent none

    options {
        skipDefaultCheckout(true)
    }

    stages {

        stage('Linux Worker') {
            agent { label 'java-linux-01' }

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
                                python3 --version

                                python3 -m venv .venv

                                .venv/bin/python -m pip install --upgrade pip
                                .venv/bin/python -m pip install -r requirements.txt

                                echo "Python backend dependencies installed successfully"
                            '''
                        }
                    }
                }

                stage('Prepare Project') {
                    steps {
                        stash name: 'myproject-files',
                              includes: '**/*',
                              excludes: 'backend/.venv/**'
                    }
                }
            }
        }

        stage('Docker Agent') {
            agent { label 'docker-agent' }

            stages {

                stage('Get Project') {
                    steps {
                        deleteDir()
                        unstash 'myproject-files'
                    }
                }

                stage('Check Docker') {
                    steps {
                        sh '''
                            docker --version
                            docker compose version
                            docker ps
                        '''
                    }
                }

                stage('Build Backend') {
                    steps {
                        sh '''
                            docker build \
                            -t myproject-backend:${BUILD_NUMBER} \
                            ./backend
                        '''
                    }
                }

                stage('Build Frontend') {
                    steps {
                        sh '''
                            docker build \
                            -t myproject-frontend:${BUILD_NUMBER} \
                            ./frontend
                        '''
                    }
                }

                stage('Deploy Application') {
                    steps {
                        sh '''
                            docker compose -p myproject down || true
                            docker compose -p myproject up -d --build
                        '''
                    }
                }

                stage('Verify Containers') {
                    steps {
                        sh '''
                            docker compose -p myproject ps
                            docker ps
                        '''
                    }
                }
            }
        }
    }

    post {
        success {
            echo '===== PIPELINE SUCCESSFUL ====='
        }

        failure {
            echo '===== PIPELINE FAILED ====='
        }

        always {
            echo '===== PIPELINE FINISHED ====='
        }
    }
}