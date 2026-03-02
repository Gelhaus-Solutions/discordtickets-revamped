class Locale extends Map {
    constructor(i18n, locale_id, messages) {
        super(messages);
        this.formatters = Object
            .entries(i18n.formatters)
            .reduce((acc, [name, builder]) => {
            const locales = [new Intl.Locale(locale_id)];
            if (i18n.default_locale_id)
                locales.push(new Intl.Locale(i18n.default_locale_id));
            acc[name] = builder(locales);
            return acc;
        }, {});
        this.i18n = i18n;
        this.locale_id = locale_id;
    }
    createTranslator() {
        return this.i18n.createTranslator(this.locale_id);
    }
    t(key, args) {
        return this.i18n.t(this.locale_id, key, args);
    }
}

var $t = {
    get(locale, original, data) {
        const [, , args, cycle] = original;
        return locale.i18n.t(locale.locale_id, data.k, {
            ...args,
            ...Object.fromEntries(Object.entries(data.o || {}).map(([k, v]) => [k, locale.i18n.resolve(args, v)])),
        }, cycle + 1);
    },
    parse(args) {
        const [key, options] = args.replace(/\s/g, '').split(',');
        const d = {
            k: key
        };
        if (options) {
            d.o = Object.fromEntries(new URLSearchParams(options).entries());
        }
        return d;
    }
};

class I18nLite {
    constructor(options) {
        this.default_locale_id = options?.default_locale_id;
        this.formatters = options?.formatters ?? {};
        this.getters = {
            $t,
            ...options?.getters,
        };
        this.locales = new Map();
        this.nested_limit = options?.nested_limit ?? 3;
    }
    createTranslator(locale_id) {
        const i18n = this;
        function t(key, args) {
            return i18n.t(locale_id, key, args);
        }
        t.locale = this.locales.get(locale_id);
        return t;
    }
    loadParsed(locale_id, messages) {
        const locale = new Locale(this, locale_id, messages);
        this.locales.set(locale_id, locale);
        return locale;
    }
    resolve(obj, key) {
        return key
            .split(/\./g)
            .reduce((acc, part) => acc && acc[part], obj);
    }
    t(locale_id, key, args = {}, nested = 0) {
        if (nested > this.nested_limit) {
            throw new Error(`Potential circular translation, "${key}" exceeded nesting limit (${this.nested_limit})`);
        }
        if (!this.locales.has(locale_id)) {
            throw new Error(`A locale with the name of "${locale_id}" does not exist`);
        }
        const locale = this.locales.get(locale_id);
        if (!locale.has(key)) {
            throw new Error(`The "${locale_id}" locale does not contain a message with the key "${key}"`);
        }
        let message = locale.get(key);
        if ('q' in message) {
            const plural_type = (message.q.cardinal && 'cardinal') || (message.q.ordinal && 'ordinal') || null;
            if (plural_type) {
                const input = this.resolve(args, message.q[plural_type]);
                if (isNaN(Number(input)) && !Array.isArray(input)) {
                    throw new Error(`A number/array value for the "${message.q[plural_type]}" variable is required`);
                }
                const literal = `${key}.=${input}`;
                if (locale.has(literal)) {
                    key = literal;
                }
                else {
                    const pr = new Intl.PluralRules(locale_id, { type: plural_type });
                    const rule = Array.isArray(input) ? pr.selectRange(...input) : pr.select(input);
                    key = key + '.' + rule;
                    if (!locale.has(key)) {
                        throw new Error(`Pluralisation failed: the "${locale_id}" locale does not contain a message with the key "${key}"`);
                    }
                }
                message = locale.get(key);
            }
        }
        let extracted;
        if (!('t' in message)) {
            if (!(this instanceof I18n) || !('o' in message)) {
                throw new Error(`Message "${key}" in the "${locale_id}" locale has not been extracted`);
            }
            const parsed = this.extract(message.o);
            locale.set(key, parsed);
            extracted = parsed;
        }
        else {
            extracted = message;
        }
        let offset = 0;
        let filled = extracted.t;
        if (extracted.p === undefined)
            return filled;
        for (const [position, placeholder] of extracted.p) {
            const corrected = position + offset;
            let value;
            let name;
            if ('v' in placeholder) {
                name = placeholder.v;
                const resolved = this.resolve(args, String(placeholder.v));
                if (typeof resolved === 'function') {
                    value = resolved(locale.formatters).result;
                }
                else {
                    value = resolved?.toString();
                }
            }
            else {
                name = placeholder.g;
                value = this.getters[placeholder.g].get(locale, [locale_id, key, args, nested], placeholder.d);
            }
            if (value === undefined)
                throw new Error(`A value for the "${name}" placeholder is required`);
            filled = filled.slice(0, corrected) + value + filled.slice(corrected);
            offset += value.length;
        }
        return filled;
    }
}

