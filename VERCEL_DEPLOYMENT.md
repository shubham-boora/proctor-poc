# Vercel Deployment Guide

## Quick Deployment Steps

### 1. Prepare Your Project
```bash
# Clone your repository
git clone <your-repo-url>
cd proctor-poc

# Install dependencies locally (optional, for testing)
npm install
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (from project root)
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No (for first deployment)
# - What's your project's name? ai-proctoring-system
# - In which directory is your code located? ./
```

### 3. Environment Variables
After deployment, set up environment variables in Vercel dashboard:

1. Go to https://vercel.com/dashboard
2. Find your project
3. Go to Settings > Environment Variables
4. Add the following variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production
```

### 4. Production Deployment
```bash
# Deploy to production
vercel --prod
```

## Configuration Files

### vercel.json
```json
{
    "version": 2,
    "builds": [
        {
            "src": "server.js",
            "use": "@vercel/node"
        }
    ],
    "routes": [
        {
            "src": "/api/(.*)",
            "dest": "server.js"
        },
        {
            "src": "/health",
            "dest": "server.js"
        },
        {
            "src": "/frontend/(.*)",
            "dest": "server.js"
        },
        {
            "src": "/(.*)",
            "dest": "server.js"
        }
    ],
    "functions": {
        "server.js": {
            "maxDuration": 60
        }
    },
    "env": {
        "NODE_ENV": "production"
    }
}
```

## Important Notes

### File Storage
- Vercel serverless functions use `/tmp` directory for temporary files
- Files are not persisted between function invocations
- For production, consider using:
  - AWS S3
  - Cloudinary
  - Vercel Blob Storage

### Function Limits
- Maximum execution time: 60 seconds (configured in vercel.json)
- Memory limit: 1024MB (default for Pro plan)
- Request body size: 4.5MB

### Frontend Access
After deployment, your app will be available at:
- Frontend: `https://your-project.vercel.app`
- API: `https://your-project.vercel.app/api/*`
- Health: `https://your-project.vercel.app/health`

### Testing the Deployment
```bash
# Test API endpoint
curl https://your-project.vercel.app/health

# Test models endpoint
curl https://your-project.vercel.app/api/models
```

## Troubleshooting

### Common Issues

1. **Function Timeout**
   - AI processing might take longer than 60s
   - Consider upgrading to Pro plan for longer timeouts

2. **Memory Limits**
   - Large image processing might hit memory limits
   - Optimize images before upload

3. **Environment Variables**
   - Make sure all environment variables are set in Vercel dashboard
   - Check variable names match exactly

4. **API Routes**
   - Ensure all frontend API calls use relative URLs
   - Check vercel.json routing configuration

### Performance Optimization

1. **Image Processing**
   - Resize images before AI analysis
   - Use Sharp for efficient processing

2. **Response Caching**
   - Consider caching AI responses
   - Use Vercel Edge Functions if needed

3. **Error Handling**
   - Implement proper error boundaries
   - Add retry logic for AI API calls

## Alternative Deployment Options

If Vercel limitations are too restrictive, consider:
- **Heroku**: Better for persistent file storage
- **Railway**: Good Node.js support
- **DigitalOcean App Platform**: More control over resources
- **AWS Lambda**: More configuration options
