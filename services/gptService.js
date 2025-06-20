const { OpenAI } = require('openai');
const fs = require('fs').promises;
const PromptService = require('./promptService');

// OpenAI model pricing enum
const OPENAI_PRICING = {
    'gpt-4o': {
        textInputPer1K: 0.005,
        textOutputPer1K: 0.015,
        imageProcessing: 0.00425
    },
    'gpt-4o-mini': {
        textInputPer1K: 0.00015,
        textOutputPer1K: 0.0006,
        imageProcessing: 0.00275
    },
    'gpt-4-turbo': {
        textInputPer1K: 0.01,
        textOutputPer1K: 0.03,
        imageProcessing: 0.00765
    },
    'gpt-4.1': {
        textInputPer1K: 0.03,
        textOutputPer1K: 0.06,
        imageProcessing: 0
    },
    'gpt-4.1-mini': {
        textInputPer1K: 0.00015,
        textOutputPer1K: 0.0006,
        imageProcessing: 0.00275
    },
    'gpt-image-1': {
        textInputPer1K: 0.00015,
        textOutputPer1K: 0.0006,
        imageProcessing: 0.00275
    }
};

class GPTService {
    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.totalCost = 0;
        this.callHistory = [];
    }

    /**
     * Analyze images using OpenAI GPT models
     */
    async analyzeImages(modelName, context) {
        try {
            if (!OPENAI_PRICING[modelName]) {
                throw new Error(`Unsupported OpenAI model: ${modelName}`);
            }

            const prompt = PromptService.getPrompt('openai', context);
            
            // Prepare images for OpenAI
            const images = [];
            
            // Add reference image
            const referenceImage = await this.encodeImageToBase64(context.referenceImagePath);
            images.push({
                type: "image_url",
                image_url: {
                    url: `data:image/jpeg;base64,${referenceImage}`,
                    detail: "high"
                }
            });

            // Add proctoring images
            for (const imagePath of context.proctoringImagePaths) {
                const imageData = await this.encodeImageToBase64(imagePath);
                images.push({
                    type: "image_url",
                    image_url: {
                        url: `data:image/jpeg;base64,${imageData}`,
                        detail: "high"
                    }
                });
            }

            const messages = [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        ...images
                    ]
                }
            ];

            const response = await this.client.chat.completions.create({
                model: modelName,
                messages: messages,
                max_tokens: 1500,
                temperature: 0.2
            });

            const analysisText = response.choices[0].message.content;

            // Calculate cost using actual token usage
            const cost = this.calculateCostFromUsage(
                modelName, 
                response.usage.prompt_tokens,
                response.usage.completion_tokens,
                images.length
            );
            
            this.totalCost += cost;
            
            // Log the call
            this.callHistory.push({
                timestamp: new Date().toISOString(),
                sessionId: context.sessionId,
                analysisId: context.analysisId,
                modelName,
                imageCount: images.length,
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
                cost,
                analysisText,
                success: true
            });

            console.log(`OpenAI analysis completed: ${modelName}, Cost: $${cost.toFixed(4)}, Tokens: ${response.usage.total_tokens}`);

            return analysisText;

        } catch (error) {
            console.error('OpenAI analysis failed:', error);
            
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

            throw new Error(`OpenAI analysis failed: ${error.message}`);
        }
    }

    /**
     * Calculate cost using actual token usage from OpenAI response
     */
    calculateCostFromUsage(modelName, promptTokens, completionTokens, imageCount) {
        const pricing = OPENAI_PRICING[modelName];
        if (!pricing) {
            console.warn(`Unknown OpenAI model for pricing: ${modelName}`);
            return 0;
        }

        const textInputCost = (promptTokens / 1000) * pricing.textInputPer1K;
        const textOutputCost = (completionTokens / 1000) * pricing.textOutputPer1K;
        const imageCost = imageCount * pricing.imageProcessing;

        const totalCost = textInputCost + textOutputCost + imageCost;

        return parseFloat(totalCost.toFixed(6));
    }

    /**
     * Calculate estimated cost for planning purposes
     */
    calculateCost(modelName, imageCount) {
        const pricing = OPENAI_PRICING[modelName];
        if (!pricing) {
            console.warn(`Unknown OpenAI model for pricing: ${modelName}`);
            return 0;
        }

        // Estimate token usage
        const estimatedInputTokens = 1800; // Base prompt + image tokens
        const estimatedOutputTokens = 800; // Typical response length

        const textInputCost = (estimatedInputTokens / 1000) * pricing.textInputPer1K;
        const textOutputCost = (estimatedOutputTokens / 1000) * pricing.textOutputPer1K;
        const imageCost = imageCount * pricing.imageProcessing;

        const totalCost = textInputCost + textOutputCost + imageCost;

        return parseFloat(totalCost.toFixed(6));
    }

    /**
     * Encode image to base64 for OpenAI API
     */
    async encodeImageToBase64(imagePath) {
        const imageBuffer = await fs.readFile(imagePath);
        return imageBuffer.toString('base64');
    }

    /**
     * Get total cost spent on OpenAI
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
                        totalTokens: 0,
                        totalImages: 0
                    };
                }
                breakdown[call.modelName].calls += 1;
                breakdown[call.modelName].totalCost += call.cost;
                breakdown[call.modelName].totalTokens += call.totalTokens || 0;
                breakdown[call.modelName].totalImages += call.imageCount || 0;
            }
        });

        // Round costs and add averages
        Object.keys(breakdown).forEach(model => {
            const data = breakdown[model];
            data.totalCost = parseFloat(data.totalCost.toFixed(6));
            data.avgCostPerCall = data.calls > 0 ? parseFloat((data.totalCost / data.calls).toFixed(6)) : 0;
            data.avgTokensPerCall = data.calls > 0 ? Math.round(data.totalTokens / data.calls) : 0;
        });

        return breakdown;
    }

    /**
     * Get available OpenAI models with pricing
     */
    getAvailableModels() {
        return Object.keys(OPENAI_PRICING).map(modelName => ({
            name: modelName,
            pricing: OPENAI_PRICING[modelName],
            provider: 'openai'
        }));
    }

    /**
     * Reset cost tracking
     */
    resetCosts() {
        this.totalCost = 0;
        this.callHistory = [];
        console.log('OpenAI costs reset');
    }

    /**
     * Get call history for debugging/auditing
     */
    getCallHistory() {
        return this.callHistory;
    }
}

// Export singleton instance
module.exports = new GPTService();