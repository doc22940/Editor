import { basename } from "path";

import * as React from "react";
import { GUI, GUIParams, GUIController } from "dat.gui";
import { Divider, InputGroup, Classes } from "@blueprintjs/core";

import { Node, Color3, Tags } from "babylonjs";

import { Nullable } from "../../../shared/types";

import { Editor } from "../editor";

import { SuggestController } from "../gui/augmentations/suggest";
import { TextureAssets } from "../assets/textures";

import { IObjectInspectorProps } from "../components/inspector";

import { undoRedo } from "../tools/undo-redo";
import { IObjectModified } from "../tools/types";
import { Tools } from "../tools/tools";

export abstract class AbstractInspector<T> extends React.Component<IObjectInspectorProps> {
    /**
     * The editor reference.
     */
    protected editor: Editor;
    /**
     * Defines the GUI reference.
     */
    protected tool: Nullable<GUI> = null;
    /**
     * The selected object reference.
     */
    protected selectedObject: T;

    private _id: string;
    private _isMounted: boolean = false;

    /**
     * Constructor.
     * @param editor the editor reference.
     * @param selectedObject the currently selected object reference.
     * @param ref the ref of the inspector properties.
     */
    // public constructor(protected editor: Editor, protected selectedObject: T, protected ref: IObjectInspector) {
    public constructor(props: IObjectInspectorProps) {
        super(props);

        this.editor = props.editor;
        this._id = props.toolId;
    }

    /**
     * Renders the component.
     */
    public render(): React.ReactNode {
        return (
            <div id={this._id} style={{ width: "100%", height: "100%" }}>
                <InputGroup className={Classes.FILL} leftIcon={"search"} type="search" placeholder="Search..." onChange={(e) => this._handleSearchChanged(e.target.value)} />
                <Divider />
            </div>
        );
    }

    /**
     * Called on the component did mount.
     */
    public abstract onUpdate(): void;

    /**
     * Called on a controller changes.
     */
    public onControllerChange(): void {
        // Empty. Can be overrided by other inspectors.
    }

    /**
     * Called on a controller finished changes.
     */
    public onControllerFinishChange(): void {
        Tags.AddTagsTo(this.selectedObject, "modified");
    }

    /**
     * Gets wether or not the component is mounted.
     */
    protected get isMounted(): boolean {
        return this._isMounted;
    }

    /**
     * Called on the component did moubnt.
     */
    public componentDidMount(): void {
        this.selectedObject = this.editor.inspector.selectedObject;
        this._isMounted = true;

        this.tool = new GUI({ autoPlace: false, scrollable: true } as GUIParams);
        document.getElementById(this._id!)?.appendChild(this.tool.domElement);

        this.resize();
        this.onUpdate();

        setTimeout(() => this._handleChanged(), 0);
    }

    /**
     * Called on the component will unmount.
     */
    public componentWillUnmount(): void {
        this._isMounted = false;
        if (this.tool) { this.tool.destroy(); }
    }

    /**
     * Refreshes the inspector tool.
     */
    public refresh(): void {
        this.editor.inspector.refresh();
    }

    /**
     * Refreshes the edition tool.
     */
    public refreshDisplay(): void {
        if (this.tool) {
            this.tool.updateDisplay();
        }
    }

    /**
     * Resizes the edition tool.
     */
    public resize(): void {
        const size = this.editor.getPanelSize("inspector");
        if (this.tool) { this.tool.width = size.width; }
    }

    /**
     * Adds a new texture field to the inspector.
     * @param parent the parent folder where to add the texture field.
     * @param object the object to modify.
     * @param property the property to modify in the given object.
     */
    protected addTexture(parent: GUI = this.tool!, object: any, property: string): SuggestController {
        const textures = ["None"].concat(Tools.Distinct(this.editor.scene!.textures.map((t) => basename(t.name))));
        const assets = this.editor.assets.getAssetsOf(TextureAssets);

        if (!assets) {
            return parent.addSuggest(object, property, textures);
        }

        return parent.addSuggest(object, property, textures, {
            onShowIcon: (i) => {
                const asset = assets?.find((a) => a.key === i);
                if (!asset) { return undefined; }

                return <img src={asset.base64} style={{ width: 20, height: 20 }}></img>;
            },
        });
    }

