pipeline {
    agent any

    environment {
        NPM_CACHE = '.npm' // Directory for npm cache
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

        // stage('Run Tests') {
        //     steps {
        //         sh 'npm test'
        //     }
        // }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            when {
                branch 'feature' // Deploy only on the 'main' branch
            }
            steps {
                sh 'npm run deploy'
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
