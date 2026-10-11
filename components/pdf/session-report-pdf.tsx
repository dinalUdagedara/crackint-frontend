import { Document, Page, Text, View } from "@react-pdf/renderer"
import type { SessionReport, StarBreakdown } from "@/types/api.types"
import { pdfStyles } from "./styles"

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <View>
      {items.map((line, i) => (
        <View key={i} style={pdfStyles.bullet} wrap={false}>
          <Text style={pdfStyles.bulletDot}>• </Text>
          <Text style={pdfStyles.bulletText}>{line}</Text>
        </View>
      ))}
    </View>
  )
}

function starLine(star: StarBreakdown): string {
  const part = (label: string, ok: boolean) => `${label}: ${ok ? "yes" : "no"}`
  return [
    part("Situation", star.situation),
    part("Task", star.task),
    part("Action", star.action),
    part("Result", star.result),
  ].join("   ")
}

export interface SessionReportPdfDocumentProps {
  title: string
  jobTitle?: string | null
  report: SessionReport
}

export function SessionReportPdfDocument({ title, jobTitle, report }: SessionReportPdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Session report</Text>
        <Text style={pdfStyles.subtitle}>Crackint — {title}</Text>

        {jobTitle ? <Text style={pdfStyles.metaRow}>Job: {jobTitle}</Text> : null}
        <Text style={pdfStyles.metaRow}>
          Average score: {report.average_score != null ? `${Math.round(report.average_score)} / 100` : "—"}
          {"   "}Answered: {report.questions_answered}
          {"   "}Skipped: {report.questions_skipped}
        </Text>
        <Text style={pdfStyles.metaRow}>
          Generated: {new Date(report.generated_at).toLocaleString()}
        </Text>

        {report.summary ? (
          <>
            <Text style={pdfStyles.sectionTitle}>Summary</Text>
            <Text style={pdfStyles.body}>{report.summary}</Text>
          </>
        ) : null}

        {report.strengths.length ? <Text style={pdfStyles.sectionTitle}>Strengths</Text> : null}
        <BulletList items={report.strengths} />

        {report.weak_topics.length ? <Text style={pdfStyles.sectionTitle}>Practice next</Text> : null}
        <BulletList items={report.weak_topics} />

        <Text style={pdfStyles.sectionTitle}>Questions</Text>
        {report.items.map((item) => (
          <View key={item.index} style={pdfStyles.messageBlock}>
            <Text style={pdfStyles.messageMeta}>
              Q{item.index}
              {item.topic ? ` · ${item.topic}` : ""}
              {item.score != null ? ` · ${item.score}/100` : ""}
              {item.difficulty ? ` · ${item.difficulty}` : ""}
            </Text>
            <Text style={pdfStyles.messageBody}>{item.question}</Text>
            <Text style={pdfStyles.messageMeta}>Your answer</Text>
            <Text style={pdfStyles.messageBody}>{item.answer}</Text>
            <Text style={pdfStyles.messageMeta}>Feedback</Text>
            <Text style={pdfStyles.messageBody}>{item.feedback}</Text>
            {item.star ? (
              <>
                <Text style={pdfStyles.messageMeta}>STAR</Text>
                <Text style={pdfStyles.messageBody}>
                  {starLine(item.star)}
                  {item.star.note ? `\n${item.star.note}` : ""}
                </Text>
              </>
            ) : null}
            {item.model_answer ? (
              <>
                <Text style={pdfStyles.messageMeta}>Model answer</Text>
                <Text style={pdfStyles.messageBody}>{item.model_answer}</Text>
              </>
            ) : null}
          </View>
        ))}

        <Text
          style={pdfStyles.footerNote}
          render={({ pageNumber, totalPages }) => `Crackint · page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}
