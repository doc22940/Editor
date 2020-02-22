import { dirname, join, basename, extname } from "path";
import { readJSON } from "fs-extra";

import { Texture, SceneLoader, Light, Node } from "babylonjs";

import { MeshesAssets } from "../assets/meshes";

import { Editor } from "../editor";

import { Overlay } from "../gui/overlay";

import { Tools } from "../tools/tools";

import { Project } from "./project";
import { IProject } from "./typings";
import { FilesStore } from "./files";

export class ProjectImporter {
    /**
     * Opens the file dialog and loads the selected project.
     * @param editor the editor reference.
     */
    public static async Browse(): Promise<void> {
        const file = await Tools.ShowOpenFileDialog();
        if (!file || extname(file.name).toLowerCase() !== ".editorproject") { return; }

        Overlay.Show("Preparing...", true);
        await Project.SetOpeningProject(file.path);
        window.location.reload();
    }

    /**
     * Imports the project located at the given path.
     * @param editor the editor reference.
     * @param path the path of the project to import.
     */
    public static async ImportProject(editor: Editor, path: string): Promise<void> {
        try {
            await this._ImportProject(editor, path);
        } catch (e) {
            // TODO.
            this._RefreshEditor(editor);
        }
    }

    /**
     * Imports the project located at the given path.
     */
    private static async _ImportProject(editor: Editor, path: string): Promise<void> {
        // Prepare overlay
        Overlay.Show("Importing Project...", true);

        // Configure editor project
        Project.Path = path;
        Project.DirPath = `${dirname(path)}/`;

        // Read project file
        const project = await readJSON(path) as IProject;

        Overlay.SetSpinnervalue(0);
        const spinnerStep = 1 / (project.textures.length + project.meshes.length + project.lights.length);
        let spinnerValue = 0;

        // Register files
        project.filesList.forEach((f) => {
            const path = join(Project.DirPath!, "files", f);
            FilesStore.list[path] = { path, name: basename(f) };
        });

        // Configure assets
        project.assets.meshes.forEach((m) => MeshesAssets.Meshes.push({ name: m, path: join(Project.DirPath!, "assets", "meshes", m) }));

        // Load all textures
        Overlay.SetMessage("Creating Textures...");

        for (const t of project.textures) {
            try {
                const json = await readJSON(join(Project.DirPath, "textures", t));
                const rootUrl = join(Project.DirPath!, "/");

                Texture.Parse(json, editor.scene!, rootUrl) as Texture;
            } catch (e) {

            }
            Overlay.SetSpinnervalue(spinnerValue += spinnerStep);
        }

        // Load all meshes
        Overlay.SetMessage("Creating Meshes...");

        for (const m of project.meshes) {
            try {
                const json = await readJSON(join(Project.DirPath, "meshes", m));
                const result = await SceneLoader.ImportMeshAsync("", Project.DirPath, join("meshes", m), editor.scene, null, ".babylon");

                result.meshes.forEach((m, index) => {
                    m._waitingParentId = json.meshes[index].parentId;
                });
            } catch (e) {

            }

            Overlay.SetSpinnervalue(spinnerValue += spinnerStep);
        }

        // Load all lights
        Overlay.SetMessage("Creating Lights...");

        for (const l of project.lights) {
            try {
                const json = await readJSON(join(Project.DirPath, "lights", l));
                Light.Parse(json, editor.scene!);
            } catch (e) {

            }

            Overlay.SetSpinnervalue(spinnerValue += spinnerStep);
        }

        // Parent Ids
        const scene = editor.scene!;
        scene.meshes.forEach((m) => this._SetWaitingParent(m));
        scene.lights.forEach((l) => this._SetWaitingParent(l));
        scene.cameras.forEach((c) => this._SetWaitingParent(c));
        scene.transformNodes.forEach((tn) => this._SetWaitingParent(tn));

        // Refresh
        editor.scene!.onReadyObservable.addOnce(() => this._RefreshEditor(editor));
        editor.scene!._checkIsReady();
    }

    /**
     * Sets the parent of the given node waiting for it.
     */
    private static _SetWaitingParent(n: Node): void {
        if (!n._waitingParentId) { return; }

        n.parent = n.getScene().getNodeByID(n._waitingParentId);
        delete n._waitingParentId;
    }

    /**
     * Refreshes the editor.
     */
    private static _RefreshEditor(editor: Editor): void {
        editor.assets.refresh();
        editor.graph.refresh();

        Overlay.Hide();
    }
}
