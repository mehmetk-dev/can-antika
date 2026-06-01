import { ImageResponse } from "next/og"

export const alt = "Can Antika"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 48,
          background: "linear-gradient(to bottom right, #1a1a1a, #2d2d2d)",
          color: "#ffffff",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 40,
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: "-0.02em" }}>
          Can Antika
        </div>
        <div style={{ fontSize: 32, color: "#d1a46e" }}>
          Geçmişin Zarafeti
        </div>
        <div style={{ fontSize: 20, color: "#aaaaaa", marginTop: 24 }}>
          1982&apos;den gelen aile tecrübesiyle seçkin antika eserler
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
