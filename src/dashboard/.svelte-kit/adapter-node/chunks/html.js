function html(value) {
	const html2 = String(value ?? '');
	const open = '<!---->';
	return open + html2 + '<!---->';
}
export { html as h };
