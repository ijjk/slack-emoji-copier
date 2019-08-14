const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const {promisify} = require('util')
const {Sema} = require('async-sema')
const FormData = require('form-data')

const mkdir = promisify(fs.mkdir)
const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const move = promisify(fs.rename)

const accountToken = process.env.SLACK_TOKEN || '' // update your token here
const endPoint = 'https://zeit-hackaton.slack.com/api/emoji.add'

;(async () => {
  const emojisDir = path.join(__dirname, 'emojis')
  const doneDir = path.join(__dirname, 'done')
  const emojis = await readdir(emojisDir)
  const sema = new Sema(5, { capacity: emojis.length })

  try {
    await mkdir(doneDir)
  } catch (_) {}

  for (const emoji of emojis) {
    await sema.acquire()

    const ext = path.extname(emoji)
    const emojiParts = emoji.split(ext)
    emojiParts.pop() // remove extension

    const name = emojiParts.join(ext)
    const emojiPath = path.join(emojisDir, emoji)

    const formData = new FormData()

    formData.append('mode', 'data')
    formData.append('name', name)
    formData.append('image', await readFile(emojiPath), {
      filename: emoji
    })
    formData.append('token', accountToken)

    console.log('uploading', name);

    const res = await fetch(endPoint, {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.error === 'ratelimited') throw new Error('rate limit')
    console.log('uploaded', name, res.ok, data);

    await new Promise((resolve) => {
      setTimeout(() => resolve(), 250)
    })
    await move(emojiPath, path.join(doneDir, emoji))
    sema.release()
  }
})()
