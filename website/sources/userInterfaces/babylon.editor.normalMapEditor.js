var BABYLON;
(function (BABYLON) {
    var EDITOR;
    (function (EDITOR) {
        var NormalMapEditor = (function () {
            // Constructor
            function NormalMapEditor(core, material, key) {
                var _this = this;
                // Texture
                var baseTexture = material[key];
                if (!baseTexture) {
                    EDITOR.GUI.GUIWindow.CreateAlert("An error happened, cannot get base texture... Please report a bug", "Warning");
                    return;
                }
                // Divs
                var layoutID = "BABYLON-NORMAL-MAP-VIEWER";
                var layoutDiv = EDITOR.GUI.GUIElement.CreateElement("div", layoutID);
                var leftDiv = EDITOR.GUI.GUIElement.CreateElement("canvas", "NORMAL-MAP-LEFT", "width: 100%; height: 100%;");
                var rightDiv = EDITOR.GUI.GUIElement.CreateElement("canvas", "NORMAL-MAP-RIGHT", "width: 100%; height: 100%;");
                // Create window
                var window = new EDITOR.GUI.GUIWindow("BABYLON-NORMAL-MAP-EDITOR", core, "Normal Map Generator", layoutDiv);
                window.modal = true;
                window.showMax = true;
                window.buttons = [
                    "Apply",
                    "Close"
                ];
                window.onButtonClicked = function (id) {
                    switch (id) {
                        case "Close":
                            window.close();
                            break;
                        case "Apply":
                            _this._apply(core.currentScene, baseTexture, material);
                            window.close();
                            break;
                    }
                };
                window.buildElement(null);
                // Layouts
                var layout = new EDITOR.GUI.GUILayout(layoutID, core);
                layout.createPanel("LEFT-PANEL", "left", 400, false).setContent(leftDiv);
                layout.createPanel("RIGHT-PANEL", "main", 400, false).setContent(rightDiv);
                layout.buildElement(layoutID);
                // Viewports
                var viewport1 = this._buildViewport($("#NORMAL-MAP-LEFT")[0]);
                var viewport2 = this._buildViewport($("#NORMAL-MAP-RIGHT")[0]);
                // Viewport 1
                var originalTexture = new BABYLON.Texture("file:" + baseTexture.name, viewport1.scene);
                var postProcess1 = new BABYLON.PassPostProcess("originalPostProcess", 1.0, viewport1.camera);
                postProcess1.onApply = function (effect) {
                    effect.setTexture("textureSampler", originalTexture);
                };
                // Viewport 2
                var tempTexture = new BABYLON.Texture("file:" + baseTexture.name, viewport2.scene);
                tempTexture.onLoadObservable.add(function () {
                    var bumpTexture = new BABYLON.NormalMapProceduralTexture("normalMap", Math.max(tempTexture.getSize().width, tempTexture.getSize().height), viewport2.scene);
                    bumpTexture.baseTexture = tempTexture;
                    bumpTexture.refreshRate = 0;
                    var postProcess2 = new BABYLON.PassPostProcess("bumpPostProcess", 1.0, viewport2.camera);
                    postProcess2.onApply = function (effect) {
                        effect.setTexture("textureSampler", bumpTexture);
                    };
                });
                // On close
                window.setOnCloseCallback(function () {
                    viewport1.engine.dispose();
                    viewport2.engine.dispose();
                    layout.destroy();
                    window.destroy();
                });
            }
            // Build a viewport returning an engine
            NormalMapEditor.prototype._buildViewport = function (canvas) {
                var engine = new BABYLON.Engine(canvas);
                var scene = new BABYLON.Scene(engine);
                scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
                var camera = new BABYLON.Camera("camera1", BABYLON.Vector3.Zero(), scene);
                engine.runRenderLoop(function () { return scene.render(); });
                return {
                    engine: engine,
                    scene: scene,
                    camera: camera
                };
            };
            // Applies
            NormalMapEditor.prototype._apply = function (scene, texture, material) {
                // Check if texture exists
                var finalTexture = null;
                for (var i = 0; i < scene.textures.length; i++) {
                    if (scene.textures[i].name === "normal_map" + texture.name.toLowerCase()) {
                        material["bumpTexture"] = scene.textures[i];
                        return;
                    }
                }
                // Create procedural texture
                var bumpTexture = new BABYLON.NormalMapProceduralTexture("normal_map" + texture.name, Math.max(texture.getBaseSize().width, texture.getBaseSize().height), scene, texture, !texture.noMipmap);
                bumpTexture.refreshRate = 0;
                bumpTexture.baseTexture = texture;
                bumpTexture.onGenerated = function () {
                    scene.getEngine().bindFramebuffer(bumpTexture._texture);
                    var array = scene.getEngine().readPixels(0, 0, bumpTexture.getBaseSize().width, bumpTexture.getBaseSize().height);
                    // Render texture in a canvas and then create a file
                    var canvas = document.createElement("canvas");
                    var context = canvas.getContext("2d");
                    if (context) {
                        var imageData = new ImageData(bumpTexture.getBaseSize().width, bumpTexture.getBaseSize().height);
                        for (var i = 0; i < array.length; i += 3) {
                            imageData.data[i] = array[i];
                            imageData.data[i + 1] = array[i + 1];
                            imageData.data[i + 2] = array[i + 2];
                        }
                        context.putImageData(imageData, 0, 0);
                        var base64 = canvas.toDataURL();
                        var finalArray = EDITOR.Tools.ConvertBase64StringToArrayBuffer(base64);
                        var file = EDITOR.Tools.CreateFile(finalArray, bumpTexture.name);
                        BABYLON.FilesInput.FilesTextures[bumpTexture.name.toLowerCase()] = file;
                        finalTexture = new BABYLON.Texture("file:" + bumpTexture.name.toLowerCase(), scene, texture.noMipmap, texture._invertY, texture._samplingMode, null, null, base64, false);
                        finalTexture.name = finalTexture.url = finalTexture.name.replace("file:", "");
                    }
                    // Remove procedural texture and apply final texture on material
                    scene.getEngine().unBindFramebuffer(bumpTexture._texture, false);
                    bumpTexture.dispose();
                    material["bumpTexture"] = finalTexture;
                };
            };
            return NormalMapEditor;
        }());
        EDITOR.NormalMapEditor = NormalMapEditor;
    })(EDITOR = BABYLON.EDITOR || (BABYLON.EDITOR = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.editor.normalMapEditor.js.map
