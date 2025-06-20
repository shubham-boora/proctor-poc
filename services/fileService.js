const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

class FileService {
    constructor() {
        this.uploadDir = 'uploads';
        this.referenceDir = path.join(this.uploadDir, 'reference');
        this.proctoringDir = path.join(this.uploadDir, 'proctoring');
        
        // Initialize directories
        this.initializeDirectories();
    }

    /**
     * Initialize upload directories
     */
    async initializeDirectories() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
            await fs.mkdir(this.referenceDir, { recursive: true });
            await fs.mkdir(this.proctoringDir, { recursive: true });
            console.log('Upload directories initialized');
        } catch (error) {
            console.error('Failed to initialize directories:', error);
        }
    }

    /**
     * Save reference image
     */
    async saveReferenceImage(fileBuffer, sessionId) {
        try {
            const filename = `reference-${sessionId}-${Date.now()}.jpg`;
            const filepath = path.join(this.referenceDir, filename);
            
            // Process and optimize image
            await sharp(fileBuffer.buffer)
                .resize(1024, 1024, { 
                    fit: 'inside', 
                    withoutEnlargement: true 
                })
                .jpeg({ 
                    quality: 85,
                    progressive: true 
                })
                .toFile(filepath);

            console.log(`Reference image saved: ${filename}`);
            return filepath;

        } catch (error) {
            console.error('Failed to save reference image:', error);
            throw new Error(`Failed to save reference image: ${error.message}`);
        }
    }

    /**
     * Save proctoring images
     */
    async saveProctoringImages(fileBuffers, sessionId, analysisId) {
        try {
            const imagePaths = [];
            
            for (let i = 0; i < fileBuffers.length; i++) {
                const fileBuffer = fileBuffers[i];
                const filename = `proctoring-${sessionId}-${analysisId}-${i + 1}-${Date.now()}.jpg`;
                const filepath = path.join(this.proctoringDir, filename);
                
                // Process and optimize image
                await sharp(fileBuffer.buffer)
                    .resize(1024, 1024, { 
                        fit: 'inside', 
                        withoutEnlargement: true 
                    })
                    .jpeg({ 
                        quality: 85,
                        progressive: true 
                    })
                    .toFile(filepath);
                
                imagePaths.push(filepath);
            }

            console.log(`Saved ${imagePaths.length} proctoring images for analysis ${analysisId}`);
            return imagePaths;

        } catch (error) {
            console.error('Failed to save proctoring images:', error);
            throw new Error(`Failed to save proctoring images: ${error.message}`);
        }
    }

    /**
     * Clear all files and directories
     */
    async clearAllFiles() {
        try {
            await this.clearDirectory(this.referenceDir);
            await this.clearDirectory(this.proctoringDir);
            console.log('All files cleared successfully');
        } catch (error) {
            console.error('Failed to clear files:', error);
            throw new Error(`Failed to clear files: ${error.message}`);
        }
    }

    /**
     * Clear specific directory
     */
    async clearDirectory(dirPath) {
        try {
            const files = await fs.readdir(dirPath);
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stat = await fs.stat(filePath);
                
                if (stat.isDirectory()) {
                    await this.clearDirectory(filePath);
                    await fs.rmdir(filePath);
                } else {
                    await fs.unlink(filePath);
                }
            }
            
            console.log(`Cleared directory: ${dirPath}`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Failed to clear directory ${dirPath}:`, error);
                throw error;
            }
        }
    }

    /**
     * Clear files for specific session
     */
    async clearSessionFiles(sessionId) {
        try {
            // Clear reference files
            await this.clearFilesByPattern(this.referenceDir, `reference-${sessionId}`);
            
            // Clear proctoring files
            await this.clearFilesByPattern(this.proctoringDir, `proctoring-${sessionId}`);
            
            console.log(`Cleared files for session: ${sessionId}`);
        } catch (error) {
            console.error(`Failed to clear session files for ${sessionId}:`, error);
            throw new Error(`Failed to clear session files: ${error.message}`);
        }
    }

    /**
     * Clear files matching pattern
     */
    async clearFilesByPattern(dirPath, pattern) {
        try {
            const files = await fs.readdir(dirPath);
            
            for (const file of files) {
                if (file.includes(pattern)) {
                    const filePath = path.join(dirPath, file);
                    await fs.unlink(filePath);
                    console.log(`Deleted file: ${file}`);
                }
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Failed to clear files with pattern ${pattern}:`, error);
                throw error;
            }
        }
    }

    /**
     * Get storage statistics
     */
    async getStorageStats() {
        try {
            const stats = {
                referenceImages: 0,
                proctoringImages: 0,
                totalSize: 0,
                directories: {
                    reference: { count: 0, size: 0 },
                    proctoring: { count: 0, size: 0 }
                }
            };

            // Count reference images
            try {
                const refFiles = await fs.readdir(this.referenceDir);
                stats.directories.reference.count = refFiles.length;
                stats.referenceImages = refFiles.length;

                for (const file of refFiles) {
                    const filePath = path.join(this.referenceDir, file);
                    const fileStat = await fs.stat(filePath);
                    stats.directories.reference.size += fileStat.size;
                }
            } catch (error) {
                // Directory might not exist
            }

            // Count proctoring images
            try {
                const procFiles = await fs.readdir(this.proctoringDir);
                stats.directories.proctoring.count = procFiles.length;
                stats.proctoringImages = procFiles.length;

                for (const file of procFiles) {
                    const filePath = path.join(this.proctoringDir, file);
                    const fileStat = await fs.stat(filePath);
                    stats.directories.proctoring.size += fileStat.size;
                }
            } catch (error) {
                // Directory might not exist
            }

            stats.totalSize = stats.directories.reference.size + stats.directories.proctoring.size;

            return stats;

        } catch (error) {
            console.error('Failed to get storage stats:', error);
            return {
                referenceImages: 0,
                proctoringImages: 0,
                totalSize: 0,
                error: error.message
            };
        }
    }

    /**
     * Clean up old files (older than specified hours)
     */
    async cleanupOldFiles(hoursOld = 24) {
        try {
            const cutoffTime = Date.now() - (hoursOld * 60 * 60 * 1000);
            let deletedCount = 0;

            // Clean reference directory
            deletedCount += await this.cleanupDirectoryByAge(this.referenceDir, cutoffTime);
            
            // Clean proctoring directory
            deletedCount += await this.cleanupDirectoryByAge(this.proctoringDir, cutoffTime);

            console.log(`Cleanup completed: ${deletedCount} files deleted (older than ${hoursOld} hours)`);
            return deletedCount;

        } catch (error) {
            console.error('Failed to cleanup old files:', error);
            throw new Error(`Failed to cleanup old files: ${error.message}`);
        }
    }

    /**
     * Clean up directory by file age
     */
    async cleanupDirectoryByAge(dirPath, cutoffTime) {
        try {
            const files = await fs.readdir(dirPath);
            let deletedCount = 0;

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const fileStat = await fs.stat(filePath);
                
                if (fileStat.mtimeMs < cutoffTime) {
                    await fs.unlink(filePath);
                    deletedCount++;
                    console.log(`Deleted old file: ${file}`);
                }
            }

            return deletedCount;

        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error(`Failed to cleanup directory ${dirPath}:`, error);
            }
            return 0;
        }
    }

    /**
     * Validate image file
     */
    async validateImage(fileBuffer) {
        try {
            const metadata = await sharp(fileBuffer.buffer).metadata();
            
            // Check if it's a valid image
            if (!metadata.width || !metadata.height) {
                throw new Error('Invalid image file');
            }

            // Check file size (max 10MB)
            if (fileBuffer.size > 10 * 1024 * 1024) {
                throw new Error('Image file too large (max 10MB)');
            }

            // Check dimensions (reasonable limits)
            if (metadata.width > 4096 || metadata.height > 4096) {
                throw new Error('Image dimensions too large (max 4096x4096)');
            }

            return {
                valid: true,
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: fileBuffer.size
            };

        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }
}

// Export singleton instance
module.exports = new FileService();