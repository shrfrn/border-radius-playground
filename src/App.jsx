import React, { useState, useCallback, useEffect } from 'react'
import { Link as LinkIcon, Unlink } from 'lucide-react'

// --- Sub-components moved outside to prevent remounting/focus loss ---

const NumberInput = ({ corner, axisIndex, unit, value, onUpdate, onToggleUnit }) => (
	<div className="flex items-center gap-1.5">
		<div className="relative flex items-center">
			<input
				type="number"
				min="0"
				max={unit === '%' ? 100 : (axisIndex === 0 ? 400 : 300)}
				value={value}
				onChange={(e) => onUpdate(corner, axisIndex, e.target.value)}
				className="w-16 bg-white text-xs font-bold text-slate-700 text-left focus:outline-none focus:ring-1 focus:ring-indigo-200 rounded border border-slate-200 hover:border-slate-300 p-1.5 pl-2.5 selection:bg-indigo-100 transition-all"
			/>
		</div>
		<button
			onClick={() => onToggleUnit(corner, axisIndex)}
			className="px-2 py-1.5 text-[10px] font-black bg-slate-50 text-slate-500 rounded border border-slate-200 hover:bg-indigo-100 hover:text-indigo-600 transition-colors uppercase min-w-[34px] shadow-sm flex items-center justify-center"
		>
			{unit}
		</button>
	</div>
)

const CornerControls = ({ corner, label, positionClass, isVisible, radii, units, linked, onUpdate, onToggleUnit, onToggleLink }) => {
	if (!isVisible) return null
	const r = radii ?? {}
	const u = units ?? {}
	const l = linked ?? {}
	const isLinked = l[corner]
	const hUnit = u[corner]?.[0] ?? 'px'
	const vUnit = u[corner]?.[1] ?? 'px'

	return (
		<div className={`absolute flex flex-col gap-4 p-5 bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-xl z-20 w-[280px] transition-all duration-300 ${positionClass}`}>
			<div className="flex items-center justify-between mb-1">
				<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
				<button
					onClick={() => onToggleLink(corner)}
					className={`p-1.5 rounded transition-colors ${isLinked ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100 border border-slate-100'}`}
					title={isLinked ? 'Unlink Horizontal/Vertical' : 'Link Horizontal/Vertical'}
				>
					{isLinked ? <LinkIcon size={14} /> : <Unlink size={14} />}
				</button>
			</div>

			<div className="space-y-2">
				<div className="flex justify-between items-center mb-1">
					<span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
						{isLinked ? 'Uniform' : 'Horizontal'}
					</span>
					<NumberInput
						corner={corner}
						axisIndex={0}
						unit={hUnit}
						value={r[corner]?.[0] ?? 0}
						onUpdate={onUpdate}
						onToggleUnit={onToggleUnit}
					/>
				</div>
				<input
					type="range"
					min="0"
					max={hUnit === '%' ? 100 : 400}
					value={r[corner]?.[0] ?? 0}
					onChange={(e) => onUpdate(corner, 0, e.target.value)}
					className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
				/>
			</div>

			{!isLinked && (
				<div className="space-y-2 pt-3 border-t border-slate-50 animate-in fade-in slide-in-from-top-1 duration-200">
					<div className="flex justify-between items-center mb-1">
						<span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">Vertical</span>
						<NumberInput
							corner={corner}
							axisIndex={1}
							unit={vUnit}
							value={r[corner]?.[1] ?? 0}
							onUpdate={onUpdate}
							onToggleUnit={onToggleUnit}
						/>
					</div>
					<input
						type="range"
						min="0"
						max={vUnit === '%' ? 100 : 300}
						value={r[corner]?.[1] ?? 0}
						onChange={(e) => onUpdate(corner, 1, e.target.value)}
						className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
					/>
				</div>
			)}
		</div>
	)
}

const DEFAULT_RADII_PX = { tl: [80, 80], tr: [80, 10], br: [100, 10], bl: [80, 80] }
const DEFAULT_RADII_PCT = { tl: [30, 40], tr: [20, 3], br: [25, 3], bl: [20, 27] }
const DEFAULT_UNITS = { tl: ['%', '%'], tr: ['px', 'px'], br: ['px', 'px'], bl: ['px', 'px'] }
const DEFAULT_LINKED = { tl: false, tr: false, br: false, bl: false }

