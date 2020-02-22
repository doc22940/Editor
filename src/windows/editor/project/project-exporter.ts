import { mkdir, pathExists, copy, writeFile } from "fs-extra";
import { join, normalize, basename } from "path";

import { SceneSerializer } from "babylonjs";

import { MeshesAssets } from "../assets/meshes";

import { Editor } from "../editor";
import { Tools } from "../tools/tools";

import { Project } from "./project";
import { FilesStore } from "./files";
import { IProject } from "./typings";

export class ProjectExporter {
    /**
     * Asks the user where to export the project and exports the project in the selected folder.
     * @param editor the editor reference.
     */
    public static async saveAs(editor: Editor): Promise<void> {
        const path = await Tools.ShowSaveDialog(Project.Path);
        Project.Path = join(path, "scene.editorproject");
        Project.DirPath = path;

        await Project.SetOpeningProject(Project.Path!);

        await this.save(editor);
    }

    /**
     * Saves the project in the current location. If no path provided, a dialog will prompt to select
     * the folder where to export the project.
     * @param editor the editor reference.
     */
    public static async save(editor: Editor): Promise<void> {
        if (!Project.Path) { return this.saveAs(editor); }

        const task = editor.addTaskFeedback(0, "Saving Files...");
        await Tools.Wait(500);

        // Create project
        const project: IProject = {
            filesList: [],
            textures: [],
            meshes: [],
            lights: [],
            assets: {
                meshes: MeshesAssets.Meshes.map((m) => m.name),
            },
        };

        // Write all files
        const filesDir = join(Project.DirPath!, "files");
        if (!(await pathExists(filesDir))) { await mkdir(filesDir); }

        let progressValue = 0;
        let progressCount = 100 / FilesStore.getFilesCount();

        for (const f in FilesStore.list) {
            const file = FilesStore.list[f];
            const dest = join(filesDir, file.name);

            project.filesList.push(file.name);
            if ((await pathExists(dest))) {
                continue;
            }

            await copy(file.path, dest);
            editor.updateTaskFeedback(task, progressValue += progressCount);
        }

        // Write all textures
        editor.updateTaskFeedback(task, 0, "Saving Textures");

        progressValue = 0;
        progressCount = 100 / editor.scene!.textures.length;

        const texturesDir = join(Project.DirPath!, "textures");
        if (!(await pathExists(texturesDir))) { await mkdir(texturesDir); }

        for (const texture of editor.scene!.textures) {
            const json = texture.serialize();
            json.name = join("./", "files", basename(texture.name));
            json.url = join("./", "files", basename(texture.name));

            const dest = `${normalize(basename(texture.name))}.json`;
            await writeFile(join(texturesDir, dest), JSON.stringify(json, null, "\t"), { encoding: "utf-8" });

            project.textures.push(dest);
            editor.updateTaskFeedback(task, progressValue += progressCount);
        }

        // Write all meshes
        editor.updateTaskFeedback(task, 0, "Saving Meshes");

        progressValue = 0;
        progressCount = 100 / editor.scene!.meshes.length;

        const meshesDir = join(Project.DirPath!, "meshes");
        if (!(await pathExists(meshesDir))) { await mkdir(meshesDir); }

        for (const mesh of editor.scene!.meshes) {
            mesh.isPickable = mesh.metadata.isPickable;
            const json = SceneSerializer.SerializeMesh(mesh, false, false);
            mesh.isPickable = true;
            
            const dest = `${normalize(basename(mesh.name))}.json`;

            await writeFile(join(meshesDir, dest), JSON.stringify(json, null, "\t"), { encoding: "utf-8" });
            project.meshes.push(dest);
            editor.updateTaskFeedback(task, progressValue += progressCount);
        }

        // Write all lights
        editor.updateTaskFeedback(task, 0, "Saving Lights");

        progressValue = 0;
        progressCount = 100 / editor.scene!.lights.length;

        const lightsDir = join(Project.DirPath!, "lights");
        if (!(await pathExists(lightsDir))) { await mkdir(lightsDir); }

        for (const light of editor.scene!.lights) {
            const json = light.serialize();
            const dest = `${normalize(basename(light.name))}.json`;

            await writeFile(join(lightsDir, dest), JSON.stringify(json, null, "\t"), { encoding: "utf-8" });
            project.lights.push(dest);
            editor.updateTaskFeedback(task, progressValue += progressCount);
        }

        // Write project!
        await writeFile(join(Project.DirPath!, "scene.editorproject"), JSON.stringify(project, null, "\t"), { encoding: "utf-8" });

        // Done!
        editor.updateTaskFeedback(task, 100, "Done!");
        editor.closeTaskFeedback(task, 500);
    }
}
