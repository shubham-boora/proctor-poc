// AI Proctoring System Frontend JavaScript

class ProctoringApp {
    constructor() {
        // Use relative URLs for local development
        this.serverUrl = '';
        this.currentSessionId = null;
        this.selectedFiles = [];
        this.selectedReferenceFile = null;
        
        this.init();
    }

    init() {
        console.log('AI Proctoring Frontend initialized');
        
        // Add comprehensive error handlers
        window.addEventListener('error', (e) => {
            console.error('=== Global JavaScript Error ===');
            console.error('Message:', e.message);
            console.error('Filename:', e.filename);
            console.error('Line:', e.lineno);
            console.error('Column:', e.colno);
            console.error('Error object:', e.error);
            console.error('Stack:', e.error?.stack);
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            console.error('=== Unhandled Promise Rejection ===');
            console.error('Reason:', e.reason);
            console.error('Promise:', e.promise);
        });
        
        this.setupEventListeners();
        this.checkServerStatus();
        this.loadAvailableModels();
        
        // Check status every 30 seconds
        setInterval(() => this.checkServerStatus(), 30000);
    }

    setupEventListeners() {
        // Reference upload
        const referenceUpload = document.getElementById('reference-upload');
        const referenceFile = document.getElementById('reference-file');
        const uploadReferenceBtn = document.getElementById('upload-reference-btn');

        referenceUpload.addEventListener('click', (e) => {
            console.log('Reference upload area clicked');
            if (e.target.classList.contains('upload-link') || e.target.closest('.upload-content')) {
                referenceFile.click();
            }
        });
        referenceUpload.addEventListener('dragenter', this.handleDragEnter.bind(this));
        referenceUpload.addEventListener('dragover', this.handleDragOver.bind(this));
        referenceUpload.addEventListener('dragleave', this.handleDragLeave.bind(this));
        referenceUpload.addEventListener('drop', (e) => this.handleDrop(e, 'reference'));
        referenceFile.addEventListener('change', this.handleReferenceFileSelect.bind(this));
        uploadReferenceBtn.addEventListener('click', () => {
            console.log('Upload reference button clicked');
            this.uploadReference();
        });

        // Analysis upload
        const analysisUpload = document.getElementById('analysis-upload');
        const analysisFiles = document.getElementById('analysis-files');
        const analyzeBtn = document.getElementById('analyze-btn');

        analysisUpload.addEventListener('click', (e) => {
            console.log('Analysis upload area clicked');
            if (e.target.classList.contains('upload-link') || e.target.closest('.upload-content')) {
                analysisFiles.click();
            }
        });
        analysisUpload.addEventListener('dragenter', this.handleDragEnter.bind(this));
        analysisUpload.addEventListener('dragover', this.handleDragOver.bind(this));
        analysisUpload.addEventListener('dragleave', this.handleDragLeave.bind(this));
        analysisUpload.addEventListener('drop', (e) => this.handleDrop(e, 'analysis'));
        analysisFiles.addEventListener('change', this.handleAnalysisFilesSelect.bind(this));
        analyzeBtn.addEventListener('click', () => {
            console.log('Analyze button clicked');
            this.analyzeImages();
        });

        // AI Provider change
        document.getElementById('ai-provider').addEventListener('change', this.updateModelOptions.bind(this));

        // Action buttons
        const clearBtn = document.getElementById('clear-data-btn');
        const refreshBtn = document.getElementById('refresh-status-btn');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                console.log('Clear data button clicked');
                try {
                    this.clearAllData();
                } catch (error) {
                    console.error('Error in clearAllData:', error);
                    alert('Error clearing data: ' + error.message);
                }
            });
        } else {
            console.error('Clear data button not found');
        }
        
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('Refresh status button clicked');
                try {
                    this.checkServerStatus();
                } catch (error) {
                    console.error('Error in checkServerStatus:', error);
                }
            });
        } else {
            console.error('Refresh status button not found');
        }
    }

    // Drag and Drop Handlers
    handleDragEnter(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        // Only remove dragover if we're leaving the main container
        if (!e.currentTarget.contains(e.relatedTarget)) {
            e.currentTarget.classList.remove('dragover');
        }
    }

    handleDrop(e, type) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showToast('Please drop image files only (JPEG, PNG, WebP)', 'warning');
            return;
        }
        
        if (type === 'reference') {
            if (imageFiles.length > 0) {
                this.handleReferenceFile(imageFiles[0]);
            }
        } else if (type === 'analysis') {
            this.handleAnalysisFiles(imageFiles);
        }
    }

    // Reference File Handling
    handleReferenceFileSelect(e) {
        console.log('Reference file selected:', e.target.files);
        const file = e.target.files[0];
        if (file) {
            console.log('Processing reference file:', file.name, file.size, file.type);
            this.handleReferenceFile(file);
        }
    }

    handleReferenceFile(file) {
        console.log('Validating reference file:', file.name);
        if (!this.validateImageFile(file)) {
            console.log('File validation failed');
            return;
        }

        console.log('File validation passed, updating UI');
        // Store the file reference
        this.selectedReferenceFile = file;

        const uploadArea = document.getElementById('reference-upload');
        uploadArea.innerHTML = `
            <div class="upload-content">
                <i class="fas fa-check-circle" style="color: var(--success-color);"></i>
                <p><strong>${file.name}</strong></p>
                <p class="upload-info">Size: ${this.formatFileSize(file.size)}</p>
                <p class="upload-info" style="margin-top: 0.5rem;">
                    <i class="fas fa-times" style="cursor: pointer; color: var(--danger-color);" onclick="app.clearReferenceFile()"></i>
                    Click to remove
                </p>
            </div>
        `;

        document.getElementById('upload-reference-btn').disabled = false;
        console.log('Reference file ready for upload');
    }

    clearReferenceFile() {
        this.selectedReferenceFile = null;
        document.getElementById('reference-file').value = '';
        document.getElementById('upload-reference-btn').disabled = true;
        
        // Reset upload area
        document.getElementById('reference-upload').innerHTML = `
            <div class="upload-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drop reference image here or <span class="upload-link">browse</span></p>
                <p class="upload-info">Supports JPEG, PNG, WebP (max 10MB)</p>
            </div>
        `;
    }

    // Analysis Files Handling
    handleAnalysisFilesSelect(e) {
        console.log('Analysis files selected:', e.target.files);
        const files = Array.from(e.target.files);
        this.handleAnalysisFiles(files);
    }

    handleAnalysisFiles(files) {
        console.log('Processing analysis files:', files.length);
        const validFiles = files.filter(file => {
            const isValid = this.validateImageFile(file);
            console.log(`File ${file.name} validation:`, isValid);
            return isValid;
        });
        
        if (validFiles.length > 5) {
            this.showToast('Maximum 5 images allowed', 'warning');
            validFiles.splice(5);
        }

        console.log('Valid files for analysis:', validFiles.length);
        this.selectedFiles = validFiles;
        this.displaySelectedFiles();
        
        document.getElementById('analyze-btn').disabled = validFiles.length === 0 || !this.currentSessionId;
    }

    displaySelectedFiles() {
        const container = document.getElementById('selected-files');
        const fileList = document.getElementById('file-list');

        if (this.selectedFiles.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        fileList.innerHTML = this.selectedFiles.map((file, index) => `
            <div class="file-item">
                <div class="file-info">
                    <i class="fas fa-image"></i>
                    <div class="file-details">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${this.formatFileSize(file.size)}</span>
                    </div>
                </div>
                <button class="remove-file" onclick="app.removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.displaySelectedFiles();
        
        document.getElementById('analyze-btn').disabled = this.selectedFiles.length === 0 || !this.currentSessionId;
    }

    // API Calls
    async uploadReference() {
        const description = document.getElementById('exam-description').value;
        const examType = document.getElementById('exam-type').value;

        if (!this.selectedReferenceFile) {
            this.showToast('Please select a reference image', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const formData = new FormData();
            formData.append('reference', this.selectedReferenceFile);
            formData.append('description', description);
            formData.append('examType', examType);

            console.log('Uploading reference image:', this.selectedReferenceFile.name);

            const response = await fetch(`${this.serverUrl}/api/reference/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            if (result.success) {
                this.currentSessionId = result.sessionId;
                this.showReferenceResult(result, description, examType);
                this.showAnalysisSection();
                this.showToast('Reference image uploaded successfully!', 'success');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            this.showToast(`Upload failed: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async analyzeImages() {
        if (!this.currentSessionId || this.selectedFiles.length === 0) {
            this.showToast('Please upload reference image and select analysis images', 'error');
            return;
        }

        const studentId = document.getElementById('student-id').value;
        const provider = document.getElementById('ai-provider').value;
        const modelName = document.getElementById('model-name').value;

        this.showAnalysisProgress(true);

        try {
            const formData = new FormData();
            
            this.selectedFiles.forEach(file => {
                formData.append('images', file);
            });
            
            formData.append('studentId', studentId || 'unknown');
            formData.append('provider', provider);
            formData.append('modelName', modelName);

            const response = await fetch(`${this.serverUrl}/api/analysis/${this.currentSessionId}`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showAnalysisResult(result);
                this.showHistorySection();
                this.loadSessionHistory();
                this.showToast('Analysis completed successfully!', 'success');
            } else {
                throw new Error(result.error || 'Analysis failed');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            this.showToast(`Analysis failed: ${error.message}`, 'error');
        } finally {
            this.showAnalysisProgress(false);
        }
    }

    async checkServerStatus() {
        try {
            console.log('Checking server status...');
            const response = await fetch(`${this.serverUrl}/health`);
            const data = await response.json();

            if (data.status === 'healthy') {
                console.log('Server is healthy, cost:', data.totalCost);
                document.getElementById('server-status').textContent = 'Online';
                document.getElementById('server-status').className = 'status-value online';
                document.getElementById('total-cost').textContent = `$${data.totalCost.toFixed(4)}`;
            } else {
                throw new Error('Server not healthy');
            }
        } catch (error) {
            console.error('Server status check failed:', error);
            document.getElementById('server-status').textContent = 'Offline';
            document.getElementById('server-status').className = 'status-value offline';
        }
    }

    async loadSessionHistory() {
        if (!this.currentSessionId) return;

        try {
            const response = await fetch(`${this.serverUrl}/api/session/${this.currentSessionId}`);
            const result = await response.json();

            if (result.success) {
                this.displaySessionHistory(result.session);
            }
        } catch (error) {
            console.error('Failed to load session history:', error);
        }
    }

    async clearAllData() {
        console.log('=== Clear All Data Started ===');
        
        try {
            if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                console.log('Clear data cancelled by user');
                return;
            }

            console.log('User confirmed, proceeding with clear...');
            
            // Show loading
            try {
                this.showLoading(true);
            } catch (loadingError) {
                console.warn('Loading overlay error:', loadingError);
            }

            // Make API call
            console.log('Making API call to clear data...');
            const response = await fetch(`${this.serverUrl}/api/clear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('API response received, status:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('API response data:', result);

            if (result && result.success) {
                console.log('Clear successful, resetting interface...');
                
                // Reset interface
                try {
                    this.resetInterface();
                    console.log('Interface reset completed');
                } catch (resetError) {
                    console.error('Error resetting interface:', resetError);
                }
                
                // Show success message
                try {
                    this.showToast('All data cleared successfully!', 'success');
                } catch (toastError) {
                    console.warn('Toast error:', toastError);
                    alert('All data cleared successfully!');
                }
                
                // Refresh status
                try {
                    this.checkServerStatus();
                } catch (statusError) {
                    console.warn('Status check error:', statusError);
                }
                
            } else {
                throw new Error(result?.error || 'Clear operation failed');
            }
            
        } catch (error) {
            console.error('=== Clear All Data Error ===');
            console.error('Error details:', error);
            console.error('Error stack:', error.stack);
            
            // Show error message
            try {
                this.showToast(`Clear failed: ${error.message}`, 'error');
            } catch (toastError) {
                console.warn('Toast error in catch:', toastError);
                alert(`Clear failed: ${error.message}`);
            }
            
        } finally {
            console.log('=== Clear All Data Cleanup ===');
            
            // Hide loading
            try {
                this.showLoading(false);
            } catch (loadingError) {
                console.warn('Loading overlay cleanup error:', loadingError);
            }
            
            console.log('=== Clear All Data Completed ===');
        }
    }

    // UI Update Methods
    async loadAvailableModels() {
        try {
            console.log('Loading available models from server...');
            const response = await fetch(`${this.serverUrl}/api/models`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Models loaded:', data);
            
            if (data.success && data.models) {
                this.availableModels = data.models;
                this.updateModelOptions();
            } else {
                throw new Error('Invalid models data received');
            }
        } catch (error) {
            console.error('Failed to load models from server, using fallback:', error);
            // Fallback to hardcoded models if server is unavailable
            this.availableModels = {
                openai: [
                    { name: 'gpt-4o-mini', provider: 'openai' },
                    { name: 'gpt-4o', provider: 'openai' },
                    { name: 'gpt-4-turbo', provider: 'openai' },
                    { name: 'gpt-4.1', provider: 'openai' },
                    { name: 'gpt-4.1-mini', provider: 'openai' },
                    { name: 'gpt-image-1', provider: 'openai' }
                ],
                gemini: [
                    { name: 'gemini-1.5-flash', provider: 'gemini' },
                    { name: 'gemini-1.5-pro', provider: 'gemini' },
                    { name: 'gemini-2.0-flash-001', provider: 'gemini' },
                    { name: 'gemini-2.0-flash-lite-001', provider: 'gemini' },
                    { name: 'gemini-2.5-pro', provider: 'gemini' },
                    { name: 'gemini-2.5-flash', provider: 'gemini' },
                    { name: 'gemini-2.5-flash-lite-preview', provider: 'gemini' }
                ]
            };
            this.updateModelOptions();
        }
    }

    updateModelOptions() {
        const provider = document.getElementById('ai-provider').value;
        const modelSelect = document.getElementById('model-name');

        // Use loaded models if available, otherwise fallback to hardcoded
        let models;
        if (this.availableModels && this.availableModels[provider]) {
            // Convert server format to display format
            models = this.availableModels[provider].map(model => ({
                value: model.name,
                text: this.getModelDisplayName(model.name)
            }));
        } else {
            // Fallback hardcoded models
            const fallbackModels = {
                openai: [
                    { value: 'gpt-4o-mini', text: 'GPT-4o Mini (Fast & Affordable)' },
                    { value: 'gpt-4o', text: 'GPT-4o (Most Capable)' },
                    { value: 'gpt-4-turbo', text: 'GPT-4 Turbo (Enhanced Performance)' },
                    { value: 'gpt-4.1', text: 'GPT-4.1 (Latest Generation)' },
                    { value: 'gpt-4.1-mini', text: 'GPT-4.1 Mini (Efficient & Fast)' },
                    { value: 'gpt-image-1', text: 'GPT Image-1 (Specialized Vision)' }
                ],
                gemini: [
                    { value: 'gemini-1.5-flash', text: 'Gemini 1.5 Flash (Fast & Efficient)' },
                    { value: 'gemini-1.5-pro', text: 'Gemini 1.5 Pro (High Performance)' },
                    { value: 'gemini-2.0-flash-001', text: 'Gemini 2.0 Flash (Latest Fast Model)' },
                    { value: 'gemini-2.0-flash-lite-001', text: 'Gemini 2.0 Flash Lite (Ultra Efficient)' },
                    { value: 'gemini-2.5-pro', text: 'Gemini 2.5 Pro (Most Advanced)' },
                    { value: 'gemini-2.5-flash', text: 'Gemini 2.5 Flash (Advanced & Fast)' },
                    { value: 'gemini-2.5-flash-lite-preview', text: 'Gemini 2.5 Flash Lite (Preview)' }
                ]
            };
            models = fallbackModels[provider] || [];
        }

        modelSelect.innerHTML = models.map(model => 
            `<option value="${model.value}">${model.text}</option>`
        ).join('');
    }

    getModelDisplayName(modelName) {
        // Generate user-friendly display names for models
        const displayNames = {
            // OpenAI models
            'gpt-4o-mini': 'GPT-4o Mini (Fast & Affordable)',
            'gpt-4o': 'GPT-4o (Most Capable)',
            'gpt-4-turbo': 'GPT-4 Turbo (Enhanced Performance)',
            'gpt-4.1': 'GPT-4.1 (Latest Generation)',
            'gpt-4.1-mini': 'GPT-4.1 Mini (Efficient & Fast)',
            'gpt-image-1': 'GPT Image-1 (Specialized Vision)',
            
            // Gemini models
            'gemini-1.5-flash': 'Gemini 1.5 Flash (Fast & Efficient)',
            'gemini-1.5-pro': 'Gemini 1.5 Pro (High Performance)',
            'gemini-2.0-flash-001': 'Gemini 2.0 Flash (Latest Fast Model)',
            'gemini-2.0-flash-lite-001': 'Gemini 2.0 Flash Lite (Ultra Efficient)',
            'gemini-2.5-pro': 'Gemini 2.5 Pro (Most Advanced)',
            'gemini-2.5-flash': 'Gemini 2.5 Flash (Advanced & Fast)',
            'gemini-2.5-flash-lite-preview': 'Gemini 2.5 Flash Lite (Preview)'
        };
        
        return displayNames[modelName] || modelName;
    }

    showReferenceResult(result, description, examType) {
        const resultSection = document.getElementById('reference-result');
        document.getElementById('session-id').textContent = result.sessionId;
        document.getElementById('uploaded-description').textContent = description;
        document.getElementById('uploaded-exam-type').textContent = examType;
        resultSection.style.display = 'block';
    }

    showAnalysisSection() {
        document.getElementById('analysis-section').style.display = 'block';
        document.getElementById('analysis-section').scrollIntoView({ behavior: 'smooth' });
    }

    showAnalysisProgress(show) {
        document.getElementById('analysis-progress').style.display = show ? 'block' : 'none';
        document.getElementById('analysis-result').style.display = show ? 'none' : 'block';
    }

    showAnalysisResult(result) {
        document.getElementById('analysis-id').textContent = result.analysisId;
        document.getElementById('processing-time').textContent = `${result.processingTime}ms`;
        document.getElementById('analysis-cost').textContent = `$${result.cost.toFixed(6)}`;
        document.getElementById('image-count').textContent = result.imageCount;
        document.getElementById('analysis-text').textContent = result.analysis;
        
        document.getElementById('analysis-result').style.display = 'block';
        document.getElementById('analysis-progress').style.display = 'none';
    }

    showHistorySection() {
        document.getElementById('history-section').style.display = 'block';
    }

    displaySessionHistory(session) {
        const container = document.getElementById('session-details');
        
        container.innerHTML = `
            <div class="session-card">
                <h4>Session Information</h4>
                <div class="session-info">
                    <p><strong>Session ID:</strong> <span>${session.sessionId}</span></p>
                    <p><strong>Created:</strong> <span>${new Date(session.createdAt).toLocaleString()}</span></p>
                    <p><strong>Exam Type:</strong> <span>${session.examType}</span></p>
                    <p><strong>Description:</strong> <span>${session.description}</span></p>
                    <p><strong>Total Analyses:</strong> <span>${session.analysisCount}</span></p>
                    <p><strong>Total Cost:</strong> <span>$${session.totalCost.toFixed(6)}</span></p>
                </div>
            </div>
            ${session.analyses.map(analysis => `
                <div class="session-card">
                    <h4>Analysis: ${analysis.analysisId}</h4>
                    <div class="analysis-summary">
                        <div class="summary-item">
                            <label>Timestamp:</label>
                            <span>${new Date(analysis.timestamp).toLocaleString()}</span>
                        </div>
                        <div class="summary-item">
                            <label>Provider:</label>
                            <span>${analysis.provider}</span>
                        </div>
                        <div class="summary-item">
                            <label>Model:</label>
                            <span>${analysis.modelName}</span>
                        </div>
                        <div class="summary-item">
                            <label>Cost:</label>
                            <span>$${analysis.cost.toFixed(6)}</span>
                        </div>
                        <div class="summary-item">
                            <label>Processing Time:</label>
                            <span>${analysis.processingTime}ms</span>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
    }

    resetInterface() {
        console.log('Resetting interface...');
        this.currentSessionId = null;
        this.selectedFiles = [];
        this.selectedReferenceFile = null;
        
        // Reset forms
        document.getElementById('reference-file').value = '';
        document.getElementById('analysis-files').value = '';
        document.getElementById('student-id').value = '';
        
        // Reset displays
        document.getElementById('reference-result').style.display = 'none';
        document.getElementById('analysis-section').style.display = 'none';
        document.getElementById('history-section').style.display = 'none';
        document.getElementById('selected-files').style.display = 'none';
        
        // Reset upload area
        document.getElementById('reference-upload').innerHTML = `
            <div class="upload-content">
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Drop reference image here or <span class="upload-link">browse</span></p>
                <p class="upload-info">Supports JPEG, PNG, WebP (max 10MB)</p>
            </div>
        `;
        
        // Reset buttons
        document.getElementById('upload-reference-btn').disabled = true;
        document.getElementById('analyze-btn').disabled = true;
        
        console.log('Interface reset complete');
    }

    showLoading(show) {
        console.log('Setting loading overlay:', show);
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        } else {
            console.error('Loading overlay element not found');
        }
    }

    // Utility Methods
    validateImageFile(file) {
        console.log('Validating file:', file.name, 'Type:', file.type, 'Size:', file.size);
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!validTypes.includes(file.type)) {
            console.log('Invalid file type:', file.type);
            this.showToast('Invalid file type. Only JPEG, PNG, and WebP are allowed.', 'error');
            return false;
        }

        if (file.size > maxSize) {
            console.log('File too large:', file.size);
            this.showToast('File too large. Maximum size is 10MB.', 'error');
            return false;
        }

        console.log('File validation passed');
        return true;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showToast(message, type = 'info') {
        console.log('Showing toast:', message, 'Type:', type);
        
        try {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            const icon = {
                success: 'fas fa-check-circle',
                error: 'fas fa-exclamation-circle',
                warning: 'fas fa-exclamation-triangle',
                info: 'fas fa-info-circle'
            }[type];

            toast.innerHTML = `
                <i class="${icon}"></i>
                <span>${message}</span>
            `;

            const container = document.getElementById('toast-container');
            if (container) {
                container.appendChild(toast);
                
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.remove();
                    }
                }, 5000);
            } else {
                console.error('Toast container not found');
                // Fallback to alert if toast container is missing
                alert(message);
            }
        } catch (error) {
            console.error('Error showing toast:', error);
            alert(message); // Fallback to alert
        }
    }
}

// Initialize the application
const app = new ProctoringApp();
