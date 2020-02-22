import * as React from "react";
import { Tree } from "antd";
import {
    ContextMenu, Menu, MenuItem, MenuDivider, Classes, Tooltip,
    Position, HotkeysTarget, Hotkeys, Hotkey, InputGroup,
} from "@blueprintjs/core";

import { Nullable, Undefinable } from "../../../shared/types";

import { Node, Scene, Mesh, Light, Camera, TransformNode } from "babylonjs";

import { Editor } from "../editor";
import { Icon } from "../gui/icon";
import { EditableText } from "../gui/editable-text";

import { Tools } from "../tools/tools";
import { undoRedo } from "../tools/undo-redo";

import { SceneSettings } from "../scene/settings";

export interface IGraphProps {
    editor: Editor;
    scene?: Undefinable<Scene>;
}

export interface IGraphState {
    nodes: JSX.Element[];

    expandedNodeIds?: Undefinable<string[]>;
    selectedNodeIds?: Undefinable<string[]>;

    filter: string;
}

@HotkeysTarget
export class Graph extends React.Component<IGraphProps, IGraphState> {
    private _editor: Editor;
    private _firstUpdate: boolean = true;
    private _filter: string = "";

    /**
     * Defines the last selected node in the graph.
     */
    public lastSelectedNode: Nullable<Node> = null;

    /**
     * Constructor.
     * @param props the component's props.
     */
    public constructor(props: IGraphProps) {
        super(props);

        this._editor = props.editor;
        if (!props.scene) { this._editor.graph = this; }

        this.state = { nodes: [], expandedNodeIds: [], selectedNodeIds: [], filter: "" };
    }

    /**
     * Renders the component.
     */
    public render(): JSX.Element {
        if (!this.state.nodes.length) { return null!; }

        return (
            <>
                <InputGroup className={Classes.FILL} leftIcon={"search"} type="search" placeholder="Search..." onChange={(e) => this._handleFilterChanged(e.target.value)}></InputGroup>
                <div style={{ width: "100%", height: "calc(100% - 55px)", overflow: "auto" }}>
                    <Tree.DirectoryTree
                        className="draggable-tree"
                        draggable={true}
                        multiple={true}
                        showIcon={true}
                        checkable={false}
                        key={"Graph"}
                        style={{ height: "calc(100% - 32px)" }}
                        blockNode={true}
                        expandedKeys={this.state.expandedNodeIds}
                        onExpand={(k) => this._handleExpandedNode(k as string[])}
                        onRightClick={(e) => this._handleNodeContextMenu(e.event, e.node)}
                        onSelect={(k) => this._handleSelectedNodes(k as string[])}
                        autoExpandParent={false}
                        selectedKeys={this.state.selectedNodeIds}
                        expandAction="doubleClick"
                        onDragEnter={(n) => this._handleDragEnter(n)}
                        onDrop={(i) => this._handleDrop(i)}
                    >
                        {this.state.nodes}
                    </Tree.DirectoryTree>
                </div>
            </>
        );
    }

    /**
     * Renders the hotkeys for the graph component;
     */
    public renderHotkeys(): JSX.Element {
        return (
            <Hotkeys>
                <Hotkey
                    group="graph-shortcuts"
                    combo="del"
                    label="Delete the selected node(s)."
                    onKeyDown={() => this._handleRemoveNode()}
                />
                <Hotkey
                    group="graph-shortcuts"
                    combo="f2"
                    label="Rename the selected node."
                    onKeyDown={() => this._handleRemoveNode()}
                />
            </Hotkeys>
        );
    }

    /**
     * Refreshes the graph.
     * @param done called on the refresh process finished.
     */
    public refresh(done?: Undefinable<() => void>): void {
        const nodes = this._parseScene();
        const expandedNodeIds = this._firstUpdate ? this.state.expandedNodeIds : undefined;

        this.setState({ nodes, expandedNodeIds }, () => done && done());
        this._firstUpdate = false;
    }

    /**
     * Clears the graph.
     */
    public clear(): void {
        this.setState({ nodes: [], selectedNodeIds: [], expandedNodeIds: [] });
        this._firstUpdate = true;
    }

