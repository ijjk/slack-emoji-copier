const fs = require('fs')
const path = require('path')
const {Sema} = require('async-sema')
const fetch = require('node-fetch')
const FormData = require('form-data')
const {promisify} = require('util')

const writeFile = promisify(fs.writeFile)
const outputDir = path.join(__dirname, 'emojis')

const accountToken = '' // update your token here
const endPoint = 'https://zeit.slack.com/api/emoji.adminList'

;(async () => {
  try {
    let page = 1
    while (true) {
      const formData = new FormData()

      formData.append('page', page)
      formData.append('count', 100)
      formData.append('token', accountToken)

      const res = await fetch(endPoint, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      const sema = new Sema(5, { capacity: data.emoji.length })

      if (!data.emoji.length) break

      for (const emoji of data.emoji) {
        await sema.acquire()

        const ext = path.extname(emoji.url)
        const emojiPath = path.join(outputDir, emoji.name + ext)
        console.log('downloading', emoji.url, 'to', emojiPath);

        const imgRes = await fetch(emoji.url)
        console.log('downloaded', emojiPath);

        const data = await imgRes.buffer()
        await writeFile(emojiPath, data)

        sema.release()
      }
      page += 1
    }
  } catch (err) {
    console.error('got error', err)
  }
})()
