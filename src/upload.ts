import path from 'path'
import fs from 'fs-extra'
import fetch from './fetch'
import FormData from 'form-data'
import { Sema } from 'async-sema'
import { TOKEN, outDir, doneDir, EMOJI_ADD_API } from './constants'

(async () => {
  const emojis = await fs.readdir(outDir)
  const sema = new Sema(2, { capacity: emojis.length })

  await fs.mkdir(doneDir).catch(() => {})

  await Promise.all(emojis.map(emoji => {
    const upload = async (retry?: number): Promise<any> => {
      if (!retry) {
        await sema.acquire()
      }

      const ext = path.extname(emoji)
      const emojiParts = emoji.split(ext)
      emojiParts.pop() // remove extension

      const name = emojiParts.join(ext)
      const emojiPath = path.join(outDir, emoji)

      const formData = new FormData()

      formData.append('mode', 'data')
      formData.append('name', name)
      formData.append('image', await fs.readFile(emojiPath), {
        filename: emoji
      })
      formData.append('token', TOKEN)

      if (!retry) {
        console.log('uploading', name);
      }

      const res = await fetch(EMOJI_ADD_API, {
        method: 'POST',
        headers: {
          ...formData.getHeaders()
        },
        body: formData.getBuffer(),
        retry: {
          retries: 3,
          maxTimeout: 10 * 1000
        }
      })
      const data = await res.json()
      if (data.error === 'ratelimited' && (retry || 0) < 6) {
        console.log(
          'Failed to upload, hit rate-limit. Waiting 10s before retry'
        );
        await new Promise(resolve => {
          setTimeout(resolve, 10 * 1000)
        })
        return upload((retry || 0) + 1)
      }

      if (data.ok === false) {
        console.error(`Failed to upload ${name} ${JSON.stringify(data)}`)
      } else {
        console.log('uploaded', name, res.ok, data);
        await fs.move(emojiPath, path.join(doneDir, emoji))
      }

      // wait a bit before the next to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
      sema.release()
    }
    return upload()
  }))
})()
