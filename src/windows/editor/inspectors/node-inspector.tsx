import { Node } from "babylonjs";
import { GUI } from "dat.gui";

import { Inspector } from "../components/inspector";
import { AbstractInspector } from "./abstract-inspector";

export class NodeInspector extends AbstractInspector<Node> {
    /**
     * Called on the component did moubnt.
     * @override
     */
    public onUpdate(): void {
        this.addCommon();
    }

    /**
     * Adds the common editable properties.
     */
    protected addCommon(): GUI {
        const common = this.tool!.addFolder("Common");
        common.open();
        common.add(this.selectedObject, 'name').name('Name');

        return common;
    }
}

Inspector.registerObjectInspector({
    ctor: NodeInspector,
    ctorNames: ["Node"],
    title: "Node",
});
