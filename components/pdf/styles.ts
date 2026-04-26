import { StyleSheet } from "@react-pdf/renderer"

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.45,
    color: "#111827",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#0f172a",
  },
  subtitle: {
    fontSize: 9,
    color: "#64748b",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 12,
    marginBottom: 6,
    color: "#1e293b",
  },
  metaRow: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 3,
  },
  body: {
    fontSize: 10,
    color: "#334155",
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 4,
  },
  bulletDot: {
    width: 10,
    fontSize: 10,
    color: "#334155",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: "#334155",
  },
  messageBlock: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
  },
  messageMeta: {
    fontSize: 8,
    color: "#64748b",
    marginBottom: 3,
    fontFamily: "Helvetica-Bold",
  },
  messageBody: {
    fontSize: 9,
    color: "#1e293b",
    whiteSpace: "pre-wrap",
  },
  footerNote: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
})
