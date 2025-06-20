const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Import services
const geminiService = require('./services/geminiService');
const gptService = require('./services/gptService');
const fileService = require('./services/fileService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, 'frontend')));

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 5 // Maximum 5 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
        }
    }
});

// Store active sessions
const activeSessions = new Map();

// Routes

// Serve the main frontend page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    const totalCost = geminiService.getTotalCost() + gptService.getTotalCost();
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        totalCost: parseFloat(totalCost.toFixed(6)),
        activeSessions: activeSessions.size
    });
});

// Get available AI models
app.get('/api/models', (req, res) => {
    try {
        const models = {
            openai: gptService.getAvailableModels(),
            gemini: geminiService.getAvailableModels()
        };
        
        res.json({
            success: true,
            models,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching models:', error);
        res.status(500).json({ 
            error: 'Failed to fetch available models',
            details: error.message 
        });
    }
});

// Upload reference image
app.post('/api/reference/upload', upload.single('reference'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No reference image provided' });
        }

        const sessionId = uuidv4();
        const { description, examType } = req.body;

        // Save reference image
        const referenceImagePath = await fileService.saveReferenceImage(req.file, sessionId);

        // Store session data
        const sessionData = {
            sessionId,
            referenceImagePath,
            description: description || 'Reference exam environment',
            examType: examType || 'general',
            createdAt: new Date(),
            analyses: []
        };

        activeSessions.set(sessionId, sessionData);

        console.log(`Reference image uploaded for session ${sessionId}`);

        res.json({
            success: true,
            sessionId,
            message: 'Reference image uploaded successfully',
            imageInfo: {
                filename: req.file.originalname,
                size: req.file.size
            }
        });

    } catch (error) {
        console.error('Reference upload error:', error);
        res.status(500).json({ 
            error: 'Failed to upload reference image',
            details: error.message 
        });
    }
});

// Analyze proctoring images
app.post('/api/analysis/:sessionId', upload.array('images', 5), async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = activeSessions.get(sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No images provided for analysis' });
        }

        const { studentId, provider, modelName } = req.body;

        // Validate required parameters
        if (!provider || !modelName) {
            return res.status(400).json({ 
                error: 'Provider and model name are required' 
            });
        }

        if (!['openai', 'gemini'].includes(provider)) {
            return res.status(400).json({ 
                error: 'Invalid provider. Use "openai" or "gemini"' 
            });
        }

        const analysisId = uuidv4();
        const startTime = Date.now();

        // Save proctoring images
        const proctoringImagePaths = await fileService.saveProctoringImages(req.files, sessionId, analysisId);

        // Prepare analysis context
        const context = {
            sessionId,
            analysisId,
            studentId: studentId || 'unknown',
            examType: session.examType,
            referenceImagePath: session.referenceImagePath,
            proctoringImagePaths
        };

        let analysisResult;
        let actualCost = 0;

        // Analyze with selected AI service
        if (provider === 'gemini') {
            const beforeCost = geminiService.getTotalCost();
            analysisResult = await geminiService.analyzeImages(modelName, context);
            const afterCost = geminiService.getTotalCost();
            actualCost = afterCost - beforeCost; // Get the actual cost for this analysis
        } else if (provider === 'openai') {
            const beforeCost = gptService.getTotalCost();
            analysisResult = await gptService.analyzeImages(modelName, context);
            const afterCost = gptService.getTotalCost();
            actualCost = afterCost - beforeCost; // Get the actual cost for this analysis
        }

        const processingTime = Date.now() - startTime;

        // Store analysis results
        const analysisData = {
            analysisId,
            timestamp: new Date(),
            studentId,
            provider,
            modelName,
            analysis: analysisResult,
            cost: actualCost,
            processingTime,
            imageCount: req.files.length
        };

        session.analyses.push(analysisData);
        activeSessions.set(sessionId, session);

        console.log(`Analysis completed: ${analysisId}, Cost: $${actualCost.toFixed(4)}, Time: ${processingTime}ms`);

        res.json({
            success: true,
            analysisId,
            sessionId,
            provider,
            modelName,
            analysis: analysisResult,
            cost: actualCost,
            processingTime,
            imageCount: req.files.length,
            totalSystemCost: geminiService.getTotalCost() + gptService.getTotalCost()
        });

    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze images',
            details: error.message 
        });
    }
});

// Get session details
app.get('/api/session/:sessionId', (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = activeSessions.get(sessionId);

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const sessionInfo = {
            sessionId: session.sessionId,
            createdAt: session.createdAt,
            examType: session.examType,
            description: session.description,
            analysisCount: session.analyses.length,
            totalCost: session.analyses.reduce((sum, analysis) => sum + analysis.cost, 0),
            analyses: session.analyses.map(a => ({
                analysisId: a.analysisId,
                timestamp: a.timestamp,
                provider: a.provider,
                modelName: a.modelName,
                cost: a.cost,
                processingTime: a.processingTime
            }))
        };

        res.json({
            success: true,
            session: sessionInfo
        });

    } catch (error) {
        console.error('Session retrieval error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve session',
            details: error.message 
        });
    }
});

// Get cost summary
app.get('/api/costs', (req, res) => {
    try {
        const geminiCost = geminiService.getTotalCost();
        const gptCost = gptService.getTotalCost();
        const totalCost = geminiCost + gptCost;

        res.json({
            success: true,
            costs: {
                gemini: geminiCost,
                openai: gptCost,
                total: totalCost
            },
            breakdown: {
                gemini: geminiService.getCostBreakdown(),
                openai: gptService.getCostBreakdown()
            }
        });

    } catch (error) {
        console.error('Cost summary error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve cost summary',
            details: error.message 
        });
    }
});

// Clear all data (sessions, files, costs)
app.post('/api/clear', async (req, res) => {
    try {
        // Clear all files
        await fileService.clearAllFiles();
        
        // Clear sessions
        activeSessions.clear();
        
        // Reset costs
        geminiService.resetCosts();
        gptService.resetCosts();

        console.log('All data cleared successfully');

        res.json({
            success: true,
            message: 'All data cleared successfully'
        });

    } catch (error) {
        console.error('Clear data error:', error);
        res.status(500).json({ 
            error: 'Failed to clear data',
            details: error.message 
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Maximum is 5 files.' });
        }
    }

    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await fileService.clearAllFiles();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await fileService.clearAllFiles();
    process.exit(0);
});

// Start server
app.listen(PORT, () => {
    console.log(`
🔒 AI Proctoring Server Started
════════════════════════════════
🌐 Frontend: http://localhost:${PORT}
📡 API:      http://localhost:${PORT}/api
🏥 Health:   http://localhost:${PORT}/health
💰 Costs:    http://localhost:${PORT}/api/costs
🗑️  Clear:    POST http://localhost:${PORT}/
════════════════════════════════
Frontend and API served from the same server
No CORS issues - Ready for production!
════════════════════════════════
    `);
});

module.exports = app;