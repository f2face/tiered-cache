import type { PathLike } from 'fs';
import { access, constants, readFile, writeFile } from 'fs/promises';
import { Cache } from './Cache';

export class FileCache implements Cache {
    constructor(private readonly filePath: PathLike) {}

    protected async fileExists(filePath: PathLike) {
        try {
            await access(filePath, constants.F_OK | constants.R_OK | constants.W_OK);
            return true;
        } catch {
            return false;
        }
    }

    public async get() {
        if (await this.fileExists(this.filePath)) return await readFile(this.filePath);
        else return null;
    }

    public async set(data: Buffer) {
        return await writeFile(this.filePath, data);
    }
}
