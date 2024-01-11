const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

/**
 * List provider can be crawl:
 * - default video/ondesu (jwplayer)
 * - odstream (jwplayer)
 * - pdrain (use api) (https://pixeldrain.com/api/file/orCdN41p)
 *
 * tested using mpv on linux
 *
 * this code is example of download from provider jwplayer
 * baseUrl: https://otakudesu.cam/episode/slf-episode-14-sub-indo/
 *
 * maybe for donwload batch file. we can use:
 * - pdrain
 * (https://desudrive.com/link/?id=eXRoOHNYVG9UdnVZK3l6V3czeHJDN0tDTHJhUmdKNnBqaXh4SklubzN3TXM=)
 *
 * - G-Drive
 * (https://drive.usercontent.google.com/download?id=10-2lyJUd4UmCjXCGEDzriutP1FJKYkFV&export=download)
 * [GET] https://drive.usercontent.google.com/download?id=10-2lyJUd4UmCjXCGEDzriutP1FJKYkFV&export=download&confirm=t&uuid=024c2b01-6e9c-4422-bf6d-a3d0d41509e6
 *
 * for gdrive, we will use session cookie? (for handle exceed limit quota)
 */

const url =
  'https://desustream.me/beta/stream/?id=NlQyUm5INnhpSmFDemR2YWg0K3htUT09';

const downloadFile = async () => {
  try {
    const response = await axios.get(url);
    const html = response.data;

    // Load HTML content into Cheerio
    const $ = cheerio.load(html);

    // Find the element containing the video source
    const videoSource = $('script[type="text/javascript"]').first().html();
    console.log(videoSource);

    // Extract the video file URL using a regular expression
    const match = /'file':'([^']+)'/gm.exec(videoSource);
    console.log(match, 'lkqmwekqmlkwemklqwe');
    const videoFileUrl = match && match[1];

    if (!videoFileUrl) {
      throw new Error('Video file URL not found in the HTML content.');
    }

    // Download the video file
    const videoResponse = await axios({
      method: 'get',
      url: videoFileUrl,
      responseType: 'stream',
    });

    const destination = 'file.mp4';
    const fileStream = fs.createWriteStream(destination);
    videoResponse.data.pipe(fileStream);

    return new Promise((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading file:', error.message);
  }
};

downloadFile()
  .then(() => {
    console.log('File downloaded successfully!');
  })
  .catch((error) => {
    console.error('Error:', error.message);
  });
