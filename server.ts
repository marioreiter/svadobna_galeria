import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { google } from 'googleapis';
import exifr from 'exifr';
import { Stream } from 'stream';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Get photos list
  app.get('/api/photos', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization' });
    }

    const folderId = req.query.folderId as string;
    if (!folderId) {
      return res.status(400).json({ error: 'Missing folderId' });
    }

    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: authHeader.replace('Bearer ', '') });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      console.log(`Listing photos for folder: ${folderId}`);
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false and mimeType contains 'image/'`,
        fields: 'files(id, name, webContentLink, thumbnailLink, description, createdTime, properties)',
        orderBy: 'createdTime desc',
        pageSize: 1000,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      const filesCount = response.data.files?.length || 0;
      console.log(`Drive returned ${filesCount} files.`);

      res.json({ files: response.data.files });
    } catch (error: any) {
      console.error('Error listing photos:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Upload photo
  app.post('/api/upload', upload.single('photo'), async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { nickname, folderId, uid } = req.body;
    if (!nickname || !folderId || !uid) {
      return res.status(400).json({ error: 'Missing nickname, folderId or uid' });
    }

    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: authHeader.replace('Bearer ', '') });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      // Extract metadata (date taken)
      let dateTaken: string | null = null;
      try {
        const metadata = await exifr.parse(req.file.buffer);
        if (metadata && metadata.DateTimeOriginal) {
          dateTaken = metadata.DateTimeOriginal.toISOString();
        }
      } catch (e) {
        console.warn('Could not parse EXIF:', e);
      }

      // Prepare file metadata for Drive
      // We store the nickname and original date in the file description/properties
      const fileMetadata = {
        name: `${nickname}_${Date.now()}_${req.file.originalname}`,
        parents: [folderId],
        description: JSON.stringify({
          nickname,
          dateTaken: dateTaken || new Date().toISOString(),
          originalName: req.file.originalname,
          uid
        }),
        properties: {
          nickname,
          dateTaken: dateTaken || new Date().toISOString(),
          uid,
        }
      };

      const media = {
        mimeType: req.file.mimetype,
        body: Stream.Readable.from(req.file.buffer),
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, webContentLink, thumbnailLink, description, createdTime',
      });

      console.log(`File created in Drive: ${response.data.id}`);

      // Make the uploaded photo publicly readable so guests can see it
      try {
        await drive.permissions.create({
          fileId: response.data.id!,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });
        console.log(`Public permissions set for file: ${response.data.id}`);
      } catch (e) {
        console.warn('Could not set public permissions on photo:', e);
      }

      // Re-fetch to ensure we get a fresh thumbnail/web content link if they were generated after permission change
      let fileData = response.data;
      if (!fileData.thumbnailLink) {
        try {
           const fresh = await drive.files.get({
             fileId: fileData.id!,
             fields: 'id, name, webContentLink, thumbnailLink, description, createdTime',
           });
           fileData = fresh.data;
        } catch (e) {
           console.warn('Could not re-fetch file data:', e);
        }
      }

      res.json({ success: true, file: fileData });
    } catch (error: any) {
      console.error('Error uploading to Drive:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Get or Create Wedding Folder
  app.post('/api/ensure-folder', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing auth' });

    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: authHeader.replace('Bearer ', '') });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const folderName = 'MB2026';
      
      // Search for existing folder
      const search = await drive.files.list({
        q: `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      if (search.data.files && search.data.files.length > 0) {
        return res.json({ folderId: search.data.files[0].id });
      }

      // Create new folder
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      };
      const folder = await drive.files.create({
        requestBody: folderMetadata,
        fields: 'id',
      });

      // Make folder public
      try {
        await drive.permissions.create({
          fileId: folder.data.id!,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          }
        });
      } catch (e) {
        console.warn('Could not make folder public:', e);
      }

      res.json({ folderId: folder.data.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Route: Delete photo
  app.delete('/api/photos/:fileId', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization' });
    }

    const { fileId } = req.params;
    if (!fileId) {
      return res.status(400).json({ error: 'Missing fileId' });
    }

    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: authHeader.replace('Bearer ', '') });
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      console.log(`Deleting file: ${fileId}`);
      await drive.files.delete({
        fileId: fileId,
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
