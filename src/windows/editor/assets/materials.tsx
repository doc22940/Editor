import { join } from "path";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { ButtonGroup, Button, Classes, Dialog, FormGroup, InputGroup, MenuItem, Position } from "@blueprintjs/core";
import { Select } from "@blueprintjs/select";

import { Material, Mesh, ShaderMaterial, PickingInfo, Tools as BabylonTools } from "babylonjs";

import { assetsHelper } from "../tools/assets-helper";
import { Tools } from "../tools/tools";

import { Icon } from "../gui/icon";

import { Project } from "../project/project";

import { Assets } from "../components/assets";
import { AbstractAssets, IAssetComponentItem } from "./abstract-assets";

export class MaterialAssets extends AbstractAssets {
    /**
     * Renders the component.
     */
    public render(): React.ReactNode {
        const node = super.render();

        return (
            <>
                <div className={Classes.FILL} key="materials-toolbar" style={{ width: "100%", height: "25px", backgroundColor: "#333333", borderRadius: "10px", marginTop: "5px" }}>
                    <ButtonGroup>
                        <Button key="add-material" icon={<Icon src="plus.svg" />} small={true} text="Add Material..." onClick={() => this._addMaterial()} />
                    </ButtonGroup>
                </div>
                {node}
            </>
        );
    }

    /**
     * Refreshes the component.
     * @override
     */
    public async refresh(): Promise<void> {
        this.items = [];

        const sphere = Mesh.CreateSphere("MaterialsSphere", 32, 1, assetsHelper.scene, false);
        
        for (const material of this.editor.scene!.materials) {
            if (material === this.editor.scene!.defaultMaterial || material instanceof ShaderMaterial) { continue; }

            const copy = material.serialize();
            sphere.material = Material.Parse(copy, assetsHelper.scene, join(Project.DirPath!, "/"));

            const base64 = await assetsHelper.getScreenshot();
            this.items.push({ id: material.name, key: material.id, base64 });
        }

        assetsHelper.reset();

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

        const mesh = pickInfo.pickedMesh;
        if (!mesh || !(mesh instanceof Mesh)) { return; }

        const material = this.editor.scene!.getMaterialByID(item.key);
        if (!material) { return; }

        mesh.material = material;
        this.editor.inspector.refresh();
    }

    /**
     * Adds a new material on the user clicks on the "Add Material..." button in the toolbar.
     */
    private async _addMaterial(): Promise<void> {
        const scope = this;
        const ListSelect = Select.ofType<string>();

        class AddMaterialDialog extends React.Component<{ }, { type: string; }> {
            private _name: string = "";

            constructor(props: { }) {
                super(props);
                this.state = { type: "StandardMaterial" };
            }
            render = () => (
                <Dialog
                    className={Classes.DARK}
                    isOpen={true}
                    usePortal={true}
                    title="Add New Material"
                    enforceFocus={true}
                    onClose={() => {
                        ReactDOM.unmountComponentAtNode(document.getElementById("BABYLON-OVERLAY") as Element);
                    }}
                >
                    <div className={Classes.DIALOG_BODY}>
                        <FormGroup label="Please provide a name for the new material" labelFor="material-name" labelInfo="(required)">
                            <InputGroup id="material-name" placeholder="Name..." autoFocus={true} onChange={(ev) => this._name = ev.target.value} />
                            <ListSelect
                                key="material-type"
                                items={["StandardMaterial", "PBRMaterial"]}
                                itemRenderer={(i, props) => {
                                    if (!props.modifiers.matchesPredicate) { return null; }
                                    return <MenuItem active={props.modifiers.active} disabled={props.modifiers.disabled} label={i} key={i} text={i} onClick={props.handleClick} />
                                }}
                                itemPredicate={(query, i) => i.toLowerCase().indexOf(query.toLowerCase()) !== -1}
                                itemsEqual={(a, b) => a.toLowerCase() === b.toLowerCase()}
                                noResults={<MenuItem disabled={true} text="No Result." />}
                                resetOnClose={true}
                                resetOnQuery={true}
                                resetOnSelect={true}
                                onItemSelect={(i) => this.setState({ type: i })}
                                popoverProps={{
                                    fill: true,
                                    enforceFocus: true,
                                    autoFocus: true,
                                    usePortal: true,
                                    position: Position.BOTTOM,
                                }}
                            >
                                <Button id="material-type" fill={true} rightIcon="caret-down" placeholder="Type..." text={this.state.type} style={{ marginTop: "5px" }} />
                            </ListSelect>
                        </FormGroup>
                    </div>
                    <div className={Classes.DIALOG_FOOTER}>
                        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                            <Button key="add" icon={<Icon src="plus.svg" />} small={true} text="Add" onClick={() => {
                                if (!this._name || !this.state.type) { return; }
                                const ctor = BabylonTools.Instantiate(`BABYLON.${this.state.type}`);
                                const material = new ctor(this._name, scope.editor.scene!);
                                material.id = Tools.RandomId();

                                scope.refresh();
                                ReactDOM.unmountComponentAtNode(document.getElementById("BABYLON-OVERLAY") as Element);
                            }} />
                        </div>
                    </div>
                </Dialog>
            ); 
        }

        ReactDOM.render(<AddMaterialDialog />, document.getElementById("BABYLON-OVERLAY"));
    }
}

Assets.addAssetComponent({
    title: "Materials",
    ctor: MaterialAssets,
});
