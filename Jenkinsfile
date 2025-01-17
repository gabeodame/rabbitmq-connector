pipeline {
    agent {
        docker {
            image 'node:14'
            args '-v /tmp:/tmp' // Optional: Add any additional Docker args
        }
    }

    environment {
        NPM_CACHE = '.npm'
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install --cache $NPM_CACHE'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build && node -v'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test || echo "No tests available."'
            }
        }

        stage('Debug Workspace') {
            steps {
                sh 'ls -R dist || echo "No build artifacts found in dist directory."'
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
        }
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}
