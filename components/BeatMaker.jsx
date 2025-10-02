'use client'

import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import { saveAs } from 'file-saver'

function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels
    const length = buffer.length * numOfChan * 2 + 44
    const arrayBuffer = new ArrayBuffer(length)
    const view = new DataView(arrayBuffer)
    writeUTFBytes(view, 0, 'RIFF')
    view.setUint32(4, 36 + buffer.length * numOfChan * 2, true)
    writeUTFBytes(view, 8, 'WAVE')
    writeUTFBytes(view, 12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numOfChan, true)
    view.setUint32(24, buffer.sampleRate, true)
    view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true)
    view.setUint16(32, numOfChan * 2, true)
    view.setUint16(34, 16, true)
    writeUTFBytes(view, 36, 'data')
    view.setUint32(40, buffer.length * numOfChan * 2, true)
    let offset = 44
    for (let i = 0; i < buffer.length; i++) {
        for (let c = 0; c < numOfChan; c++) {
            let sample = buffer.getChannelData(c)[i]
            sample = Math.max(-1, Math.min(1, sample))
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
            offset += 2
        }
    }
    return arrayBuffer
}

function writeUTFBytes(view, offset, str) {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
}

const STEP_OPTIONS = [8, 16, 32]
const CYCLE_OPTIONS = [1, 2, 4, 8]
const baseName = url => url.split('/').pop()?.replace(/\.(wav|mp3|ogg)$/i, '') || url

