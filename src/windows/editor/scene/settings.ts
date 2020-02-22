import { Camera, ArcRotateCamera, Vector3, Scene } from "babylonjs";

import { Nullable } from "../../../shared/types";

export class SceneSettings {
    /**
     * Defines the camera being used by the editor.
     */
    public static Camera: Nullable<Camera> = null;

    /**
     * Returns the editor cameras as an ArcRotateCamera.
     * @param scene the scene where to add the new camera if doesn't exists.
     */
    public static GetArcRotateCamera(scene: Scene): ArcRotateCamera {
        if (this.Camera && this.Camera instanceof ArcRotateCamera) { return this.Camera; }
        if (this.Camera) { this.Camera.dispose(); }

        const camera = new ArcRotateCamera("Editor Camera", 0, 0, 10, Vector3.Zero(), scene);
        camera.attachControl(scene.getEngine().getRenderingCanvas()!, true, false);

        this.Camera = camera;
        scene.activeCamera = this.Camera;

        return this.Camera as ArcRotateCamera;
    }
}