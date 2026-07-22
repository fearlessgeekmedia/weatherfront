import type { Alert } from "../api";

function severityColor(severity: string): string {
  switch (severity) {
    case "Extreme":
    case "Severe":
      return "red";
    case "Moderate":
      return "yellow";
    case "Minor":
      return "cyan";
    default:
      return "gray";
  }
}

function alertTypeColors(event: string): { fg: string; bg: string } | null {
  const e = event.toLowerCase();
  if (e.includes("warning")) {
    return { fg: "white", bg: "red" };
  }
  if (e.includes("watch")) {
    return { fg: "white", bg: "orange" };
  }
  if (e.includes("advisory")) {
    return { fg: "black", bg: "white" };
  }
  if (e.includes("statement")) {
    return { fg: "black", bg: "yellow" };
  }
  return null;
}

function formatTimeRange(effective: string, expires: string): string {
  const fmt = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };
  return `${fmt(effective)} → ${fmt(expires)}`;
}

export function Alerts({
  alerts,
  selectedIdx,
  expandedId,
  onExpand,
}: {
  alerts: Alert[];
  selectedIdx: number;
  expandedId: string | null;
  onExpand: (id: string) => void;
}) {
  if (!alerts.length) return null;

  return (
    <box title="Alerts" style={{ flexDirection: "column", gap: 1, border: true, padding: 1, flexGrow: 1, flexShrink: 1, minWidth: 1 }}>
      {alerts.map((alert, idx) => {
        const props = alert.properties;
        const colors = alertTypeColors(props.event);
        const isExpanded = expandedId === alert.id;
        const isSelected = idx === selectedIdx;
        const headline = props.headline && props.headline !== props.event ? props.headline : props.event;
        const body = props.description && props.instruction && props.instruction !== props.description ? `${props.description} ${props.instruction}` : (props.description || props.instruction || "");
        const tail = `${formatTimeRange(props.effective, props.expires)} | ${props.areaDesc}`;
        return (
          <box key={alert.id} style={{ flexDirection: "column", gap: 0 }}>
            <text fg={isSelected ? "white" : (colors?.fg ?? severityColor(props.severity))} bg={isSelected ? "blue" : (colors?.bg ?? undefined)}>
              {headline} {isExpanded ? "−" : "+"}
            </text>
            {isExpanded && (
              <>
                {colors ? (
                  <text fg={colors.fg} bg={colors.bg}>
                    {body}
                  </text>
                ) : (
                  <text>{body}</text>
                )}
                {colors ? (
                  <text fg={colors.fg} bg={colors.bg}>
                    {tail}
                  </text>
                ) : (
                  <text fg="gray">{tail}</text>
                )}
              </>
            )}
          </box>
        );
      })}
    </box>
  );
}
