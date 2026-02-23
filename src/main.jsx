import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
	state = { hasError: false, error: null }
	static getDerivedStateFromError(error) {
		return { hasError: true, error }
	}
	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: 24, fontFamily: 'monospace', background: '#fee', color: '#c00' }}>
					<h1>Something went wrong</h1>
					<pre>{this.state.error?.toString()}</pre>
				</div>
			)
		}
		return this.props.children
	}
}

const root = document.getElementById('root')
if (!root) throw new Error('#root element not found')

ReactDOM.createRoot(root).render(
	<React.StrictMode>
		<ErrorBoundary>
			<App />
		</ErrorBoundary>
	</React.StrictMode>
)
