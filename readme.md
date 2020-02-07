# Slack Emoji Copier

> downloads emojis from one slack endpoint and uploads them to another

## Usage

1. Update `EMOJI_LIST_API` and `EMOJI_ADD_API` in `dist/constants.js`
2. Get your slack token by going to `WORKSPACE.slack.com/admin/emoji` and looking for the `emoji.adminList` request and the token is under the request's payload
3. `SLACK_TOKEN='...' yarn download`
4. `SLACK_TOKEN='...' yarn upload`
5. Enjoy
