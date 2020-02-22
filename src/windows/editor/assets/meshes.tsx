import { dirname, join, extname } from "path";
import { copy } from "fs-extra";

import { SceneLoader, PickingInfo } from "babylonjs";

import { assetsHelper } from "../tools/assets-helper";
import { Tools } from "../tools/tools";

import { IFile } from "../project/files";
import { Project } from "../project/project";

import { Assets } from "../components/assets";
import { AbstractAssets, IAssetComponentItem } from "./abstract-assets";

export class MeshesAssets extends AbstractAssets {
    /**
     * Defines the size of assets to be drawn in the panel. Default is 100x100 pixels.
     * @override
     */
    protected size: number = 75;

    private _extensions: string[] = [".babylon"];

    /**
     * Defines the list of all avaiable meshes in the assets component.
     */
    public static Meshes: IFile[] = [];

    /**
     * Refreshes the component.
     * @override
     */
    public async refresh(): Promise<void> {
        this.items = [];
        for (const m of MeshesAssets.Meshes) {
            const dir = join(dirname(m.path), "/");
            await SceneLoader.ImportMeshAsync("", dir, m.name, assetsHelper.scene);

            const base64 = await assetsHelper.getScreenshot();
            this.items.push({ id: m.name, key: m.path, base64 });

            assetsHelper.reset();
        }
        
        return super.refresh();
    }

    /**
     * Called on the user drops an asset in editor. (typically the preview canvas).
     * @param item the item being dropped.
     * @param pickInfo the pick info generated on the drop event.
     * @override
     */
    public async onDropAsset(item: IAssetComponentItem, pickInfo: PickingInfo): Promise<void> {
        super.onDropAsset(item, pickInfo);

        const rootUrl = join(dirname(item.key), "/");
        const result = await SceneLoader.ImportMeshAsync("", rootUrl, item.id, this.editor.scene!);

        result.meshes.forEach((m) => {
            m.id = Tools.RandomId();
            if (m.material) { m.material.id = Tools.RandomId(); }
            if (!m.parent && pickInfo.pickedPoint) { m.position.copyFrom(pickInfo.pickedPoint); }
        });
        result.skeletons.forEach((s) => s.id = Tools.RandomId());
        result.particleSystems.forEach((ps) => ps.id = Tools.RandomId());

        this.editor.graph.refresh();
    }

    /**
     * Called on the user drops files in the assets component and returns true if the files have been computed.
     * @param files the list of files being dropped.
     */
    public async onDropFiles(files: IFile[]): Promise<void> {
        for (const file of files) {
            const extension = extname(file.name).toLowerCase();
            if (this._extensions.indexOf(extension) === -1) { continue; }

            const existing = MeshesAssets.Meshes.find((m) => m.name === file.name);

            // Copy assets
            const dest = join(Project.DirPath!, "assets", "meshes", file.name);
            if (dest) { await copy(file.path, dest); }

            if (!existing) {
                MeshesAssets.Meshes.push({ name: file.name, path: dest });
            }
        }

        return this.refresh();
    }
}

Assets.addAssetComponent({
    title: "Meshes",
    ctor: MeshesAssets,
});
