const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

/**
 * === Otakudesu
 * url: https://otakudesu.cam/anime/ede-zero-s2-sub-indo/
 *
 * - G-Drive
 * @ (https://drive.usercontent.google.com/download?id=10-2lyJUd4UmCjXCGEDzriutP1FJKYkFV&export=download)
 * [GET] https://drive.usercontent.google.com/download?id=10-2lyJUd4UmCjXCGEDzriutP1FJKYkFV&export=download&confirm=t&uuid=024c2b01-6e9c-4422-bf6d-a3d0d41509e6
 * [GET] https://drive.usercontent.google.com/download?id=1nvYe_GbUe3yyGPj24yjLhhX50NXB4p94&export=download&confirm=t&uuid=5e3075ae-1d4f-4d14-88e7-43c055f84e75 (!! Example Quota Exceeded)
 * [GET] https://drive.usercontent.google.com/uc?id=1TaMbh0pot3jFbUFyGcBvtL0GDFNSxOup&export=download (!! Example download vid)
 * for gdrive, we will use session cookie? (for handle exceed limit quota)
 * - after login, we can use (https://editthiscookie.com/) for import/export cookie
 */

const url =
  'https://drive.usercontent.google.com/download?id=1eUMrsALwTNldKJC8K2waG_OTrf69XHfo&export=download';

const downloadFromGDrive = async () => {
  try {
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);
    const urlDownload = new URL(
      'https://drive.usercontent.google.com/download',
    );

    // Get value of each item. and append into download url
    urlDownload.searchParams.append('id', $(`input[name='id']`).val());
    urlDownload.searchParams.append('uuid', $(`input[name='uuid']`).val());
    urlDownload.searchParams.append('export', $(`input[name='export']`).val());
    urlDownload.searchParams.append(
      'confirm',
      $(`input[name='confirm']`).val(),
    );

    // Download the file
    const fileResponse = await axios({
      method: 'get',
      url: urlDownload.toString(),
      responseType: 'stream',
    });

    if (!fileResponse.headers['content-disposition']) {
      throw new Error(
        'Quota Exceeded: Unable to download the file due to quota limitations.',
      );
    }

    const match = /filename="(.+)"$/.exec(
      fileResponse.headers['content-disposition'],
    );
    const destination = match && match[1];
    const fileStream = fs.createWriteStream(destination);
    fileResponse.data.pipe(fileStream);

    return new Promise((resolve, reject) => {
      fileStream.on('ready', () => console.log('Processing download...'));
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading file:', error.message);
  }
};

downloadFromGDrive()
  .then(() => {
    console.log('File downloaded successfully! (GDrive)');
    process.exit(0);
  })
  .catch((err) => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });
