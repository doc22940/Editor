import { extname, basename, join } from "path";
import { copy } from "fs-extra";

import { Texture, PickingInfo } from "babylonjs";

import { FilesStore, IFile } from "../project/files";
import { Project } from "../project/project";

import { Assets } from "../components/assets";
import { AbstractAssets, IAssetComponentItem } from "./abstract-assets";

export class TextureAssets extends AbstractAssets {
    /**
     * Defines the size of assets to be drawn in the panel. Default is 100x100 pixels.
     * @override
     */
    protected size: number = 50;

    private _extensions: string[] = [".png", ".jpg", ".jpeg", ".dds"];

    /**
     * Refreshes the component.
     * @override
     */
    public async refresh(): Promise<void> {
        this.items = [];
        
        for (const texture of this.editor.scene!.textures) {
            if (!(texture instanceof Texture)) { continue; }

            const name = basename(texture.name);
            const file = FilesStore.getFileFromBaseName(name);
            if (!file) { continue; }

            this.items.push({ key: texture.uid, id: basename(texture.name), base64: file.path });
        }

        return super.refresh();
    }

    /**
     * Called on the user drops an asset in editor. (typically the preview canvas).
     * @param item the item being dropped.
     * @param pickInfo the pick info generated on the drop event.
     * @override
     */
    public onDropAsset(item: IAssetComponentItem, pickInfo: PickingInfo): void {
        super.onDropAsset(item, pickInfo);

        // TODO.
    }

    /**
     * Called on the user drops files in the assets component and returns true if the files have been computed.
     * @param files the list of files being dropped.
     */
    public async onDropFiles(files: IFile[]): Promise<void> {
        for (const file of files) {
            const extension = extname(file.name);
            if (this._extensions.indexOf(extension) === -1) { continue; }

            // Get file
            if (!FilesStore.getFileFromBaseName(file.name)) {
                // Register file
                const path = join(Project.DirPath!, "files", file.name);
                FilesStore.list[path] = { path, name: file.name };

                // Create texture
                const texture = new Texture(file.path, this.editor.scene!);
                texture.onLoadObservable.addOnce(() => {
                    const path = join("files", basename(texture.name));

                    texture.name = path;
                    if (texture.url) { texture.url = path; }
                });
            }

            // Copy assets
            const dest = join(Project.DirPath!, "files", file.name);
            if (dest) { await copy(file.path, dest); }
        }

        return this.refresh();
    }
}

Assets.addAssetComponent({
    title: "Textures",
    ctor: TextureAssets,
});
