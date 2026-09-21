/* ==========================================================================
   OCEAN-X — icon set

   Line icons on a 20px grid, drawn with currentColor so they inherit the
   state of whatever control they sit inside.
   ========================================================================== */

const base = {
    viewBox: "0 0 20 20",
    width: 18,
    height: 18,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
};

export const IconCrosshair = (props) => (
    <svg {...base} {...props}>
        <circle cx="10" cy="10" r="5.2" />
        <path d="M10 1.8v3.2M10 15v3.2M1.8 10H5M15 10h3.2" />
    </svg>
);

export const IconLayers = (props) => (
    <svg {...base} {...props}>
        <path d="m10 2.8 7 3.7-7 3.7-7-3.7 7-3.7Z" />
        <path d="m3 11 7 3.7 7-3.7" />
    </svg>
);

export const IconPalette = (props) => (
    <svg {...base} {...props}>
        <path d="M10 2.8a7.2 7.2 0 0 0 0 14.4c1 0 1.6-.7 1.6-1.5 0-.9-.7-1.4-.7-2.1 0-.6.5-1.1 1.2-1.1h1.3a3.8 3.8 0 0 0 3.8-3.8c0-3.3-3.2-5.9-7.2-5.9Z" />
        <path d="M6.4 10.6h.01M7.8 7.2h.01M11.4 6.4h.01" strokeWidth="2" />
    </svg>
);

export const IconDepth = (props) => (
    <svg {...base} {...props}>
        <path d="M10 3v10.5" />
        <path d="M6.6 10.4 10 13.8l3.4-3.4" />
        <path d="M3.5 16.8h13" />
    </svg>
);

export const IconAnalysis = (props) => (
    <svg {...base} {...props}>
        <path d="M3.4 2.8v14.4h13.2" />
        <path d="M6.4 13.4V9.8M9.6 13.4V6.6M12.8 13.4v-5" />
    </svg>
);

export const IconIso = (props) => (
    <svg {...base} {...props}>
        <path d="M10 4.2c3.2 0 5.8 1.1 5.8 2.5S13.2 9.2 10 9.2 4.2 8.1 4.2 6.7 6.8 4.2 10 4.2Z" />
        <path d="M4.2 10.4c0 1.4 2.6 2.5 5.8 2.5s5.8-1.1 5.8-2.5" />
        <path d="M4.2 14c0 1.4 2.6 2.5 5.8 2.5s5.8-1.1 5.8-2.5" />
    </svg>
);

export const IconPin = (props) => (
    <svg {...base} {...props}>
        <path d="M10 17.5s5.4-4.9 5.4-9a5.4 5.4 0 1 0-10.8 0c0 4.1 5.4 9 5.4 9Z" />
        <circle cx="10" cy="8.4" r="1.9" />
    </svg>
);

export const IconArea = (props) => (
    <svg {...base} {...props}>
        <path d="M5.4 5.4h9.2v9.2H5.4z" strokeDasharray="2.6 2.2" />
        <path d="M3.6 3.6h1.6v1.6H3.6zM14.8 3.6h1.6v1.6h-1.6zM3.6 14.8h1.6v1.6H3.6zM14.8 14.8h1.6v1.6h-1.6z" />
    </svg>
);

export const IconNumbers = (props) => (
    <svg {...base} {...props}>
        <path d="M4.2 4.2h11.6v11.6H4.2z" />
        <path d="M7.4 7.6h5.2M7.4 10h5.2M7.4 12.4h3" />
    </svg>
);

export const IconClear = (props) => (
    <svg {...base} {...props}>
        <path d="M5.6 5.6l8.8 8.8M14.4 5.6l-8.8 8.8" />
    </svg>
);

export const IconShip = (props) => (
    <svg {...base} {...props}>
        <path d="M4 12.6h12l-1.6 4H5.6z" />
        <path d="M6.4 12.6V7.8h7.2v4.8M10 7.8V4.6" />
    </svg>
);

export const IconUpload = (props) => (
    <svg {...base} {...props}>
        <path d="M10 13.4V4.6M6.6 8 10 4.6 13.4 8" />
        <path d="M3.8 13.4v1.8a1.8 1.8 0 0 0 1.8 1.8h8.8a1.8 1.8 0 0 0 1.8-1.8v-1.8" />
    </svg>
);

export const IconPlus = (props) => (
    <svg {...base} {...props}>
        <path d="M10 4.6v10.8M4.6 10h10.8" />
    </svg>
);

export const IconMinus = (props) => (
    <svg {...base} {...props}>
        <path d="M4.6 10h10.8" />
    </svg>
);

export const IconHome = (props) => (
    <svg {...base} {...props}>
        <circle cx="10" cy="10" r="7.2" />
        <path d="M2.8 10h14.4M10 2.8c1.9 2 3 4.5 3 7.2s-1.1 5.2-3 7.2c-1.9-2-3-4.5-3-7.2s1.1-5.2 3-7.2Z" />
    </svg>
);

export const IconExpand = (props) => (
    <svg {...base} {...props}>
        <path d="M7.4 2.8H2.8v4.6M12.6 2.8h4.6v4.6M12.6 17.2h4.6v-4.6M7.4 17.2H2.8v-4.6" />
    </svg>
);

export const IconArrow = (props) => (
    <svg {...base} {...props}>
        <path d="M4.6 10h10.8M11 5.6 15.4 10 11 14.4" />
    </svg>
);

export const IconClock = (props) => (
    <svg {...base} {...props}>
        <circle cx="10" cy="10" r="7.2" />
        <path d="M10 5.8V10l2.8 1.8" />
    </svg>
);

export const IconBack = (props) => (
    <svg {...base} {...props}>
        <path d="M15.4 10H4.6M9 5.6 4.6 10 9 14.4" />
    </svg>
);
