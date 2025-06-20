const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const PromptService = require('./promptService');

// Gemini model pricing enum
const GEMINI_PRICING = {
    'gemini-1.5-pro': {
textInputPer1K: 0.00125,
textOutputPer1K: 0.005,
imageProcessing: 0.003125
},
'gemini-1.5-flash': {
textInputPer1K: 0.000075,
textOutputPer1K: 0.0003,
imageProcessing: 0.000075
},
'gemini-2.5-pro': {
textInputPer1K: 0.00125,
textOutputPer1K: 0.01,
imageProcessing: 0.00125
},
'gemini-2.5-flash': {
textInputPer1K: 0.0003,
textOutputPer1K: 0.0025,
imageProcessing: 0.0003
},
'gemini-2.5-flash-lite-preview': {
textInputPer1K: 0.0001,
textOutputPer1K: 0.0004,
imageProcessing: 0.0001
},
'gemini-2.0-flash-001': {
textInputPer1K: 0.0001,
textOutputPer1K: 0.0004,
imageProcessing: 0.0001
},
'gemini-2.0-flash-lite-001': {
textInputPer1K: 0.000075,
textOutputPer1K: 0.0003,
imageProcessing: 0.000075
}
};

class GeminiService {
    constructor() {
        this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.totalCost = 0;
        this.callHistory = [];
    }

    /**
     * Analyze images using Gemini AI
     */
    async analyzeImages(modelName, context) {
        try {
            if (!GEMINI_PRICING[modelName]) {
                throw new Error(`Unsupported Gemini model: ${modelName}`);
            }

            const model = this.client.getGenerativeModel({ model: modelName });
            
            const prompt = PromptService.getPrompt('gemini', context);
            
            // Prepare images
            const imageParts = [];
            
            // Add reference image
            const referenceImageData = await fs.readFile(context.referenceImagePath);
            imageParts.push({
                inlineData: {
                    data: referenceImageData.toString('base64'),
                    mimeType: 'image/jpeg'
                }
            });

            // Add proctoring images
            for (const imagePath of context.proctoringImagePaths) {
                const imageData = await fs.readFile(imagePath);
                imageParts.push({
                    inlineData: {
                        data: imageData.toString('base64'),
                        mimeType: 'image/jpeg'
                    }
                });
            }

            const result = await model.generateContent([
                prompt,
                ...imageParts
            ]);

            const response = await result.response;
            const analysisText = response.text();

            // Calculate cost
            const cost = this.calculateCost(modelName, imageParts.length);
            this.totalCost += cost;
            
            // Log the call
            this.callHistory.push({
                timestamp: new Date().toISOString(),
                sessionId: context.sessionId,
                analysisId: context.analysisId,
                modelName,
                imageCount: imageParts.length,
                cost,
                analysisText,
                success: true
            });

            console.log(`Gemini analysis completed: ${modelName}, Cost: $${cost.toFixed(4)}`);

            return analysisText;

        } catch (error) {
            console.error('Gemini analysis failed:', error);
            
            // Log failed call
            this.callHistory.push({
                timestamp: new Date().toISOString(),
                sessionId: context.sessionId,
                analysisId: context.analysisId,
                modelName,
                cost: 0,
                success: false,
                error: error.message
            });

            throw new Error(`Gemini analysis failed: ${error.message}`);
        }
    }

    /**
     * Calculate cost for Gemini API call
     */
    calculateCost(modelName, imageCount) {
        const pricing = GEMINI_PRICING[modelName];
        if (!pricing) {
            console.warn(`Unknown Gemini model for pricing: ${modelName}`);
            return 0;
        }

        // Estimate costs (Gemini doesn't provide exact token counts)
        const estimatedInputTokens = 1500; // Base prompt + image descriptions
        const estimatedOutputTokens = 800; // Typical response length

        const textInputCost = (estimatedInputTokens / 1000) * pricing.textInputPer1K;
        const textOutputCost = (estimatedOutputTokens / 1000) * pricing.textOutputPer1K;
        const imageCost = imageCount * pricing.imageProcessing;

        const totalCost = textInputCost + textOutputCost + imageCost;

        return parseFloat(totalCost.toFixed(6));
    }

    /**
     * Get total cost spent on Gemini
     */
    getTotalCost() {
        return parseFloat(this.totalCost.toFixed(6));
    }

    /**
     * Get cost breakdown by model
     */
    getCostBreakdown() {
        const breakdown = {};
        
        this.callHistory.forEach(call => {
            if (call.success) {
                if (!breakdown[call.modelName]) {
                    breakdown[call.modelName] = {
                        calls: 0,
                        totalCost: 0,
                        totalImages: 0
                    };
                }
                breakdown[call.modelName].calls += 1;
                breakdown[call.modelName].totalCost += call.cost;
                breakdown[call.modelName].totalImages += call.imageCount || 0;
            }
        });

        // Round costs
        Object.keys(breakdown).forEach(model => {
            breakdown[model].totalCost = parseFloat(breakdown[model].totalCost.toFixed(6));
        });

        return breakdown;
    }

    /**
     * Get available Gemini models with pricing
     */
    getAvailableModels() {
        return Object.keys(GEMINI_PRICING).map(modelName => ({
            name: modelName,
            pricing: GEMINI_PRICING[modelName],
            provider: 'gemini'
        }));
    }

    /**
     * Reset cost tracking
     */
    resetCosts() {
        this.totalCost = 0;
        this.callHistory = [];
        console.log('Gemini costs reset');
    }

    /**
     * Get call history for debugging/auditing
     */
    getCallHistory() {
        return this.callHistory;
    }
}

// Export singleton instance
module.exports = new GeminiService();