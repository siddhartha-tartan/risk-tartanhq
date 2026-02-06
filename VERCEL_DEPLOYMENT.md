# Vercel Deployment Guide

This guide explains how to deploy the Document Processor application to Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. AWS credentials with S3 access
3. OpenAI API key
4. OCR API credentials

## Deployment Steps

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your Git repository
4. Select the repository containing this project

### 2. Configure Environment Variables

In the Vercel project settings, add the following environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `OCR_API_URL` | URL for the OCR API endpoint | Yes |
| `OCR_API_USERNAME` | Username for OCR API authentication | Yes |
| `OCR_API_PASSWORD` | Password for OCR API authentication | Yes |
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 | Yes |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for S3 | Yes |
| `AWS_REGION` | AWS region (e.g., `ap-south-1`) | Yes |
| `S3_BUCKET` | S3 bucket name for file storage | Yes |

### 3. Configure Build Settings

The default settings should work:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 4. Deploy

Click "Deploy" and Vercel will:
1. Install dependencies
2. Build the application
3. Deploy to their edge network

## Important Notes

### Serverless Limitations

This application has been adapted for Vercel's serverless environment:

1. **File Storage**: Files are uploaded directly to S3 instead of the local filesystem
2. **Temporary Files**: Any temp files are stored in `/tmp` which is ephemeral
3. **Function Timeouts**: API routes are configured with 60-second timeouts in `vercel.json`
4. **In-Memory State**: The `documentStore` uses in-memory storage which doesn't persist across function invocations

### For Production Use

For a production deployment, consider:

1. **Database**: Replace the in-memory `documentStore` with a database:
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
   - [Vercel KV](https://vercel.com/docs/storage/vercel-kv)
   - [Supabase](https://supabase.com)
   - [PlanetScale](https://planetscale.com)

2. **File Previews**: Consider using S3 presigned URLs for direct file access:
   ```typescript
   // Get presigned URL for a file
   const response = await fetch(`/api/documents/preview?filename=doc.pdf&source=presigned`);
   const { url } = await response.json();
   // Use the presigned URL directly in img/iframe src
   ```

3. **Monitoring**: Set up error tracking and monitoring:
   - [Vercel Analytics](https://vercel.com/analytics)
   - [Sentry](https://sentry.io)

### API Route Timeouts

The following routes have extended timeouts (60 seconds) configured:
- `/api/process/ocr-zip` - OCR processing
- `/api/process/extract-data` - AI data extraction
- `/api/process/generate-ai-insights` - AI insights generation
- `/api/process/verify-checklist` - Checklist verification
- `/api/process/verify-loan-checklist` - Loan checklist verification
- `/api/process/analyze-business-documents` - Business document analysis
- `/api/process/generate-cam-summary` - CAM summary generation
- `/api/documents/upload-zip` - File uploads

**Note**: The 60-second timeout requires a Vercel Pro plan. Free/Hobby plans have a 10-second limit.

## Local Development

For local development, create a `.env.local` file with your credentials:

```bash
cp .env.example .env.local
# Edit .env.local with your actual credentials
```

Then run:
```bash
npm install
npm run dev
```

## Troubleshooting

### Build Failures

1. **ESLint Errors**: The build may show ESLint warnings but should not fail on them
2. **TypeScript Errors**: Ensure all dependencies are installed with `npm install`

### Runtime Errors

1. **S3 Access Denied**: Check AWS credentials and bucket permissions
2. **OCR API Errors**: Verify OCR API URL and credentials
3. **OpenAI Errors**: Ensure your API key is valid and has sufficient credits

### File Upload Issues

1. Files are uploaded directly to S3
2. Maximum file size depends on Vercel's request limits (4.5MB for Hobby, 50MB for Pro)
3. For larger files, consider implementing chunked uploads

## Security Recommendations

1. **Environment Variables**: Never commit `.env.local` or expose API keys
2. **CORS**: Configure allowed origins in production
3. **Rate Limiting**: Consider implementing rate limiting for API routes
4. **Input Validation**: Validate all user inputs on the server side
