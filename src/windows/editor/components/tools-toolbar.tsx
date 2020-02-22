import * as React from "react";
import { ButtonGroup, Button } from "@blueprintjs/core";

import { Editor } from "../editor";
import { Icon } from "../gui/icon";

export interface IToolbarProps {
    editor: Editor;
}

export class ToolsToolbar extends React.Component<IToolbarProps> {
    private _editor: Editor;

    /**
     * Constructor.
     * @param props the component's props.
     */
    public constructor(props: IToolbarProps) {
        super(props);
        this._editor = props.editor;
    }

    /**
     * Renders the component.
     */
    public render(): React.ReactNode {
        return (
            <ButtonGroup style={{ marginTop: "auto", marginBottom: "auto" }}>
                <Button icon={<Icon src="play.svg"/>} text="Play & Debug Game" onClick={() => this._buttonClicked("playAndDebug")}/>
            </ButtonGroup>
        );
    }

    /**
     * Called on a menu item is clicked.
     */
    private async _buttonClicked(id: string): Promise<void> {
        switch (id) {
            case "playAndDebug": this._editor.runProject(); break;
            default: break;
        }
    }
}
