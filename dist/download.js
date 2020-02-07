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
    var _a, _b, _c, _d, _e;
    await fs_extra_1.default.mkdir(constants_1.outDir).catch(() => { });
    const emojiMap = {};
    try {
        let page = 1;
        let data = { ok: false, emoji: [] };
        do {
            const formData = new form_data_1.default();
            formData.append('page', page + '');
            formData.append('count', '100');
            formData.append('token', constants_1.TOKEN);
            const res = await fetch_1.default(constants_1.EMOJI_LIST_API, {
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
            data = await res.json();
            if (!((_a = data) === null || _a === void 0 ? void 0 : _a.ok)) {
                console.error(data);
                throw new Error('failed to get emojis');
            }
            if (!((_c = (_b = data) === null || _b === void 0 ? void 0 : _b.emoji) === null || _c === void 0 ? void 0 : _c.length)) {
                break;
            }
            const sema = new async_sema_1.Sema(10, { capacity: data.emoji.length });
            await Promise.all(data.emoji.map(async (emoji) => {
                await sema.acquire();
                const ext = path_1.default.extname(emoji.url);
                const emojiPath = path_1.default.join(constants_1.outDir, emoji.name + ext);
                if (await fs_extra_1.default.pathExists(emojiPath)) {
                    console.log('already have', emoji.name);
                }
                else {
                    emojiMap[emoji.name] = emoji.url;
                    const imgRes = await fetch_1.default(emoji.url);
                    console.log('downloaded', emoji.name);
                    const outStream = fs_extra_1.default.createWriteStream(emojiPath);
                    imgRes.body.pipe(outStream);
                }
                sema.release();
            }));
            page += 1;
        } while (((_e = (_d = data) === null || _d === void 0 ? void 0 : _d.emoji) === null || _e === void 0 ? void 0 : _e.length) > 0);
        console.log('finished');
    }
    catch (err) {
        console.error('got error', err);
    }
    await fs_extra_1.default.writeFile('emojis.json', JSON.stringify(emojiMap, null, 2))
        .catch(console.error);
})();
