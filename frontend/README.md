# AI Proctoring System Frontend

A modern, responsive web interface for the AI Proctoring System that provides an intuitive way to upload reference images and analyze exam photos for potential violations.

## Features

### 🎯 Core Functionality
- **Reference Image Upload**: Drag-and-drop or browse to upload approved exam environment
- **Multi-Image Analysis**: Upload up to 5 exam images for AI analysis
- **Real-time Processing**: Live progress indicators during AI analysis
- **Session Management**: Track exam sessions and analysis history
- **Cost Monitoring**: Real-time cost tracking for AI API usage

### 🎨 User Interface
- **Modern Design**: Clean, professional interface with smooth animations
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Drag & Drop**: Intuitive file upload with visual feedback
- **Progress Indicators**: Clear progress bars and loading states
- **Toast Notifications**: Non-intrusive success/error messages
- **Real-time Status**: Live server status and cost monitoring

### 🤖 AI Integration
- **Multi-Provider Support**: Choose between OpenAI GPT and Google Gemini
- **Model Selection**: Select from various AI models based on needs and budget
- **Detailed Results**: Comprehensive analysis reports with violation detection
- **Cost Transparency**: Real-time cost calculation and breakdown

## File Structure

```
frontend/
├── index.html          # Main HTML structure
├── styles.css          # Modern CSS styling with animations
├── script.js           # Complete JavaScript functionality
└── README.md          # This documentation
```

## Setup Instructions

1. **Start the Backend Server**
   ```bash
   cd /home/shb/coding/nodeJs/proctor-poc
   npm start
   ```

2. **Open the Frontend**
   ```bash
   cd frontend
   # Serve the files using any local server
   python3 -m http.server 8080
   # OR
   npx live-server
   # OR simply open index.html in your browser
   ```

3. **Access the Application**
   - Open your browser and navigate to `http://localhost:8080`
   - The frontend will automatically connect to the backend at `http://localhost:3000`

## Usage Workflow

### Step 1: Upload Reference Image
1. **Drag and drop** or **click to browse** for your reference image
2. Fill in the **exam description** and select **exam type**
3. Click **Upload Reference** to create a new session
4. Note the **Session ID** generated for tracking

### Step 2: Analyze Exam Images
1. **Upload multiple images** (up to 5) from the exam session
2. Enter the **Student ID** for tracking
3. Select your preferred **AI Provider** (OpenAI or Gemini)
4. Choose the **AI Model** based on your needs:

   **OpenAI Models:**
   - **GPT-4o Mini**: Fast and cost-effective option
   - **GPT-4o**: Most capable multimodal analysis
   - **GPT-4 Turbo**: Enhanced performance model
   - **GPT-4.1**: Latest generation with advanced capabilities
   - **GPT-4.1 Mini**: Efficient latest generation model
   - **GPT-Image-1**: Specialized vision analysis model

   **Google Gemini Models:**
   - **Gemini 1.5 Flash**: Fast and efficient processing
   - **Gemini 1.5 Pro**: High-performance analysis
   - **Gemini 2.0 Flash**: Latest fast model with improved performance
   - **Gemini 2.0 Flash Lite**: Ultra-efficient latest generation
   - **Gemini 2.5 Pro**: Most advanced multimodal capabilities
   - **Gemini 2.5 Flash**: Advanced model with optimized speed
   - **Gemini 2.5 Flash Lite**: Preview of ultra-efficient advanced model

5. Click **Analyze Images** to start processing

### Step 3: Review Results
1. **Analysis Report**: Detailed AI analysis of potential violations
2. **Cost Information**: Exact cost breakdown for the analysis
3. **Session History**: Complete history of all analyses in the session
4. **Processing Metrics**: Time taken and images processed

## Technical Features

### Frontend Technologies
- **HTML5**: Semantic markup with modern features
- **CSS3**: Advanced styling with custom properties, flexbox, and grid
- **Vanilla JavaScript**: No dependencies, pure ES6+ code
- **Font Awesome**: Professional icons throughout the interface
- **Responsive Design**: Mobile-first approach with media queries

### Key Components

