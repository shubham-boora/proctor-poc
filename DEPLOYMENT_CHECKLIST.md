# Vercel Deployment Checklist

## Pre-Deployment

- [ ] Environment variables ready:
  - [ ] OPENAI_API_KEY
  - [ ] GEMINI_API_KEY
- [ ] Code pushed to Git repository
- [ ] `vercel.json` configuration file present
- [ ] Dependencies listed in `package.json`

## Deployment Steps

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project root**
   ```bash
   vercel
   ```

4. **Set Environment Variables**
   - Go to Vercel Dashboard
   - Navigate to Project Settings
   - Add environment variables:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `GEMINI_API_KEY`: Your Google Gemini API key
     - `NODE_ENV`: production

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Post-Deployment Testing

- [ ] Frontend loads: `https://your-project.vercel.app`
- [ ] Health check works: `https://your-project.vercel.app/health`
- [ ] Models API works: `https://your-project.vercel.app/api/models`
- [ ] File upload works (test with small image)
- [ ] AI analysis works (test with both OpenAI and Gemini)

## Troubleshooting

### Common Issues:
1. **Function timeout**: AI processing takes too long
2. **Environment variables not set**: Check Vercel dashboard
3. **File upload fails**: Check file size limits (4.5MB max)
4. **API errors**: Check logs in Vercel dashboard

### Performance Tips:
- Optimize images before upload
- Use smaller AI models for faster responses
- Consider caching for repeated requests

## URLs After Deployment

Replace `your-project` with your actual Vercel project name:

- **Frontend**: `https://your-project.vercel.app`
- **Health Check**: `https://your-project.vercel.app/health`
- **API Base**: `https://your-project.vercel.app/api`
- **Models**: `https://your-project.vercel.app/api/models`
- **Upload Reference**: `POST https://your-project.vercel.app/api/reference/upload`
- **Analysis**: `POST https://your-project.vercel.app/api/analysis/:sessionId`
