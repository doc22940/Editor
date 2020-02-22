import * as React from "react";
import { Tooltip, Classes, Position } from "@blueprintjs/core";

import { Editor } from "../editor";
import { ScenePicker } from "../scene/picker";

export interface IPreviewProps {
    /**
     * The editor reference.
     */
    editor: Editor;
}

export interface IPreviewState {
    /**
     * The name of the node which is under the pointer.
     */
    overNodeName: string;
}

export class Preview extends React.Component<IPreviewProps, IPreviewState> {
    /**
     * Defines the scene picker used to get/pick infos from the scene.
     */
    public picker: ScenePicker;

    private _editor: Editor;

    /**
     * Constructor.
     * @param props the component's props.
     */
    public constructor(props: IPreviewProps) {
        super(props);

        this._editor = props.editor;
        this._editor.preview = this;
        this._editor.editorInitializedObservable.addOnce(() => this._createPicker());

        this.state = { overNodeName: "" };
    }

    /**
     * Renders the component.
     */
    public render(): React.ReactNode {
        const toolTipContent =
            <em>
                {this.state.overNodeName}
            </em>;
        
        return (
            <Tooltip className={Classes.TOOLTIP} position={Position.BOTTOM} content={toolTipContent}>
                <canvas id="renderCanvas" style={{ width: "100%", height: "100%", position: "absolute", top: "0", touchAction: "none" }}></canvas>
            </Tooltip>
        );
    }

    /**
     * Creates the scene picker.
     */
    private _createPicker(): void {
        this.picker = new ScenePicker(this._editor);
        this.picker.onNodeOver.add((n) => {
            this.setState({ overNodeName: n.name });
        });
    }
}
