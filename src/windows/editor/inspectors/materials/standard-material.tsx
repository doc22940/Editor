import { basename } from "path";

import { StandardMaterial, Mesh, Texture } from "babylonjs";
import { GUI } from "dat.gui";

import { MaterialAssets } from "../../assets/materials";

import { Inspector } from "../../components/inspector";
import { AbstractInspector } from "../abstract-inspector";

export class StandardMaterialInspector extends AbstractInspector<Mesh> {
    private _diffuseTexture: string = "";
    private _bumpTexture: string = "";
    private _specularTexture: string = "";
    private _ambientTexture: string = "";
    private _opacityTexture: string = "";
    private _emissiveTexture: string = "";
    private _lightMapTexture: string = "";

    /**
     * Called on a controller finished changes.
     * @override
     */
    public onControllerFinishChange(): void {
        super.onControllerFinishChange();
        this.editor.assets.refresh(MaterialAssets);
    }

    /**
     * Called on the component did moubnt.
     * @override
     */
    public onUpdate(): void {
        const material = this.selectedObject.material as StandardMaterial;

        this.addCommon(material);
        this.addDiffuse(material);
        this.addBump(material);
        this.addSpecular(material);
        this.addAmbient(material);
        this.addOpacity(material);
        this.addEmissive(material);
        this.addLightMap(material);
    }

    /**
     * Adds the common editable properties.
     * @param material the material to edit.
     */
    protected addCommon(material: StandardMaterial): GUI {
        const common = this.tool!.addFolder("Common");
        common.open();
        common.add(material, "name").name("Name");
        common.add(material, "alpha").min(0).max(1).name("Alpha");
        common.add(material, "wireframe").name("Wire Frame");
        common.add(material, "fogEnabled").name("Fog Enabled");
        common.add(material, "backFaceCulling").name("Back Face Culling");
        common.add(material, "checkReadyOnEveryCall").name("Check Ready On Every Call");
        common.add(material, "checkReadyOnlyOnce").name("Check Ready Only Once");
        common.add(material, "disableDepthWrite").name("Disable Depth Write");
        common.add(material, "needDepthPrePass").name("Need Depth Pre Pass");

        return common;
    }

    /**
     * Adds the diffuse editable properties.
     * @param material the material to edit.
     */
    protected addDiffuse(material: StandardMaterial): GUI {
        const diffuse = this.tool!.addFolder("Diffuse");
        diffuse.open();
        diffuse.add(material, "linkEmissiveWithDiffuse").name("Link Emissive With Diffuse");
        diffuse.add(material, "useAlphaFromDiffuseTexture").name("Use Alpha From Diffuse Texture");

        this._diffuseTexture = material.diffuseTexture?.name ?? "None";
        this.addTexture(diffuse, this, "_diffuseTexture").name("Texture").onChange(() => {
            const texture = this.editor.scene!.textures.find((t) => basename(t.name) === this._diffuseTexture);
            material.diffuseTexture = texture as Texture;
        });

        this.addColor3(diffuse, "Color", material, "diffuseColor");

        return diffuse;
    }

     /**
     * Adds the bump editable properties.
     * @param material the material to edit.
     */
    protected addBump(material: StandardMaterial): GUI {
        const bump = this.tool!.addFolder('Bump');
        bump.open();
        bump.add(material, "invertNormalMapX").name("Invert Normal Map X");
        bump.add(material, "invertNormalMapY").name("Invert Normal Map Y");

        this._bumpTexture = material.bumpTexture?.name ?? "None";
        this.addTexture(bump, this, "_bumpTexture").name("Texture").onChange(() => {
            const texture = this.editor.scene!.textures.find((t) => basename(t.name) === this._bumpTexture);
            material.bumpTexture = texture as Texture;
        });

        bump.add(material, "useParallax").name("Use Parallax");
        bump.add(material, "useParallaxOcclusion").name("Use Parallax Occlusion");
        bump.add(material, "parallaxScaleBias").step(0.001).name("Parallax Scale Bias");

        return bump;
    }

