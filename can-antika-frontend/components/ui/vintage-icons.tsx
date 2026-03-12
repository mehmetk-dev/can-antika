/* ── Vintage SVG İkon Bileşenleri ── */

interface IconProps {
    className?: string
}

export function VintageSearch({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3h6" />
            <path d="M9.5 3v2.5M14.5 3v2.5" />
            <path d="M9 5.5h6" />
            <path d="M9 5.5C7.5 7 6.5 9 6.5 11.5c0 3.5 2.5 6 3.5 7h4c1-1 3.5-3.5 3.5-7 0-2.5-1-4.5-2.5-6" />
            <path d="M8.5 18.5h7" />
            <circle cx="17" cy="13" r="4.5" />
            <path d="M15.5 11.5c.5-.6 1.3-1 2-1" strokeWidth="1" opacity="0.5" />
            <path d="M20.5 16.8L23.5 20" strokeWidth="1.8" />
        </svg>
    )
}

export function VintageHeart({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21C12 21 3 14.5 3 8.5A4.5 4.5 0 0 1 12 6.545 4.5 4.5 0 0 1 21 8.5C21 14.5 12 21 12 21Z" />
            <path d="M9 9c.5-1.5 2-2 3-1.5" strokeWidth="1" opacity="0.4" />
        </svg>
    )
}

export function VintageBasket({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 2L3 7h18l-3-5" />
            <path d="M3 7l1.5 11a2 2 0 0 0 2 1.5h11a2 2 0 0 0 2-1.5L21 7" />
            <path d="M9 11v4M12 11v4M15 11v4" strokeWidth="1" opacity="0.6" />
            <path d="M8 7c0-2 1.5-4 4-4s4 2 4 4" />
        </svg>
    )
}

export function VintageUser({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            <path d="M10 8c0-1 .5-2 2-2" strokeWidth="1" opacity="0.4" />
        </svg>
    )
}

export function VintageLogout({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
        </svg>
    )
}

export function VintagePhone({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z" />
            <path d="M15 5c2.2.5 4 2.3 4.5 4.5" strokeWidth="1" opacity="0.5" />
            <path d="M15 2a9 9 0 0 1 7 7" strokeWidth="1" opacity="0.5" />
        </svg>
    )
}

export function VintageShield({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M12 2L4 6v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V6L12 2Z" />
            <path d="M9 12l2 2 4-4" strokeWidth="1.5" />
        </svg>
    )
}

export function VintageMenuIcon({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 6h16M4 6c0-1 1-2 2-2h12c1 0 2 1 2 2M4 6l-1 1" strokeLinecap="round" />
            <path d="M6 12h12" strokeLinecap="round" />
            <path d="M4 18h16M4 18c0 1 1 2 2 2h12c1 0 2-1 2-2M20 18l1 1" strokeLinecap="round" />
            <circle cx="2" cy="6" r="0.5" fill="currentColor" />
            <circle cx="22" cy="18" r="0.5" fill="currentColor" />
        </svg>
    )
}

export function VintageCorner({ className }: IconProps) {
    return (
        <svg className={className} viewBox="0 0 40 40" fill="none">
            <path d="M0 40V20C0 8.954 8.954 0 20 0h20" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M0 35V25C0 14.507 8.507 6 19 6h16" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
            <circle cx="20" cy="20" r="2" fill="currentColor" opacity="0.3" />
        </svg>
    )
}

export function VintageLocationIcon({ className = "w-6 h-6" }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
            <path d="M9 9c0-1.66 1.34-3 3-3" strokeLinecap="round" />
            <path d="M12 5.5V4M12 14v-1.5M8.5 9H7M17 9h-1.5" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        </svg>
    )
}

export function VintagePhoneIcon({ className = "w-6 h-6" }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="4" width="14" height="16" rx="2" />
            <circle cx="12" cy="10" r="4" />
            <circle cx="12" cy="10" r="1.5" />
            <circle cx="12" cy="6.5" r="0.5" fill="currentColor" />
            <circle cx="15" cy="8" r="0.5" fill="currentColor" />
            <circle cx="15.5" cy="11" r="0.5" fill="currentColor" />
            <circle cx="14" cy="13.5" r="0.5" fill="currentColor" />
            <circle cx="10" cy="13.5" r="0.5" fill="currentColor" />
            <circle cx="8.5" cy="11" r="0.5" fill="currentColor" />
            <circle cx="9" cy="8" r="0.5" fill="currentColor" />
            <path d="M7 17h10" strokeLinecap="round" />
        </svg>
    )
}

export function VintageMailIcon({ className = "w-6 h-6" }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="5" width="18" height="14" rx="1" />
            <path d="M3 5l9 7 9-7" />
            <circle cx="12" cy="15" r="2.5" />
            <path d="M10.5 15h3M12 13.5v3" strokeWidth="1" />
            <path d="M6 8l4 3M18 8l-4 3" strokeWidth="1" opacity="0.4" />
        </svg>
    )
}

export function VintageClockIcon({ className = "w-6 h-6" }: IconProps) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="13" r="9" />
            <circle cx="12" cy="13" r="7" strokeWidth="1" />
            <circle cx="12" cy="3" r="1.5" />
            <path d="M12 4.5V6" />
            <path d="M12 13V9" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 13l3 2" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 7v0.5M12 18.5v0.5M7 13h0.5M16.5 13h0.5" strokeWidth="1" strokeLinecap="round" />
            <text x="12" y="10" textAnchor="middle" fontSize="2" fill="currentColor" stroke="none">XII</text>
            <text x="12" y="18" textAnchor="middle" fontSize="2" fill="currentColor" stroke="none">VI</text>
        </svg>
    )
}
