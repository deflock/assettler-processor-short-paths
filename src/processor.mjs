import nodepath from 'path';
import {trimStringLeft} from '@deflock/string-trim';
import {extensionMatches} from '@deflock/path';
import GenericProcessor from '@assettler/core/lib/generic-processor';

/**
 *
 */
export default class Processor extends GenericProcessor {
    /**
     * @param {Object} options
     */
    constructor(options = {}) {
        super();

        this.options = options;

        this.map = {};
        this.typeExtensions = this.options.typeExtensions || {};
    }

    /**
     * @param {Object|Array} files
     * @param {Object} params
     * @returns {Promise<any[]>}
     */
    async process(files, params) {
        return super.process(files, params).then(() => this.writeAsJson(this.getOption('mapPath'), this.map));
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async onInit(file, params) {
        return this.doTrack(file, params);
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async onAdd(file, params) {
        return this.doTrack(file, params);
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async onChange(file, params) {
        return this.doTrack(file, params);
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async onUnlink(file, params) {
        return this.doUntrack(file, params);
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async doTrack(file, params) {
        const relativePath = file.path;

        const shorts = this.resolveShortPaths(relativePath);

        for (const type of Object.keys(shorts)) {
            if (!Array.isArray(shorts[type])) {
                throw new Error(`Short paths for path "${relativePath}" is not an array`);
            }

            if (!Object.prototype.hasOwnProperty.call(this.map, type)) {
                this.map[type] = {};
            }

            for (const sp of shorts[type]) {
                // if (Object.prototype.hasOwnProperty.call(this.map[type], sp)) {
                //     throw new Error(`Short paths already have path "${sp}"`);
                // }
                this.map[type][sp] = relativePath;
            }
        }
    }

    /**
     * @param {Object} file
     * @param {Object} params
     * @returns {Promise<void>}
     */
    async doUntrack(file, params) {
        const relativePath = file.path;

        const types = this.resolveFileTypesByExtension(relativePath);

        for (const type of types) {
            if (this.map[type]) {
                for (const sp of Object.keys(this.map[type])) {
                    if (!Object.prototype.hasOwnProperty.call(this.map[type], sp)) {
                        continue;
                    }
                    if (this.map[type][sp] === relativePath) {
                        delete this.map[type][sp];
                    }
                }
            }
        }
    }

    /**
     * @param {string} path
     *
     * @returns {Object}
     */
    resolveShortPaths(path) {
        const shorts = {};

        const ext = nodepath.extname(path);
        const types = this.resolveFileTypesByExtension(path);

        for (const type of types) {
            shorts[type] = [];

            const basename = nodepath.basename(path, ext);
            const basepath = nodepath.join(nodepath.dirname(path), basename);

            shorts[type].push(basepath);

            const parts = basepath.split(nodepath.sep);

            if (parts.length >= 2 && parts[parts.length - 1] === parts[parts.length - 2]) {
                parts.pop();
                shorts[type].push(parts.join(nodepath.sep));
            }
        }

        return shorts;
    }

    /**
     * @param {string} path
     * @returns {Array}
     */
    resolveFileTypesByExtension(path) {
        const types = [];

        const ext = nodepath.extname(path);

        for (const type of Object.keys(this.typeExtensions)) {
            if (!extensionMatches(ext, this.typeExtensions[type])) {
                continue;
            }

            types.push(type);
        }

        if (!types.length) {
            types.push(trimStringLeft(ext, '.'));
        }

        return types;
    }

    /**
     * @param {string} option
     * @returns {*}
     */
    getOption(option) {
        return this.options[option];
    }
}
