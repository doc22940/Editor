import * as React from "react";

import { Undefinable } from "../../../shared/types";

export interface IIconProps {
    /**
     * The source of the image. Can be a svg.
     */
    src: string;
    /**
     * Optional style to pass to the img element.
     */
    style?: Undefinable<React.CSSProperties>;
    /**
     * Optional callback called on the user clicks on the icon.
     */
    onClick?: Undefinable<(event: React.MouseEvent<HTMLImageElement, MouseEvent>) => void>;
}

/**
 * Defines the icon
 */
export class Icon extends React.Component<IIconProps> {
    /**
     * Renders the icon component.
     */
    public render(): React.ReactNode {
        return (
            <img
                src={`./css/svg/${this.props.src}`}
                style={{ width: "16px", height: "16px", filter: "invert(1.0)", ...this.props.style }}
                onClick={this.props.onClick}
            ></img>
        );
    }
}
