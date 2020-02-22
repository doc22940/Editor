import * as React from "react";
import { Toaster, Position, ProgressBar, Intent, Classes, IToastProps } from "@blueprintjs/core";

import { Engine, Scene, Observable, ISize, Node } from "babylonjs";

import GoldenLayout from "golden-layout";

import { IStringDictionary, Nullable } from "../../shared/types";

import { Overlay } from "./gui/overlay";

import { Tools } from "./tools/tools";
import { IObjectModified } from "./tools/types";
import { undoRedo } from "./tools/undo-redo";

import { IFile } from "./project/files";
import { Project } from "./project/project";
import { ProjectImporter } from "./project/project-importer";
import { ProjectExporter } from "./project/project-exporter";

import { SceneSettings } from "./scene/settings";

// Components
import { Inspector } from "./components/inspector";
import { Graph } from "./components/graph";
import { Assets } from "./components/assets";
import { Preview } from "./components/preview";
import { MainToolbar } from "./components/main-toolbar";
import { ToolsToolbar } from "./components/tools-toolbar";

// Augmentations
import "./gui/augmentations/index";

// Inspectors
import "./inspectors/node-inspector";
import "./inspectors/mesh-inspector";

import "./inspectors/materials/standard-material";

// Assets
import "./assets/meshes";
import "./assets/textures";
import "./assets/materials";

export class Editor extends React.Component {
    /**
     * Reference to the Babylon.JS engine used to render the preview scene.
     */
    public engine: Nullable<Engine> = null;
    /**
     * Reference to the Babylon.JS scene rendered by the preview component.
     */
    public scene: Nullable<Scene> = null;

    /**
     * Reference to the layout used to create the editor's sections.
     */
    public layout: GoldenLayout;

    /**
     * Reference to the inspector tool used to edit objects in the scene.
     */
    public inspector: Inspector;
    /**
     * Reference to the graph tool used to show and edit hierarchy in the scene..
     */
    public graph: Graph;
    /**
     * Reference to the assets tool used to show and edit assets of the project (meshes, prefabs, etc.)..
     */
    public assets: Assets;
    /**
     * Reference to the preview element used to draw the project's scene.
     */
    public preview: Preview;
    /**
     * Reference to the main toolbar.
     */
    public mainToolbar: MainToolbar;
    /**
     * Reference to the tools toolbar.
     */
    public toolsToolbar: ToolsToolbar;

    /**
     * Notifies observers once the editor has been initialized.
     */
    public editorInitializedObservable: Observable<void> = new Observable<void>();
    /**
     * Notifies observers on the editor is resized (window, layout, etc.).
     */
    public resizeObservable: Observable<void> = new Observable<void>();
    /**
     * Notifies observers on the editor modifies an object (typically inspectors).
     */
    public objectModifiedObservable: Observable<IObjectModified<any>> = new Observable<IObjectModified<any>>();
    /**
     * Notifies observers that a node has been selected in the editor (preview or graph).
     */
    public selectedNodeObservable: Observable<Node> = new Observable<Node>();

    private _taskFeedbacks: IStringDictionary<{
        message: string;
        amount: number;
    }> = { };
    private _toaster: Nullable<Toaster> = null;
    private _refHandlers = {
        getToaster: (ref: Toaster) => (this._toaster = ref),
    };
    private _resetting: boolean = false;

    /**
     * Defines the current version of the layout.
     */
    public static readonly LayoutVersion = "3.0.0";

    private static _loadedPlugins: IStringDictionary<{ path: string }> = { };

    /**
     * Renders the component.
     */
    public render(): React.ReactNode {
        return (
            <>
                <div id="BABYLON-TOOLBAR" className="bp3-dark" style={{ width: "100%", height: "60px", backgroundColor: "#444444 !important" }}>
                    <div className="bp3-dark" style={{ width: "100%", height: "30px", backgroundColor: "#444444" }}>
                        <MainToolbar editor={this} key="main-toolbar"></MainToolbar>
                    </div>
                    <div className="bp3-dark" style={{ width: "100%", height: "30px", backgroundColor: "#444444" }}>
                        <ToolsToolbar editor={this} key="tools-toolbar"></ToolsToolbar>
                    </div>
                </div>
                <div id="BABYLON-EDITOR-LAYOUT" className="bp3-dark" style={{ width: "100%", height: "100%", overflow: "hidden"}}></div>
                <div style={{ position: "absolute", pointerEvents: "none" }}>
                    <Toaster canEscapeKeyClear={true} position={Position.TOP} ref={this._refHandlers.getToaster}></Toaster>
                </div>
            </>
        );
    }

