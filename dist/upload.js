"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const fetch_1 = __importDefault(require("./fetch"));
const form_data_1 = __importDefault(require("form-data"));
const async_sema_1 = require("async-sema");
const constants_1 = require("./constants");
(async () => {
    const emojis = await fs_extra_1.default.readdir(constants_1.outDir);
    const sema = new async_sema_1.Sema(2, { capacity: emojis.length });
    await fs_extra_1.default.mkdir(constants_1.doneDir).catch(() => { });
    await Promise.all(emojis.map(emoji => {
        const upload = async (retry) => {
            if (!retry) {
                await sema.acquire();
            }
            const ext = path_1.default.extname(emoji);
            const emojiParts = emoji.split(ext);
            emojiParts.pop(); // remove extension
            const name = emojiParts.join(ext);
            const emojiPath = path_1.default.join(constants_1.outDir, emoji);
            const formData = new form_data_1.default();
            formData.append('mode', 'data');
            formData.append('name', name);
            formData.append('image', await fs_extra_1.default.readFile(emojiPath), {
                filename: emoji
            });
            formData.append('token', constants_1.TOKEN);
            if (!retry) {
                console.log('uploading', name);
            }
            const res = await fetch_1.default(constants_1.EMOJI_ADD_API, {
                method: 'POST',
                headers: {
                    ...formData.getHeaders()
                },
                body: formData.getBuffer(),
                retry: {
                    retries: 3,
                    maxTimeout: 10 * 1000
                }
            });
            const data = await res.json();
            if (data.error === 'ratelimited' && (retry || 0) < 6) {
                console.log('Failed to upload, hit rate-limit. Waiting 10s before retry');
                await new Promise(resolve => {
                    setTimeout(resolve, 10 * 1000);
                });
                return upload((retry || 0) + 1);
            }
            if (data.ok === false) {
                console.error(`Failed to upload ${name} ${JSON.stringify(data)}`);
            }
            else {
                console.log('uploaded', name, res.ok, data);
                await fs_extra_1.default.move(emojiPath, path_1.default.join(constants_1.doneDir, emoji));
            }
            // wait a bit before the next to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
            sema.release();
        };
        return upload();
    }));
})();
