import { Component } from "react";

/* ==========================================================================
   OCEAN-X — layer error boundary

   The Cesium layer components build large GPU resources from backend
   rasters. If one of them throws, the whole globe would unmount with it.
   Wrapping each layer keeps the failure local: the rest of the scene stays
   interactive and the parent is told which layer went down.
   ========================================================================== */

export default class LayerErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { failed: false };
    }

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidCatch(error) {
        console.error(
            `OCEAN-X: the "${this.props.name}" layer failed to render.`,
            error,
        );

        this.props.onFailure?.(this.props.name, error);
    }

    render() {
        if (this.state.failed) return null;
        return this.props.children;
    }
}
