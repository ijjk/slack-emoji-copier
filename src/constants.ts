import path from 'path'

export const EMOJI_LIST_API = 'https://zeit.slack.com/api/emoji.adminList'
export const EMOJI_ADD_API = 'https://zeit-hackaton.slack.com/api/emoji.add'
export const TOKEN = process.env.SLACK_TOKEN!

if (!TOKEN) {
  throw new Error(`You must provide your token with SLACK_TOKEN='..'`)
}

const outDirIdx = process.argv.findIndex(arg => arg === '-o')

export const outDir = outDirIdx === -1
  ? path.join(__dirname, '../emojis')
  : path.resolve(process.argv[outDirIdx + 1])

export const doneDir = path.join(__dirname, '../uploaded')
