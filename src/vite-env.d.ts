/// <reference types="vite/client" />

declare module 'react-draggable' {
    import * as React from 'react';

    export interface DraggableBounds {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
    }

    export interface DraggableProps {
        axis?: 'both' | 'x' | 'y' | 'none';
        bounds?: DraggableBounds | string | false;
        defaultClassName?: string;
        defaultClassNameDragging?: string;
        defaultClassNameDragged?: string;
        defaultPosition?: ControlPosition;
        positionOffset?: PositionOffsetControlPosition;
        position?: ControlPosition;
        scale?: number;
        grid?: [number, number];
        children?: React.ReactNode;
        nodeRef?: React.Ref<HTMLElement>;
        onStart?: DraggableEventHandler;
        onDrag?: DraggableEventHandler;
        onStop?: DraggableEventHandler;
    }

    export interface DraggableEvent {
        target: SVGElement | HTMLElement;
        type: string;
    }

    export type DraggableEventHandler = (e: any, data: DraggableData) => void | false;

    export interface DraggableData {
        node: HTMLElement;
        x: number;
        y: number;
        deltaX: number;
        deltaY: number;
        lastX: number;
        lastY: number;
    }

    export type ControlPosition = { x: number, y: number };
    export type PositionOffsetControlPosition = { x: number | string, y: number | string };

    export default class Draggable extends React.Component<DraggableProps> { }
}
