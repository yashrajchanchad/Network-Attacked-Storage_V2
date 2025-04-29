const express = require('express');
const multer = require('multer');
const morgan = require('morgan');
const createError = require('http-errors');
const checkDiskSpace = require('check-disk-space').default;
const os = require('os');
const fs = require('fs');
const path = require('path');
const { readdir, stat } = require('fs/promises');
const { join } = require('path');
const formidable = require('formidable');
const app = express();
const PORT = 3000;
// const storageDir = 'D:\MIT ONLINE DATA\SEM 3\Mini Project';

const storageDir = '/Users/pranav/storage';

// Serve static files from the public directory
app.use(express.static('public'));
app.use(morgan("combined"));

// Middleware to parse JSON bodies
app.use(express.json());

require('./utils/db');

// Function to get the storage details
function getStorageDetails() {
  const totalSpace = storageDir.size(); // Example, this should be your total storage capacity
  const usedSpace = totalSpace - os.freemem(); // Example, this should be the used storage space
  return { totalSpace, usedSpace, details };
}

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(storageDir, path.dirname(file.originalname || file.webkitRelativePath));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, path.basename(file.originalname || file.webkitRelativePath));
  }
});

const upload = multer({ storage: storage });

// Ensure storage directory exists
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir);
}

// User routes
const userRoutes = require('./routes/user.routes');
app.use('/access', userRoutes);

// Admiin routes
const adminRoutes = require('./routes/admin.routes');
app.use('/admin', adminRoutes);

// Storage Capacity and Usage Endpoint
// app.get('/storage-details', async (req, res) => {
//   checkDiskSpace('/Volumes').then((diskSpace) => {
//     res.json(diskSpace);
//   });
// });

// File Upload
app.post('/upload', (req, res) => {
  const form = new formidable.IncomingForm({ multiples: true });
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).send('Error parsing form data');
    }

    const currentPath = fields.path.join() || '/';
    if (typeof currentPath !== 'string') {
      return res.status(400).send('Invalid path');
    }

    const uploadDir = path.join(storageDir, currentPath);

    const fileArray = Array.isArray(files.files) ? files.files : [files.files];

    fileArray.forEach(file => {
      const uploadPath = path.join(uploadDir, file.originalFilename);
      const dir = path.dirname(uploadPath);

      fs.mkdirSync(dir, { recursive: true });

      fs.rename(file.filepath, uploadPath, (err) => {
        if (err) {
          console.log(err);
          return res.status(500).send('Error uploading file');
        }
      });
    });

    res.send('Files uploaded successfully');
  });
});

// Create Folder
app.post('/create-folder', (req, res) => {
  const folderPath = path.join(storageDir, req.body.path || '', req.body.folderName);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
    res.send('Folder created successfully');
  } else {
    res.status(400).send('Folder already exists');
  }
});

// Read/Get File
app.get('/files/:filename', (req, res) => {
  const filePath = path.join(storageDir, req.params.filename);
  res.sendFile(filePath);
});

// Download File or Folder
app.get('/files/download/:filename', (req, res) => {
  const filePath = path.join(storageDir, req.params.filename);

  if (fs.lstatSync(filePath).isDirectory()) {
    const archiveName = `${req.params.filename}.zip`;
    const archivePath = path.join(storageDir, archiveName);

    const output = fs.createWriteStream(archivePath);
    const archive = require('archiver')('zip');

    output.on('close', () => {
      res.download(archivePath, archiveName, (err) => {
        if (err) {
          console.error('Error during file download:', err);
          res.status(500).send('Error during file download');
        }
        fs.unlinkSync(archivePath); // Delete the zip after download
      });
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);
    archive.directory(filePath, false);
    archive.finalize();
  } else {
    res.download(filePath, err => {
      if (err) {
        console.error('Error during file download: ', err);
        res.status(500).send('Error during file download');
      }
    });
  }
});

// Get size of the directory recursively
const dirSize = async dir => {
  const files = await readdir(dir, { withFileTypes: true });
  const paths = files.map(async file => {
    const path = join(dir, file.name);
    if (file.isDirectory()) return await dirSize(path);
    if (file.isFile()) {
      const { size } = await stat(path);
      return size;
    }
    return 0;
  });
  return (await Promise.all(paths)).flat(Infinity).reduce((i, size) => i + size, 0);
}

// Get Details of File or Folder
app.get('/files/details/:path', (req, res) => {
  const itemPath = path.join(storageDir, req.params.path);

  fs.stat(itemPath, async (err, stats) => {
    if (err) {
      return res.status(500).send('Error fetching details');
    }
    const details = {
      name: path.basename(itemPath),
      path: req.params.path,
      size: stats.isDirectory() ? await dirSize(itemPath) : stats.size,
      type: stats.isDirectory() ? 'directory' : 'file',
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime
    };
    res.json(details);
  });
});

// List Files
app.get('/files', (req, res) => {
  const currentPath = req.query.path || '';

  const listFiles = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.resolve(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results.push({ name: file, type: 'directory', path: path.join(currentPath, file) });
      } else {
        results.push({ name: file, type: 'file', path: path.join(currentPath, file) });
      }
    });
    return results;
  };

  const fullPath = path.join(storageDir, currentPath);
  if (fs.existsSync(fullPath)) {
    res.json(listFiles(fullPath));
  } else {
    res.status(404).send('Path not found');
  }
});

// Update/Rename File
app.put('/files/:path', (req, res) => {
  const oldPath = path.join(storageDir, req.params.path);
  const newPath = path.join(storageDir, path.dirname(req.params.path), req.body.newFilename);

  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      return res.status(500).send('Error renaming file');
    }

    res.send('File renamed successfully');
  });
});

// Delete File
app.delete('/files/:path', (req, res) => {
  const filePath = path.join(storageDir, req.params.path);

  fs.rm(filePath, { recursive: true, force: true }, (err) => {
    if (err) {
      return res.status(500).send('Error deleting file');
    }

    res.send('File deleted successfully');
  });
});

// Default Error Thorw
app.use(async (req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status = err.status || 500;
  res.json({
    error: {
      status: err.status || 500,
      message: err.message
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});