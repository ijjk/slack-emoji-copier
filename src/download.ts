import path from 'path'
import fs from 'fs-extra'
import fetch from './fetch'
import FormData from 'form-data'
import { Sema } from 'async-sema'
import { TOKEN, outDir, EMOJI_LIST_API } from './constants'

(async () => {
  await fs.mkdir(outDir).catch(() => {})

  const emojiMap: { [key: string]: string } = {}

  try {
    let page = 1
    let data: {
      ok: boolean
      emoji: Array<{url: string, name: string}>
    } = { ok: false, emoji: [] }

    do {
      const formData = new FormData()

      formData.append('page', page+'')
      formData.append('count', '100')
      formData.append('token', TOKEN)

      const res = await fetch(EMOJI_LIST_API, {
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

      data = await res.json()

      if (!data?.ok) {
        console.error(data);
        throw new Error('failed to get emojis')
      }

      if (!data?.emoji?.length) {
        break
      }
      const sema = new Sema(10, { capacity: data.emoji.length })

      await Promise.all(data.emoji.map(async emoji => {
        await sema.acquire()

        const ext = path.extname(emoji.url)
        const emojiPath = path.join(outDir, emoji.name + ext)

        if (await fs.pathExists(emojiPath)) {
          console.log('already have', emoji.name);
        } else {
          emojiMap[emoji.name] = emoji.url

          const imgRes = await fetch(emoji.url)
          console.log('downloaded', emoji.name);

          const outStream = fs.createWriteStream(emojiPath)
          imgRes.body.pipe(outStream)
        }

        sema.release()
      }))

      page += 1
    } while (data?.emoji?.length > 0)

    console.log('finished');
  } catch (err) {
    console.error('got error', err)
  }

  await fs.writeFile('emojis.json', JSON.stringify(emojiMap, null, 2))
    .catch(console.error)
})()
