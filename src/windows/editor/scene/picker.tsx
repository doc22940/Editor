import { Observable, Node, Vector2, PointerEventTypes, AbstractMesh } from "babylonjs";

import { Nullable } from "../../../shared/types";

import { Editor } from "../editor";

export class ScenePicker {
    /**
     * Notifies users when the 
     */
    public onNodeOver: Observable<Node> = new Observable<Node>();

    private _editor: Editor;
    private _downMousePosition: Vector2 = Vector2.Zero();
    private _lastSelectedMesh: Nullable<AbstractMesh> = null;

    /**
     * Constructor.
     * @param editor the editor reference.
     */
    public constructor(editor: Editor) {
        this._editor = editor;

        this._bindCanvasEvents();
    }

    /**
     * Returns the reference of the mesh that is under the pointer.
     * @param fastCheck Launch a fast check only using the bounding boxes. Can be set to null.
     */
    public getNodeUnderPointer(fastCheck: boolean = false): Nullable<Node> {
        const scene = this._editor.scene!;
        const pick = scene.pick(scene.pointerX, scene.pointerY, undefined, fastCheck);
        return pick?.pickedMesh ?? null;
    }

    /**
     * Binds all the needed canvas events.
     */
    private _bindCanvasEvents(): void {
        this._editor.scene!.onPointerObservable.add(ev => {
            if (!this._editor.scene!.activeCamera) { return; }
            
            switch (ev.type) {
                case PointerEventTypes.POINTERDOWN: this._onCanvasDown(ev.event); break;
                case PointerEventTypes.POINTERUP: this._onCanvasUp(ev.event); break;
                case PointerEventTypes.POINTERMOVE: this._onCanvasMove(); break;
            }
        });
    }

    /**
     * Called on the pointer is down on the canvas.
     */
    private _onCanvasDown(ev: MouseEvent): void {
        this._downMousePosition.set(ev.offsetX, ev.offsetY);
    }

    /**
     * Called on the pointer is up on the canvas.
     */
    private _onCanvasUp(ev: MouseEvent): void {
        const distance = Vector2.Distance(this._downMousePosition, new Vector2(ev.offsetX, ev.offsetY));
        if (distance > 2) { return; }

        const node = this.getNodeUnderPointer(false);
        if (node) { this._editor.selectedNodeObservable.notifyObservers(node); }
    }

    /**
     * Called on the pointer moves on the canvas.
     */
    private _onCanvasMove(): void {
        const mesh = this.getNodeUnderPointer(true);
        if (!mesh) { return; }

        if (this._lastSelectedMesh) {
            this._lastSelectedMesh.showBoundingBox = false;
            this._lastSelectedMesh.showSubMeshesBoundingBox = false;
            this._lastSelectedMesh = null;
        }

        if (mesh instanceof AbstractMesh) {
            mesh.showBoundingBox = true;
            mesh.showSubMeshesBoundingBox = true;
            this._lastSelectedMesh = mesh;
        }

        this.onNodeOver.notifyObservers(mesh);
    }
}
