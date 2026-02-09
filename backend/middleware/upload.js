const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let folder = 'others';
    
    // Determine folder based on fieldname
    if (file.fieldname === 'paymentProof') {
      folder = 'payment-proofs';
    } else if (file.fieldname === 'registrationFile') {
      folder = 'registration-files';
    } else if (file.fieldname === 'teamFile') {
      folder = 'team-files';
    }
    
    const destPath = path.join(uploadDir, folder);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    cb(null, destPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, PDF, DOC, and DOCX files are allowed.'));
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Specific upload configurations
const uploadPaymentProof = upload.single('paymentProof');
const uploadRegistrationFile = upload.single('registrationFile');
const uploadMultiple = upload.array('files', 5); // Max 5 files

module.exports = {
  upload,
  uploadPaymentProof,
  uploadRegistrationFile,
  uploadMultiple,
};