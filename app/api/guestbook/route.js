import { readEntries, writeEntries } from '../../../lib/guestbook'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const MAX_NAME_LENGTH = 60
const MAX_DRAWING_SIZE = 750_000 // ~750 KB

function sanitizeInput(value) {
    if (typeof value !== 'string') {
        return ''
    }

    return value.trim()
}

export async function GET() {
    const entries = await readEntries()
    return NextResponse.json(entries, { status: 200 })
}

export async function POST(request) {
    const body = await request.json().catch(() => null)

    if (!body) {
        return NextResponse.json({ error: 'Invalid JSON payload.' }, { status: 400 })
    }

    const name = sanitizeInput(body.name)
    const drawing = typeof body.drawing === 'string' ? body.drawing.trim() : ''

    if (!name || !drawing) {
        return NextResponse.json({ error: 'Both name and drawing are required.' }, { status: 400 })
    }

    if (name.length > MAX_NAME_LENGTH) {
        return NextResponse.json({
            error: `Please keep the name under ${MAX_NAME_LENGTH} characters.`
        }, { status: 400 })
    }

    if (!drawing.startsWith('data:image/png;base64,')) {
        return NextResponse.json({ error: 'Drawings must be submitted as PNG data URLs.' }, { status: 400 })
    }

    const base64 = drawing.split(',')[1] || ''
    if (!base64) {
        return NextResponse.json({ error: 'The drawing data looks empty. Try sketching again.' }, { status: 400 })
    }

    const byteLength = Math.ceil((base64.length * 3) / 4)
    if (byteLength > MAX_DRAWING_SIZE) {
        return NextResponse.json({ error: 'Please keep drawings under 750 KB.' }, { status: 400 })
    }

    const entries = await readEntries()

    const newEntry = {
        id: randomUUID(),
        name,
        drawing,
        createdAt: new Date().toISOString()
    }

    const updatedEntries = [newEntry, ...entries]
    await writeEntries(updatedEntries)

    return NextResponse.json(newEntry, { status: 201 })
}
