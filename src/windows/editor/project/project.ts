import { ipcRenderer } from "electron";

import { IPCRequests, IPCResponses } from "../../../shared/ipc";
import { Nullable } from "../../../shared/types";

import { IProject } from "./typings";

export class Project {
    /**
     * Defines the path of the currently opened project.
     */
    public static Path: Nullable<string> = null;
    /**
     * Defines the path to the directory containing the project.
     */
    public static DirPath: Nullable<string> = null;
    /**
     * Defines the current project datas.
     */
    public static Project: Nullable<IProject> = null;

    /**
     * Returns the project path set when opened the editor from the OS file system.
     */
    public static GetOpeningProject(): Promise<Nullable<string>> {
        return new Promise<Nullable<string>>((resolve) => {
            ipcRenderer.once(IPCResponses.GetProjectPath, (_, path) => resolve(path));
            ipcRenderer.send(IPCRequests.GetProjectPath);
        });
    }

    /**
     * Sets the new project path of the project.
     * @param path the new path of the project.
     */
    public static SetOpeningProject(path: string): Promise<void> {
        return new Promise<void>((resolve) => {
            ipcRenderer.once(IPCResponses.SetProjectPath, () => resolve());
            ipcRenderer.send(IPCRequests.SetProjectPath, path);
        });
    }
}
