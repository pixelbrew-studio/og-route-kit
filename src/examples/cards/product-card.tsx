export type ProductCardProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ProductCard({ eyebrow, title, description }: ProductCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#f7f5ef",
        color: "#151515",
        fontFamily: "Inter, Arial, sans-serif",
        padding: 72,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "62%" }}>
        <div style={{ fontSize: 30, letterSpacing: 0, color: "#2f6f62", fontWeight: 700 }}>{eyebrow}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ fontSize: 78, lineHeight: 0.95, fontWeight: 800 }}>{title}</div>
          <div style={{ fontSize: 34, lineHeight: 1.25, color: "#494844" }}>{description}</div>
        </div>
      </div>
      <div
        style={{
          marginLeft: 56,
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "2px solid #d8d2c3",
          background: "#ffffff",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 250 }}>
          <div style={{ height: 24, background: "#2f6f62" }} />
          <div style={{ height: 24, background: "#a5b8ae" }} />
          <div style={{ height: 24, background: "#d8d2c3" }} />
          <div style={{ height: 120, border: "2px solid #151515", marginTop: 18 }} />
        </div>
      </div>
    </div>
  );
}
