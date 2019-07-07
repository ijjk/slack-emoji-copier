# Slack Emoji Copier

> downloads emojis from one slack endpoint and uploads them to another

## Usage

1. Update `endpoint` and the `accountToken` in `download.js` and `upload.js`. Run `window.prompt("API token: ", window.boot_data.api_token)` in any logged in Slack page to get the token.
2. `mkdir emojis done`
3. `node ./download.js`
4. `node ./upload.js`
5. Enjoy
