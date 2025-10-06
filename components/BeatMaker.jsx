'use client'

import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'

const STEP_OPTIONS = [8, 16, 32]
const baseName = url => url.split('/').pop()?.replace(/\.(wav|mp3|ogg)$/i, '') || url

const SCALES = {
    cMinor: {
        label: 'C Minor',
        notes: ['C4', 'D#4', 'F4', 'G4', 'G#4', 'A#4', 'C5']
    },
    aMinor: {
        label: 'A Minor',
        notes: ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4']
    },
    dMajor: {
        label: 'D Major',
        notes: ['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5']
    },
    fMinor: {
        label: 'F Minor',
        notes: ['F3', 'G3', 'G#3', 'A#3', 'C4', 'C#4', 'D#4', 'F4']
    },
    gMajor: {
        label: 'G Major',
        notes: ['G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F#4', 'G4']
    }
}

const SYNTH_PRESETS = {
    glimmer: {
        label: 'Glimmer Plucks',
        synthOptions: {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.02, decay: 0.15, sustain: 0.15, release: 1.2 }
        },
        filterFrequency: 1400,
        delay: { time: '8n', feedback: 0.25, wet: 0.35 },
        reverb: { decay: 4.5, wet: 0.35 },
        volume: -10
    },
    nebula: {
        label: 'Nebula Keys',
        synthOptions: {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.4, release: 1.8 }
        },
        filterFrequency: 900,
        delay: { time: '4n', feedback: 0.35, wet: 0.4 },
        reverb: { decay: 6, wet: 0.4 },
        volume: -12
    },
    noir: {
        label: 'Noir Bells',
        synthOptions: {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.03, decay: 0.2, sustain: 0.2, release: 1.5 }
        },
        filterFrequency: 1200,
        delay: { time: '8n', feedback: 0.18, wet: 0.3 },
        reverb: { decay: 5.5, wet: 0.32 },
        volume: -14
    },
    aurora: {
        label: 'Aurora Pads',
        synthOptions: {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.4, decay: 0.6, sustain: 0.8, release: 2.5 }
        },
        filterFrequency: 600,
        delay: { time: '2n', feedback: 0.45, wet: 0.45 },
        reverb: { decay: 8, wet: 0.45 },
        volume: -16
    }
}

const getScaleNotes = key => SCALES[key]?.notes || SCALES.cMinor.notes

const LIVE_SYNTH_NOTES = ['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']

const generateSynthPattern = (length, scaleKey, density = 0.4) => {
    const notes = getScaleNotes(scaleKey)
    const pattern = Array.from(
        { length },
        () => (Math.random() < density ? notes[Math.floor(Math.random() * notes.length)] : null)
    )
    if (!pattern.some(Boolean) && notes.length) {
        pattern[0] = notes[0]
    }
    return pattern
}

const getPresetParams = key => {
    const preset = SYNTH_PRESETS[key] || SYNTH_PRESETS.glimmer
    return {
        volume: preset.volume,
        filterFrequency: preset.filterFrequency,
        delayWet: preset.delay.wet ?? 0.3,
        reverbWet: preset.reverb.wet ?? 0.3
    }
}

