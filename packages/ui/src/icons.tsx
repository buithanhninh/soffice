import type { ReactNode } from 'react'

export interface IconProps {
  size?: number
}

function Svg({ size = 16, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function IconSend(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.2 8 13.8 2.6 11 13.4 7.6 9.6z" strokeLinejoin="round" />
      <path d="M7.6 9.6 13.8 2.6" />
    </Svg>
  )
}

export function IconStop(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="4" width="8" height="8" rx="1.5" fill="currentColor" stroke="none" />
    </Svg>
  )
}

/** return/enter arrow (↵) for the icon-only send button */
export function IconEnter(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 3.5v4a2.5 2.5 0 0 1-2.5 2.5H3.5" />
      <path d="M6.5 7 3.5 10l3 3" />
    </Svg>
  )
}


export interface SofficeMarkProps {
  readonly size?: number
  readonly className?: string
  readonly fill?: string
}

/**
 * sOffice brand glyph component.
 * Stylized 'S' ribbon intertwined with stacked AI document sheets and sparkle accents,
 * harmonized with the sOffice brand identity (https://soffice.caqa.io.vn).
 */
export function SofficeMark({
  size = 24,
  className = '',
  fill = 'currentColor',
}: SofficeMarkProps) {
  return (
    <svg
      className={`soffice-mark ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M52 46 L78 26 L86 35 L58 56 Z" fill={fill} opacity="0.35" />
      <path d="M48 44 L74 24 L83 33 L55 54 Z" fill={fill} opacity="0.6" />
      <path d="M44 42 L70 22 L79 31 L51 52 Z" fill={fill} opacity="0.85" />
      <path
        d="M48 18 C33 18 22 27 22 40 C22 49 28 56 38 60 L44 62 C53 66 58 70 58 76 C58 83 51 88 40 88 C30 88 23 83 20 75 L12 80 C17 92 27 98 40 98 C57 98 68 89 68 76 C68 66 61 59 51 55 L45 53 C36 49 32 46 32 40 C32 33 38 28 48 28 C56 28 62 32 65 39 L73 34 C68 24 59 18 48 18 Z"
        fill={fill}
      />
      <path
        d="M78 8 C78 13 81 16 86 16 C81 16 78 19 78 24 C78 19 75 16 70 16 C75 16 78 13 78 8 Z"
        fill={fill}
      />
      <path
        d="M66 10 C66 12.5 67.5 14 70 14 C67.5 14 66 15.5 66 18 C66 15.5 64.5 14 62 14 C64.5 14 66 12.5 66 10 Z"
        fill={fill}
        opacity="0.8"
      />
      <circle cx="88" cy="8" r="2" fill={fill} opacity="0.75" />
    </svg>
  )
}

/** Backward-compatibility alias during rebranding migration */
export const GensparkMark = SofficeMark
