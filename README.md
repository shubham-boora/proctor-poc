# AI Proctoring Server

A sophisticated AI-powered online proctoring system that uses computer vision and machine learning to monitor online exams and detect potential cheating violations.

## Features

- **Multi-AI Provider Support**: Compatible with both OpenAI GPT and Google Gemini models
- **Reference-Based Monitoring**: Compare exam environment against approved reference images
- **Real-time Violation Detection**: Identify unauthorized devices, materials, and suspicious behavior
- **Cost Tracking**: Monitor and track AI API usage costs across providers
- **Session Management**: Maintain detailed exam sessions with analysis history
- **Image Processing**: Automatic image optimization and validation
- **RESTful API**: Complete REST API for integration with exam platforms

## Violation Detection Capabilities

- Unauthorized devices (phones, tablets, smartwatches, extra monitors)
- Prohibited materials (books, notes, papers, calculators)
- Environmental changes from reference setup
- Suspicious behavior and body language
- Multiple people in testing area
- Communication activities
- Screen content violations
- Position or camera angle changes

## Technology Stack

- **Backend**: Node.js with Express
- **AI Services**: OpenAI GPT-4/GPT-4o, Google Gemini Pro/Flash
- **Image Processing**: Sharp for optimization and validation
- **File Handling**: Multer for uploads with validation
- **Environment**: dotenv for configuration

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-proctoring-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

4. **Start the server**
   ```bash
   # Production (frontend + backend integrated)
   npm start
   
   # Development (with auto-reload)
   npm run dev
   
   # Production mode
   npm run production
   ```

5. **Access the application**
   ```
   Frontend: http://localhost:3000
   API:      http://localhost:3000/api
   Health:   http://localhost:3000/health
   ```

## API Endpoints

### Health & System

- `GET /health` - Server health check and system status
- `GET /api/costs` - Cost summary and breakdown
- `POST /api/clear` - Clear all data (sessions, files, costs)

### Exam Management

- `POST /api/reference/upload` - Upload reference exam environment image
- `POST /api/analysis/:sessionId` - Analyze proctoring images against reference
- `GET /api/session/:sessionId` - Get session details and analysis history

## Usage Example

### 1. Upload Reference Image

```bash
curl -X POST http://localhost:3000/api/reference/upload \
  -F "reference=@reference-image.jpg" \
  -F "description=Standard exam setup" \
  -F "examType=midterm"
```

Response:
```json
{
  "success": true,
  "sessionId": "uuid-session-id",
  "message": "Reference image uploaded successfully"
}
```

### 2. Analyze Proctoring Images

```bash
curl -X POST http://localhost:3000/api/analysis/uuid-session-id \
  -F "images=@exam-image-1.jpg" \
  -F "images=@exam-image-2.jpg" \
  -F "provider=openai" \
  -F "modelName=gpt-4o" \
  -F "studentId=student123"
```

Response:
```json
{
  "success": true,
  "analysisId": "uuid-analysis-id",
  "analysis": "Detailed AI analysis of violations...",
  "cost": 0.0234,
  "processingTime": 3500,
  "imageCount": 2
}
```

## Supported AI Models

### OpenAI Models
- `gpt-4o` - Latest multimodal model (recommended)
- `gpt-4o-mini` - Faster, cost-effective option
- `gpt-4-turbo` - Enhanced GPT-4 model
- `gpt-4.1` - Latest generation model with advanced capabilities
- `gpt-4.1-mini` - Efficient and fast latest generation model
- `gpt-image-1` - Specialized vision model for image analysis

### Google Gemini Models
- `gemini-1.5-pro` - High-performance multimodal model
- `gemini-1.5-flash` - Fast and efficient option
- `gemini-2.0-flash-001` - Latest fast model with improved performance
- `gemini-2.0-flash-lite-001` - Ultra-efficient latest generation model
- `gemini-2.5-pro` - Most advanced multimodal model
- `gemini-2.5-flash` - Advanced model with optimized speed
- `gemini-2.5-flash-lite-preview` - Preview of ultra-efficient advanced model

## Cost Management

The system tracks API costs in real-time:
- Per-request cost calculation
- Provider-specific pricing models
- Total cost tracking across sessions
- Detailed cost breakdowns by model

## File Management

- Automatic image optimization and resizing
- Support for JPEG, PNG, and WebP formats
- Maximum file size: 10MB per image
- Maximum files per request: 5 images
- Automatic cleanup of old files
- Session-based file organization

## Configuration

Key environment variables:

```env
# Required API Keys
OPENAI_API_KEY=your_key
GEMINI_API_KEY=your_key

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional Settings
MAX_FILE_SIZE=10485760  # 10MB
MAX_FILES=5
SESSION_CLEANUP_HOURS=24
```

## Error Handling

The system includes comprehensive error handling for:
- Invalid API keys or model names
- File upload validation and size limits
- Image processing errors
- AI service failures and rate limits
- Session management errors

## Security Considerations

- Input validation for all uploads
- File type restrictions
- Size limits on uploads and requests
- API key protection through environment variables
- CORS configuration for cross-origin requests

## Development

### Project Structure
```
├── server.js              # Main server file
├── services/
│   ├── fileService.js     # File handling and storage
│   ├── geminiService.js   # Google Gemini AI integration
│   └── gptService.js      # OpenAI GPT integration
├── uploads/               # File storage (auto-created)
├── package.json
├── .env.example
└── README.md
```

### Adding New Features

1. **New AI Provider**: Create a new service file in `/services/`
2. **Additional Endpoints**: Add routes in `server.js`
3. **Enhanced Detection**: Modify prompts in service files
4. **Custom Validation**: Extend `fileService.js` validation

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the [Issues](https://github.com/your-username/ai-proctoring-server/issues) page
2. Review the API documentation above
3. Ensure your API keys are correctly configured

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
>>>>>>> f87be81 (Initial commit)
