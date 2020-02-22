import { basename } from "path";

import { Nullable, IStringDictionary } from "../../../shared/types";

export interface IFile {
    /**
     * The name of the file in file system.
     */
    name: string;
    /**
     * The absolute path of the file in the file system.
     */
    path: string;
}

export interface IContentFile extends IFile {
    /**
     * Defines the content of the file.
     */
    content: string;
}

export class FilesStore {
    /**
     * Defines the list of all available files in the project.
     */
    public static list: IStringDictionary<IFile> = { };
    /**
     * Reference to the project's file.
     */
    public static project: Nullable<IFile> = null;

    /**
     * Clears the current file list of the project.
     */
    public static clear(): void {
        this.list = { };
        this.project = null;
    }

    /**
     * Returns the number of files available in the project.
     */
    public static getFilesCount(): number {
        return Object.keys(this.list).length;
    }

    /**
     * Removes the file from the list, located at the given path.
     * @param path the path of the file to remove from the list.
     */
    public static removeFileFromPath(path: string): void {
        for (const f in this.list) {
            const file = this.list[f];
            if (file.path === path) {
                delete this.list[f];
                return;
            }
        }
    }

    /**
     * Returns the first file found which has the given path.
     * @param path the path of the file to find.
     */
    public static getFileFromPath(path: string): Nullable<IFile> {
        for (const f in this.list) {
            const file = this.list[f];
            if (file.path === path) { return this.list[f]; }
		}

		return null;
	}

	/**
	 * Returns the key in the .list dictionary of the file located at the given path.
	 * @param path the path of the file to find its key.
	 */
	public static getKeyFromPath(path: string): Nullable<string> {
		for (const f in this.list) {
            const file = this.list[f];
            if (file.path === path) { return f; }
		}

		return null;
	}

    /**
     * Returns the first file found which has the given base name.
     * @param name the name of the file to find.
     */
    public static getFileFromBaseName(name: string): Nullable<IFile> {
        for (const f in this.list) {
            const file = this.list[f];
            if (basename(file.name) === name) { return this.list[f]; }
        }

        return null;
    }
}
