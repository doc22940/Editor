import { ipcRenderer } from "electron";

import { Tools as BabylonTools, Scene, Node, Nullable } from "babylonjs";

import { IPCResponses, IPCRequests } from "../../../shared/ipc";

export class Tools {
    /**
     * Returns the name of the constructor of the given object.
     * @param object the object to return its constructor name.
     */
    public static GetConstructorName(object: any): string {
        let name = (object && object.constructor) ? object.constructor.name : "";

        if (name === "") {
            name = typeof(object);
        }

        return name;
    }

    /**
     * Implementation from http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/2117523#answer-2117523
     * Be aware Math.random() could cause collisions, but:
     * "All but 6 of the 128 bits of the ID are randomly generated, which means that for any two ids, there's a 1 in 2^^122 (or 5.3x10^^36) chance they'll collide"
     */
    public static RandomId(): string {
        return BabylonTools.RandomId();
    }

    /**
     * Returns all the scene nodes of the given scene.
     * @param scene the scene containing the nodes to get.
     */
    public static getAllSceneNodes(scene: Scene): Node[] {
        return (scene.meshes as Node[])
                    .concat(scene.lights as Node[])
                    .concat(scene.cameras as Node[])
                    .concat(scene.transformNodes as Node[]);
    }

    /**
     * Returns wether or not the given element is a child (recursively) of the given parent.
     * @param element the element being possibily a child of the given parent.
     * @param parent the parent to check.
     */
    public static IsElementChildOf(element: HTMLElement, parent: HTMLElement): boolean {
        while (element.parentElement) {
            if (element === parent) { return true; }
            element = element.parentElement;
        }

        return false;
    }

    /**
     * Waits until the given timeMs value is reached.
     * @param timeMs the time in milliseconds to wait.
     */
    public static Wait(timeMs: number): Promise<void> {
        return new Promise<void>((resolve) => setTimeout(() => resolve(), timeMs));
    }

    /**
     * Returns the given array by keeping only distinct values.
     * @param array the array to filter.
     */
    public static Distinct(array: string[]): string[] {
        const unique = (value, index, self) => self.indexOf(value) === index;
        return array.filter(unique);
    }

    /**
     * Shows the open file dialog and returns the selected file.
     */
    public static async ShowOpenFileDialog(): Promise<File> {
        return new Promise<File>((resolve, reject) => {
            const input = document.createElement("input");
            input.type = "file";
            input.multiple = false;
            input.addEventListener("change", () => {
                input.remove();
                if (input.files?.item(0)) {
                    return resolve(input.files!.item(0)!);
                }
                reject("User decided to not choose any files.");
            });
            input.click();
        });
    }

    /**
     * Opens the save dialog and returns the selected path.
     * @param path optional path where to open the save dialog.
     */
    public static async ShowSaveDialog(path: Nullable<string> = null): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            ipcRenderer.once(IPCResponses.OpenFileDialog, (_, path) => resolve(path));
            ipcRenderer.once(IPCResponses.CancelOpenFileDialog, () => reject("User decided to not save any file."));
            ipcRenderer.send(IPCRequests.OpenFileDialog, "Open Babylon.JS Editor Project", path ?? "");
        });
    }
}