export default function BeatMaker() {
    const [samples, setSamples] = useState([])
    const [stepsCount, setStepsCount] = useState(16)
    const [tempo, setTempo] = useState(128)
    const [tracks, setTracks] = useState([])
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    const [synthEnabled, setSynthEnabled] = useState(false)
    const [synthPreset, setSynthPreset] = useState('glimmer')
    const [synthScale, setSynthScale] = useState('cMinor')
    const [synthDensity, setSynthDensity] = useState(0.4)
    const [synthPattern, setSynthPattern] = useState(() => generateSynthPattern(16, 'cMinor', 0.4))
    const [synthParams, setSynthParams] = useState(() => getPresetParams('glimmer'))

    const [liveSynthEnabled, setLiveSynthEnabled] = useState(false)
    const [liveSynthWaveform, setLiveSynthWaveform] = useState('sawtooth')
    const [liveSynthVolume, setLiveSynthVolume] = useState(-12)
    const [liveSynthHeldNotes, setLiveSynthHeldNotes] = useState([])
    const [liveSynthEnvelope, setLiveSynthEnvelope] = useState({
        attack: 0.05,
        decay: 0.25,
        sustain: 0.6,
        release: 1.6
    })
    const [liveSynthFilter, setLiveSynthFilter] = useState({
        frequency: 1200,
        resonance: 1.2
    })
    const [liveSynthFx, setLiveSynthFx] = useState({
        chorusWet: 0.25,
        pingPongWet: 0.25,
        pingPongTime: 0.3,
        pingPongFeedback: 0.35,
        reverbWet: 0.35
    })

    const tracksRef = useRef(tracks)
    useEffect(() => { tracksRef.current = tracks }, [tracks])

    const progressRef = useRef({})

    const syncProgressRef = (reset = false) => {
        const next = {}
        tracksRef.current.forEach(tr => {
            const existing = progressRef.current[tr.id]
            next[tr.id] = reset ? 0 : (typeof existing === 'number' ? existing % stepsCountRef.current : 0)
        })
        progressRef.current = next
    }

    const stepsCountRef = useRef(stepsCount)
    useEffect(() => { stepsCountRef.current = stepsCount }, [stepsCount])
    useEffect(() => { syncProgressRef() }, [tracks, stepsCount])

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
        const player = new Tone.Player({ url })
        const hpf = new Tone.Filter(params.hpf ?? 20, 'highpass')
        const lpf = new Tone.Filter(params.lpf ?? 15000, 'lowpass')
        const distortion = new Tone.Distortion(params.distortion ?? 0)
        const bitcrusher = new Tone.BitCrusher(params.bitDepth ?? 8)
        const delay = new Tone.FeedbackDelay(params.delayTime ?? 0.25, params.delayFeedback ?? 0.15)
        delay.wet.value = params.delayWet ?? 0
        const vol = new Tone.Volume(params.volume ?? 0)
        const pan = new Tone.Panner(params.pan ?? 0)
        const reverb = new Tone.Reverb({ decay: 2.5, wet: params.reverb ?? 0.2 })
        player.chain(hpf, lpf, distortion, bitcrusher, delay, vol, pan, reverb, Tone.getDestination())
        player.playbackRate = params.speed || 1
        return { player, hpf, lpf, distortion, bitcrusher, delay, vol, pan, reverb }
    }

    const markLoaded = () => Tone.loaded().then(() =>
        setTracks(t => t.map(x => ({ ...x, loaded: true })))
    )

    const addTrack = url => {
        if (!url) return
        const id = crypto.randomUUID()
        const params = {
            volume: 0,
            pan: 0,
            hpf: 20,
            lpf: 15000,
            reverb: 0.2,
            distortion: 0,
            bitDepth: 8,
            delayWet: 0,
            delayTime: 0.25,
            delayFeedback: 0.15,
            speed: 1
        }
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
        setSynthPattern(prev => {
            const next = Array(n).fill(null)
            for (let i = 0; i < Math.min(n, prev.length); i++) next[i] = prev[i]
            return next
        })
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
            if (key === 'speed') tr.nodes.player.playbackRate = val
            if (key === 'distortion') tr.nodes.distortion.distortion = val
            if (key === 'bitDepth') {
                const rounded = Math.round(val)
                tr.nodes.bitcrusher.bits = rounded
                p.bitDepth = rounded
                return { ...tr, params: p }
            }
            if (key === 'delayWet') tr.nodes.delay.wet.rampTo(val, 0.1)
            if (key === 'delayTime') tr.nodes.delay.delayTime.rampTo(val, 0.1)
            if (key === 'delayFeedback') tr.nodes.delay.feedback.rampTo(val, 0.1)
            return { ...tr, params: p }
        }))

    useEffect(() => { Tone.Transport.bpm.value = tempo }, [tempo])
    const [swing, setSwing] = useState(0)
    useEffect(() => {
        Tone.Transport.swing = swing
        Tone.Transport.swingSubdivision = '8n'
    }, [swing])

    const synthRef = useRef(null)
    const synthNodesRef = useRef(null)
    const synthPatternRef = useRef(synthPattern)
    const synthEnabledRef = useRef(synthEnabled)
    const synthDensityRef = useRef(synthDensity)

    const liveSynthRef = useRef(null)
    const liveSynthNodesRef = useRef(null)
    const liveSynthActiveNotesRef = useRef(new Set())

    useEffect(() => { synthPatternRef.current = synthPattern }, [synthPattern])
    useEffect(() => { synthEnabledRef.current = synthEnabled }, [synthEnabled])
    useEffect(() => { synthDensityRef.current = synthDensity }, [synthDensity])

    const disposeSynth = () => {
        if (synthRef.current) {
            synthRef.current.dispose()
            synthRef.current = null
        }
        if (synthNodesRef.current) {
            Object.values(synthNodesRef.current).forEach(node => node.dispose())
            synthNodesRef.current = null
        }
    }

    const disposeLiveSynth = () => {
        if (liveSynthRef.current) {
            try {
                liveSynthRef.current.releaseAll()
            } catch (e) {
                // ignore release errors when synth already disposed
            }
            liveSynthRef.current.dispose()
            liveSynthRef.current = null
        }
        if (liveSynthNodesRef.current) {
            Object.values(liveSynthNodesRef.current).forEach(node => node.dispose())
            liveSynthNodesRef.current = null
        }
        liveSynthActiveNotesRef.current.clear()
        setLiveSynthHeldNotes([])
    }

    useEffect(() => {
        if (!liveSynthEnabled) {
            disposeLiveSynth()
            return
        }

        if (liveSynthRef.current) return

        const synth = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: liveSynthWaveform },
            envelope: liveSynthEnvelope
        })
        const filter = new Tone.Filter(liveSynthFilter.frequency, 'lowpass')
        filter.Q.value = liveSynthFilter.resonance
        const chorus = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.4, wet: liveSynthFx.chorusWet }).start()
        const pingPong = new Tone.PingPongDelay({
            delayTime: liveSynthFx.pingPongTime,
            feedback: liveSynthFx.pingPongFeedback,
            wet: liveSynthFx.pingPongWet
        })
        const reverb = new Tone.Reverb({ decay: 5, wet: liveSynthFx.reverbWet })
        const volume = new Tone.Volume(liveSynthVolume)

        synth.chain(filter, chorus, pingPong, reverb, volume, Tone.getDestination())

        liveSynthRef.current = synth
        liveSynthNodesRef.current = { filter, chorus, pingPong, reverb, volume }

        return () => disposeLiveSynth()
    }, [liveSynthEnabled])

    useEffect(() => {
        if (!synthEnabled) {
            disposeSynth()
            setSynthParams(getPresetParams(synthPreset))
            return
        }

        const preset = SYNTH_PRESETS[synthPreset] || SYNTH_PRESETS.glimmer
        const params = getPresetParams(synthPreset)
        disposeSynth()
        const synth = new Tone.Synth(preset.synthOptions)
        const filter = new Tone.Filter(params.filterFrequency, 'lowpass')
        const delay = new Tone.FeedbackDelay(preset.delay.time, preset.delay.feedback)
        delay.wet.value = params.delayWet
        const reverb = new Tone.Reverb({ decay: preset.reverb.decay, wet: params.reverbWet })
        const volume = new Tone.Volume(params.volume)
        synth.chain(filter, delay, reverb, volume, Tone.getDestination())
        synthRef.current = synth
        synthNodesRef.current = { filter, delay, reverb, volume }
        setSynthParams(params)

        return () => disposeSynth()
    }, [synthEnabled, synthPreset])

    useEffect(() => {
        const nodes = synthNodesRef.current
        if (!nodes) return
        nodes.volume.volume.rampTo(synthParams.volume, 0.1)
        nodes.filter.frequency.rampTo(synthParams.filterFrequency, 0.1)
        nodes.delay.wet.rampTo(synthParams.delayWet, 0.1)
        nodes.reverb.wet.rampTo(synthParams.reverbWet, 0.1)
    }, [synthParams])

    useEffect(() => {
        if (!liveSynthEnabled || !liveSynthRef.current) return
        liveSynthRef.current.set({ oscillator: { type: liveSynthWaveform } })
    }, [liveSynthEnabled, liveSynthWaveform])

    useEffect(() => {
        if (!liveSynthEnabled || !liveSynthRef.current) return
        liveSynthRef.current.set({ envelope: liveSynthEnvelope })
    }, [liveSynthEnabled, liveSynthEnvelope])

    useEffect(() => {
        const nodes = liveSynthNodesRef.current
        if (!liveSynthEnabled || !nodes) return
        nodes.volume.volume.rampTo(liveSynthVolume, 0.1)
    }, [liveSynthEnabled, liveSynthVolume])

    useEffect(() => {
        const nodes = liveSynthNodesRef.current
        if (!liveSynthEnabled || !nodes) return
        nodes.filter.frequency.rampTo(liveSynthFilter.frequency, 0.1)
        nodes.filter.Q.rampTo(liveSynthFilter.resonance, 0.1)
    }, [liveSynthEnabled, liveSynthFilter])

    useEffect(() => {
        const nodes = liveSynthNodesRef.current
        if (!liveSynthEnabled || !nodes) return
        nodes.chorus.wet.rampTo(liveSynthFx.chorusWet, 0.1)
        nodes.pingPong.wet.rampTo(liveSynthFx.pingPongWet, 0.1)
        nodes.pingPong.delayTime.rampTo(liveSynthFx.pingPongTime, 0.1)
        nodes.pingPong.feedback.rampTo(liveSynthFx.pingPongFeedback, 0.1)
        nodes.reverb.wet.rampTo(liveSynthFx.reverbWet, 0.1)
    }, [liveSynthEnabled, liveSynthFx])

    useEffect(() => () => {
        disposeSynth()
        disposeLiveSynth()
        tracksRef.current.forEach(tr => {
            Object.values(tr.nodes).forEach(node => node.dispose())
        })
        Tone.Transport.stop()
        Tone.Transport.cancel()
    }, [])

    const repeat = time => {
        const step = Math.floor(Tone.Transport.ticks / Tone.Transport.PPQ * 4) % stepsCountRef.current
        setCurrentStep(step)
        const stepDur = Tone.Time('16n').toSeconds()
        tracksRef.current.forEach(tr => {
            if (!tr.loaded) return
            if (tr.steps[step]) tr.nodes.player.start(time)
        })

        if (synthEnabledRef.current && synthRef.current) {
            const pattern = synthPatternRef.current
            if (pattern[step]) {
                synthRef.current.triggerAttackRelease(pattern[step], '8n', time)
            }
        }
    }

    const togglePlay = async () => {
        if (!isPlaying) {
            await Tone.start()
            Tone.Transport.stop()
            Tone.Transport.cancel()
            setCurrentStep(0)
            Tone.Transport.position = 0
            Tone.Transport.scheduleRepeat(repeat, '16n')
            Tone.Transport.start()
        } else {
            Tone.Transport.stop()
            Tone.Transport.cancel()
            setCurrentStep(0)
        }
        setIsPlaying(p => !p)
    }

    const regenerateSynth = () => {
        setSynthPattern(generateSynthPattern(stepsCountRef.current, synthScale, synthDensityRef.current))
    }

    const clearSynthPattern = () => {
        setSynthPattern(Array(stepsCountRef.current).fill(null))
    }

    const cycleSynthNote = idx => {
        const notes = getScaleNotes(synthScale)
        setSynthPattern(prev => {
            const next = [...prev]
            const current = next[idx]
            if (!current) {
                next[idx] = notes[0]
            } else {
                const found = notes.indexOf(current)
                if (found === -1 || found === notes.length - 1) {
                    next[idx] = null
                } else {
                    next[idx] = notes[found + 1]
                }
            }
            return next
        })
    }

    const handleScaleChange = key => {
        setSynthScale(key)
        setSynthPattern(generateSynthPattern(stepsCountRef.current, key, synthDensityRef.current))
    }

    const updateSynthParam = (key, value) => {
        setSynthParams(prev => ({ ...prev, [key]: value }))
    }

    const synthHasNotes = synthPattern.some(Boolean)

    const updateLiveSynthEnvelope = (key, value) => {
        setLiveSynthEnvelope(prev => ({ ...prev, [key]: value }))
    }

    const updateLiveSynthFilter = (key, value) => {
        setLiveSynthFilter(prev => ({ ...prev, [key]: value }))
    }

    const updateLiveSynthFx = (key, value) => {
        setLiveSynthFx(prev => ({ ...prev, [key]: value }))
    }

    const handleLiveSynthNoteDown = async note => {
        if (!liveSynthEnabled || !liveSynthRef.current) return
        try {
            await Tone.start()
        } catch (e) {
            // ignore start rejections when already running
        }
        liveSynthActiveNotesRef.current.add(note)
        setLiveSynthHeldNotes(prev => (prev.includes(note) ? prev : [...prev, note]))
        liveSynthRef.current.triggerAttack(note)
    }

    const handleLiveSynthNoteUp = note => {
        if (!liveSynthEnabled || !liveSynthRef.current) return
        if (!liveSynthActiveNotesRef.current.has(note)) return
        liveSynthActiveNotesRef.current.delete(note)
        setLiveSynthHeldNotes(prev => prev.filter(n => n !== note))
        liveSynthRef.current.triggerRelease(note)
    }

    const handleLiveSynthPointerDown = (note, event) => {
        event.preventDefault()
        handleLiveSynthNoteDown(note)
    }

    const handleLiveSynthPointerUp = (note, event) => {
        event.preventDefault()
        handleLiveSynthNoteUp(note)
    }

    const handleLiveSynthPointerLeave = note => {
        handleLiveSynthNoteUp(note)
    }

    const anyLoading = tracks.some(t => !t.loaded)
    const playDisabled = anyLoading
    const playLabel = anyLoading ? 'Loading…' : isPlaying ? 'Stop' : 'Play'

    return (
        <div className="w-full max-w-6xl mx-auto pt-16 pb-6">
            <div className="flex flex-col items-center gap-4 mb-8">
                <div className="flex flex-wrap justify-center gap-4 items-center">
                    <button onClick={togglePlay} disabled={playDisabled}
                            className={`px-6 py-2 rounded-lg font-semibold transition ${playDisabled
                                ? 'opacity-50 cursor-not-allowed'
                                : isPlaying
                                    ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-700 hover:to-violet-700'
                                    : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700'}`}>
                        {playLabel}
                    </button>

                    <label className="text-sm">Tempo</label>
                    <input type="range" min="70" max="180" value={tempo}
                           onChange={e => setTempo(+e.target.value)}
                           className="w-44 accent-violet-400" />
                    <span>{tempo} BPM</span>

                    <label className="text-sm ml-4">Swing</label>
                    <input type="range" min={0} max={0.6} step={0.01} value={swing}
                           onChange={e => setSwing(Number(e.target.value))}
                           className="w-32 accent-violet-400" />
                    <span>{Math.round(swing * 100)}%</span>

                    <label className="text-sm ml-4">Steps</label>
                    <select value={stepsCount} onChange={e => changeStepsCount(+e.target.value)}
                            className="px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                        {STEP_OPTIONS.map(n => <option key={n}>{n}</option>)}
                    </select>
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
                <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="font-semibold text-emerald-500">Synth Pattern Generator</div>
                        <button onClick={() => setSynthEnabled(v => !v)}
                                className={`px-3 py-1 rounded-md border transition ${synthEnabled
                                    ? 'border-emerald-500 text-emerald-500 hover:bg-emerald-500/10'
                                    : 'border-zinc-400 text-zinc-400 hover:bg-zinc-800/30'}`}>
                            {synthEnabled ? 'Disable Synth' : 'Enable Synth'}
                        </button>
                        <select value={synthPreset} onChange={e => setSynthPreset(e.target.value)}
                                className="px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                            {Object.entries(SYNTH_PRESETS).map(([key, preset]) => (
                                <option key={key} value={key}>{preset.label}</option>
                            ))}
                        </select>
                        <select value={synthScale} onChange={e => handleScaleChange(e.target.value)}
                                className="px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                            {Object.entries(SCALES).map(([key, value]) => (
                                <option key={key} value={key}>{value.label}</option>
                            ))}
                        </select>
                        <button onClick={regenerateSynth}
                                className="px-3 py-1 rounded-md border border-emerald-500 text-emerald-500 hover:bg-emerald-500/10 transition">
                            Generate New Pattern
                        </button>
                        {!synthEnabled && <span className="text-xs text-emerald-400">Enable the synth to hear the pattern.</span>}
                    </div>
                    <table className="w-full border-separate border-spacing-1">
                        <thead>
                        <tr>{Array.from({ length: stepsCount }).map((_, i) => (
                            <th key={i} className="text-[10px] text-zinc-500">{i + 1}</th>
                        ))}</tr>
                        </thead>
                        <tbody>
                        <tr>{synthPattern.map((note, idx) => {
                            const pad = stepsCount > 16 ? 'w-7 h-7' : 'w-8 h-8'
                            const label = note ? note.replace(/\d/g, '') : '—'
                            return (
                                <td key={idx}>
                                    <button onClick={() => cycleSynthNote(idx)}
                                            className={[
                                                pad,
                                                'rounded-md border text-xs font-medium transition',
                                                note ? 'bg-emerald-500/20 border-emerald-400 text-emerald-100' : 'bg-zinc-800 border-zinc-700 text-zinc-400',
                                                currentStep === idx && isPlaying ? 'ring-2 ring-emerald-300' : '',
                                                synthEnabled ? 'hover:bg-emerald-400/20' : 'opacity-70'
                                            ].join(' ')}>
                                        {label}
                                    </button>
                                </td>
                            )
                        })}</tr>
                        </tbody>
                    </table>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <button onClick={clearSynthPattern}
                                disabled={!synthHasNotes}
                                className={`px-3 py-1 rounded-md border transition ${synthHasNotes
                                    ? 'border-zinc-400 text-zinc-800 hover:bg-zinc-200 dark:border-zinc-500 dark:text-zinc-200 dark:hover:bg-zinc-800/50'
                                    : 'border-zinc-300 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500 cursor-not-allowed opacity-60'}`}>
                            Clear Pattern
                        </button>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        <Knob label="Volume (dB)" min={-24} max={6} step={0.5}
                              value={synthParams.volume}
                              onChange={v => updateSynthParam('volume', v)} />
                        <Knob label="Filter (Hz)" min={200} max={8000} step={50}
                              value={synthParams.filterFrequency}
                              onChange={v => updateSynthParam('filterFrequency', v)} />
                        <Knob label="Delay Wet" min={0} max={1} step={0.01}
                              value={synthParams.delayWet}
                              onChange={v => updateSynthParam('delayWet', v)} />
                        <Knob label="Reverb Wet" min={0} max={1} step={0.01}
                              value={synthParams.reverbWet}
                              onChange={v => updateSynthParam('reverbWet', v)} />
                        <Knob label="Note Density" min={0.05} max={0.9} step={0.01}
                              value={synthDensity}
                              onChange={v => {
                                  setSynthDensity(v)
                                  setSynthPattern(generateSynthPattern(stepsCountRef.current, synthScale, v))
                              }} />
                    </div>
                </div>

                <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="font-semibold text-sky-500">Live Synth Playground</div>
                        <button onClick={() => setLiveSynthEnabled(v => !v)}
                                className={`px-3 py-1 rounded-md border transition ${liveSynthEnabled
                                    ? 'border-sky-500 text-sky-500 hover:bg-sky-500/10'
                                    : 'border-zinc-400 text-zinc-400 hover:bg-zinc-800/30'}`}>
                            {liveSynthEnabled ? 'Disable Live Synth' : 'Enable Live Synth'}
                        </button>
                        <select value={liveSynthWaveform}
                                onChange={e => setLiveSynthWaveform(e.target.value)}
                                className="px-3 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                            {['sine', 'triangle', 'square', 'sawtooth', 'fatsawtooth', 'pwm'].map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        {!liveSynthEnabled && (
                            <span className="text-xs text-sky-400">Enable the synth and tap the keys to jam live.</span>
                        )}
                    </div>

                    <div className={`grid gap-4 transition ${liveSynthEnabled ? 'opacity-100' : 'opacity-60'}`}>
                        <div className="flex flex-wrap gap-2">
                            {LIVE_SYNTH_NOTES.map(note => {
                                const label = note.replace(/\d/, '')
                                const active = liveSynthHeldNotes.includes(note)
                                return (
                                    <button
                                        key={note}
                                        onPointerDown={event => handleLiveSynthPointerDown(note, event)}
                                        onPointerUp={event => handleLiveSynthPointerUp(note, event)}
                                        onPointerLeave={() => handleLiveSynthPointerLeave(note)}
                                        onPointerCancel={() => handleLiveSynthPointerLeave(note)}
                                        className={`px-3 py-2 rounded-md border text-sm font-semibold transition ${active
                                            ? 'bg-sky-500/30 border-sky-400 text-sky-100'
                                            : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'}`}>
                                        {label}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                            <Knob label="Volume (dB)" min={-30} max={6} step={0.5}
                                  value={liveSynthVolume}
                                  onChange={setLiveSynthVolume} />
                            <Knob label="Attack (s)" min={0.005} max={1} step={0.005}
                                  value={liveSynthEnvelope.attack}
                                  onChange={v => updateLiveSynthEnvelope('attack', v)} />
                            <Knob label="Decay (s)" min={0.05} max={2} step={0.01}
                                  value={liveSynthEnvelope.decay}
                                  onChange={v => updateLiveSynthEnvelope('decay', v)} />
                            <Knob label="Sustain" min={0} max={1} step={0.01}
                                  value={liveSynthEnvelope.sustain}
                                  onChange={v => updateLiveSynthEnvelope('sustain', v)} />
                            <Knob label="Release (s)" min={0.05} max={4} step={0.05}
                                  value={liveSynthEnvelope.release}
                                  onChange={v => updateLiveSynthEnvelope('release', v)} />
                            <Knob label="Filter (Hz)" min={200} max={8000} step={50}
                                  value={liveSynthFilter.frequency}
                                  onChange={v => updateLiveSynthFilter('frequency', v)} />
                            <Knob label="Resonance (Q)" min={0.1} max={10} step={0.1}
                                  value={liveSynthFilter.resonance}
                                  onChange={v => updateLiveSynthFilter('resonance', v)} />
                            <Knob label="Chorus Mix" min={0} max={1} step={0.01}
                                  value={liveSynthFx.chorusWet}
                                  onChange={v => updateLiveSynthFx('chorusWet', v)} />
                            <Knob label="PingPong Mix" min={0} max={1} step={0.01}
                                  value={liveSynthFx.pingPongWet}
                                  onChange={v => updateLiveSynthFx('pingPongWet', v)} />
                            <Knob label="PingPong Time (s)" min={0.05} max={0.6} step={0.01}
                                  value={liveSynthFx.pingPongTime}
                                  onChange={v => updateLiveSynthFx('pingPongTime', v)} />
                            <Knob label="PingPong Feedback" min={0} max={0.95} step={0.01}
                                  value={liveSynthFx.pingPongFeedback}
                                  onChange={v => updateLiveSynthFx('pingPongFeedback', v)} />
                            <Knob label="Reverb Mix" min={0} max={1} step={0.01}
                                  value={liveSynthFx.reverbWet}
                                  onChange={v => updateLiveSynthFx('reverbWet', v)} />
                        </div>
                    </div>
                </div>

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

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
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
                            <Knob label="Distortion" min={0} max={1} step={0.01}
                                  value={t.params.distortion} onChange={v => setParam(t.id, 'distortion', v)} />
                            <Knob label="Bit Depth" min={1} max={8} step={1}
                                  value={t.params.bitDepth} onChange={v => setParam(t.id, 'bitDepth', v)} />
                            <Knob label="Delay Mix" min={0} max={1} step={0.01}
                                  value={t.params.delayWet} onChange={v => setParam(t.id, 'delayWet', v)} />
                            <Knob label="Delay Time (s)" min={0.05} max={0.6} step={0.01}
                                  value={t.params.delayTime} onChange={v => setParam(t.id, 'delayTime', v)} />
                            <Knob label="Delay Feedback" min={0} max={0.95} step={0.01}
                                  value={t.params.delayFeedback} onChange={v => setParam(t.id, 'delayFeedback', v)} />
                            <Knob label="Playback Rate" min={0.5} max={1.5} step={0.01}
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
                {typeof value === 'number'
                    ? (Number.isInteger(value) ? value : value.toFixed(2))
                    : value}
            </div>
        </div>
    )
}