    /**
     * Adds a color3 folder to edit RGB
     * @param parent the parent folder where to add the color folder.
     * @param name the name of the color folder.
     * @param object the base object to modify.
     * @param property the path to the color property.
     */
    protected addColor3(parent: GUI = this.tool!, name: string, object: any, property: string): GUI {
        const folder = parent.addFolder(name);
        folder.open();

        const o = { color: (object[property] as Color3).toHexString() };

        folder.add(object[property], "r").min(0).max(1).onChange(() => {
            o.color = (object[property] as Color3).toHexString();
            this.refreshDisplay();
        });
        folder.add(object[property], "g").min(0).max(1).onChange(() => {
            o.color = (object[property] as Color3).toHexString();
            this.refreshDisplay();
        });
        folder.add(object[property], "b").min(0).max(1).onChange(() => {
            o.color = (object[property] as Color3).toHexString();
            this.refreshDisplay();
        });

        folder.addColor(o, "color").name("Color").onChange(() => {
            const value = Color3.FromHexString(o.color);
            object[property].r = value.r;
            object[property].g = value.g;
            object[property].b = value.b;
            this.refreshDisplay();
        });

        return folder;
    }

    /**
     * Called on the user wants to filter the tools.
     */
    private _handleSearchChanged(filter: string, root?: GUI): void {
        if (!root) { root = this.tool!; }

        for (const f in root.__folders) {
            const folder = root.__folders[f];
            let fullFolder = false;

            if (folder.name.toLowerCase().indexOf(filter.toLowerCase()) === -1) {
                folder.domElement.style.display = "none";
            } else {
                folder.domElement.style.display = '';

                // Found, re-show parents
                let parent = folder.parent;
                while (parent && parent.name) {
                    parent.domElement.style.display = '';
                    parent = parent.parent;
                }

                fullFolder = true;
            }

            // Controllers
            folder.__controllers.forEach(c => {
                // Get li element
                const li = c["__li"];
                if (!li) { return; }

                // Full folder? show controllers of the current folder
                if (fullFolder) {
                    li.style.display = '';
                    return;
                }

                // Filter li element
                if (li.innerText.toLowerCase().indexOf(filter.toLowerCase()) === -1) {
                    li.style.display = "none";
                } else {
                    li.style.display = '';

                    // Found, re-show parents
                    let parent = c["__gui"];
                    while (parent && parent.name) {
                        parent.domElement.style.display = '';
                        parent = parent.parent;
                    }
                }
            });

            this._handleSearchChanged(filter, folder);
        }
    }

    /**
     * Called on the tool is mounted to handle onChange & onFinishChange
     */
    private _handleChanged(root?: GUI): void {
        if (!root) { root = this.tool!; }

        root.__controllers.forEach((c) => {
            const existingChangeFn = c["__onChange"];
            const existingFinishChangeFn = c["__onFinishChange"];

            c.onChange((r) => {
                if (existingChangeFn) { existingChangeFn(r); }
                this.onControllerChange();

                if (c.object === this) { return; }

                const modificationInfos = { object: this.selectedObject, path: this._getPropertyPath(c) } as IObjectModified<T>;
                if (this.selectedObject instanceof Node && this.selectedObject.metadata && this.selectedObject.metadata.prefab) {
                    this.selectedObject.metadata.prefab.properties = this.selectedObject.metadata.prefab.properties ?? { };
                    this.selectedObject.metadata.prefab.properties![modificationInfos.path] = true;
                }
                this.editor.objectModifiedObservable.notifyObservers(modificationInfos);
            });

            c.onFinishChange((r) => {
                if (existingFinishChangeFn) { existingFinishChangeFn(r); }
                this.onControllerFinishChange();
                
                if (c.object === this) { return; }
                
                // Notify
                const modificationInfos = { object: this.selectedObject, path: this._getPropertyPath(c) } as IObjectModified<T>;
                this.editor.objectModifiedObservable.notifyObservers(modificationInfos);

                // Undo/redo
                if (!c.object) { return; }
                const property = c["property"];
                const initialValue = c["initialValue"];

                undoRedo.push({
                    common: () => {
                        this.tool?.updateDisplay();
                        this.editor.graph.refresh();
                    },
                    redo: () => c.object[property] = r,
                    undo: () => c.object[property] = initialValue,
                });
            });
        });

        for (const f in root.__folders) {
            this._handleChanged(root.__folders[f]);
        }
    }

    /**
     * Returns the proeprty path of the controller.
     */
    private _getPropertyPath(controller: GUIController): string {
        if (!controller.__path) {
            if (controller.object === this.selectedObject) {
                return controller.property;
            }

            for (const key in this.selectedObject) {
                const value = this.selectedObject[key];
                if (value === controller.object) {
                    return `${key}.${controller["property"]}`;
                }
            }
        }

        return `${controller.__path + "." ?? ""}${controller["property"]}`;
    }
}
