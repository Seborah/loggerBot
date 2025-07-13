const https = require('https')
const fs = require('fs')
const path = require('path')

const DOWNLOAD_DIR = path.join(__dirname, 'downloads')
if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR)

function downloadFile(url, filePath) {
    //TODO return some file paths to where the files should be so I can link them to a message
    //TODO update to include a date in the file name.
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath)
        https
            .get(url, (response) => {
                response.pipe(file)
                file.on('finish', () => file.close(resolve))
            })
            .on('error', (err) => {
                fs.unlink(filePath, () => reject(err))
            })
    })
}

var meow =
    '\
\
    // Download attachments\
    for (const attachment of message.attachments.values()) {\
        //TODO redo this to work with TODOs in downloadFile\
        const url = attachment.url\
        const fileName = `${Date.now()}_${attachment.name}`\
        const filePath = path.join(DOWNLOAD_DIR, fileName)\
\
        try {\
            await downloadFile(url, filePath)\
            console.log(`Downloaded: ${fileName}`)\
        } catch (err) {\
            console.error(`Failed to download ${url}:`, err)\
        }\
    }\
    '
