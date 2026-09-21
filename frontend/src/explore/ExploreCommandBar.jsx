import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
    IconAnalysis,
    IconCrosshair,
    IconDepth,
    IconIso,
    IconLayers,
    IconPalette,
    IconUpload,
} from "./ui/Icons.jsx";

import { COMMAND_IDS } from "./lib/layers.js";

/* ==========================================================================
   OCEAN-X — command bar

   A single floating console. Nothing else is permanently on screen: every
   panel in the app is opened from here, which is what keeps the globe clear
   by default.
   ========================================================================== */

const COMMAND_META = {
    location: { label: "Location", Icon: IconCrosshair },
    layers: { label: "Layers", Icon: IconLayers },
    color: { label: "Color", Icon: IconPalette },
    depth: { label: "Depth", Icon: IconDepth },
    analysis: { label: "Analysis", Icon: IconAnalysis },
    isolayer: { label: "IsoLayer", Icon: IconIso },
};

const COMMANDS = COMMAND_IDS.map((id) => ({ id, ...COMMAND_META[id] }));

export default function ExploreCommandBar({
    openCommand,
    onOpenCommand,
    activeTools,
    selectionMode,
    activeLayer,
    onOpenDataUpload,
    onOpenAnalysis,
    onOpenDepthAnalysis,
    children,
}) {
    const barRef = useRef(null);

    /* Click-away and Escape both close the open menu. */
    useEffect(() => {
        if (!openCommand) return undefined;

        const onPointerDown = (event) => {
            if (!barRef.current?.contains(event.target)) onOpenCommand(null);
        };

        const onKeyDown = (event) => {
            if (event.key === "Escape") onOpenCommand(null);
        };

        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [openCommand, onOpenCommand]);

    const subtitleFor = (id) => {
        if (id === "location" && selectionMode) {
            return selectionMode === "point"
                ? "Point"
                : selectionMode === "area"
                  ? "Area"
                  : selectionMode === "argo"
                    ? "Argo / Float"
                    : "Exact";
        }

        if (id === "layers" && activeLayer) return activeLayer.short;

        return null;
    };

    return (
        <div className="ox-commandbar" ref={barRef}>
            <div className="ox-commandbar__brand">
                <span className="ox-commandbar__mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="25" height="25">
                        <circle
                            cx="12"
                            cy="12"
                            r="8.6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        />
                        <path
                            d="M3.8 9.8c3.8 2.2 12.6 2.2 16.4 0M3.8 14.2c3.8-2.2 12.6-2.2 16.4 0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.3"
                            strokeLinecap="round"
                        />
                    </svg>
                </span>
                <strong>OCEAN&#8209;X</strong>
            </div>

            <span className="ox-commandbar__rule" aria-hidden="true" />

            <nav className="ox-commandbar__commands" aria-label="Explore tools">
                {COMMANDS.map(({ id, label, Icon }) => {
                    const open = openCommand === id;
                    const active = activeTools.includes(id);
                    const subtitle = subtitleFor(id);

                    return (
                        <button
                            key={id}
                            type="button"
                            data-command={id}
                            className={`ox-command ${open ? "is-open" : ""} ${
                                active ? "is-active" : ""
                            }`}
                            aria-expanded={open}
                            aria-haspopup={id === "depth" || id === "analysis" ? undefined : "menu"}
                            onClick={() => {
                                if (id === "depth") {
                                    onOpenDepthAnalysis?.();
                                    return;
                                }
                                if (id === "analysis") {
                                    onOpenAnalysis?.();
                                    return;
                                }
                                onOpenCommand(open ? null : id);
                            }}
                        >
                            <Icon />
                            <span className="ox-command__label">
                                {label}
                                {subtitle && (
                                    <span className="ox-command__sub">
                                        {subtitle}
                                    </span>
                                )}
                            </span>
                            <span
                                className={`ox-command__chevron ${open ? "is-open" : ""}`}
                                aria-hidden="true"
                            />
                        </button>
                    );
                })}
            </nav>

            <span className="ox-commandbar__rule" aria-hidden="true" />

            <div className="ox-commandbar__utility">
                <button
                    type="button"
                    className="ox-utility"
                    onClick={onOpenDataUpload}
                    title="Add new data"
                >
                    <IconUpload />
                    <span className="ox-sr">Add new data</span>
                </button>
            </div>

            {children}
        </div>
    );
}

/* --------------------------------------------------------------------------
   MENU — the popover a command opens
   -------------------------------------------------------------------------- */

export function CommandMenu({ command, title, hint, children }) {
    const menuRef = useRef(null);
    const [position, setPosition] = useState({ left: 0, top: 0 });

    const updatePosition = useCallback(() => {
        const menu = menuRef.current;
        const anchor = document.querySelector(
            `.ox-command[data-command="${command}"]`,
        );
        const bar = menu?.closest(".ox-commandbar");

        if (!menu || !anchor || !bar) return;

        const anchorRect = anchor.getBoundingClientRect();
        const barRect = bar.getBoundingClientRect();

        const menuWidth = menu.offsetWidth || 306;
        const desiredLeft =
            anchorRect.left - barRect.left + anchorRect.width / 2;
        const minLeft = 12 + menuWidth / 2;
        const maxLeft = Math.max(
            minLeft,
            barRect.width - 12 - menuWidth / 2,
        );

        setPosition({
            left: Math.min(Math.max(desiredLeft, minLeft), maxLeft),
            top: anchorRect.bottom - barRect.top + 11,
        });
    }, [command]);

    useLayoutEffect(() => {
        updatePosition();

        const handleResize = () => updatePosition();
        window.addEventListener("resize", handleResize);

        const bar = menuRef.current?.closest(".ox-commandbar");
        const observer =
            typeof ResizeObserver !== "undefined" && bar
                ? new ResizeObserver(handleResize)
                : null;

        observer?.observe(bar);

        return () => {
            window.removeEventListener("resize", handleResize);
            observer?.disconnect();
        };
    }, [updatePosition]);

    return (
        <div
            ref={menuRef}
            className="ox-menu"
            role="menu"
            style={{
                "--ox-menu-left": `${position.left}px`,
                "--ox-menu-top": `${position.top}px`,
            }}
        >
            <header className="ox-menu__head">
                <span className="ox-menu__title">{title}</span>
                {hint && <span className="ox-menu__hint">{hint}</span>}
            </header>

            <div className="ox-menu__body">{children}</div>
        </div>
    );
}

export function MenuItem({
    icon,
    label,
    detail,
    active,
    disabled,
    badge,
    onClick,
}) {
    return (
        <button
            type="button"
            role="menuitem"
            className={`ox-menuitem ${active ? "is-active" : ""}`}
            disabled={disabled}
            aria-current={active || undefined}
            onClick={onClick}
        >
            {icon && <span className="ox-menuitem__icon">{icon}</span>}

            <span className="ox-menuitem__copy">
                <span className="ox-menuitem__label">{label}</span>
                {detail && (
                    <span className="ox-menuitem__detail">{detail}</span>
                )}
            </span>

            {badge && <span className="ox-chip">{badge}</span>}
            {active && !badge && (
                <span className="ox-menuitem__state">On</span>
            )}
        </button>
    );
}
