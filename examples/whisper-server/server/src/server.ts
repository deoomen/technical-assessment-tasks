import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import { TranscriptionOptions } from './types/whisper';
import { nodewhisper } from 'nodejs-whisper';
import { getPath } from './utils/paths';
import { createValidationError, createTranscriptionError, createFileSystemError } from './utils/errors';
import type { 
  APIResult,
  TranscriptionRequest, 
  TranscriptionResponse,
  HealthCheckResponse 
} from './types/api';

const app = express();
const port = 3001;

// Allow both development endpoints
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.111:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Directory constants
const SERVER_ROOT = path.resolve(__dirname, '..');
const MODEL_FILE = 'ggml-large-v3-turbo.bin';
const UPLOADS_DIR = path.join(SERVER_ROOT, 'uploads');
const MODEL_PATH = path.join(SERVER_ROOT, 'models', MODEL_FILE);
const BINARY_PATH = path.join(SERVER_ROOT, 'build', 'bin', 'whisper-cli');

const ensureDirectoryExists = async (dir: string) => {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    await ensureDirectoryExists(UPLOADS_DIR);
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const initializeModel = async () => {
  try {
    await fs.access(MODEL_PATH);
    console.log(`✅ Model file found at: ${MODEL_PATH}`);
    
    await fs.access(BINARY_PATH);
    console.log(`✅ Whisper binary found at: ${BINARY_PATH}`);
  } catch (error) {
    console.error('❌ Error checking model/binary:', error);
    console.error(`Please ensure:
    1. Model file exists at: ${MODEL_PATH}
    2. Whisper binary exists at: ${BINARY_PATH}`);
    process.exit(1);
  }
};

const cleanupUpload = async (filePath: string) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Warning: Failed to cleanup uploaded file:', error);
    throw createFileSystemError('delete', filePath, (error as Error).message);
  }
};

app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  // Validate request
  if (!req.file) {
    const response: APIResult<never> = {
      success: false,
      error: createValidationError('audio', 'No audio file provided')
    };
    return res.status(400).json(response);
  }

  try {
    const options: TranscriptionOptions = {
      modelName: MODEL_FILE.replace('.bin', ''),
      language: req.body.language || 'pl',
      task: req.body.task || 'transcribe',
      timestamps: true,
      word_timestamps: true,
      binary_path: BINARY_PATH
    };

    const transcript: string = await nodewhisper(req.file.path, options);
    const response: APIResult<TranscriptionResponse> = {
      success: true,
      data: {
        rawText: transcript
      }
    };

    await cleanupUpload(req.file.path);
    res.json(response);
  } catch (error) {
    console.error('❌ Transcription error:', error);
    if (req.file) {
      try {
        await cleanupUpload(req.file.path);
      } catch {
        // Ignore cleanup errors on transcription failure
      }
    }

    const response: APIResult<never> = {
      success: false,
      error: createTranscriptionError((error as Error).message, {
        audioFile: req.file?.originalname,
        modelName: MODEL_FILE
      })
    };
    res.status(500).json(response);
  }
});

app.get('/health', (req, res) => {
  const response: HealthCheckResponse = {
    status: 'ok',
    uploadDir: UPLOADS_DIR,
    modelPath: MODEL_PATH,
    binaryPath: BINARY_PATH, 
    modelName: MODEL_FILE,
    model: 'ready'
  };
  res.json(response);
});

const start = async () => {
  await ensureDirectoryExists(UPLOADS_DIR);
  await initializeModel();
  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://0.0.0.0:${port}`);
    console.log(`📁 Using uploads directory: ${UPLOADS_DIR}`);
    console.log(`🧠 Using model file: ${MODEL_PATH}`);
    console.log(`⚙️  Using whisper binary: ${BINARY_PATH}`);
  });
};

start().catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});