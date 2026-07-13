import multer from "multer";
import path from "path";

// Memory storage keeps file buffers in RAM, avoiding server disk footprint
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg"];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only documents (.pdf, .doc, .docx, .txt) and images are allowed!"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
  },
});

// Export helper for candidate creation/updates which handles multiple file attachments
export const candidateAttachmentsUpload = upload.fields([
  { name: "resume", maxCount: 1 },
  { name: "coverLetter", maxCount: 1 },
  { name: "certificates", maxCount: 5 }
]);

export default upload;
