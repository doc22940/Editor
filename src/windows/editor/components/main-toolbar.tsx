
import * as React from "react";
import { ButtonGroup, Button, Popover, Position, Menu, MenuItem, MenuDivider } from "@blueprintjs/core";

import { Undefinable } from "../../../shared/types";

import { Editor } from "../editor";

import { Icon } from "../gui/icon";
import { Confirm } from "../gui/confirm";
import { Overlay } from "../gui/overlay";

import { SceneFactory } from "../scene/factory";

import { ProjectImporter } from "../project/project-importer";
import { ProjectExporter } from "../project/project-exporter";

export interface IToolbarProps {
    editor: Editor;
}

export interface IToolbarState {
    workspaceThemes?: Undefinable<string[]>;
}

export class MainToolbar extends React.Component<IToolbarProps, IToolbarState, IToolbarState> {
    private _editor: Editor;

    /**
     * Constructor.
     * @param props the component's props.
     */
    public constructor(props: IToolbarProps) {
        super(props);

        this._editor = props.editor;
        this._editor.mainToolbar = this;

        this.state = { workspaceThemes: undefined };
    }

    /**
     * Renders the component.
     */
    public render(): React.ReactNode {
        const project =
            <Menu>
                <MenuItem text="Open Project..." icon={<Icon src="save.svg" />} onClick={() => this._menuItemClicked("project:open")} />
                <MenuItem text="Reload Project..." icon={<Icon src="undo.svg" />} onClick={() => this._menuItemClicked("project:reload")} />
                <MenuDivider />
                <MenuItem text="Save Project..." icon={<Icon src="copy.svg" />} onClick={() => this._menuItemClicked("project:save")} />
                <MenuItem text="Save Project As..." icon={<Icon src="copy.svg" />} onClick={() => this._menuItemClicked("project:save-as")} />
            </Menu>;
        const edit =
            <Menu>
                <MenuItem text="Undo" icon={<Icon src="undo.svg" />} onClick={() => this._menuItemClicked("edit:undo")} />
                <MenuItem text="Redo" icon={<Icon src="redo.svg" />} onClick={() => this._menuItemClicked("edit:redo")} />
                <MenuDivider />
                <MenuItem text="Reset Editor..." icon={<Icon src="recycle.svg" />} onClick={() => this._menuItemClicked("edit:reset")} />
            </Menu>;
        const add =
            <Menu>
                <MenuItem text="Point Light" icon={<Icon src="lightbulb.svg" />} onClick={() => this._menuItemClicked("add:pointlight")} />
            </Menu>;
        const addMesh =
            <Menu>
                <MenuItem text="Cube" icon={<Icon src="vector-square.svg" />} onClick={() => this._menuItemClicked("addmesh:cube")} />
                <MenuItem text="Sphere" icon={<Icon src="circle.svg" />} onClick={() => this._menuItemClicked("addmesh:sphere")} />
            </Menu>;

        return (
            <ButtonGroup style={{ marginTop: "auto", marginBottom: "auto" }}>
                <Popover content={project} position={Position.BOTTOM_LEFT}>
                    <Button icon={<Icon src="folder-open.svg"/>} rightIcon="caret-down" text="Project"/>
                </Popover>
                <Popover content={edit} position={Position.BOTTOM_LEFT}>
                    <Button icon={<Icon src="edit.svg"/>} rightIcon="caret-down" text="Edit"/>
                </Popover>
                <Popover content={add} position={Position.BOTTOM_LEFT}>
                    <Button icon={<Icon src="plus.svg"/>} rightIcon="caret-down" text="Add"/>
                </Popover>
                <Popover content={addMesh} position={Position.BOTTOM_LEFT}>
                    <Button icon={<Icon src="plus.svg"/>} rightIcon="caret-down" text="Add Mesh"/>
                </Popover>
                <Button icon={<Icon src="dog.svg"/>} text="Help..." onClick={() => this._menuItemClicked("help")}/>
            </ButtonGroup>
        );
    }

    /**
     * Called on a menu item is clicked.
     */
    private async _menuItemClicked(id: string): Promise<void> {
        // Get event family
        const split = id.split(":");
        const family = split[0];
        const action = split[1];

        // Common id.
        switch (id) {
            // Project
            case "project:open": ProjectImporter.Browse(); break;
            case "project:reload": this._reloadProject(); break;
            case "project:save": ProjectExporter.save(this._editor); break;
            case "project:save-as": ProjectExporter.saveAs(this._editor); break;

            default: break;
        }

        // Add mesh
        if (family === "addmesh") {
            switch (action) {
                case "cube": SceneFactory.AddCube(this._editor); break;
                case "sphere": SceneFactory.AddSphere(this._editor); break;
                default: break;
            }

            return this._editor.graph.refresh();
        }

        // Add light
        if (family === "add") {
            switch (action) {
                case "pointlight": SceneFactory.AddPointLight(this._editor); break;
                default: break;
            }

            return this._editor.graph.refresh();
        }
    }

    /**
     * Called on the user wants to reload the project.
     */
    private async _reloadProject(): Promise<void> {
        if (await Confirm.Show("Reload project?", "Are you sure to reload?")) {
            Overlay.Show("Reloading...", true);
            window.location.reload();
        }
    }
}
