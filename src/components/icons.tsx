/** 輕量 inline SVG 圖示（stroke 走 currentColor）。 */
type P = { size?: number };
const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const IconTree = ({ size = 22 }: P) => (
  <svg {...base(size)}>
    <path d="M12 22v-6" />
    <path d="M12 16c-3.5 0-6-2.5-6-5.5C6 7 8.5 4 12 2c3.5 2 6 5 6 8.5 0 3-2.5 5.5-6 5.5Z" fill="currentColor" stroke="none" />
  </svg>
);

export const IconSun = ({ size = 20 }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IconMoon = ({ size = 20 }: P) => (
  <svg {...base(size)}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

export const IconSearch = ({ size = 15 }: P) => (
  <svg {...base(size)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);

export const IconClose = ({ size = 15 }: P) => (
  <svg {...base(size)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const IconFilter = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z" />
  </svg>
);

export const IconInfo = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

export const IconAlert = ({ size = 14 }: P) => (
  <svg {...base(size)}>
    <path d="M12 3 2 20h20L12 3Z" />
    <path d="M12 10v4M12 17h.01" />
  </svg>
);

export const IconLayers = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M12 3 3 8l9 5 9-5-9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </svg>
);
