import React, { useState, useCallback, useEffect } from 'react'
import { Link as LinkIcon, Unlink, DraftingCompass, Copy, Check } from 'lucide-react'

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

const OVERLAY_ACCENT = '#00e5ff'
const OVERLAY_DEFAULT_STROKE = 'rgba(255,255,255,0.9)'
const OVERLAY_DEFAULT_FILL = 'rgba(255,255,255,0.15)'
const RADII_FONT_SIZE = 14
const DIM_TICK = 6
const DIM_LINE_GAP = 32 // gap in line for centered text

function CornerRadiiOverlay({ width, height, radii, units, visibleCorners = { tl: true, tr: true, br: true, bl: true } }) {
	const [hoveredCorner, setHoveredCorner] = useState(null)
	const toPx = (val, unit, dim) => (unit === '%' ? (val / 100) * dim : val)
	const isSquare = width === height
	const getCornerData = c => {
		const r = radii[c] ?? [0, 0]
		const u = units[c] ?? ['px', 'px']
		const hPx = toPx(r[0], u[0], width)
		const vPx = toPx(r[1], u[1], height)
		const hLabel = `${r[0]}${u[0]}`
		const vLabel = `${r[1]}${u[1]}`
		const sameVal = r[0] === r[1] && u[0] === u[1]
		return { hPx, vPx, hLabel, vLabel, showBothRadii: sameVal && !isSquare }
	}

	const vLabelGap = 5

	const cornerConfig = [
		{ c: 'tl', cx: d => d.hPx, cy: d => d.vPx, hLine: d => ({ x1: d.hPx, y1: d.vPx, x2: 0, y2: d.vPx }), vLine: d => ({ x1: d.hPx, y1: d.vPx, x2: d.hPx, y2: 0 }), hLabel: d => ({ x: d.hPx / 2, y: d.vPx - 6 }), vLabel: d => ({ x: d.hPx + vLabelGap, y: d.vPx / 2, anchor: 'start' }) },
		{ c: 'tr', cx: d => width - d.hPx, cy: d => d.vPx, hLine: d => ({ x1: width - d.hPx, y1: d.vPx, x2: width, y2: d.vPx }), vLine: d => ({ x1: width - d.hPx, y1: d.vPx, x2: width - d.hPx, y2: 0 }), hLabel: d => ({ x: width - d.hPx / 2, y: d.vPx - 6 }), vLabel: d => ({ x: width - d.hPx - vLabelGap, y: d.vPx / 2, anchor: 'end' }) },
		{ c: 'br', cx: d => width - d.hPx, cy: d => height - d.vPx, hLine: d => ({ x1: width - d.hPx, y1: height - d.vPx, x2: width, y2: height - d.vPx }), vLine: d => ({ x1: width - d.hPx, y1: height - d.vPx, x2: width - d.hPx, y2: height }), hLabel: d => ({ x: width - d.hPx / 2, y: height - d.vPx + 14 }), vLabel: d => ({ x: width - d.hPx - vLabelGap, y: height - d.vPx / 2, anchor: 'end' }) },
		{ c: 'bl', cx: d => d.hPx, cy: d => height - d.vPx, hLine: d => ({ x1: d.hPx, y1: height - d.vPx, x2: 0, y2: height - d.vPx }), vLine: d => ({ x1: d.hPx, y1: height - d.vPx, x2: d.hPx, y2: height }), hLabel: d => ({ x: d.hPx / 2, y: height - d.vPx + 14 }), vLabel: d => ({ x: d.hPx + vLabelGap, y: height - d.vPx / 2, anchor: 'start' }) },
	]

	function getDimSidesForCorner(c) {
		const u = units[c] ?? ['px', 'px']
		const widthLabel = u[0] === '%' ? '100%' : `${width}px`
		const heightLabel = u[1] === '%' ? '100%' : `${height}px`
		const edgeOffset = 8
		return {
			tl: [
				{ type: 'top', x1: 0, y: edgeOffset, x2: width, tickDy: DIM_TICK, cx: width / 2, label: widthLabel },
				{ type: 'left', y1: 0, x: edgeOffset, y2: height, tickDx: DIM_TICK, cy: height / 2, label: heightLabel, textX: edgeOffset, textAnchor: 'middle' },
			],
			tr: [
				{ type: 'top', x1: 0, y: edgeOffset, x2: width, tickDy: DIM_TICK, cx: width / 2, label: widthLabel },
				{ type: 'right', y1: 0, x: width - edgeOffset, y2: height, tickDx: -DIM_TICK, cy: height / 2, label: heightLabel, textX: width - edgeOffset, textAnchor: 'middle' },
			],
			br: [
				{ type: 'bottom', x1: 0, y: height - edgeOffset, x2: width, tickDy: -DIM_TICK, cx: width / 2, label: widthLabel },
				{ type: 'right', y1: 0, x: width - edgeOffset, y2: height, tickDx: -DIM_TICK, cy: height / 2, label: heightLabel, textX: width - edgeOffset, textAnchor: 'middle' },
			],
			bl: [
				{ type: 'bottom', x1: 0, y: height - edgeOffset, x2: width, tickDy: -DIM_TICK, cx: width / 2, label: widthLabel },
				{ type: 'left', y1: 0, x: edgeOffset, y2: height, tickDx: DIM_TICK, cy: height / 2, label: heightLabel, textX: edgeOffset, textAnchor: 'middle' },
			],
		}[c]
	}

	function renderSideDimension(side) {
		const stroke = OVERLAY_ACCENT
		const isHoriz = side.type === 'top' || side.type === 'bottom'
		const half = DIM_LINE_GAP / 2
		if (isHoriz) {
			return (
				<g key={side.type}>
					<line x1={side.x1} y1={side.y} x2={side.cx - half} y2={side.y} stroke={stroke} strokeWidth={1.2} />
					<line x1={side.cx + half} y1={side.y} x2={side.x2} y2={side.y} stroke={stroke} strokeWidth={1.2} />
					<line x1={side.x1} y1={side.y} x2={side.x1} y2={side.y + side.tickDy} stroke={stroke} strokeWidth={1.2} />
					<line x1={side.x2} y1={side.y} x2={side.x2} y2={side.y + side.tickDy} stroke={stroke} strokeWidth={1.2} />
					<text x={side.cx} y={side.y} dy="0.35em" textAnchor="middle" fill={stroke} fontSize={11} fontFamily="monospace" fontWeight="bold">{side.label}</text>
				</g>
			)
		}
		return (
			<g key={side.type}>
				<line x1={side.x} y1={side.y1} x2={side.x} y2={side.cy - half} stroke={stroke} strokeWidth={1.2} />
				<line x1={side.x} y1={side.cy + half} x2={side.x} y2={side.y2} stroke={stroke} strokeWidth={1.2} />
				<line x1={side.x} y1={side.y1} x2={side.x + side.tickDx} y2={side.y1} stroke={stroke} strokeWidth={1.2} />
				<line x1={side.x} y1={side.y2} x2={side.x + side.tickDx} y2={side.y2} stroke={stroke} strokeWidth={1.2} />
				<text
					x={side.textX ?? side.x}
					y={side.cy}
					dy="0.35em"
					textAnchor={side.textAnchor ?? 'middle'}
					fill={stroke}
					fontSize={11}
					fontFamily="monospace"
					fontWeight="bold"
					transform={`rotate(-90 ${side.textX ?? side.x} ${side.cy})`}
				>
					{side.label}
				</text>
			</g>
		)
	}

	return (
		<svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
			{/* Side dimensions on hover – pointer-events wrapper so only corners receive hover */}
			<g style={{ pointerEvents: 'none', opacity: hoveredCorner ? 1 : 0, transition: 'opacity 0.2s ease-out' }}>
				{hoveredCorner && getDimSidesForCorner(hoveredCorner)?.map(renderSideDimension)}
			</g>
			{cornerConfig.map(({ c, cx, cy, hLine, vLine, hLabel, vLabel }) => {
				if (!visibleCorners[c]) return null
				const d = getCornerData(c)
				if (d.hPx <= 0 && d.vPx <= 0) return null
				const hl = hLine(d)
				const vl = vLine(d)
				const hPos = hLabel(d)
				const vPos = vLabel(d)
				const isHovered = hoveredCorner === c
				const strokeColor = isHovered ? OVERLAY_ACCENT : OVERLAY_DEFAULT_STROKE
				const fillColor = isHovered ? 'rgba(0,229,255,0.12)' : OVERLAY_DEFAULT_FILL
				return (
					<g
						key={c}
						style={{ pointerEvents: 'auto', cursor: 'pointer' }}
						onMouseEnter={() => setHoveredCorner(c)}
						onMouseLeave={() => setHoveredCorner(null)}
					>
						<ellipse cx={cx(d)} cy={cy(d)} rx={d.hPx} ry={d.vPx} fill={fillColor} stroke={strokeColor} strokeWidth={1.5} />
						{d.hPx > 0 && (d.showBothRadii || d.hPx !== d.vPx) && (
							<>
								<line x1={hl.x1} y1={hl.y1} x2={hl.x2} y2={hl.y2} stroke={strokeColor} strokeWidth={1.2} />
								<text x={hPos.x} y={hPos.y} textAnchor="middle" fill={strokeColor} fontSize={RADII_FONT_SIZE} fontFamily="monospace" fontWeight="bold">{d.hLabel}</text>
							</>
						)}
						{d.vPx > 0 && (d.showBothRadii || d.hPx !== d.vPx || isSquare) && (
							<>
								<line x1={vl.x1} y1={vl.y1} x2={vl.x2} y2={vl.y2} stroke={strokeColor} strokeWidth={1.2} />
								<text x={vPos.x} y={vPos.y} textAnchor={vPos.anchor ?? 'middle'} fill={strokeColor} fontSize={RADII_FONT_SIZE} fontFamily="monospace" fontWeight="bold">{d.vLabel}</text>
							</>
						)}
					</g>
				)
			})}
		</svg>
	)
}