const STORAGE_KEY = 'border-radius-app-state'

const INITIAL_RADII_PX = { tl: [90, 120], tr: [349, 153], br: [203, 151], bl: [173, 173] }
const INITIAL_RADII_PCT = { tl: [30, 40], tr: [87, 51], br: [51, 50], bl: [43, 58] }
const INITIAL_UNITS = { tl: ['%', '%'], tr: ['px', 'px'], br: ['px', 'px'], bl: ['px', 'px'] }

function loadState() {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return null
		const data = JSON.parse(raw)
		const corners = ['tl', 'tr', 'br', 'bl']
		const has = (o, k) => o && typeof o === 'object' && Array.isArray(o[k])
		if (!data.radiiPx || !corners.every(c => has(data.radiiPx, c))) return null
		if (!data.radiiPct || !corners.every(c => has(data.radiiPct, c))) return null
		if (!data.units || !corners.every(c => has(data.units, c))) return null
		return {
			radiiPx: { ...DEFAULT_RADII_PX, ...data.radiiPx },
			radiiPct: { ...DEFAULT_RADII_PCT, ...data.radiiPct },
			units: { ...DEFAULT_UNITS, ...data.units },
			linked: { ...DEFAULT_LINKED, ...data.linked },
			mode: typeof data.mode === 'number' && data.mode >= 1 && data.mode <= 4 ? data.mode : 4,
			shape: data.shape === 'square' ? 'square' : 'rectangle',
		}
	} catch {
		return null
	}
}

function saveState(state) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
	} catch (_) {}
}

const PRESETS = [
	{ name: 'Circle / Ellipse', mode: 1, radiiPx: { tl: [200, 150], tr: [200, 150], br: [200, 150], bl: [200, 150] }, radiiPct: { tl: [50, 50], tr: [50, 50], br: [50, 50], bl: [50, 50] }, units: { tl: ['%', '%'], tr: ['%', '%'], br: ['%', '%'], bl: ['%', '%'] } },
	{ name: 'Pill', mode: 1, radiiPx: { tl: [999, 999], tr: [999, 999], br: [999, 999], bl: [999, 999] }, radiiPct: { tl: [100, 100], tr: [100, 100], br: [100, 100], bl: [100, 100] }, units: { tl: ['px', 'px'], tr: ['px', 'px'], br: ['px', 'px'], bl: ['px', 'px'] } },
	{ name: 'Blob', mode: 4, radiiPx: { tl: [120, 120], tr: [280, 120], br: [280, 210], bl: [120, 210] }, radiiPct: { tl: [30, 30], tr: [70, 30], br: [70, 70], bl: [30, 70] }, units: { tl: ['%', '%'], tr: ['%', '%'], br: ['%', '%'], bl: ['%', '%'] } },
	{ name: 'Leaf', mode: 3, radiiPx: { tl: [0, 0], tr: [200, 150], br: [200, 150], bl: [200, 150] }, radiiPct: { tl: [0, 0], tr: [50, 50], br: [50, 50], bl: [50, 50] }, units: { tl: ['%', '%'], tr: ['%', '%'], br: ['%', '%'], bl: ['%', '%'] } },
	{ name: 'Squircle', mode: 1, radiiPx: { tl: [64, 64], tr: [64, 64], br: [64, 64], bl: [64, 64] }, radiiPct: { tl: [16, 21], tr: [16, 21], br: [16, 21], bl: [16, 21] }, units: { tl: ['px', 'px'], tr: ['px', 'px'], br: ['px', 'px'], bl: ['px', 'px'] } },
	{ name: 'Rounded', mode: 1, radiiPx: { tl: [24, 24], tr: [24, 24], br: [24, 24], bl: [24, 24] }, radiiPct: { tl: [6, 8], tr: [6, 8], br: [6, 8], bl: [6, 8] }, units: { tl: ['px', 'px'], tr: ['px', 'px'], br: ['px', 'px'], bl: ['px', 'px'] } },
	{ name: 'Soft', mode: 1, radiiPx: { tl: [8, 8], tr: [8, 8], br: [8, 8], bl: [8, 8] }, radiiPct: { tl: [2, 3], tr: [2, 3], br: [2, 3], bl: [2, 3] }, units: { tl: ['px', 'px'], tr: ['px', 'px'], br: ['px', 'px'], bl: ['px', 'px'] } },
]

