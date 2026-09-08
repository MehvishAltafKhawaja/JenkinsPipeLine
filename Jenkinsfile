pipeline {

    agent none

    stages {

        stage('Checkout on Linux Worker') {
            agent {
                label 'java-linux-01'
            }

            steps {
                echo '===== CHECKOUT SOURCE CODE ====='
                checkout scm
            }
        }

       stage('Test Python Backend') {
    agent {
        label 'java-linux-01'
    }

    steps {
        echo '===== TESTING PYTHON BACKEND ====='

        dir('backend') {
            sh '''
                python3 --version

                echo "Creating Python virtual environment..."
                python3 -m venv .venv

                echo "Installing dependencies..."
                .venv/bin/python -m pip install --upgrade pip
                .venv/bin/python -m pip install -r requirements.txt

                echo "Python backend dependencies installed successfully"
            '''
        }
    }
}

        stage('Prepare Project for Docker Agent') {
            agent {
                label 'java-linux-01'
            }

            steps {
                echo '===== STASHING PROJECT FILES ====='

               stash name: 'myproject-files',
                 includes: '**/*',
                 excludes: 'backend/.venv/**'
            }
        }

        stage('Get Project on Docker Agent') {
            agent {
                label 'docker-agent'
            }

            steps {
                echo '===== UNSTASH PROJECT ====='

                unstash 'myproject-files'
            }
        }

        stage('Check Docker') {
            agent {
                label 'docker-agent'
            }

            steps {
                sh '''
                    docker --version
                    docker compose version
                    docker ps
                '''
            }
        }

        stage('Build Backend Image') {
            agent {
                label 'docker-agent'
            }

            steps {
                echo '===== BUILDING BACKEND IMAGE ====='

                sh '''
                    docker build \
                    -t myproject-backend:${BUILD_NUMBER} \
                    ./backend
                '''
            }
        }

        stage('Build Frontend Image') {
            agent {
                label 'docker-agent'
            }

            steps {
                echo '===== BUILDING FRONTEND IMAGE ====='

                sh '''
                    docker build \
                    -t myproject-frontend:${BUILD_NUMBER} \
                    ./frontend
                '''
            }
        }

        stage('Deploy Application') {
            agent {
                label 'docker-agent'
            }

            steps {
                echo '===== DEPLOYING APPLICATION ====='

                sh '''
                    docker compose down || true
                    docker compose up -d --build
                '''
            }
        }

        stage('Verify Containers') {
            agent {
                label 'docker-agent'
            }

            steps {
                echo '===== VERIFYING CONTAINERS ====='

                sh '''
                    docker compose ps
                    docker ps
                '''
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