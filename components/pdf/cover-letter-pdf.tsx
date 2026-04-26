import { Document, Page, Text } from "@react-pdf/renderer"
import { pdfStyles } from "./styles"

export interface CoverLetterPdfDocumentProps {
  resumeName: string
  jobTitle: string
  company?: string | null
  content: string
  generatedAt?: string
}

export function CoverLetterPdfDocument({
  resumeName,
  jobTitle,
  company,
  content,
  generatedAt,
}: CoverLetterPdfDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Cover letter</Text>
        <Text style={pdfStyles.subtitle}>Crackint — exported draft</Text>

        <Text style={pdfStyles.metaRow}>Resume: {resumeName}</Text>
        <Text style={pdfStyles.metaRow}>
          Role: {jobTitle}
          {company ? ` · ${company}` : ""}
        </Text>
        {generatedAt ? (
          <Text style={pdfStyles.metaRow}>Exported: {generatedAt}</Text>
        ) : null}

        <Text style={[pdfStyles.sectionTitle, { marginTop: 16 }]}>Letter</Text>
        <Text style={[pdfStyles.messageBody, { marginTop: 4 }]}>{content}</Text>

        <Text style={pdfStyles.footerNote} fixed>
          Proofread before submitting — this is an AI-assisted draft
        </Text>
      </Page>
    </Document>
  )
}