    /**
     * Selecs the given node in the graph.
     * @param node the node to select in the graph.
     */
    public setSelected(node: Node): void {
        let expanded = this.state.expandedNodeIds?.slice();
        if (expanded) {
            let parent = node.parent;
            while (parent) {
                const pid = parent.id;
                if (expanded.indexOf(pid) === -1) { expanded.push(pid); }

                parent = parent.parent;
            }
        }

        this.lastSelectedNode = node;
        this.setState({
            selectedNodeIds: [node.id],
            expandedNodeIds: expanded ?? undefined,
        });
    }

    /**
     * Refreshes the graph and selects the given node. Mainly used by assets.
     * @param node the node to select in the graph.
     */
    public refreshAndSelect(node: Node): void {
        this.refresh(() => {
            setTimeout(() => this.setSelected(node));
        });
    }

    /**
     * Clones the given node.
     * @param node the node to clone.
     */
    public cloneNode(node: Node): Node {
        if (node instanceof Mesh) { return node.clone(`${node.name} Cloned`, node.parent, false, true); }
        if (node instanceof Light) { return node.clone(`${node.name} Cloned`)!; }
        if (node instanceof Camera) { return node.clone(`${node.name} Cloned`); }
        if (node instanceof TransformNode) { return node.clone(`${node.name} Cloned`, node.parent, false)!; }

        return null!;
    }

    /**
     * Removes the given node.
     * @param node the node to remove.
     */
    public removeNode(node: Node): void {
        let array: Nullable<Node[]> = null;

        if (node instanceof Mesh) {
            array = this._editor.scene!.meshes;
        } else if (node instanceof Light) {
            array = this._editor.scene!.lights;
        } else if (node instanceof Camera) {
            array = this._editor.scene!.cameras;
        } else if (node instanceof TransformNode) {
            array = this._editor.scene!.transformNodes;
        }

        if (!array) { return; }
        
        undoRedo.push({
            common: () => setTimeout(() => this.refresh(), 0),
            redo: () => {
                const index = array!.indexOf(node);
                if (index === -1) { return; }
                array!.splice(index, 1);
            },
            undo: () => {
                array!.push(node);
            },
        });
    }

    /**
     * Called on the user wants to filter the nodes.
     */
    private _handleFilterChanged(filter: string): void {
        this._filter = filter;
        this.setState({ filter, nodes: this._parseScene() });
    }

    /**
     * Returns the game instance used by the graph.
     */
    private get _scene(): Scene {
        return this.props.scene ?? this._editor.scene!;
    }

    /**
     * Recursively parses the stage to adds the nodes to the props.
     */
    private _parseScene(): JSX.Element[] {
        return [
            <Tree.TreeNode
                active={true}
                expanded={true}
                title={<span>Scene</span>}
                key="scene"
                isLeaf={true}
                icon={<Icon src="camera-retro.svg" />}
            />
        ].concat(this._scene.rootNodes.map((n) => this._parseNode(n)));
    }

    /**
     * Parses the given node and returns the new treenode object.
     * @param node the node to parse.
     */
    private _parseNode(node: Node): JSX.Element {
        node.metadata = node.metadata ?? { };
        if (node instanceof Mesh) {
            node.metadata.isPickable = node.isPickable;
            node.isPickable = true;
        }

        node.id = node.id ?? Tools.RandomId();
        node.name = node.name ?? "Node";

        const ctor = Tools.GetConstructorName(node);
        const name = node.name ?? ctor;

        const style: React.CSSProperties = { marginLeft: "5px" };
        if (node.metadata.doNotExport) {
            style.color = "grey";
            style.textDecoration = "line-through";
        }

        // Filter
        let matchesFilter: boolean = true;
        if (this._filter) {
            const all = Tools.getAllSceneNodes(this._scene);
            matchesFilter = all.find((c) => (c.name ?? Tools.GetConstructorName(c)).toLowerCase().indexOf(this._filter.toLowerCase()) !== -1) !== undefined;
        }

        let children: JSX.Element[] = [];
        if (matchesFilter) {
            children = node.getChildren().map((c: Node) => this._parseNode(c));
        }

        return (
            <Tree.TreeNode
                active={true}
                expanded={true}
                title={
                    <Tooltip
                        content={ctor}
                        position={Position.RIGHT}
                        usePortal={false}
                    >
                        <span style={style}>{name}</span>
                    </Tooltip>
                }
                key={node.id}
                isLeaf={!node.getChildren().length}
                icon={<Icon src={this._getIcon(node)} />}
            >
                {children}
            </Tree.TreeNode>
        );
    }