#### File Upload System
- **Drag & Drop**: Visual feedback with hover states
- **File Validation**: Type and size checking before upload
- **Progress Tracking**: Real-time upload progress
- **Multi-file Support**: Handle multiple images simultaneously

#### API Integration
- **RESTful API Calls**: Complete integration with backend endpoints
- **Error Handling**: Comprehensive error catching and user feedback
- **Response Processing**: Parse and display API responses elegantly
- **Status Monitoring**: Continuous server health checking

#### User Experience
- **Loading States**: Smooth loading animations and progress bars
- **Toast Notifications**: Non-blocking success/error messages
- **Form Validation**: Client-side validation before submission
- **Responsive Feedback**: Immediate visual feedback for all actions

### Browser Compatibility
- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile Support**: iOS Safari, Android Chrome
- **Progressive Enhancement**: Graceful degradation for older browsers

## API Endpoints Used

The frontend integrates with these backend endpoints:

- `GET /health` - Server status and cost monitoring
- `POST /api/reference/upload` - Upload reference images
- `POST /api/analysis/:sessionId` - Analyze exam images
- `GET /api/session/:sessionId` - Retrieve session details
- `POST /api/clear` - Clear all data
- `GET /api/costs` - Get cost summary

## Configuration

### Server URL
The frontend connects to the backend server at `http://localhost:3000` by default. To change this, modify the `serverUrl` property in `script.js`:

```javascript
constructor() {
    this.serverUrl = 'http://your-server-url:port';
    // ... rest of constructor
}
```

### Supported File Types
- **JPEG** (.jpg, .jpeg)
- **PNG** (.png)
- **WebP** (.webp)
- **Maximum file size**: 10MB per image
- **Maximum files**: 5 images per analysis

## Error Handling

The frontend includes comprehensive error handling:

- **Network Errors**: Connection failures and timeouts
- **File Validation**: Invalid file types and sizes
- **API Errors**: Backend error responses
- **User Input**: Form validation and required fields
- **Session Management**: Invalid or expired sessions

## Performance Optimizations

- **Lazy Loading**: Components load only when needed
- **Debounced Inputs**: Reduced API calls for real-time features
- **Efficient DOM Updates**: Minimal DOM manipulation
- **Image Optimization**: Client-side image validation
- **Memory Management**: Proper cleanup of event listeners

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **High Contrast**: Clear visual hierarchy
- **Focus Management**: Proper focus indicators
- **Alternative Text**: Descriptive labels for all interactive elements

## Customization

### Styling
The CSS uses custom properties (CSS variables) for easy theming:

```css
:root {
    --primary-color: #2563eb;
    --success-color: #10b981;
    --danger-color: #ef4444;
    /* ... modify these to change the theme */
}
```

### Functionality
Key functions can be extended or modified:

- `validateImageFile()` - Customize file validation
- `updateModelOptions()` - Add new AI models
- `showToast()` - Customize notification system
- `checkServerStatus()` - Modify health checking

## Troubleshooting

### Common Issues

1. **Server Connection Failed**
   - Ensure backend server is running on port 3000
   - Check CORS configuration if hosting on different domains

2. **File Upload Errors**
   - Verify file types are supported (JPEG, PNG, WebP)
   - Check file sizes are under 10MB
   - Ensure backend has write permissions

3. **Analysis Failures**
   - Verify API keys are configured in backend .env file
   - Check internet connection for AI service calls
   - Ensure selected AI model is available

### Debug Mode
Enable browser developer tools to see detailed error messages and network requests.

## Future Enhancements

Potential improvements for the frontend:

- **Real-time Updates**: WebSocket integration for live analysis updates
- **Image Preview**: Thumbnail previews of uploaded images
- **Batch Processing**: Queue multiple analysis requests
- **Export Features**: Download analysis reports as PDF
- **Advanced Filtering**: Filter session history by date, student, etc.
- **Dark Mode**: Toggle between light and dark themes
- **Offline Support**: Service worker for offline functionality

## Contributing

To contribute to the frontend:

1. Follow the existing code style and structure
2. Test across multiple browsers and devices
3. Ensure accessibility standards are maintained
4. Add appropriate error handling for new features
5. Update documentation for any new functionality

## License

This frontend is part of the AI Proctoring System and follows the same MIT license as the backend.
