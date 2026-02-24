'use client'

import React from 'react'

interface MarkdownRendererProps {
    content: string
    className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    const html = parseMarkdown(content)

    return (
        <div
            className={`markdown-rendered prose prose-zinc dark:prose-invert max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    )
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function parseInline(text: string): string {
    let result = escapeHtml(text)

    // Bold: **text** or __text__
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    result = result.replace(/__(.+?)__/g, '<strong>$1</strong>')

    // Italic: *text* or _text_
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')
    result = result.replace(/_(.+?)_/g, '<em>$1</em>')

    // Strikethrough: ~~text~~
    result = result.replace(/~~(.+?)~~/g, '<del>$1</del>')

    // Inline code: `code`
    result = result.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

    // Links: [text](url)
    result = result.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="markdown-link">$1</a>'
    )

    // Checkbox: - [x] or - [ ]
    result = result.replace(
        /^- \[x\] (.+)/gm,
        '<span class="checkbox checked">☑</span> <span class="checkbox-text done">$1</span>'
    )
    result = result.replace(
        /^- \[ \] (.+)/gm,
        '<span class="checkbox">☐</span> <span class="checkbox-text">$1</span>'
    )

    return result
}

function parseMarkdown(markdown: string): string {
    if (!markdown) return ''

    const lines = markdown.split('\n')
    const result: string[] = []
    let inCodeBlock = false
    let codeContent: string[] = []
    let codeLang = ''
    let inList = false
    let listItems: string[] = []
    let listType: 'ul' | 'ol' = 'ul'
    let inBlockquote = false
    let blockquoteLines: string[] = []

    const flushList = () => {
        if (inList && listItems.length > 0) {
            const tag = listType
            result.push(`<${tag} class="markdown-list">`)
            listItems.forEach((item) => {
                result.push(`<li>${parseInline(item)}</li>`)
            })
            result.push(`</${tag}>`)
            listItems = []
            inList = false
        }
    }

    const flushBlockquote = () => {
        if (inBlockquote && blockquoteLines.length > 0) {
            result.push('<blockquote class="markdown-blockquote">')
            result.push(blockquoteLines.map((l) => `<p>${parseInline(l)}</p>`).join(''))
            result.push('</blockquote>')
            blockquoteLines = []
            inBlockquote = false
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Code blocks (```)
        if (line.trim().startsWith('```')) {
            if (inCodeBlock) {
                result.push(
                    `<pre class="markdown-codeblock"><code class="language-${codeLang}">${escapeHtml(codeContent.join('\n'))}</code></pre>`
                )
                codeContent = []
                codeLang = ''
                inCodeBlock = false
            } else {
                flushList()
                flushBlockquote()
                inCodeBlock = true
                codeLang = line.trim().slice(3).trim() || 'text'
            }
            continue
        }

        if (inCodeBlock) {
            codeContent.push(line)
            continue
        }

        // Blockquote
        if (line.startsWith('> ')) {
            flushList()
            inBlockquote = true
            blockquoteLines.push(line.slice(2))
            continue
        } else if (inBlockquote) {
            flushBlockquote()
        }

        // Horizontal rule
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
            flushList()
            result.push('<hr class="markdown-hr"/>')
            continue
        }

        // Headings
        const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
        if (headingMatch) {
            flushList()
            const level = headingMatch[1].length
            result.push(
                `<h${level} class="markdown-h${level}">${parseInline(headingMatch[2])}</h${level}>`
            )
            continue
        }

        // Unordered list
        const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)/)
        if (ulMatch) {
            if (!inList || listType !== 'ul') {
                flushList()
                inList = true
                listType = 'ul'
            }
            listItems.push(ulMatch[2])
            continue
        }

        // Ordered list
        const olMatch = line.match(/^(\s*)\d+\.\s+(.+)/)
        if (olMatch) {
            if (!inList || listType !== 'ol') {
                flushList()
                inList = true
                listType = 'ol'
            }
            listItems.push(olMatch[2])
            continue
        }

        // If we were in a list but this line isn't a list item
        if (inList) {
            flushList()
        }

        // Empty line
        if (line.trim() === '') {
            result.push('<br/>')
            continue
        }

        // Regular paragraph
        result.push(`<p class="markdown-p">${parseInline(line)}</p>`)
    }

    // Flush remaining
    if (inCodeBlock) {
        result.push(
            `<pre class="markdown-codeblock"><code>${escapeHtml(codeContent.join('\n'))}</code></pre>`
        )
    }
    flushList()
    flushBlockquote()

    return result.join('\n')
}
