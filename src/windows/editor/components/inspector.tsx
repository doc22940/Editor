import * as React from "react";
import { Tabs, Tab, TabId } from "@blueprintjs/core";

import { Editor } from "../editor";
import { AbstractInspector } from "../inspectors/abstract-inspector";

import { Tools } from "../tools/tools";
import { Nullable, Undefinable } from "../../../shared/types";

export interface IObjectInspector {
    ctor: (new (props: IObjectInspectorProps) => AbstractInspector<any>);
    ctorNames: string[];
    title: string;
    isSupported?: Undefinable<(obj: any) => boolean>;
    /**
     * The reference to the inspector.
     * @hidden
     */
    _ref?: Undefinable<AbstractInspector<any>>;
    /**
     * @hidden
     */
    _id?: Undefinable<string>;
}

export interface IObjectInspectorProps {
    editor: Editor;
    toolId: string;
    /**
     * The object reference to edit.
     * @hidden
     */
    _objectRef: any;
}

export interface IInspectorProps {
    editor: Editor;
}

export interface IInspectorState {
    selectedObject: any;
    serializationObject: Undefinable<string>;
}

export class Inspector extends React.Component<IInspectorProps, IInspectorState> {
    /**
     * The selected object reference.
     */
    public selectedObject: any = null;

    private _editor: Editor;
    private _firstTabId: TabId = "";
    private _activeTabId: Nullable<TabId> = null;

    private _refHandler = {
        getInspector: (ref: AbstractInspector<any>) => ref && (Inspector._objectInspectorsConfigurations.find((a) => a._id === ref.props.toolId)!._ref = ref),
    };

    private static _objectInspectorsConfigurations: IObjectInspector[] = [];

    /**
     * Registers the given object inspector.
     * @param objectInspectorConfiguration the object inspector configuration.
     */
    public static registerObjectInspector(objectInspectorConfiguration: IObjectInspector): void {
        objectInspectorConfiguration._id = Tools.RandomId();
        this._objectInspectorsConfigurations.push(objectInspectorConfiguration);
    }

    /**
     * Constructor.
     * @param props the component's props.
     */
    public constructor(props: IInspectorProps) {
        super(props);

        this._editor = props.editor;
        this._editor.inspector = this;

        this.state = { selectedObject: null, serializationObject: undefined };
    }

    /**
     * Renders the component.
     */
    public render(): React.ReactNode {
        if (!this.state.selectedObject) { return null; }

        const tabs: JSX.Element[] = [];
        const ctor = Tools.GetConstructorName(this.state.selectedObject);

        this._firstTabId = "";

        Inspector._objectInspectorsConfigurations.forEach((i) => {
            if (i.isSupported) {
                const isSupported = i.isSupported(this.state.selectedObject);
                if (!isSupported) { return; }
            } else {
                const ctorIndex = i.ctorNames.indexOf(ctor);
                if (ctorIndex === -1) { return; }
            }

            const tabId = i._id!
            if (this._firstTabId === "") {
                this._firstTabId = tabId;
            }

            const objectInspector = <i.ctor key={this.state.selectedObject.id} editor={this._editor} _objectRef={this.state.selectedObject} toolId={i._id!} ref={this._refHandler.getInspector} />;
            const tab = <Tab id={tabId} title={i.title} key={i._id!} panel={objectInspector} style={{ height: "100%" }} />;

            tabs.push(tab);
        });

        if (!tabs.find((t) => t.key === this._activeTabId)) {
            this._activeTabId = null;
        }

        if (!tabs.length) {
            return null;
        }

        return (
            <>
                <div id="EDITOR-INSPECTOR" style={{ width: "100%", height: "100%" }}>
                    <Tabs
                        animate={true}
                        id="inspector"
                        key={this.state.serializationObject ?? "inspector"}
                        renderActiveTabPanelOnly={true}
                        vertical={false}
                        children={tabs}
                        onChange={(id) => this._handleActiveTabChanged(id)}
                        selectedTabId={this._activeTabId || this._firstTabId}
                    ></Tabs>
                </div>
            </>
        );
    }

    /**
     * Sets the selected object in the scene or graph to be edited.
     * @param object the selected object reference used by the inspector to be modified.
     */
    public setSelectedObject<T>(object: T): void {
        this.selectedObject = object;
        this.setState({ selectedObject: object });
    }

    /**
     * Refreshes the inspector.
     */
    public refresh(): void {
        this.setState({
            selectedObject: this.selectedObject,
        });
    }

    /**
     * Resizes the inspector.
     */
    public resize(): void {
        Inspector._objectInspectorsConfigurations.forEach((i) => i._ref?.resize());
    }

    /**
     * Called on the user changes the active tab.
     */
    private _handleActiveTabChanged(tabId: TabId): void {
        this._activeTabId = tabId;
        this.forceUpdate();
    }
}