class I18n extends I18nLite {
    constructor(options) {
        super(options);
        this.defer_extraction = options?.defer_extraction ?? true;
        this.placeholder_regex = options?.placeholder_regex || /\\?{\s?(?:(?<variable>[-a-z0-9._]+)|(?:(?<getter>[$a-z0-9_]+)(?:\((?<args>[-a-z0-9()!@:%_+.~#?&/= ,]*)\))?))\s?}/gi;
    }
    extract(message) {
        const extracted = { t: message };
        const excluded = [];
        let match = null;
        while ((match = this.placeholder_regex.exec(extracted.t)) !== null) {
            if (match[0].startsWith('\\')) {
                excluded.push(match[0]);
                continue;
            }
            extracted.t = extracted.t.substring(0, match.index) + extracted.t.substring(match.index + match[0].length);
            this.placeholder_regex.lastIndex -= match[0].length;
            if (extracted.p === undefined)
                extracted.p = [];
            if (match.groups.variable) {
                extracted.p.push([
                    match.index,
                    {
                        v: match.groups.variable
                    }
                ]);
            }
            else {
                const g = match.groups.getter;
                const getter = this.getters[g];
                if (!getter)
                    throw new Error(`Getter "${g}" is not registered`);
                extracted.p.push([
                    match.index,
                    {
                        g,
                        d: getter.parse(match.groups.args),
                    }
                ]);
            }
        }
        excluded.forEach(str => extracted.t = extracted.t.replace(str, str.slice(1)));
        return extracted;
    }
    fallback(fallback_map) {
        if (!this.default_locale_id)
            throw new Error('No default locale is set');
        let ordered_ids;
        const default_locale = this.locales.get(this.default_locale_id);
        const locale_ids = Array.from(this.locales.keys());
        const fallen = {};
        if (fallback_map) {
            const set = new Set(Object.keys(fallback_map));
            for (const locale_id of locale_ids)
                set.add(locale_id);
            ordered_ids = [...set.values()];
        }
        else {
            ordered_ids = locale_ids;
        }
        for (const locale_id of ordered_ids) {
            fallen[locale_id] = [];
            let fallback_order;
            if (fallback_map) {
                fallback_order = [
                    ...(fallback_map[locale_id] || []),
                    this.default_locale_id
                ];
            }
            else {
                const base_language = new Intl.Locale(locale_id).language;
                if (base_language !== locale_id && this.locales.has(base_language))
                    fallback_order = [base_language, this.default_locale_id];
                else
                    fallback_order = [this.default_locale_id];
            }
            const locale = this.locales.get(locale_id);
            for (const [key] of default_locale) {
                if (locale.has(key))
                    continue;
                for (const fallback_id of fallback_order) {
                    const fallback_locale = this.locales.get(fallback_id);
                    if (fallback_locale.has(key)) {
                        locale.set(key, fallback_locale.get(key));
                        fallen[locale_id].push([key, fallback_id]);
                        break;
                    }
                }
            }
        }
        return fallen;
    }
    load(locale_id, messages, namespace) {
        return this.loadParsed(locale_id, this.parse(messages, namespace));
    }
    parse(messages, namespace) {
        const parsed = [];
        for (const [k, v] of Object.entries(messages)) {
            let key = namespace ? namespace + ':' + k : k;
            let query;
            const fi = key.indexOf('#');
            if (fi !== -1) {
                query = { cardinal: k.substring(fi + 1) };
                key = k.substring(0, fi);
            }
            else {
                const qi = key.indexOf('?');
                if (qi !== -1) {
                    query = Object.fromEntries(new URLSearchParams(k.substring(qi + 1)).entries());
                    key = k.substring(0, qi);
                }
            }
            if (typeof v === 'string') {
                parsed.push([
                    key,
                    this.defer_extraction ? { o: v } : this.extract(v)
                ]);
            }
            else if (typeof v === 'object') {
                if (query) {
                    parsed.push([
                        key,
                        { q: query }
                    ]);
                }
                const nested = this.parse(v);
                for (const [nested_k, ...nested_v] of nested) {
                    parsed.push([
                        key + '.' + nested_k,
                        ...nested_v
                    ]);
                }
            }
        }
        return parsed;
    }
}

export { I18nLite as I };
//# sourceMappingURL=I18n-COJpH9gE.js.map