    /**
     * Called on the component did mount.
     */
    public async componentDidMount(): Promise<void> {
        document.getElementById("BABYLON-START-IMAGE")?.remove();
        Overlay.Show("Loading Editor...", true);

        await Tools.Wait(0);

        // Create default layout
        const layoutVersion = localStorage.getItem('babylonjs-editor-layout-version');
        const layoutStateItem = (layoutVersion === Editor.LayoutVersion) ? localStorage.getItem('babylonjs-editor-layout-state') : null;
        const layoutState = layoutStateItem ? JSON.parse(layoutStateItem) : null;

        if (layoutState) { this._configureLayourContent(layoutState.content); }

        this.layout = new GoldenLayout(layoutState ?? {
            settings: {
                showPopoutIcon: false,
                showCloseIcon: false,
                showMaximiseIcon: true
            },
            dimensions: {
                minItemWidth: 240,
                minItemHeight: 50
            },
            labels: {
                close: "Close",
                maximise: "Maximize",
                minimise: "Minimize"
            },
            content: [{
                type: "row", content: [
                    { type: "react-component", id: "inspector", component: "inspector", componentName: "Inspector", title: "Inspector", width: 20, isClosable: false, props: {
                        editor: this
                    } },
                    { type: "column", content: [
                        { type: "react-component", id: "preview", component: "preview", componentName: "Preview", title: "Preview", isClosable: false, props: {
                            editor: this
                        } },
                        { type: "stack", id: "edit-panel", componentName: "edit-panel", content: [
                            { type: "react-component", id: "assets", component: "assets", componentName: "Assets", title: "Assets", width: 10, isClosable: false, props: {
                                editor: this
                            } },
                        ] },
                    ] },
                    { type: "stack", content: [
                        { type: "react-component", id: "graph", component: "graph", componentName: "Graph", title: "Graph", width: 2, isClosable: false, props: {
                            editor: this
                        } },
                    ] }
                ]
            }],
        }, $("#BABYLON-EDITOR-LAYOUT"));

        // Register layout events
        this.layout.on("componentCreated", (c) => c.container.on("resize", () => this.resize()));

        // Register components
        this.layout.registerComponent("inspector", Inspector);
        this.layout.registerComponent("preview", Preview);
        this.layout.registerComponent("assets", Assets);
        this.layout.registerComponent("graph", Graph);

        // Retrieve preview layout state for plugins.
        const loadedPluginsItem = localStorage.getItem("babylonjs-editor-loaded-plugins");
        if (loadedPluginsItem) {
            Editor._loadedPlugins = JSON.parse(loadedPluginsItem);
            for (const key in Editor._loadedPlugins) {
                const plugin = require(Editor._loadedPlugins[key].path);
                this.layout.registerComponent(key, plugin.default);
            }
        }

        try {
            this.layout.init();
        } catch (e) {
            this._resetEditor();
        }

        // Don't forget to listen closing plugins
        for (const key in Editor._loadedPlugins) {
            const item = this.layout.root.getItemsById(key)[0];
            if (item) { item["container"].on("destroy", () => delete Editor._loadedPlugins[key]); }
        }

        // Init!
        setTimeout(async () => {
            try {
                await this._init();
            } catch (e) {
                this._resetEditor();
            }
        }, 0);
    }

    /**
     * Resizes the editor.
     */
    public resize(): void {
        this.engine!.resize();
        this.inspector.resize();
        this.resizeObservable.notifyObservers();
    }

    /**
     * Returns the current size of the panel identified by the given id.
     * @param panelId the id of the panel to retrieve its size.
     */
    public getPanelSize(panelId: string): ISize {
        const panel = this.layout.root.getItemsById(panelId)[0].element as any;
        return { width: panel.width(), height: panel.height() };
    }

    /**
     * Adds a new task feedback (typically when saving the project).
     * @param amount the amount of progress for the task in interval [0; 100].
     * @param message the message to show.
     */
    public addTaskFeedback(amount: number, message: string): string {
        const key = this._toaster?.show(this._renderTaskFeedback(amount, message));
        if (!key) { throw "Can't create a new task feedback" }

        this._taskFeedbacks[key] = { amount, message };
        return key;
    }

    /**
     * Updates the task feedback identified by the given key.
     * @param key the key that identifies the task feedback.
     * @param amount the new amount of the progress bar.
     * @param message the new message to show.
     */
    public updateTaskFeedback(key: string, amount: number, message?: string): void {
        const task = this._taskFeedbacks[key];
        if (task === undefined) { throw "Can't update an unexisting feedback."; }

        task.message = message ?? task.message;
        this._toaster?.show(this._renderTaskFeedback(amount ?? task.amount, task.message), key);
    }

