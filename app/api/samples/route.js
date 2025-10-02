import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const audioDir = path.join(process.cwd(), 'public', 'audio')
        const files = fs.existsSync(audioDir)
            ? fs.readdirSync(audioDir).filter(f => /\.(wav|mp3|ogg)$/i.test(f))
            : []
        const urls = files.map(f => `/audio/${f}`)
        return NextResponse.json({ files: urls })
    } catch (e) {
        return NextResponse.json({ files: [], error: e?.message || 'err' }, { status: 500 })
    }
}
