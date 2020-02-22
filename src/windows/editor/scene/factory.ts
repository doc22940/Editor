import {
    Mesh, PointLight,
    Vector3,
} from "babylonjs";

import { Editor } from "../editor";
import { Tools } from "../tools/tools";

export class SceneFactory {
    /**
     * Adds a new cube to the scene.
     * @param editor the editor reference.
     */
    public static AddCube(editor: Editor): Mesh {
        const cube = Mesh.CreateBox("New Cube", 1, editor.scene!, false);
        cube.id = Tools.RandomId();
        return cube;
    }

    /**
     * Adds a new sphere to the scene.
     * @param editor the editor reference.
     */
    public static AddSphere(editor: Editor): Mesh {
        const sphere = Mesh.CreateSphere("New Sphere", 32, 1, editor.scene!, false);
        sphere.id = Tools.RandomId();
        return sphere;
    }

    /**
     * Adds a new point light to the scene.
     * @param editor the editor reference.
     */
    public static AddPointLight(editor: Editor): PointLight {
        const light = new PointLight("New Point Light", Vector3.Zero(), editor.scene!);
        light.id = Tools.RandomId();
        return light;
    }
}
