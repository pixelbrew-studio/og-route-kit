export type ChangelogCardProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ChangelogCard({ eyebrow, title, description }: ChangelogCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#111111",
        color: "#f5f5f0",
        fontFamily: "Inter, Arial, sans-serif",
        padding: 70,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 30, width: "58%" }}>
        <div style={{ fontSize: 30, color: "#78dcca", fontWeight: 700 }}>{eyebrow}</div>
        <div style={{ fontSize: 78, lineHeight: 0.96, fontWeight: 800 }}>{title}</div>
        <div style={{ fontSize: 32, lineHeight: 1.28, color: "#c9c9c3" }}>{description}</div>
      </div>
      <div style={{ marginLeft: 58, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
        {["Typed route factory", "Metadata helper", "Static PNG export"].map((item) => (
          <div
            key={item}
            style={{
              display: "flex",
              alignItems: "center",
              height: 72,
              border: "1px solid #343434",
              padding: "0 26px",
              fontSize: 26,
              background: "#1d1d1b",
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