    /**
     * Closes the toast identified by the given id.
     * @param key the key of the existing toast.
     * @param timeout the time in Ms to wait before dismiss.
     */
    public closeTaskFeedback(key: string, timeout: number = 0): void {
        setTimeout(() => {
            this._toaster?.dismiss(key);
            delete this._taskFeedbacks[key];
        }, timeout);
    }

    /**
     * Runs the project.
     */
    public async runProject(): Promise<void> {
        // TODO.
    }

    /**
     * Inits the launch of the editor's project.
     */
    private async _init(): Promise<void> {
        // Create Babylon.JS stuffs
        this.engine = new Engine(document.getElementById("renderCanvas") as HTMLCanvasElement, true);
        this.scene = new Scene(this.engine);
        this.scene.activeCamera = SceneSettings.Camera ?? SceneSettings.GetArcRotateCamera(this.scene);
        this.engine.runRenderLoop(() => this.scene!.render());

        this._bindEvents();
        this.resize();

        // Hide overlay
        Overlay.Hide();

        // Get opening project
        const projectPath = await Project.GetOpeningProject();
        if (projectPath) { await ProjectImporter.ImportProject(this, projectPath); }

        // Notify!
        this.editorInitializedObservable.notifyObservers();
    }

    /**
     * Renders the
     */
    private _renderTaskFeedback(amount: number, message: string): IToastProps {
        return {
            icon: "cloud-upload",
            timeout: 10000,
            className: Classes.DARK,
            message: (
                <>
                    <p><strong>{message}</strong></p>
                    <ProgressBar
                        intent={amount < 100 ? Intent.PRIMARY : Intent.SUCCESS}
                        value={amount / 100}
                    />
                </>
            ),
        }
    }

    /**
     * Binds the events of the overall editor main events;
     */
    private _bindEvents(): void {
        // Editor events coordinator
        this.selectedNodeObservable.add((o, ev) => {
            this.inspector.setSelectedObject(o);
            if (ev.target !== this.graph) { this.graph.setSelected(o); }
        });

        // Events
        window.addEventListener("resize", () => {
            this.layout.updateSize();
            this.resize();
        });

        // Drag'n'drop
        document.addEventListener("dragover", (ev) => ev.preventDefault());
        document.addEventListener("drop", (ev) => {
            if (!ev.dataTransfer || !ev.dataTransfer.files.length) { return; }

            const files: IFile[] = [];
            const sources = ev.dataTransfer.files;
            for (let i = 0; i < sources.length; i++) {
                const file = sources.item(i);
                if (file) { files.push({ path: file.path, name: file.name } as IFile); }
            }

            if (files.length) { this.assets.addDroppedFiles(ev, files); }
        });

        // Shortcuts
        window.addEventListener("keyup", (ev) => {
            if ((ev.ctrlKey || ev.metaKey) && ev.key === "s") { return ProjectExporter.save(this); }
            if ((ev.ctrlKey || ev.metaKey) && ev.key === "S") { return ProjectExporter.saveAs(this); }

            if ((ev.ctrlKey || ev.metaKey) && ev.key === "z") { return undoRedo.undo(); }
            if (ev.ctrlKey && ev.key === "y") { return undoRedo.redo(); }
            if (ev.metaKey && ev.key === "Z") { return undoRedo.redo(); }
        });

        // State
        window.addEventListener("beforeunload", () => {
            if (this._resetting) { return; }

            const config = this.layout.toConfig();
            this._clearLayoutContent(config.content);

            localStorage.setItem("babylonjs-editor-layout-state", JSON.stringify(config));
            localStorage.setItem("babylonjs-editor-layout-version", Editor.LayoutVersion);
            localStorage.setItem("babylonjs-editor-plugins", JSON.stringify(Editor._loadedPlugins));
        });
    }

    /**
     * Clears the contents of the serialized layout.
     */
    private _clearLayoutContent(content: Nullable<any[]>): void {
        if (!content) { return; }
        content.forEach((c) => {
            if (c.props) { c.props = { }; }
            if (c.componentState) { delete c.componentState; }

            this._clearLayoutContent(c.content);
        });
    }

    /**
     * Configures the contents of the serialized layout.
     */
    private _configureLayourContent(content: Nullable<any[]>): void {
        if (!content) { return; }
        content.forEach((c) => {
            if (c.props) { c.props = { editor: this, id: c.id }; }
            this._configureLayourContent(c.content);
        });
    }

    /**
     * Resets the editor.
     * @hidden
     */
    public _resetEditor(): void {
        this._resetting = true;
        localStorage.removeItem("babylonjs-editor-layout-state");
        localStorage.removeItem("babylonjs-editor-layout-version");
        localStorage.removeItem("babylonjs-editor-plugins");

        window.location.reload();
    }
}