    /**
     * Adds the specular editable properties.
     * @param material the material to edit.
     */
    protected addSpecular(material: StandardMaterial): GUI {
        const specular = this.tool!.addFolder("Specular");
        specular.open();
        specular.add(material, "specularPower").step(0.01).name("Specular Power");
        specular.add(material, "useGlossinessFromSpecularMapAlpha").name("Use Glossiness From Specular Map Alpha");
        specular.add(material, "useReflectionFresnelFromSpecular").name("Use Reflection Fresnel From Specular");
        specular.add(material, "useSpecularOverAlpha").name("Use Specular Over Alpha");

        this._specularTexture = material.specularTexture?.name ?? "None";
        this.addTexture(specular, this, "_specularTexture").name("Texture").onChange(() => {
            const texture = this.editor.scene!.textures.find((t) => basename(t.name) === this._specularTexture);
            material.specularTexture = texture as Texture;
        });

        this.addColor3(specular, "Color", material, "specularColor");

        return specular;
    }

    /**
     * Adds the ambient editable properties.
     * @param material the material to edit.
     */
    protected addAmbient(material: StandardMaterial): GUI {
        const ambient = this.tool!.addFolder("Ambient");
        ambient.open();

        this._ambientTexture = material.ambientTexture?.name ?? "None";
        this.addTexture(ambient, this, "_ambientTexture").name("Texture").onChange(() => {
            const texture = this.editor.scene!.textures.find((t) => basename(t.name) === this._ambientTexture);
            material.ambientTexture = texture as Texture;
        });

        this.addColor3(ambient, "Color", material, "ambientColor");

        return ambient;
    }

    /**
     * Adds the opacity editable properties.
     * @param material the material to edit.
     */
    protected addOpacity(material: StandardMaterial): GUI {
        const opacity = this.tool!.addFolder("Opacity");
        opacity.open();

        this._opacityTexture = material.opacityTexture?.name ?? "None";
        this.addTexture(opacity, this, "_opacityTexture").name("Texture").onChange(() => {
            const texture = this.editor.scene!.textures.find((t) => basename(t.name) === this._opacityTexture);
            material.opacityTexture = texture as Texture;
        });

        return opacity;
    }

    /**
     * Adds the emissive editable properties.
     * @param material the material to edit.
     */
    protected addEmissive(material: StandardMaterial): GUI {
        const emissive = this.tool!.addFolder("Emissive");
        emissive.open();

        this._emissiveTexture = material.emissiveTexture?.name ?? "None";
        this.addTexture(emissive, this, "_emissiveTexture").name("Texture").onChange(() => {
            const texture = this.editor.scene!.textures.find((t) => basename(t.name) === this._emissiveTexture);
            material.emissiveTexture = texture as Texture;
        });

        this.addColor3(emissive, "Color", material, "emissiveColor");

        return emissive;
    }

    /**
     * Adds the light map editable properties.
     * @param material the material to edit.
     */
    protected addLightMap(material: StandardMaterial): GUI {
        const lightMap = this.tool!.addFolder("Light Map");
        lightMap.open();
        lightMap.add(material, "useLightmapAsShadowmap").name("Use Lightmap As Shadowmap");

        this._lightMapTexture = material.lightmapTexture?.name ?? "None";
        this.addTexture(lightMap, this, "_lightMapTexture").name("Texture").onChange(() => {
            const texture = this.editor.scene!.textures.find((t) => basename(t.name) === this._lightMapTexture);
            material.lightmapTexture = texture as Texture;
        });

        return lightMap;
    }
}

Inspector.registerObjectInspector({
    ctor: StandardMaterialInspector,
    ctorNames: ["StandardMaterial"],
    title: "Material",
    isSupported: (o) => o instanceof StandardMaterial || o.material instanceof StandardMaterial,
});
