import chokidar from 'chokidar';
import * as Path from 'path'
import * as fs from "fs";
import { FileContent } from "../FileContent";

let rootDir: string
let callback: (file: FileContent) => void;
let extList: string[];
let ignoreList: string[] = []

export const FileWriteContent = (file: FileContent) => {
    if (!rootDir) {
        return;
    }

    let fullPath = Path.join(rootDir, file.relativePath)
    ignoreList.push(fullPath)
    fs.writeFile(fullPath, file.content, () => {
        console.log(`[WATCHER][FILE]: ${file.relativePath} is synced!`)
        setTimeout(() => {
            ignoreList = ignoreList.filter((value) => value != fullPath);
        }, 5000);

    })
}

export const StartFileWatcher = async (dirPath: string, types: string[], cb: (file: FileContent) => void) => {
    if (!fs.existsSync(dirPath)) {
        console.log("[WATCHER]: Provided path to the directory doesn't exists.")
        return false;
    }
    try {
        const watcher = chokidar.watch(dirPath)
        watcher.on('change', onChange);
        callback = cb;
        extList = types;
        rootDir = dirPath;
        console.log(`[WATCHER]: Watch file changes in ${dirPath}`)
        return true
    } catch (e) {
        console.log("[WATCHER]: Error when loading watcher")
        return false;
    }
}

const onChange = (absPath: string) => {
    let relPath = getRelativePath(rootDir, absPath);
    let fileName = getFileName(absPath);

    if (ignoreList.includes(absPath)) return;
    if (matchExtension(fileName)) {
        generateFileContent(absPath, relPath, fileName)
    }
    console.log("[WATCHER]: Modified", relPath);
}

const generateFileContent = (path: string, relPath: string, fileName: string) => {
    fs.readFile(path, (err, data) => {
        if (err) {
            console.log("[WATCHER]: Error when reading file,", relPath)
            return;
        }
        callback(new FileContent(fileName, relPath, data));
    })
}

const matchExtension = (filename: string): boolean => {
    let splitName = filename.split('.')
    let ext = splitName[splitName.length - 1]
    return extList.includes(ext.toLowerCase());
}

function getRelativePath(root: string, path: string): string {
    return path.split(root, 2)[1];
}

function getFileName(path: string): string {
    let splitChar: string;
    if (path.includes("/")) {
        splitChar = "/"
    } else if (path.includes("\\")) {
        splitChar = "\\"
    } else {
        return path
    }

    let splitParts = path.split(splitChar)
    return splitParts[splitParts.length - 1]
}