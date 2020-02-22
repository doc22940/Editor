export interface IProject {
    /**
     * Defines the list of the files associated to the project.
     */
    filesList: string[];

    /**
     * Defines the list of scene's textures.
     */
    textures: string[];
    /**
     * Defines the list of scene's meshes.
     */
    meshes: string[];
    /**
     * Defines the list of scene's lights
     */
    lights: string[];
    /**
     * Defines all the informations about assets.
     */
    assets: {
        /**
         * Defines all the informations about the meshes assets.
         */
        meshes: string[];
    }
}
