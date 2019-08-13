const fs = require('fs')
const path = require('path')
const yaml = require('yaml')
const {Sema} = require('async-sema')
const fetch = require('node-fetch')
const {promisify} = require('util')

const mkdir = promisify(fs.mkdir)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const outputDir = path.join(__dirname, 'emojis')

;(async () => {
  await mkdir(outputDir)

  try {
    const dataStr = await readFile('./packs/star-wars.yaml', 'utf8')
    const data = yaml.parse(dataStr)
    const sema = new Sema(5, { capacity: data.emojis.length })

    if (!data.emojis.length) return

    for (const emoji of data.emojis) {
      await sema.acquire()

      const ext = path.extname(emoji.src)
      const emojiPath = path.join(outputDir, emoji.name + ext)
      console.log('downloading', emoji.src, 'to', emojiPath);

      const imgRes = await fetch(emoji.src)
      console.log('downloaded', emojiPath);

      const data = await imgRes.buffer()
      await writeFile(emojiPath, data)

      sema.release()
    }
  } catch (err) {
    console.error('got error', err)
  }
})()
