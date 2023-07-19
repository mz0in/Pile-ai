import { ipcMain, app, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import pileHelper from './utils/PileHelper';
import pileIndex from './utils/PileIndex';
import pileTags from './utils/PileTags';

const matter = require('gray-matter');

// Index operations
ipcMain.handle('index-load', (event, pilePath) => {
  const index = pileIndex.load(pilePath);
  return index;
});

ipcMain.handle('index-get', (event) => {
  const index = pileIndex.get();
  return index;
});

ipcMain.handle('index-add', (event, filePath) => {
  const index = pileIndex.add(filePath);
  return index;
});

ipcMain.handle('index-remove', (event, filePath) => {
  const index = pileIndex.remove(filePath);
  return index;
});

// Tag operations
ipcMain.handle('tags-load', (event, pilePath) => {
  const tags = pileTags.load(pilePath);
  return tags;
});

ipcMain.handle('tags-get', (event) => {
  const tags = pileTags.get();
  return tags;
});

ipcMain.handle('tags-sync', (event, filePath) => {
  pileTags.sync(filePath);
});

ipcMain.handle('tags-add', (event, { tag, filePath }) => {
  pileTags.add(tag, filePath);
});

ipcMain.handle('tags-remove', (event, { tag, filePath }) => {
  pileTags.remove(tag, filePath);
});

// File operations
ipcMain.on('update-file', (event, { path, content }) => {
  pileHelper.updateFile(path, content);
});

ipcMain.on('change-folder', (event, newPath) => {
  pileHelper.changeWatchFolder(newPath);
});

ipcMain.handle('matter-parse', async (event, file) => {
  const post = matter(file);
  return post;
});

ipcMain.handle('matter-stringify', async (event, { content, data }) => {
  const stringifiedContent = matter.stringify(content, data);
  return stringifiedContent;
});

ipcMain.handle('get-files', async (event, dirPath) => {
  const files = await pileHelper.getFilesInFolder(dirPath);
  return files;
});

ipcMain.handle('get-file', async (event, filePath) => {
  const content = await pileHelper.getFile(filePath);
  return content;
});

ipcMain.on('get-config-file-path', (event) => {
  const userHomeDirectoryPath = app.getPath('home');
  const pilesConfig = path.join(userHomeDirectoryPath, 'Piles', 'piles.json');
  event.returnValue = pilesConfig;
});

ipcMain.on('open-file-dialog', async (event) => {
  const directory = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (!directory.canceled) {
    event.sender.send('selected-directory', directory.filePaths[0]);
  }
});

ipcMain.handle('open-file', async (event, data) => {
  let attachments: string[] = [];
  const storePath = data.storePath;
  const selected = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'svg'] },
      { name: 'Movies', extensions: ['mp4', 'mov'] },
    ],
  });

  const selectedFiles = selected.filePaths || [];

  if (selected.canceled) {
    return attachments;
  }

  for (const filePath of selectedFiles) {
    const currentDate = new Date();
    const year = String(currentDate.getFullYear()).slice(-2);
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const hours = String(currentDate.getHours()).padStart(2, '0');
    const minutes = String(currentDate.getMinutes()).padStart(2, '0');
    const seconds = String(currentDate.getSeconds()).padStart(2, '0');
    const selectedFileName = filePath.split('/').pop();

    if (!selectedFileName) return;

    const extension = selectedFileName.split('.').pop();
    const fileName = `${year}${month}${day}-${hours}${minutes}${seconds}.${extension}`;
    const fullStorePath = path.join(
      storePath,
      String(currentDate.getFullYear()),
      currentDate.toLocaleString('default', { month: 'short' }),
      'media'
    );
    const newFilePath = path.join(fullStorePath, fileName);

    try {
      await fs.promises.mkdir(fullStorePath, { recursive: true });
      await fs.promises.copyFile(filePath, newFilePath);
      attachments.push(newFilePath);
    } catch (err) {
      console.error(err);
    }
  }

  return attachments;
});

const iconName = path.join(__dirname, '../../assets/icon.png');

ipcMain.on('ondragstart', (event, filePath) => {
  event.sender.startDrag({
    file: filePath,
    icon: filePath,
  });
});