function getDisplayRadii(radiiPx, radiiPct, units) {
	const out = {}
	;['tl', 'tr', 'br', 'bl'].forEach(c => {
		const u = units[c] ?? ['px', 'px']
		const px = radiiPx[c] ?? [0, 0]
		const pct = radiiPct[c] ?? [0, 0]
		out[c] = [
			u[0] === '%' ? pct[0] : px[0],
			u[1] === '%' ? pct[1] : px[1],
		]
	})
	return out
}

function CssRuleDisplay({ borderRadiusString }) {
	const hasSlash = borderRadiusString.includes(' / ')
	const parts = hasSlash ? borderRadiusString.split(' / ') : null
	const valueCount = hasSlash ? 0 : borderRadiusString.trim().split(/\s+/).length

	if (valueCount === 1 || valueCount === 2) {
		return (
			<p className="font-mono text-xs md:text-sm leading-relaxed break-words text-left">
				<span className="text-slate-200">border-radius: </span>
				<span className="text-yellow-200 font-bold">{borderRadiusString};</span>
			</p>
		)
	}

	if (valueCount === 3) {
		return (
			<p className="font-mono text-xs md:text-sm leading-relaxed break-words text-left whitespace-pre">
				<span className="text-slate-200">border-radius:</span>
				{'\n'}
				<span className="text-yellow-200 font-bold">{'    '}{borderRadiusString};</span>
			</p>
		)
	}

	return (
		<p className="font-mono text-xs md:text-sm leading-relaxed break-words text-left whitespace-pre">
			<span className="text-slate-200">border-radius:</span>
			{'\n'}
			{parts ? (
				<>
					<span className="text-yellow-200 font-bold">{'    '}{parts[0]} / </span>
					{'\n'}
					<span className="text-yellow-200 font-bold">{'        '}{parts[1]};</span>
				</>
			) : (
				<span className="text-yellow-200 font-bold">{'    '}{borderRadiusString};</span>
			)}
		</p>
	)
}

// --- Main App Component ---

function getInitialState() {
	const saved = loadState()
	if (saved) return saved
	return {
		radiiPx: { ...DEFAULT_RADII_PX, ...INITIAL_RADII_PX },
		radiiPct: { ...DEFAULT_RADII_PCT, ...INITIAL_RADII_PCT },
		units: { ...DEFAULT_UNITS, ...INITIAL_UNITS },
		linked: { ...DEFAULT_LINKED },
		mode: 4,
		shape: 'rectangle',
	}
}

