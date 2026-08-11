/**
 * Checks the dashboard's preview markdown against Discord's dialect, which is
 * not the GFM the previews used to be rendered with. The cases that matter:
 *
 *   - `__underline__` is an underline, not bold
 *   - spoilers, subtext and three-level headings exist
 *   - tables, images and horizontal rules do not
 *   - mentions become chips, resolving to a name when we have one
 *   - HTML in the source is shown, never run
 *
 * The renderer is an ES module inside the dashboard, so it is imported rather
 * than required — `src/dashboard/package.json` sets `"type": "module"`.
 */
const assert = require('assert');
const path = require('path');

let pass = 0;
const t = (name, fn) => {
	try {
		fn();
		pass++;
		console.log('  ok  ', name);
	} catch (e) {
		console.log('  FAIL', name, '\n       ', e.message);
		process.exitCode = 1;
	}
};

(async () => {
	const { renderMarkdown } = await import(
		'file://' + path.join(__dirname, '..', 'src', 'dashboard', 'src', 'lib', 'markdown.js')
	);
	const md = (source, options) => renderMarkdown(source, options);

	console.log('\n== escaping ==');

	t('HTML is shown as text, not run', () => {
		const html = md('<img src=x onerror=alert(1)>');
		assert.ok(!html.includes('<img src=x'), 'no live tag');
		assert.ok(html.includes('&lt;img'), 'the characters the admin typed');
	});

	t('a script tag cannot be smuggled through a code block', () => {
		const html = md('```\n<script>alert(1)</script>\n```');
		assert.ok(!/<script>/.test(html));
		assert.ok(html.includes('&lt;script&gt;'));
	});

	t('javascript: cannot reach an href through a masked link', () => {
		const html = md('[click](javascript:alert(1))');
		assert.ok(!html.includes('href="javascript:'));
	});

	t('a typed NUL cannot forge a code-span marker', () => {
		const html = md('\u0000CODE0\u0000');
		assert.ok(!html.includes('undefined'), 'no stash was resolved');
		assert.ok(!html.includes('\u0000'), 'and the NUL itself is stripped');
	});

	console.log('\n== Discord dialect ==');

	t('__underline__ is an underline, not bold', () => {
		assert.ok(md('__hello__').includes('<u>hello</u>'));
	});

	t('bold, italic and strikethrough', () => {
		assert.ok(md('**b**').includes('<strong>b</strong>'));
		assert.ok(md('*i*').includes('<em>i</em>'));
		assert.ok(md('~~s~~').includes('<s>s</s>'));
		assert.ok(md('***bi***').includes('<strong><em>bi</em></strong>'));
	});

	t('spoilers are rendered, not printed as pipes', () => {
		const html = md('||secret||');
		assert.ok(html.includes('class="spoiler"'));
		assert.ok(!html.includes('||'));
	});

	t('-# subtext is a subtext, which is what the footer block compiles to', () => {
		const html = md('-# small print');
		assert.ok(html.includes('class="subtext"'));
		assert.ok(html.includes('small print'));
		assert.ok(!html.includes('-#'));
	});

	t('three heading levels, and no fourth', () => {
		assert.ok(md('# h').includes('heading-1'));
		assert.ok(md('### h').includes('heading-3'));
		const fourth = md('#### h');
		assert.ok(!fourth.includes('heading-'), 'Discord shows #### as text');
		assert.ok(fourth.includes('#### h'));
	});

	t('quotes and lists', () => {
		assert.ok(md('> quoted').includes('class="quote"'));
		assert.ok(md('- one').includes('class="bullet"'));
		assert.ok(md('1. one').includes('class="bullet"'));
	});

	t('code spans are literal inside', () => {
		const html = md('`**not bold**`');
		assert.ok(html.includes('<code'), 'rendered as code');
		assert.ok(!html.includes('<strong>'), 'and the markdown inside is not parsed');
	});

	t('a code span keeps the spaces around it', () => {
		assert.ok(md('use `x` now').includes('use <code class="inline-code">x</code> now'));
	});

	t('single newlines are line breaks, as they are in Discord', () => {
		assert.ok(md('a\nb').includes('<br>'));
		assert.ok(!md('a\nb', { breaks: false }).includes('<br>'));
	});

	console.log('\n== what Discord does not have ==');

	t('tables are not rendered', () => {
		const html = md('| a | b |\n| - | - |\n| 1 | 2 |');
		assert.ok(!html.includes('<table'));
	});

	t('images are not rendered', () => {
		const html = md('![alt](https://example.com/x.png)');
		assert.ok(!html.includes('<img'), 'markdown images do not exist in Discord');
	});

	t('--- is not a horizontal rule', () => {
		assert.ok(!md('---').includes('<hr'));
	});

	console.log('\n== mentions and links ==');

	t('a role mention resolves to its name when the list has it', () => {
		const html = md('<@&123>', {
			mentions: {
				roles: [{
					id: '123',
					name: 'Support',
				}],
			},
		});
		assert.ok(html.includes('@Support'), html);
		assert.ok(html.includes('role-mention'));
	});

	t('an unknown role falls back to its id rather than "unknown"', () => {
		const html = md('<@&999>', {
			mentions: {
				roles: [{
					id: '123',
					name: 'Support',
				}],
			},
		});
		assert.ok(html.includes('@999'));
	});

	t('a channel mention resolves too', () => {
		const html = md('<#55>', {
			mentions: {
				channels: [{
					id: '55',
					name: 'general',
				}],
			},
		});
		assert.ok(html.includes('#general'));
	});

	t('a role name containing HTML is escaped in the chip', () => {
		const html = md('<@&1>', {
			mentions: {
				roles: [{
					id: '1',
					name: '<b>x</b>',
				}],
			},
		});
		assert.ok(!html.includes('<b>'));
	});

	t('custom emoji become images from the CDN', () => {
		const html = md('<:wave:12345>');
		assert.ok(html.includes('cdn.discordapp.com/emojis/12345.png'));
		assert.ok(md('<a:wave:12345>').includes('12345.gif'), 'animated ones are gifs');
	});

	t('masked links and bare URLs both become one anchor', () => {
		const masked = md('[text](https://example.com)');
		assert.strictEqual(masked.match(/<a /g).length, 1);
		assert.ok(masked.includes('>text</a>'));
		const bare = md('https://example.com');
		assert.strictEqual(bare.match(/<a /g).length, 1);
	});

	console.log(`\n${pass} checks passed`);
})();
