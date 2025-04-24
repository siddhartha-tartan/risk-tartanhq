# Elastic Beanstalk Deployment Guide

This document provides instructions for deploying the Document Processor application to AWS Elastic Beanstalk.

## Prerequisites

1. Install the AWS CLI and configure it with your credentials:
   ```
   aws configure
   ```

2. Install the EB CLI:
   ```
   pip install awsebcli
   ```

## Deployment Steps

### First-time Deployment

1. Initialize the EB environment in your project directory:
   ```
   eb init
   ```
   - Select your region
   - Create a new application or select an existing one
   - Select Node.js as the platform
   - Choose to set up SSH for your instances

2. Create an environment and deploy:
   ```
   eb create document-processor-env
   ```

3. Set environment variables (replace with your actual values):
   ```
   eb setenv \
     AWS_REGION=ap-south-1 \
     S3_BUCKET=ai-policy-benchmark \
     AWS_ACCESS_KEY_ID=your-access-key \
     AWS_SECRET_ACCESS_KEY=your-secret-key \
     OCR_API_URL=http://rulesyncapi-cl1.ap-south-1.elasticbeanstalk.com/api/v1/cam_ocr \
     OCR_API_USERNAME=chat@service.user \
     OCR_API_PASSWORD=chat@123
   ```

### Subsequent Deployments

1. Make your changes to the code
2. Deploy the updated application:
   ```
   eb deploy
   ```

3. To monitor the deployment and application logs:
   ```
   eb logs
   ```

4. To open the application in a browser:
   ```
   eb open
   ```

## Troubleshooting

1. View the application logs:
   ```
   eb logs
   ```

2. Connect to the EC2 instance:
   ```
   eb ssh
   ```

3. Check the status of the environment:
   ```
   eb status
   ```

4. If deployment fails, try rebuilding the environment:
   ```
   eb rebuild
   ```

## Important Notes

- The application uses the `.ebextensions` directory for configuration
- Environment variables are set via the EB CLI or the AWS Console
- Health checks are configured to monitor the `/api/health` endpoint
- Files larger than 10MB should be uploaded directly to S3 rather than through the application
- Remember to secure your AWS credentials and API keys

## Maintenance

- Regularly update Node.js dependencies with `npm audit fix`
- Update Python dependencies in `scripts/requirements.txt`
- Monitor the EC2 instances for resource usage 