function getCssSnippetText(borderRadiusString) {
	const hasSlash = borderRadiusString.includes(' / ')
	const parts = hasSlash ? borderRadiusString.split(' / ') : null
	const valueCount = hasSlash ? 0 : borderRadiusString.trim().split(/\s+/).length
	const isSinglePair = hasSlash && parts?.length === 2 && !parts[0].trim().includes(' ') && !parts[1].trim().includes(' ')
	const isTwoPairs = hasSlash && parts?.length === 2 && parts[0].trim().split(/\s+/).length === 2 && parts[1].trim().split(/\s+/).length === 2
	if (valueCount === 1 || valueCount === 2) return `border-radius: ${borderRadiusString};`
	if (isSinglePair || isTwoPairs || valueCount === 3) return `border-radius:\n    ${borderRadiusString};`
	if (parts?.length === 2) return `border-radius:\n    ${parts[0]} / \n        ${parts[1]};`
	return `border-radius: ${borderRadiusString};`
}

function CssRuleDisplay({ borderRadiusString }) {
	const [copied, setCopied] = useState(false)
	const hasSlash = borderRadiusString.includes(' / ')
	const parts = hasSlash ? borderRadiusString.split(' / ') : null
	const valueCount = hasSlash ? 0 : borderRadiusString.trim().split(/\s+/).length
	const isSinglePair = hasSlash && parts?.length === 2 && !parts[0].trim().includes(' ') && !parts[1].trim().includes(' ')
	const isTwoPairs = hasSlash && parts?.length === 2 && parts[0].trim().split(/\s+/).length === 2 && parts[1].trim().split(/\s+/).length === 2

	const onCopy = () => {
		navigator.clipboard.writeText(getCssSnippetText(borderRadiusString))
		setCopied(true)
		setTimeout(() => setCopied(false), 400)
	}

	const copyButton = (
		<button
			type="button"
			onClick={onCopy}
			className="absolute -top-1.5 right-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-150 active:scale-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
			title="Copy CSS"
			aria-label="Copy CSS"
		>
			{copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
		</button>
	)

	if (valueCount === 1 || valueCount === 2) {
		return (
			<div className="relative pr-12">
				{copyButton}
				<p className="font-mono text-xs md:text-sm leading-relaxed break-words text-left">
					<span className="text-slate-200">border-radius: </span>
					<span className="text-yellow-200 font-bold">{borderRadiusString};</span>
				</p>
			</div>
		)
	}

	if (isSinglePair || isTwoPairs) {
		return (
			<div className="relative pr-12">
				{copyButton}
				<p className="font-mono text-xs md:text-sm leading-relaxed break-words text-left whitespace-pre">
					<span className="text-slate-200">border-radius:</span>
					{'\n'}
					<span className="text-yellow-200 font-bold">{'    '}{borderRadiusString};</span>
				</p>
			</div>
		)
	}

	if (valueCount === 3) {
		return (
			<div className="relative pr-12">
				{copyButton}
				<p className="font-mono text-xs md:text-sm leading-relaxed break-words text-left whitespace-pre">
					<span className="text-slate-200">border-radius:</span>
					{'\n'}
					<span className="text-yellow-200 font-bold">{'    '}{borderRadiusString};</span>
				</p>
			</div>
		)
	}

	return (
		<div className="relative pr-12">
			{copyButton}
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
		</div>
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
	const [overlayCorners, setOverlayCorners] = useState({ tl: true, tr: true, br: true, bl: true })

	const toggleOverlay = useCallback((corner) => {
		setOverlayCorners(prev => ({ ...prev, [corner]: !prev[corner] }))
	}, [])

	const toggleAllOverlays = useCallback(() => {
		const allOn = ['tl', 'tr', 'br', 'bl'].every(c => overlayCorners[c])
		setOverlayCorners({ tl: !allOn, tr: !allOn, br: !allOn, bl: !allOn })
	}, [overlayCorners])

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
			const unit0 = u[c]?.[0] ?? 'px'
			const unit1 = u[c]?.[1] ?? 'px'
			const val0 = unit0 === '%' ? (pct[c]?.[0] ?? 0) : (px[c]?.[0] ?? 0)
			const val1 = unit1 === '%' ? (pct[c]?.[1] ?? 0) : (px[c]?.[1] ?? 0)
			finalRadii[c] = l[c] ? [val0, val0] : [val0, val1]
			if (l[c]) finalUnits[c] = [unit0, unit0]
			else finalUnits[c] = [unit0, unit1]
		})

		const tl = finalRadii?.tl ?? [0, 0]
		const tr = finalRadii?.tr ?? [0, 0]
		const tlUnitH = finalUnits?.tl?.[0] ?? 'px'
		const tlUnitV = finalUnits?.tl?.[1] ?? 'px'
		const trUnitH = finalUnits?.tr?.[0] ?? 'px'
		const trUnitV = finalUnits?.tr?.[1] ?? 'px'

		if (mode === 1) {
			finalRadii = { tl, tr: [...tl], br: [...tl], bl: [...tl] }
			finalUnits = { tl: [tlUnitH, tlUnitV], tr: [tlUnitH, tlUnitV], br: [tlUnitH, tlUnitV], bl: [tlUnitH, tlUnitV] }
		} else if (mode === 2) {
			finalRadii = { ...finalRadii, br: [...tl], bl: [...tr] }
			finalUnits = { ...finalUnits, br: [tlUnitH, tlUnitV], bl: [trUnitH, trUnitV] }
		} else if (mode === 3) {
			finalRadii = { ...finalRadii, bl: [...tr] }
			finalUnits = { ...finalUnits, bl: [trUnitH, trUnitV] }
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
				<div className="w-full grid grid-cols-3 items-center gap-4 mb-6">
					<h1 className="text-2xl font-black text-slate-900 tracking-tight">
						CSS Border Radius
					</h1>
					<div className="flex gap-1 flex-wrap justify-center">
						{['rectangle', 'square'].map(s => (
							<button
								key={s}
								type="button"
								onClick={() => setShape(s)}
								className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm transition-all capitalize ${
									shape === s
										? 'bg-indigo-600 text-white border-indigo-600'
										: 'text-slate-600 bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'
								}`}
								aria-pressed={shape === s}
								aria-label={`Shape: ${s}`}
							>
								{s}
							</button>
						))}
					</div>
					<div className="flex gap-1 flex-wrap justify-end">
						{[1, 2, 3, 4].map(v => (
							<button
								key={v}
								type="button"
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

				<div className={`flex flex-col items-center gap-0 transition-all duration-300 ease-out ${shape === 'square' ? 'w-[320px]' : 'w-[500px]'}`}>
					<div className={`relative transition-all duration-300 ease-out ${shape === 'square' ? 'w-[320px] h-[320px]' : 'w-[500px] h-[300px]'}`}>
						<div className={`absolute inset-0 border border-slate-200 flex items-center justify-center bg-white shadow-inner overflow-visible rounded-none ${shape === 'square' ? 'w-[320px] h-[320px]' : 'w-[500px] h-[300px]'}`}>
							<div
								className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl transition-all duration-300 ease-out relative overflow-visible"
								style={{ borderRadius: borderRadiusString }}
							>
								<div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
								<CornerRadiiOverlay
									width={shape === 'square' ? 320 : 500}
									height={shape === 'square' ? 320 : 300}
									radii={computedState.radii}
									units={computedState.units}
									visibleCorners={overlayCorners}
								/>
							</div>
						</div>
						{['tl', 'tr', 'br', 'bl'].map(corner => {
							const pos = { tl: '-top-[45px] -left-[45px]', tr: '-top-[45px] -right-[45px]', br: '-bottom-[45px] -right-[45px]', bl: '-bottom-[45px] -left-[45px]' }[corner]
							return (
								<button
									key={corner}
									type="button"
									onClick={() => toggleOverlay(corner)}
									className={`absolute ${pos} p-2 rounded-full transition-colors shadow-md z-10 ${overlayCorners[corner] ? 'bg-indigo-600 text-white border-2 border-indigo-700 hover:bg-indigo-500 hover:border-indigo-600' : 'bg-white text-slate-600 border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400'}`}
									title={overlayCorners[corner] ? 'Hide corner curve' : 'Show corner curve'}
								>
									<DraftingCompass size={16} />
								</button>
							)
						})}
						{(() => {
							const allOn = ['tl', 'tr', 'br', 'bl'].every(c => overlayCorners[c])
							return (
								<button
									type="button"
									onClick={toggleAllOverlays}
									className={`absolute -top-[45px] left-[13px] flex items-center gap-1.5 rounded-full px-3 py-2 transition-colors shadow-md z-10 ${allOn ? 'bg-indigo-600 text-white border-2 border-indigo-700 hover:bg-indigo-500 hover:border-indigo-600' : 'bg-white text-slate-600 border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400'}`}
									title={allOn ? 'Hide all corner curves' : 'Show all corner curves'}
								>
									<DraftingCompass size={16} />
									<span className="text-xs font-bold uppercase tracking-wide">all</span>
								</button>
							)
						})()}
					</div>
					<div className="w-full mt-14 bg-slate-900 rounded-xl px-5 py-4 border border-slate-700 shadow-lg">
						<CssRuleDisplay borderRadiusString={borderRadiusString} />
					</div>
				</div>
				</div>

				<div className="w-full flex items-center justify-between gap-4 mt-6 flex-wrap">
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