function App() {
	const [initial] = useState(getInitialState)
	const [mode, setMode] = useState(initial.mode)
	const [radiiPx, setRadiiPx] = useState(initial.radiiPx)
	const [radiiPct, setRadiiPct] = useState(initial.radiiPct)
	const [units, setUnits] = useState(initial.units)
	const [linked, setLinked] = useState(initial.linked)
	const [shape, setShape] = useState(initial.shape)

	useEffect(() => {
		saveState({ radiiPx, radiiPct, units, linked, mode, shape })
	}, [radiiPx, radiiPct, units, linked, mode, shape])

	const displayRadii = getDisplayRadii(radiiPx, radiiPct, units)

	const applyPreset = useCallback((preset) => {
		setRadiiPx({ ...DEFAULT_RADII_PX, ...preset.radiiPx })
		setRadiiPct({ ...DEFAULT_RADII_PCT, ...preset.radiiPct })
		setUnits({ ...DEFAULT_UNITS, ...preset.units })
		setMode(preset.mode ?? 4)
	}, [])

	const computedState = (() => {
		const px = { ...DEFAULT_RADII_PX, ...radiiPx }
		const pct = { ...DEFAULT_RADII_PCT, ...radiiPct }
		const u = { ...DEFAULT_UNITS, ...units }
		const l = { ...DEFAULT_LINKED, ...linked }
		let finalRadii = {}
		let finalUnits = { ...u }
		;['tl', 'tr', 'br', 'bl'].forEach(c => {
			const unit = u[c]?.[0] ?? 'px'
			const val0 = unit === '%' ? (pct[c]?.[0] ?? 0) : (px[c]?.[0] ?? 0)
			const val1 = unit === '%' ? (pct[c]?.[1] ?? 0) : (px[c]?.[1] ?? 0)
			finalRadii[c] = l[c] ? [val0, val0] : [val0, val1]
			if (l[c]) finalUnits[c] = [unit, unit]
		})

		const tl = finalRadii?.tl ?? [0, 0]
		const tr = finalRadii?.tr ?? [0, 0]
		const tlUnit = finalUnits?.tl?.[0] ?? 'px'
		const trUnit = finalUnits?.tr?.[0] ?? 'px'

		if (mode === 1) {
			finalRadii = { tl, tr: [...tl], br: [...tl], bl: [...tl] }
			finalUnits = { tl: [tlUnit, tlUnit], tr: [tlUnit, tlUnit], br: [tlUnit, tlUnit], bl: [tlUnit, tlUnit] }
		} else if (mode === 2) {
			finalRadii = { ...finalRadii, br: [...tl], bl: [...tr] }
			finalUnits = { ...finalUnits, br: [tlUnit, tlUnit], bl: [trUnit, trUnit] }
		} else if (mode === 3) {
			finalRadii = { ...finalRadii, bl: [...tr] }
			finalUnits = { ...finalUnits, bl: [trUnit, trUnit] }
		}

		return { radii: finalRadii, units: finalUnits }
	})()

	const borderRadiusString = (() => {
		const { radii: r, units: u } = computedState
		if (!r || !u) return '0'
		const getValStr = (c, axis) => `${r[c]?.[axis] ?? 0}${u[c]?.[axis] ?? 'px'}`

		let hParts = []
		if (mode === 1) hParts = [getValStr('tl', 0)]
		else if (mode === 2) hParts = [getValStr('tl', 0), getValStr('tr', 0)]
		else if (mode === 3) hParts = [getValStr('tl', 0), getValStr('tr', 0), getValStr('br', 0)]
		else hParts = [getValStr('tl', 0), getValStr('tr', 0), getValStr('br', 0), getValStr('bl', 0)]

		const l = { ...DEFAULT_LINKED, ...linked }
		const needsVertical = ['tl', 'tr', 'br', 'bl'].some(c =>
			!l[c] && (r[c]?.[0] !== r[c]?.[1] || u[c]?.[0] !== u[c]?.[1])
		)

		if (!needsVertical) return hParts.join(' ')

		let vParts = []
		if (mode === 1) vParts = [getValStr('tl', 1)]
		else if (mode === 2) vParts = [getValStr('tl', 1), getValStr('tr', 1)]
		else if (mode === 3) vParts = [getValStr('tl', 1), getValStr('tr', 1), getValStr('br', 1)]
		else vParts = [getValStr('tl', 1), getValStr('tr', 1), getValStr('br', 1), getValStr('bl', 1)]

		return `${hParts.join(' ')} / ${vParts.join(' ')}`
	})()

	const updateRadius = useCallback((corner, axisIndex, value) => {
		const val = Math.max(0, parseInt(value, 10) || 0)
		const unit = units[corner]?.[axisIndex] ?? 'px'
		const isPct = unit === '%'
		const clamp = (v, max) => (isPct ? Math.min(max, v) : v)
		const maxVal = axisIndex === 0 ? (isPct ? 100 : 400) : (isPct ? 100 : 300)
		const clamped = clamp(val, maxVal)
		const updateStore = (setter) => {
			setter(prev => {
				const next = { ...prev }
				const arr = [...(prev[corner] || [0, 0])]
				arr[axisIndex] = clamped
				next[corner] = linked[corner] ? [clamped, clamped] : arr
				return next
			})
		}
		if (isPct) updateStore(setRadiiPct)
		else updateStore(setRadiiPx)
	}, [linked, units])

	const toggleUnit = useCallback((corner, axisIndex) => {
		setUnits(prev => {
			const next = { ...prev }
			const currentUnit = prev[corner]?.[axisIndex] ?? 'px'
			const newUnit = currentUnit === 'px' ? '%' : 'px'

			if (linked[corner]) next[corner] = [newUnit, newUnit]
			else {
				const cornerUnits = [...(prev[corner] ?? ['px', 'px'])]
				cornerUnits[axisIndex] = newUnit
				next[corner] = cornerUnits
			}
			return next
		})
	}, [linked])

	const toggleLink = useCallback((corner) => {
		setLinked(prev => {
			const isNowLinked = !prev[corner]
			if (isNowLinked) {
				setRadiiPx(r => ({ ...r, [corner]: [r[corner]?.[0] ?? 0, r[corner]?.[0] ?? 0] }))
				setRadiiPct(p => ({ ...p, [corner]: [p[corner]?.[0] ?? 0, p[corner]?.[0] ?? 0] }))
			}
			return { ...prev, [corner]: isNowLinked }
		})
	}, [])

	return (
		<div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8 flex flex-col items-center">
			<div className="w-full max-w-5xl flex flex-col mb-8">
				<div className="w-full flex items-center justify-between mb-6">
					<h1 className="text-2xl font-black text-slate-900 tracking-tight">
						CSS Border Radius
					</h1>
					<div className="flex gap-1 flex-wrap">
						{[1, 2, 3, 4].map(v => (
							<button
								key={v}
								onClick={() => setMode(v)}
								className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm transition-all ${
									mode === v
										? 'bg-indigo-600 text-white border-indigo-600'
										: 'text-slate-600 bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'
								}`}
							>
								{v} {v === 1 ? 'Value' : 'Values'}
							</button>
						))}
					</div>
				</div>

				<div className="relative w-full h-[600px] flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 overflow-visible">
				<CornerControls corner="tl" label={mode === 1 ? 'All Corners' : mode === 2 ? 'TOP-L / BOT-R' : 'Top Left'} positionClass="-top-4 -left-12 lg:-left-20" isVisible={true} radii={displayRadii} units={units} linked={linked} onUpdate={updateRadius} onToggleUnit={toggleUnit} onToggleLink={toggleLink} />
				<CornerControls corner="tr" label={mode === 2 || mode === 3 ? 'TOP-R / BOT-L' : 'Top Right'} positionClass="-top-4 -right-12 lg:-right-20" isVisible={mode >= 2} radii={displayRadii} units={units} linked={linked} onUpdate={updateRadius} onToggleUnit={toggleUnit} onToggleLink={toggleLink} />
				<CornerControls corner="br" label="Bottom Right" positionClass="-bottom-4 -right-12 lg:-right-20" isVisible={mode >= 3} radii={displayRadii} units={units} linked={linked} onUpdate={updateRadius} onToggleUnit={toggleUnit} onToggleLink={toggleLink} />
				<CornerControls corner="bl" label="Bottom Left" positionClass="-bottom-4 -left-12 lg:-left-20" isVisible={mode >= 4} radii={displayRadii} units={units} linked={linked} onUpdate={updateRadius} onToggleUnit={toggleUnit} onToggleLink={toggleLink} />

				<div className={`relative border border-slate-200 flex items-center justify-center bg-white shadow-inner overflow-hidden transition-all duration-300 ease-out ${shape === 'square' ? 'w-[320px] h-[320px]' : 'w-[500px] h-[300px]'}`}>
					<div
						className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl transition-all duration-300 ease-out flex flex-col items-center justify-center p-6 text-white overflow-hidden text-center relative"
						style={{ borderRadius: borderRadiusString }}
					>
						<div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
						<div className="z-10 bg-black/30 backdrop-blur-lg px-6 py-4 rounded-2xl border border-white/20 max-w-[85%]">
							<CssRuleDisplay borderRadiusString={borderRadiusString} />
						</div>
					</div>
				</div>
				</div>

				<div className="w-full flex items-center justify-between gap-4 mt-6 flex-wrap">
					<div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex gap-1">
						{['rectangle', 'square'].map(s => (
							<button
								key={s}
								onClick={() => setShape(s)}
								className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all ${
									shape === s ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
								}`}
							>
								{s}
							</button>
						))}
					</div>
					<div className="flex items-center gap-2 flex-wrap">
						<span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Presets</span>
						<div className="flex gap-1 flex-wrap">
							{PRESETS.map(preset => (
								<button
									key={preset.name}
									onClick={() => applyPreset(preset)}
									className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-white border border-slate-200 shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition-all"
								>
									{preset.name}
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default App
