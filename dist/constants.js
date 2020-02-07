"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
exports.EMOJI_LIST_API = 'https://zeit.slack.com/api/emoji.adminList';
exports.EMOJI_ADD_API = 'https://zeit-hackaton.slack.com/api/emoji.add';
exports.TOKEN = process.env.SLACK_TOKEN;
if (!exports.TOKEN) {
    throw new Error(`You must provide your token with SLACK_TOKEN='..'`);
}
const outDirIdx = process.argv.findIndex(arg => arg === '-o');
exports.outDir = outDirIdx === -1
    ? path_1.default.join(__dirname, '../emojis')
    : path_1.default.resolve(process.argv[outDirIdx + 1]);
exports.doneDir = path_1.default.join(__dirname, '../uploaded');
