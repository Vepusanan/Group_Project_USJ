import multer from 'multer';
import path from 'path';
import { uploadMessageAttachmentBuffer } from '../utils/supabaseStorage.js';

// --- Multer Configuration ---
// Use memory storage to get the file Buffer for direct Supabase upload.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    fileFilter: (req, file, cb) => {
        // [Task: Accept PDF and images only]
        const allowedMimeTypes = [
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'application/pdf'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, GIF, or PDF are allowed.'), false);
        }
    }
}).single('attachment'); // 'attachment' is the expected field name


export const handleMessageAttachment = (req, res, next) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({ success: false, error: `File upload failed: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ success: false, error: err.message });
        }
        
        if (!req.file) {
            // No file provided, continue to next middleware/handler (this is fine if the message has text)
            return res.status(400).json({ success: false, error: 'No file provided.' });
        }

        try {
            const userId = req.user.id; // From 'protect' middleware
            const fileExtension = path.extname(req.file.originalname);
            
            // Generate unique filename: user_id/timestamp-random.ext
            const fileName = `${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${fileExtension}`;
            
            // Upload buffer to Supabase
            const publicUrl = await uploadMessageAttachmentBuffer(req.file.buffer, fileName);

            // Attach the final URL to the request body so the client can use it
            // or we can process it in a subsequent route handler.
            req.attachmentUrl = publicUrl; 
            
            // The route handler will run next
            next();

        } catch (processError) {
            console.error("Supabase Upload Process Error:", processError);
            return res.status(500).json({ 
                success: false, 
                error: 'Error processing attachment upload.' 
            });
        }
    });
};