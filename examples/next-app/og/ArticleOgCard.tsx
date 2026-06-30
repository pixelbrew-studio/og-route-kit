export type ArticleOgCardProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function ArticleOgCard({ eyebrow, title, description }: ArticleOgCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#fbfbf9",
        color: "#111827",
        fontFamily: "Georgia, serif",
        padding: 74,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 28, color: "#5b616e" }}>
        <div>{eyebrow}</div>
        <div>Open Graph</div>
      </div>
      <div style={{ display: "flex", gap: 56, alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 30, width: "70%" }}>
          <div style={{ fontSize: 82, lineHeight: 0.98, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 32, lineHeight: 1.3, color: "#4b5563" }}>{description}</div>
        </div>
        <div style={{ flex: 1, height: 250, borderLeft: "6px solid #111827", background: "#ece7dd" }} />
      </div>
    </div>
  );
}
