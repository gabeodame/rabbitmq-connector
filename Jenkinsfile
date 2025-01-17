pipeline {
    agent any

    environment {
        NODE_VERSION = '16.x' // Specify the Node.js version to use
        NPM_CACHE = '.npm'   // Directory for npm cache
    }

    stages {
        stage('Setup Environment') {
            steps {
                script {
                    if (!fileExists('.nvmrc')) {
                        writeFile file: '.nvmrc', text: NODE_VERSION
                    }
                }
                sh 'echo Using Node.js version: $(cat .nvmrc)'
            }
        }

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                # Install Node.js version using nvm
                . ~/.nvm/nvm.sh
                nvm install $(cat .nvmrc)
                nvm use $(cat .nvmrc)
                npm install --cache $NPM_CACHE
                '''
            }
        }

        stage('Run Tests') {
            steps {
                sh '''
                . ~/.nvm/nvm.sh
                nvm use $(cat .nvmrc)
                npm test
                '''
            }
        }

        stage('Build') {
            steps {
                sh '''
                . ~/.nvm/nvm.sh
                nvm use $(cat .nvmrc)
                npm run build
                '''
            }
        }

        stage('Deploy') {
            when {
                branch 'main' // Deploy only on the 'main' branch
            }
            steps {
                sh '''
                . ~/.nvm/nvm.sh
                nvm use $(cat .nvmrc)
                npm run deploy
                '''
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: '**/build/**/*', fingerprint: true
        }
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}
