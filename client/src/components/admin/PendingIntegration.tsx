export default function PendingIntegration({ tool, description }: { tool: string; description: string }) {
  return (
    <div
      style={{
        border: "1px dashed #cbd5e1",
        borderRadius: 8,
        padding: "16px 20px",
        background: "#fafafa",
        textAlign: "center",
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>Pendente: {tool}</p>
      <p style={{ fontSize: 13, color: "#666" }}>{description}</p>
    </div>
  );
}
