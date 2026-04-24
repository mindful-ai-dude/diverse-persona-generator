import { jsPDF } from 'jspdf'
import type { Persona, GenerationConfig } from '../types'

/**
 * Triggers a download of a blob as a file.
 */
function downloadBlob(blob: Blob, filename: string) {
  try {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    
    // Dispatch a mouse event for better browser compatibility instead of a simple click()
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    })
    a.dispatchEvent(event)
    
    // Give the browser plenty of time before revoking the URL
    setTimeout(() => {
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    }, 2000)
  } catch (err) {
    console.error('Error in downloadBlob:', err)
    alert('Download failed. See console for details.')
  }
}

/**
 * Gets a formatted timestamp for filenames
 */
function getTimestamp() {
  const now = new Date()
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

/**
 * Exports the population as a plain text file.
 */
export function exportAsText(population: Persona[], config: GenerationConfig) {
  console.log('exportAsText called with', population.length, 'personas')
  try {
    let content = `Diverse Persona Population Export\n`
    content += `Context: ${config.context}\n`
    content += `Generated: ${new Date().toLocaleString()}\n`
    content += `Total Personas: ${population.length}\n`
    content += `===================================================\n\n`

    population.forEach((persona, index) => {
      content += `Persona #${index + 1}: ${persona.name}\n`
      content += `Overview: ${persona.stage1Descriptor}\n`
      content += `Traits: ${persona.traits.join(', ')}\n\n`
      content += `Summary:\n${persona.summary}\n\n`
      content += `Background:\n${persona.background}\n\n`
      
      content += `Diversity Axis Values:\n`
      config.axes.forEach(axis => {
        const val = persona.values[axis.id] || 0
        content += `- ${axis.name}: ${val.toFixed(1)} / 100\n`
      })
      
      content += `---------------------------------------------------\n\n`
    })

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    downloadBlob(blob, `persona-population-${getTimestamp()}.txt`)
  } catch (err) {
    console.error('Error in exportAsText:', err)
    alert('Failed to export TXT: ' + (err instanceof Error ? err.message : String(err)))
  }
}

/**
 * Exports the population as a Markdown file.
 */
export function exportAsMarkdown(population: Persona[], config: GenerationConfig) {
  console.log('exportAsMarkdown called')
  try {
    let content = `# Diverse Persona Population Export\n\n`
    content += `**Context:** ${config.context}\n\n`
    content += `**Generated:** ${new Date().toLocaleString()}\n\n`
    content += `**Total Personas:** ${population.length}\n\n`
    content += `---\n\n`

    population.forEach((persona, index) => {
      content += `## ${index + 1}. ${persona.name}\n\n`
      content += `> **${persona.stage1Descriptor}**\n\n`
      content += `**Traits:** ${persona.traits.map(t => '\`' + t + '\`').join(', ')}\n\n`
      
      content += `### Summary\n${persona.summary}\n\n`
      content += `### Background\n${persona.background}\n\n`
      
      content += `### Diversity Axis Values\n\n`
      content += `| Axis | Value |\n`
      content += `|------|-------|\n`
      config.axes.forEach(axis => {
        const val = persona.values[axis.id] || 0
        content += `| **${axis.name}** | ${val.toFixed(1)} / 100 |\n`
      })
      content += `\n---\n\n`
    })

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    downloadBlob(blob, `persona-population-${getTimestamp()}.md`)
  } catch (err) {
    console.error('Error in exportAsMarkdown:', err)
    alert('Failed to export MD: ' + (err instanceof Error ? err.message : String(err)))
  }
}

/**
 * Exports the population as a beautifully formatted PDF using jsPDF.
 */
export async function exportAsPDF(population: Persona[], config: GenerationConfig) {
  console.log('exportAsPDF called')
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const maxLineWidth = pageWidth - margin * 2
    
    // Custom styling colors
    const primaryColor = '#F5A623' // Amber/Golden to match the theme
    const textColor = '#333333'
    const mutedColor = '#666666'

    // Title Page
    doc.setFontSize(24)
    doc.setTextColor(primaryColor)
    doc.text('Diverse Persona Population', margin, 40)
    
    doc.setFontSize(14)
    doc.setTextColor(textColor)
    doc.text('Context:', margin, 60)
    doc.setFontSize(12)
    doc.setTextColor(mutedColor)
    const contextLines = doc.splitTextToSize(config.context || '', maxLineWidth)
    doc.text(contextLines, margin, 70)
    
    doc.setFontSize(12)
    doc.setTextColor(textColor)
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 90 + (contextLines.length * 6))
    doc.text(`Total Personas: ${population.length}`, margin, 100 + (contextLines.length * 6))

    // Create a page for each persona
    population.forEach((persona, index) => {
      doc.addPage()
      let cursorY = margin
      
      // Header (Name & Avatar Placeholder/Number)
      doc.setFontSize(20)
      doc.setTextColor(primaryColor)
      doc.text(`#${index + 1} - ${persona.name}`, margin, cursorY)
      cursorY += 10
      
      // Descriptor
      doc.setFontSize(12)
      doc.setTextColor(mutedColor)
      doc.text(persona.stage1Descriptor || '', margin, cursorY)
      cursorY += 15
      
      // Summary Section
      doc.setFontSize(14)
      doc.setTextColor(textColor)
      doc.text('Summary', margin, cursorY)
      cursorY += 8
      
      doc.setFontSize(10)
      doc.setTextColor(mutedColor)
      const summaryLines = doc.splitTextToSize(persona.summary || '', maxLineWidth)
      doc.text(summaryLines, margin, cursorY)
      cursorY += summaryLines.length * 5 + 10
      
      // Background Section
      doc.setFontSize(14)
      doc.setTextColor(textColor)
      doc.text('Background', margin, cursorY)
      cursorY += 8
      
      doc.setFontSize(10)
      doc.setTextColor(mutedColor)
      const backgroundLines = doc.splitTextToSize(persona.background || '', maxLineWidth)
      doc.text(backgroundLines, margin, cursorY)
      cursorY += backgroundLines.length * 5 + 10
      
      // Traits
      doc.setFontSize(14)
      doc.setTextColor(textColor)
      doc.text('Traits', margin, cursorY)
      cursorY += 8
      
      doc.setFontSize(10)
      doc.setTextColor(mutedColor)
      const traitsText = (persona.traits || []).join(' • ')
      const traitsLines = doc.splitTextToSize(traitsText, maxLineWidth)
      doc.text(traitsLines, margin, cursorY)
      cursorY += traitsLines.length * 5 + 10
      
      // Diversity Axes
      doc.setFontSize(14)
      doc.setTextColor(textColor)
      doc.text('Diversity Axis Values', margin, cursorY)
      cursorY += 10
      
      doc.setFontSize(10)
      ;(config.axes || []).forEach((axis) => {
        const val = persona.values[axis.id] || 0
        doc.setTextColor(textColor)
        doc.text(axis.name, margin, cursorY)
        doc.setTextColor(mutedColor)
        doc.text(`${val.toFixed(1)} / 100`, margin + 60, cursorY)
        cursorY += 7
      })
    })

    const blob = doc.output('blob')
    downloadBlob(blob, `persona-population-${getTimestamp()}.pdf`)
  } catch (err) {
    console.error('Error in exportAsPDF:', err)
    alert('Failed to export PDF: ' + (err instanceof Error ? err.message : String(err)))
  }
}
