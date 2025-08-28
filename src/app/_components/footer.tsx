import "@/styles/footer.css";

export default function Footer() {
	return (
		<footer className="nx-footer" role="contentinfo">
			<div className="nx-footer-inner">
				<p className="nx-footer-copy">© {new Date().getFullYear()} NexusCTF</p>
				<div className="nx-footer-links">
					<a href="https://github.com" target="_blank" rel="noreferrer" className="nx-footer-link">
						GitHub
					</a>
					<a href="/privacy" className="nx-footer-link">Privacy</a>
					<a href="/terms" className="nx-footer-link">Terms</a>
				</div>
			</div>
			<div className="nx-scanlines" aria-hidden="true" />
		</footer>
	);
}


