import { Mesh } from "babylonjs";
import { GUI } from "dat.gui";

import { Inspector } from "../components/inspector";
import { NodeInspector } from "./node-inspector";

export class MeshInspector extends NodeInspector {
    /**
     * The selected object reference.
     */
    protected selectedObject: Mesh;

    /**
     * Called on the component did moubnt.
     * @override
     */
    public onUpdate(): void {
        this.addCommon();
        this.addRendering();
        this.addTransforms();
    }

    /**
     * Adds the common editable properties.
     * @override
     */
    protected addCommon(): GUI {
        const common = super.addCommon();
        common.add(this.selectedObject, "isVisible").name("Is Visible");
        common.add(this.selectedObject.metadata, "isPickable").name("Is Pickable");

        return common;
    }

    /**
     * Adds the rendering editable properties
     */
    protected addRendering(): GUI {
        const rendering = this.tool!.addFolder("Rendering");
        rendering.open();
        rendering.add(this.selectedObject, "receiveShadows").name("Receive Shadows");
        rendering.add(this.selectedObject, "applyFog").name("Apply Fog");

        return rendering;
    }

    /**
     * Adds the transforms editable properties.
     */
    protected addTransforms(): GUI {
        const transforms = this.tool!.addFolder("Transforms");
        transforms.open();

        const position = transforms.addFolder("Position");
        position.open();
        position.add(this.selectedObject.position, "x");
        position.add(this.selectedObject.position, "y");
        position.add(this.selectedObject.position, "z");

        const rotation = transforms.addFolder("Rotation");
        rotation.open();
        rotation.add(this.selectedObject.rotation, "x");
        rotation.add(this.selectedObject.rotation, "y");
        rotation.add(this.selectedObject.rotation, "z");

        const scaling = transforms.addFolder("Scaling");
        scaling.open();
        scaling.add(this.selectedObject.scaling, "x");
        scaling.add(this.selectedObject.scaling, "y");
        scaling.add(this.selectedObject.scaling, "z");

        return transforms;
    }
}

Inspector.registerObjectInspector({
    ctor: MeshInspector,
    ctorNames: ["Mesh"],
    title: "Mesh",
});