    /**
     * Returns the appropriate icon according to the given node type.
     * @param node the node reference.
     */
    private _getIcon(node: Node): string {
        if (node instanceof Light) { return "lightbulb.svg"; }
        if (node instanceof Mesh) { return "vector-square.svg"; }
        if (node instanceof Camera) { return "camera.svg"; }
        return "clone.svg";
    }

    /**
     * Called on the user right-clicks on a node.
     * @param graphNode the node being right-clicked in the tree.
     * @param e the event object coming from react.
     */
    private _handleNodeContextMenu(e: React.MouseEvent, graphNode: any): void {
        const node = this._getNodeById(graphNode.key);
        if (!node || node.doNotSerialize || node === SceneSettings.Camera) { return; }

        const name = node.name ?? Tools.GetConstructorName(node);

        ContextMenu.show(
            <Menu className={Classes.DARK}>
                <EditableText
                    value={name}
                    multiline={true}
                    confirmOnEnterKey={true}
                    selectAllOnFocus={true}
                    className={Classes.FILL}
                    onConfirm={(v) => {
                        const oldName = node.name;
                        undoRedo.push({
                            common: () => this.refresh(),
                            redo: () => node.name = v,
                            undo: () => node.name = oldName,
                        });
                    }}
                />
                <MenuDivider />
                <MenuItem text="Clone" icon={<Icon src="clone.svg" />} onClick={() => this._handleClone()} />
                <MenuDivider />
                <MenuItem text="Remove" icon={<Icon src="times.svg" />} onClick={() => this._handleRemoveNode()} />
            </Menu>,
            { left: e.clientX, top: e.clientY }
        );

        const selectedNodeIds = this.state.selectedNodeIds?.slice() ?? [];
        if (selectedNodeIds.indexOf(graphNode.key) !== -1) { return; }
        
        if (e.ctrlKey) {
            selectedNodeIds.push(graphNode.key);
            this.setState({ selectedNodeIds });
        } else {
            this.setState({ selectedNodeIds: [graphNode.key] });
        }
    }

    /**
     * Removes the given node from the graph and destroys its data.
     */
    private _handleRemoveNode(): void {
        if (!this.state.selectedNodeIds) { return; }
        this.state.selectedNodeIds.forEach((id) => {
            const node = this._getNodeById(id);
            if (!node) { return; }

            this.removeNode(node);
        });
    }

    /**
     * Clones all selected nodes.
     */
    private _handleClone(): void {
        if (!this.state.selectedNodeIds) { return; }
        this.state.selectedNodeIds.forEach((id) => {
            const node = this._getNodeById(id);
            if (!node) { return; }

            const clone = this.cloneNode(node);
            clone.id = Tools.RandomId();
        });

        this.refresh();
    }

    /**
     * Called on the user selects keys in the graph.
     */
    private _handleSelectedNodes(keys: string[]): void {
        this.setState({ selectedNodeIds: keys });

        const lastSelected = this._getNodeById(keys[keys.length - 1]);
        if (!lastSelected) { return; }

        this._editor.selectedNodeObservable.notifyObservers(lastSelected, undefined, this);
        this.lastSelectedNode = lastSelected;
    }

    /**
     * Called on the user expands given node keys.
     */
    private _handleExpandedNode(keys: string[]): void {
        this.setState({ expandedNodeIds: keys });
    }

    /**
     * Called on the drag event tries to enter in an existing node.
     */
    // @ts-ignore
    private _handleDragEnter(n: any): void {
        // Nothing to do now.
        // console.log(n);
    }

    /**
     * Called on a node is dropped in the graph.
     */
    private _handleDrop(info: any): void {
        if (!this.state.selectedNodeIds) { return; }

        const source = this._getNodeById(info.dragNode.key);
        if (!source) { return; }

        const target = this._getNodeById(info.node.key);
        if (!target) { return; }

        const all = this.state.selectedNodeIds.map((s) => this._getNodeById(s)).filter((n) => n) as Node[];
        all.forEach((n) => n.parent = target);

        this.refresh();
    }

    /**
     * Returns the node in the stage identified by the given id.
     * @param id the id of the node to find.
     */
    private _getNodeById(id: string): Undefinable<Node> {
        const all = Tools.getAllSceneNodes(this._editor.scene!);
        return all.find((c) => c.id === id);
    }
}
