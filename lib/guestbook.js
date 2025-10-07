import { promises as fs } from 'fs'
import path from 'path'

let cachedRedisClient = null
let redisClientPromise = null

function normalizeEntries(value) {
    if (!Array.isArray(value)) {
        return []
    }

    return value
        .filter(entry => entry && typeof entry === 'object')
        .sort((a, b) => {
            const aTime = new Date(a.createdAt || 0).getTime()
            const bTime = new Date(b.createdAt || 0).getTime()
            return bTime - aTime
        })
}

function isRedisConfigured() {
    return Boolean(process.env.KV_REDIS_URL?.trim())
}

async function getRedisClient() {
    if (!isRedisConfigured()) {
        return null
    }

    if (cachedRedisClient) {
        return cachedRedisClient
    }

    if (!redisClientPromise) {
        redisClientPromise = (async () => {
            try {
                const { createClient } = await import('redis')
                const client = createClient({ url: process.env.KV_REDIS_URL })
                client.on('error', error => {
                    console.error('Vercel Redis connection error.', error)
                })
                await client.connect()
                return client
            } catch (error) {
                console.error('Failed to connect to Vercel Redis, falling back to file storage.', error)
                throw error
            }
        })()
    }

    try {
        cachedRedisClient = await redisClientPromise
        return cachedRedisClient
    } catch (error) {
        redisClientPromise = null
        return null
    }
}

function resolveGuestbookFile() {
    const envPath = process.env.GUESTBOOK_DATA_FILE?.trim()

    if (envPath) {
        return path.isAbsolute(envPath) ? envPath : path.join(process.cwd(), envPath)
    }

    return path.join(process.cwd(), 'data', 'guestbook.json')
}

async function ensureFile(filePath) {
    try {
        await fs.access(filePath)
    } catch (error) {
        if (error?.code === 'ENOENT') {
            await fs.mkdir(path.dirname(filePath), { recursive: true })
            await fs.writeFile(filePath, '[]', 'utf8')
        } else {
            throw error
        }
    }
}

export async function readEntries() {
    const redisClient = await getRedisClient()
    if (redisClient) {
        try {
            const stored = await redisClient.get('guestbook:entries')
            if (!stored) {
                return []
            }
            const parsed = JSON.parse(stored)
            return normalizeEntries(parsed)
        } catch (error) {
            console.error('Failed to read guestbook entries from Redis, falling back to file storage.', error)
        }
    }

    const guestbookFile = resolveGuestbookFile()
    await ensureFile(guestbookFile)
    const fileContents = await fs.readFile(guestbookFile, 'utf8')

    try {
        const parsed = JSON.parse(fileContents)
        return normalizeEntries(parsed)
    } catch (error) {
        console.error('Failed to parse guestbook entries, resetting file.', error)
        await fs.writeFile(guestbookFile, '[]', 'utf8')
        return []
    }
}

export async function writeEntries(entries) {
    const redisClient = await getRedisClient()
    if (redisClient) {
        try {
            await redisClient.set('guestbook:entries', JSON.stringify(entries))
            return
        } catch (error) {
            console.error('Failed to write guestbook entries to Redis, falling back to file storage.', error)
        }
    }

    const guestbookFile = resolveGuestbookFile()
    await ensureFile(guestbookFile)
    await fs.writeFile(guestbookFile, JSON.stringify(entries, null, 2) + '\n', 'utf8')
}

export function getGuestbookPath() {
    return resolveGuestbookFile()
}

export function getGuestbookStorageStrategy() {
    if (isRedisConfigured()) {
        return 'vercel-redis'
    }

    return 'filesystem'
}