export default function BeatMakerPro() {
    const [samples, setSamples] = useState([])
    const [stepsCount, setStepsCount] = useState(16)
    const [tempo, setTempo] = useState(128)
    const [loopCycles, setLoopCycles] = useState(1)
    const [tracks, setTracks] = useState([])
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    const tracksRef = useRef(tracks)
    useEffect(() => { tracksRef.current = tracks }, [tracks])

    const stepsCountRef = useRef(stepsCount)
    useEffect(() => { stepsCountRef.current = stepsCount }, [stepsCount])

    useEffect(() => {
        fetch('/api/samples')
            .then(r => r.json())
            .then(d => {
                const valid = d.files || []
                setSamples(valid)
                setTracks(prev => prev.filter(t => valid.includes(t.sampleUrl)))
            })
            .catch(() => setSamples([]))
    }, [])

    const makeNodes = (url, params) => {
        const player = new Tone.Player(url)
        const hpf = new Tone.Filter(params.hpf, 'highpass')
        const lpf = new Tone.Filter(params.lpf, 'lowpass')
        const vol = new Tone.Volume(params.volume)
        const pan = new Tone.Panner(params.pan)
        const reverb = new Tone.Reverb({ decay: 2.5, wet: params.reverb })
        player.chain(hpf, lpf, vol, pan, reverb, Tone.getDestination())
        return { player, hpf, lpf, vol, pan, reverb }
    }

    const markLoaded = () => Tone.loaded().then(() =>
        setTracks(t => t.map(x => ({ ...x, loaded: true })))
    )

    const addTrack = url => {
        if (!url) return
        const id = crypto.randomUUID()
        const params = { volume: 0, pan: 0, hpf: 20, lpf: 15000, reverb: 0.2, speed: 1 }
        const nodes = makeNodes(url, params)
        setTracks(t => [...t, {
            id,
            name: baseName(url),
            sampleUrl: url,
            steps: Array(stepsCountRef.current).fill(false),
            params,
            nodes,
            loaded: false
        }])
        markLoaded()
    }

    const removeTrack = id =>
        setTracks(t => {
            const tr = t.find(x => x.id === id)
            if (tr) Object.values(tr.nodes).forEach(n => n.dispose())
            return t.filter(x => x.id !== id)
        })

    const changeTrackSample = (id, url) =>
        setTracks(t => t.map(tr => {
            if (tr.id !== id || !url) return tr
            Object.values(tr.nodes).forEach(n => n.dispose())
            const nodes = makeNodes(url, tr.params)
            return { ...tr, sampleUrl: url, name: baseName(url), nodes, loaded: false }
        })) || markLoaded()

    const toggleStep = (id, idx) =>
        setTracks(t => t.map(tr => {
            if (tr.id !== id) return tr
            const steps = [...tr.steps]
            steps[idx] = !steps[idx]
            return { ...tr, steps }
        }))

    const changeStepsCount = n => {
        setStepsCount(n)
        setTracks(t => t.map(tr => {
            const next = Array(n).fill(false)
            for (let i = 0; i < Math.min(n, tr.steps.length); i++) next[i] = tr.steps[i]
            return { ...tr, steps: next }
        }))
        setCurrentStep(0)
    }

    const setParam = (id, key, val) =>
        setTracks(t => t.map(tr => {
            if (tr.id !== id) return tr
            const p = { ...tr.params, [key]: val }
            if (key === 'volume') tr.nodes.vol.volume.rampTo(val, 0.1)
            if (key === 'pan') tr.nodes.pan.pan.rampTo(val, 0.1)
            if (key === 'hpf') tr.nodes.hpf.frequency.rampTo(val, 0.1)
            if (key === 'lpf') tr.nodes.lpf.frequency.rampTo(val, 0.1)
            if (key === 'reverb') tr.nodes.reverb.wet.rampTo(val, 0.1)
            return { ...tr, params: p }
        }))

    useEffect(() => { Tone.Transport.bpm.value = tempo }, [tempo])

    const repeat = time => {
        const step = (Math.floor(Tone.Transport.ticks / Tone.Transport.PPQ * 4)) % stepsCountRef.current
        setCurrentStep(step)
        tracksRef.current.forEach(tr => {
            if (!tr.loaded) return
            if (tr.params.speed === 2) {
                if (step % 2 === 0 && tr.steps[step / 2]) tr.nodes.player.start(time)
            } else {
                if (tr.steps[step]) tr.nodes.player.start(time)
            }
        })
    }

    const togglePlay = async () => {
        if (!isPlaying) {
            await Tone.start()
            Tone.Transport.scheduleRepeat(repeat, '16n')
            Tone.Transport.start()
        } else {
            Tone.Transport.stop()
            Tone.Transport.cancel()
            setCurrentStep(0)
        }
        setIsPlaying(p => !p)
    }

    const allLoaded = tracks.length && tracks.every(t => t.loaded)

    const exportWav = async () => {
        const validTracks = tracksRef.current.filter(t => t.sampleUrl)
        if (!validTracks.length) return

        await Tone.loaded()

        const offTracks = validTracks.map(tr => {
            const player = new Tone.Player(tr.sampleUrl)
            const hpf = new Tone.Filter(tr.params.hpf, 'highpass')
            const lpf = new Tone.Filter(tr.params.lpf, 'lowpass')
            const vol = new Tone.Volume(tr.params.volume)
            const pan = new Tone.Panner(tr.params.pan)
            const rev = new Tone.Reverb({ decay: 2.5, wet: tr.params.reverb })
            player.chain(hpf, lpf, vol, pan, rev, Tone.getDestination())
            return { ...tr, player }
        })

        await Promise.all(offTracks.map(t => t.player.load()))

        const stepDur = Tone.Time('16n').toSeconds()
        const duration = stepsCount * loopCycles * stepDur

        const buffer = await Tone.Offline(() => {
            for (let cycle = 0; cycle < loopCycles; cycle++) {
                for (let step = 0; step < stepsCount; step++) {
                    const tTime = (cycle * stepsCount + step) * stepDur
                    offTracks.forEach(ot => {
                        if (ot.params.speed === 2) {
                            if (step % 2 === 0 && ot.steps[step / 2]) ot.player.start(tTime)
                        } else {
                            if (ot.steps[step]) ot.player.start(tTime)
                        }
                    })
                }
            }
        }, duration)

        if (!buffer) return
        const wav = audioBufferToWav(buffer)
        saveAs(new Blob([wav], { type: 'audio/wav' }), `beat-loop-${loopCycles}x.wav`)
    }

    return (
        <div className="w-full max-w-6xl mx-auto pt-16 pb-6">
            <div className="flex flex-col items-center gap-4 mb-8">
                <div className="flex flex-wrap justify-center gap-4 items-center">
                    <button onClick={togglePlay} disabled={!allLoaded}
                            className={`px-6 py-2 rounded-lg font-semibold transition ${!allLoaded
                                ? 'opacity-50 cursor-not-allowed'
                                : isPlaying
                                    ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-700 hover:to-violet-700'
                                    : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700'}`}>
                        {!allLoaded ? 'Loading…' : isPlaying ? 'Stop' : 'Play'}
                    </button>

                    <label className="text-sm">Tempo</label>
                    <input type="range" min="70" max="180" value={tempo}
                           onChange={e => setTempo(+e.target.value)}
                           className="w-44 accent-violet-400" />
                    <span>{tempo} BPM</span>

                    <label className="text-sm ml-4">Steps</label>
                    <select value={stepsCount} onChange={e => changeStepsCount(+e.target.value)}
                            className="px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                        {STEP_OPTIONS.map(n => <option key={n}>{n}</option>)}
                    </select>

                    <label className="text-sm ml-4">Cycles</label>
                    <select value={loopCycles} onChange={e => setLoopCycles(+e.target.value)}
                            className="px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                        {CYCLE_OPTIONS.map(n => <option key={n}>{n}×</option>)}
                    </select>

                    <button onClick={exportWav} disabled={!tracks.length}
                            className={`px-5 py-2 rounded-lg border transition ${tracks.length
                                ? 'border-violet-500 text-violet-500 hover:bg-violet-500 hover:text-white'
                                : 'opacity-50 cursor-not-allowed border-zinc-400 text-zinc-400'}`}>
                        Download WAV
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
                <span className="text-sm opacity-80">Add Track:</span>
                {samples.map(s => (
                    <button key={s} onClick={() => addTrack(s)}
                            className="px-3 py-1 rounded-full text-sm bg-zinc-200 dark:bg-zinc-700 hover:bg-violet-500 hover:text-white transition">
                        {baseName(s)}
                    </button>
                ))}
                {!samples.length && <span className="text-sm opacity-60">No samples in /public/audio</span>}
            </div>

            <div className="space-y-8">
                {tracks.map(t => (
                    <div key={t.id} className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                        <div className="flex flex-wrap items-center gap-3 mb-5">
                            <div className="font-semibold text-violet-600">{t.name}</div>
                            <select value={t.sampleUrl} onChange={e => changeTrackSample(t.id, e.target.value)}
                                    className="px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                                {samples.map(s => <option key={s} value={s}>{baseName(s)}</option>)}
                            </select>
                            {!t.loaded && <span className="text-xs px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700">Loading…</span>}
                            <button onClick={() => removeTrack(t.id)}
                                    className="ml-auto px-3 py-1 rounded-md bg-red-500 text-white hover:bg-red-600">Remove</button>
                        </div>

                        <div>
                            <table className="w-full border-separate border-spacing-1">
                                <thead>
                                <tr>{Array.from({ length: stepsCount }).map((_, i) => (
                                    <th key={i} className="text-[10px] text-zinc-500">{i + 1}</th>
                                ))}</tr>
                                </thead>
                                <tbody>
                                <tr>{t.steps.map((on, sIdx) => {
                                    const pad = stepsCount > 16 ? 'w-7 h-7' : 'w-8 h-8'
                                    return (
                                        <td key={sIdx}>
                                            <button onClick={() => toggleStep(t.id, sIdx)}
                                                    className={[
                                                        pad,
                                                        'rounded-md transition',
                                                        on
                                                            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400'
                                                            : 'bg-zinc-700 hover:bg-zinc-600',
                                                        currentStep === sIdx && isPlaying ? 'ring-2 ring-fuchsia-400' : '',
                                                        (sIdx % 4 === 0) ? 'outline outline-1 outline-zinc-800/40' : ''
                                                    ].join(' ')} />
                                        </td>
                                    )
                                })}</tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                            <Knob label="Volume (dB)" min={-24} max={6} step={0.5}
                                  value={t.params.volume} onChange={v => setParam(t.id, 'volume', v)} />
                            <Knob label="Pan" min={-1} max={1} step={0.01}
                                  value={t.params.pan} onChange={v => setParam(t.id, 'pan', v)} />
                            <Knob label="High-Pass (Hz)" min={20} max={4000} step={10}
                                  value={t.params.hpf} onChange={v => setParam(t.id, 'hpf', v)} />
                            <Knob label="Low-Pass (Hz)" min={200} max={15000} step={50}
                                  value={t.params.lpf} onChange={v => setParam(t.id, 'lpf', v)} />
                            <Knob label="Reverb Wet" min={0} max={1} step={0.01}
                                  value={t.params.reverb} onChange={v => setParam(t.id, 'reverb', v)} />
                            <Knob label="Speed (×)" min={1} max={2} step={1}
                                  value={t.params.speed} onChange={v => setParam(t.id, 'speed', v)} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function Knob({ label, min, max, step, value, onChange }) {
    return (
        <div className="flex flex-col items-start">
            <div className="text-sm mb-1">{label}</div>
            <input type="range" min={min} max={max} step={step} value={value}
                   onChange={e => onChange(Number(e.target.value))}
                   className="w-full accent-violet-400" />
            <div className="text-xs opacity-70 mt-1">
                {typeof value === 'number' ? value.toFixed(2) : value}
            </div>
        </div>
    )
}
