var BH = (function() {
/**
 * dirtyEnv указывает на то, что прототип объекта не пустой.
 * @type {Boolean}
 */
var dirtyEnv = false;
for (var i in {}) {
    dirtyEnv = true;
    break;
}
/**
 * BH: BEMJSON -> HTML процессор.
 * @constructor
 */
function BH() {
    /**
     * Используется для идентификации матчеров.
     * Каждому матчеру дается уникальный id для того, чтобы избежать повторного применения
     * матчера к одному и тому же узлу BEMJSON-дерева.
     * @type {Number}
     * @private
     */
    this._lastMatchId = 0;
    /**
     * Плоский массив для хранения матчеров.
     * Каждый элемент — массив с двумя элементами: [{String} выражение, {Function} матчер}]
     * @type {Array}
     * @private
     */
    this._matchers = [];
    /**
     * Флаг, включающий автоматическую систему поиска зацикливаний. Следует использовать в development-режиме,
     * чтобы определять причины зацикливания.
     * @type {Boolean}
     * @private
     */
    this._infiniteLoopDetection = false;

    /**
     * Неймспейс для библиотек. Сюда можно писать различный функционал для дальнейшего использования в матчерах.
     * ```javascript
     * bh.lib.objects = bh.lib.objects || {};
     * bh.lib.objects.inverse = bh.lib.objects.inverse || function(obj) { ... };
     * ```
     * @type {Object}
     */
    this.lib = {};
    this._inited = false;
    /**
     * Опции BH. Задаются через setOptions.
     * @type {Object}
     */
    this._options = {};
    this._optJsAttrName = 'onclick';
    this._optJsAttrIsJs = true;
    this.utils = {
        _lastGenId: 0,
        _expandoId: new Date().getTime(),
        bh: this,
        /**
         * Расширяет один объект свойствами другого (других).
         * Аналог jQuery.extend.
         * ```javascript
         * obj = ctx.extend(obj, {a: 1});
         * ```
         * @param {Object} target
         * @returns {Object}
         */
        extend: function(target) {
            if (typeof target !== 'object') {
                target = {};
            }
            for (var i = 1, len = arguments.length; i < len; i++) {
                var obj = arguments[i], key;
                if (obj) {
                    if (dirtyEnv) {
                        for (key in obj) {
                            if (obj.hasOwnProperty(key)) {
                                target[key] = obj[key];
                            }
                        }
                    } else {
                        for (key in obj) {
                            target[key] = obj[key];
                        }
                    }
                }
            }
            return target;
        },
        /**
         * Возвращает позицию элемента в рамках родителя.
         * Отсчет производится с 1 (единицы).
         * ```javascript
         * bh.match('list__item', function(ctx) {
         *     ctx.mod('pos', ctx.position());
         * });
         * ```
         * @returns {Number}
         */
        position: function () {
            var node = this.node;
            return node.index === 'content' ? 1 : node.index + 1;
        },
        /**
         * Возвращает true, если текущий BEMJSON-элемент первый в рамках родительского BEMJSON-элемента.
         * ```javascript
         * bh.match('list__item', function(ctx) {
         *     if (ctx.isFirst()) {
         *         ctx.mod('first', 'yes');
         *     }
         * });
         * ```
         * @returns {Boolean}
         */
        isFirst: function () {
            var node = this.node;
            return node.index === 'content' || node.index === 0;
        },
        /**
         * Возвращает true, если текущий BEMJSON-элемент последний в рамках родительского BEMJSON-элемента.
         * ```javascript
         * bh.match('list__item', function(ctx) {
         *     if (ctx.isLast()) {
         *         ctx.mod('last', 'yes');
         *     }
         * });
         * ```
         * @returns {Boolean}
         */
        isLast: function () {
            var node = this.node;
            return node.index === 'content' || node.index === node.arr.length - 1;
        },
        /**
         * Передает параметр вглубь BEMJSON-дерева. Например:
         * ```javascript
         * bh.match('input', function(ctx) {
         *     ctx.content({
         *         elem: 'control'
         *     }, true);
         *     ctx.tParam('value', ctx.param('value'));
         * });
         * bh.match('input__control', function(ctx) {
         *     ctx.attr('value', ctx.tParam('value'));
         * });
         * ```
         * @param {String} key
         * @param {*} value
         * @returns {*|Ctx}
         */
        tParam: function (key, value) {
            var keyName = '__tp_' + key;
            if (arguments.length === 2) {
                this.node[keyName] = value;
                return this;
            } else {
                var node = this.node;
                while (node) {
                    if (node.hasOwnProperty(keyName)) {
                        return node[keyName];
                    }
                    node = node.parentNode;
                }
                return undefined;
            }
        },
        /**
         * Применяет матчинг для переданного фрагмента BEMJSON.
         * Возвращает результат преобразований.
         * @param {Object|Array} bemJson
         * @returns {Object|Array}
         */
        apply: function (bemJson) {
            var prevCtx = this.ctx,
                prevNode = this.node;
            var res = this.bh.processBemJson(bemJson, prevCtx.block);
            this.ctx = prevCtx;
            this.node = prevNode;
            return res;
        },
        /**
         * Выполняет преобразования данного BEMJSON-элемента остальными матчерами.
         * Метод был переименован в applyBase.
         * @deprecated
         */
        applyCtx: function (changes) {
            return this.applyBase.apply(this, arguments);
        },
        /**
         * Выполняет преобразования данного BEMJSON-элемента остальными матчерами. Может понадобиться, например, чтобы добавить элемент в самый конец содержимого, если в базовых шаблонах в конец содержимого добавляются другие элементы.
         * Пример:
         * ```javascript
         * bh.match('header', function(ctx) {
         *    ctx.content([
         *        ctx.content(),
         *        { elem: 'under' }
         *    ], true);
         * });
         * bh.match('header_float_yes', function(ctx) {
         *    ctx.applyBase();
         *    ctx.content([
         *        ctx.content(),
         *        { elem: 'clear' }
         *    ], true);
         * });
         * ```
         * @param {Object} [changes]
         * @returns {Ctx}
         */
        applyBase: function (changes) {
            var prevCtx = this.ctx,
                prevNode = this.node,
                prevValues,
                key;
            if (changes) {
                prevValues = {};
                for (key in changes) {
                    if (dirtyEnv && !changes.hasOwnProperty(key)) continue;
                    prevValues[key] = prevCtx[key];
                    prevCtx[key] = changes[key];
                }
            }
            var res = this.bh.processBemJson(this.ctx, this.ctx.block, true);
            if (res !== prevCtx) {
                this.newCtx = res;
            }
            if (changes) {
                for (key in changes) {
                    if (dirtyEnv && !changes.hasOwnProperty(key)) continue;
                    prevCtx[key] = prevValues[key];
                }
            }
            this.ctx = prevCtx;
            this.node = prevNode;
            return this;
        },
        /**
         * Применяет матчеры, которые еще не были выполнены для данного фрагмента BEMJSON.
         * Используется в случаях, когда следует выполнить шаблоны после выставления модификаторов.
         * @returns {Ctx}
         */
        applyTemplates: function () {
            return this.applyBase();
        },
        /**
         * Останавливает выполнение прочих матчеров для данного BEMJSON-элемента.
         * Пример:
         * ```javascript
         * bh.match('button', function(ctx) {
         *     ctx.tag('button', true);
         * });
         * bh.match('button', function(ctx) {
         *     ctx.tag('span');
         *     ctx.stop();
         * });
         * ```
         * @returns {Ctx}
         */
        stop: function () {
            this.ctx._stop = true;
            return this;
        },
        /**
         * Возвращает уникальный идентификатор. Может использоваться, например,
         * чтобы задать соответствие между `label` и `input`.
         * @returns {String}
         */
        generateId: function (obj, onlyGet) {
            return 'uniq' + this._expandoId + (++this._lastGenId);
        },
        /**
         * Возвращает/устанавливает модификатор в зависимости от аргументов.
         * **force** — задать модификатор даже если он был задан ранее.
         * ```javascript
         * bh.match('input', function(ctx) {
         *     ctx.mod('native', 'yes');
         *     ctx.mod('disabled', true);
         * });
         * bh.match('input_islands_yes', function(ctx) {
         *     ctx.mod('native', '', true);
         *     ctx.mod('disabled', false, true);
         * });
         * ```
         * @param {String} key
         * @param {String|Boolean} [value]
         * @param {Boolean} [force]
         * @returns {String|undefined|Ctx}
         */
        mod: function(key, value, force) {
            var mods;
            if (value !== undefined) {
                mods = this.ctx.mods || (this.ctx.mods = {});
                mods[key] = mods[key] === undefined || force ? value : mods[key];
                return this;
            } else {
                mods = this.ctx.mods;
                return mods ? mods[key] : undefined;
            }
        },
        /**
         * Возвращает/устанавливает модификаторы в зависимости от аргументов.
         * **force** — задать модификаторы даже если они были заданы ранее.
         * ```javascript
         * bh.match('paranja', function(ctx) {
         *     ctx.mods({
         *         theme: 'normal',
         *         disabled: true
         *     });
         * });
         * ```
         * @param {Object} [values]
         * @param {Boolean} [force]
         * @returns {Object|Ctx}
         */
        mods: function(values, force) {
            var mods = this.ctx.mods || (this.ctx.mods = {});
            if (values !== undefined) {
                for (var key in values) {
                    if (dirtyEnv && !values.hasOwnProperty(key)) continue;
                    mods[key] = mods[key] === undefined || force ? values[key] : mods[key];
                }
                return this;
            } else {
                return mods;
            }
        },
        /**
         * Возвращает/устанавливает тег в зависимости от аргументов.
         * **force** — задать значение тега даже если оно было задано ранее.
         * ```javascript
         * bh.match('input', function(ctx) {
         *     ctx.tag('input');
         * });
         * ```
         * @param {String} [tagName]
         * @param {Boolean} [force]
         * @returns {String|undefined|Ctx}
         */
        tag: function(tagName, force) {
            if (tagName !== undefined) {
                this.ctx.tag = this.ctx.tag === undefined || force ? tagName : this.ctx.tag;
                return this;
            } else {
                return this.ctx.tag;
            }
        },
        /**
         * Возвращает/устанавливает значение mix в зависимости от аргументов.
         * При установке значения, если force равен true, то переданный микс заменяет прежнее значение,
         * в противном случае миксы складываются.
         * ```javascript
         * bh.match('button_pseudo_yes', function(ctx) {
         *     ctx.mix([{block: 'b-link'}]);
         * });
         * ```
         * @param {Array|BemJson} [mix]
         * @param {Boolean} [force]
         * @returns {Array|undefined|Ctx}
         */
        mix: function(mix, force) {
            if (mix !== undefined) {
                if (force) {
                    this.ctx.mix = mix;
                } else {
                    if (this.ctx.mix) {
                        this.ctx.mix = Array.isArray(this.ctx.mix) ?
                            this.ctx.mix.concat(mix) :
                            [this.ctx.mix].concat(mix);
                    } else {
                        this.ctx.mix = mix;
                    }
                }
                return this;
            } else {
                return this.ctx.mix;
            }
        },
        /**
         * Возвращает/устанавливает значение атрибута в зависимости от аргументов.
         * **force** — задать значение атрибута даже если оно было задано ранее.
         * @param {String} key
         * @param {String} [value]
         * @param {Boolean} [force]
         * @returns {String|undefined|Ctx}
         */
        attr: function(key, value, force) {
            var attrs;
            if (value !== undefined) {
                attrs = this.ctx.attrs || (this.ctx.attrs = {});
                attrs[key] = attrs[key] === undefined || force ? value : attrs[key];
                return this;
            } else {
                attrs = this.ctx.attrs;
                return attrs ? attrs[key] : undefined;
            }
        },
        /**
         * Возвращает/устанавливает атрибуты в зависимости от аргументов.
         * **force** — задать атрибуты даже если они были заданы ранее.
         * ```javascript
         * bh.match('input', function(ctx) {
         *     ctx.attrs({
         *         name: ctx.param('name'),
         *         autocomplete: 'off'
         *     });
         * });
         * ```
         * @param {Object} [values]
         * @param {Boolean} [force]
         * @returns {Object|Ctx}
         */
        attrs: function(values, force) {
            var attrs = this.ctx.attrs || (this.ctx.attrs = {});
            if (values !== undefined) {
                for (var key in values) {
                    if (dirtyEnv && !values.hasOwnProperty(key) || values[key] === undefined) continue;
                    if (attrs[key] === undefined || force) attrs[key] = values[key];
                }
                return this;
            } else {
                return attrs;
            }
        },
        /**
         * Возвращает/устанавливает значение bem в зависимости от аргументов.
         * **force** — задать значение bem даже если оно было задано ранее.
         * Если `bem` имеет значение `true`, то для элемента не будут генерироваться BEM-классы.
         * ```javascript
         * bh.match('meta', function(ctx) {
         *     ctx.bem(false);
         * });
         * ```
         * @param {Boolean} [bem]
         * @param {Boolean} [force]
         * @returns {Boolean|undefined|Ctx}
         */
        bem: function(bem, force) {
            if (bem !== undefined) {
                this.ctx.bem = this.ctx.bem === undefined || force ? bem : this.ctx.bem;
                return this;
            } else {
                return this.ctx.bem;
            }
        },
        /**
         * Возвращает/устанавливает значение `js` в зависимости от аргументов.
         * **force** — задать значение `js` даже если оно было задано ранее.
         * Значение `js` используется для инициализации блоков в браузере через `BEM.DOM.init()`.
         * ```javascript
         * bh.match('input', function(ctx) {
         *     ctx.js(true);
         * });
         * ```
         * @param {Boolean|Object} [js]
         * @param {Boolean} [force]
         * @returns {Boolean|Object|Ctx}
         */
        js: function(js, force) {
            if (js !== undefined) {
                this.ctx.js = this.ctx.js === undefined || force ? js : this.ctx.js;
                return this;
            } else {
                return this.ctx.js;
            }
        },
        /**
         * Возвращает/устанавливает значение CSS-коасс в зависимости от аргументов.
         * **force** — задать значение CSS-класса даже если оно было задано ранее.
         * ```javascript
         * bh.match('page', function(ctx) {
         *     ctx.cls('ua_js_no ua_css_standard');
         * });
         * ```
         * @param cls
         * @param force
         * @returns {*}
         */
        cls: function(cls, force) {
            if (cls !== undefined) {
                this.ctx.cls = this.ctx.cls === undefined || force ? cls : this.ctx.cls;
                return this;
            } else {
                return this.ctx.cls;
            }
        },
        /**
         * Возвращает/устанавливает параметр текущего BEMJSON-элемента.
         * **force** — задать значение параметра, даже если оно было задано ранее.
         * Например:
         * ```javascript
         * // Пример входного BEMJSON: { block: 'search', action: '/act' }
         * bh.match('search', function(ctx) {
         *     ctx.attr('action', ctx.param('action') || '/');
         * });
         * ```
         * @param {String} key
         * @param {*} [value]
         * @param {Boolean} [force]
         * @returns {*|Ctx}
         */
        param: function(key, value, force) {
            if (value !== undefined) {
                this.ctx[key] = this.ctx[key] === undefined || force ? value : this.ctx[key];
                return this;
            } else {
                return this.ctx[key];
            }
        },
        /**
         * Возвращает/устанавливает содержимое в зависимости от аргументов.
         * **force** — задать содержимое даже если оно было задано ранее.
         * ```javascript
         * bh.match('input', function(ctx) {
         *     ctx.content({ elem: 'control' });
         * });
         * ```
         * @param {String} [value]
         * @param {Boolean} [force]
         * @returns {*|Ctx}
         */
        content: function(value, force) {
            if (arguments.length > 0) {
                this.ctx.content = this.ctx.content === undefined || force ? value : this.ctx.content;
                return this;
            } else {
                return this.ctx.content;
            }
        },
        /**
         * Возвращает текущий фрагмент BEMJSON-дерева.
         * Может использоваться в связке с `return` для враппинга и подобных целей.
         * ```javascript
         * bh.match('input', function(ctx) {
         *     return {
         *         elem: 'wrapper',
         *         content: ctx.json()
         *     };
         * });
         * ```
         * @returns {Object|Array}
         */
        json: function() {
            return this.newCtx || this.ctx;
        }
    };
}

BH.prototype = {

    /**
     * Задает опции шаблонизации.
     *
     * @param {Object} options
     *        {String} options[jsAttrName] Атрибут, в который записывается значение поля `js`. По умолчанию, `onclick`.
     *        {String} options[jsAttrScheme] Схема данных для `js`-значения.
     *                 Форматы:
     *                     `js` — значение по умолчанию. Получаем `return { ... }`.
     *                     `json` — JSON-формат. Получаем `{ ... }`.
     * @returns {BH}
     */
    setOptions: function(options) {
        var i;
        var bhOptions = this._options;
        if (dirtyEnv) {
            for (i in options) {
                if (options.hasOwnProperty(i)) {
                    bhOptions[i] = bhOptions;
                }
            }
        } else {
            for (i in options) {
                bhOptions[i] = bhOptions;
            }
        }
        if (options.jsAttrName) {
            this._optJsAttrName = options.jsAttrName;
        }
        if (options.jsAttrScheme) {
            this._optJsAttrIsJs = options.jsAttrScheme === 'js';
        }
        return this;
    },

    /**
     * Возвращает опции шаблонизации.
     *
     * @returns {Object}
     */
    getOptions: function() {
        return this._options;
    },

    /**
     * Включает/выключает механизм определения зацикливаний.
     *
     * @param {Boolean} enable
     * @returns {BH}
     */
    enableInfiniteLoopDetection: function(enable) {
        this._infiniteLoopDetection = enable;
        return this;
    },

    /**
     * Преобразует BEMJSON в HTML-код.
     * @param {Object|Array|String} bemJson
     */
    apply: function (bemJson) {
        return this.toHtml(this.processBemJson(bemJson));
    },

    /**
     * Объявляет матчер.
     * ```javascript
     * bh.match('page', function(ctx) {
     *     ctx.mix([{ block: 'ua' }]);
     *     ctx.cls('ua_js_no ua_css_standard');
     * });
     * bh.match('block_mod_modVal', function(ctx) {
     *     ctx.tag('span');
     * });
     * bh.match('block__elem', function(ctx) {
     *     ctx.attr('disabled', 'disabled');
     * });
     * bh.match('block__elem_elemMod', function(ctx) {
     *     ctx.mix([{ block: 'link' }]);
     * });
     * bh.match('block__elem_elemMod_elemModVal', function(ctx) {
     *     ctx.mod('active', 'yes');
     * });
     * bh.match('block_blockMod__elem', function(ctx) {
     *     ctx.param('checked', true);
     * });
     * bh.match('block_blockMod_blockModVal__elem', function(ctx) {
     *     ctx.content({
     *         elem: 'wrapper',
     *         content: ctx
     *     };
     * });
     * ```
     * @param {String} expr
     * @param {Function} matcher
     */
    match: function (expr, matcher) {
        matcher.__id = '__func' + (this._lastMatchId++);
        this._matchers.push([expr, matcher]);
        this._fastMatcher = null;
    },

    /**
     * Вспомогательный метод для компиляции матчеров с целью их быстрого дальнейшего исполнения.
     * @returns {String}
     */
    buildMatcher: function () {

        /**
         * Группирует селекторы матчеров по указанному ключу.
         * @param {Array} data
         * @param {String} key
         * @returns {Object}
         */
        function groupBy(data, key) {
            var res = {};
            for (var i = 0, l = data.length; i < l; i++) {
                var item = data[i];
                var value = item[key] || '__no_value__';
                (res[value] || (res[value] = [])).push(item);
            }
            return res;
        }

        var i, j, l;
        var res = [''];
        var vars = ['bh = this'];
        var allMatchers = this._matchers;
        var decl, expr, matcherInfo;
        var declarations = [], exprBits, blockExprBits;
        for (i = allMatchers.length - 1; i >= 0; i--) {
            matcherInfo = allMatchers[i];
            expr = matcherInfo[0];
            if (expr) {
                vars.push('_m' + i + ' = ms[' + i + '][1]');
                decl = { fn: matcherInfo[1], index: i };
                if (~expr.indexOf('__')) {
                    exprBits = expr.split('__');
                    blockExprBits = exprBits[0].split('_');
                    decl.block = blockExprBits[0];
                    if (blockExprBits.length > 1) {
                        decl.blockMod = blockExprBits[1];
                        decl.blockModVal = blockExprBits[2] || true;
                    }
                    exprBits = exprBits[1].split('_');
                    decl.elem = exprBits[0];
                    if (exprBits.length > 1) {
                        decl.mod = exprBits[1];
                        decl.modVal = exprBits[2] || true;
                    }
                } else {
                    exprBits = expr.split('_');
                    decl.block = exprBits[0];
                    if (exprBits.length > 1) {
                        decl.mod = exprBits[1];
                        decl.modVal = exprBits[2] || true;
                    }
                }
                declarations.push(decl);
            }
        }
        var declByBlock = groupBy(declarations, 'block');
        res.push('var ' + vars.join(', ') + ';');
        res.push('function applyMatchers(ctx, json) {');
        res.push('var subRes, newCtx;');

        res.push('switch (json.block) {');
        for (var blockName in declByBlock) {
            if (dirtyEnv && !declByBlock.hasOwnProperty(blockName)) continue;
            res.push('case "' + escapeStr(blockName) + '":');
            var declsByElem = groupBy(declByBlock[blockName], 'elem');

            res.push('switch (json.elem) {');
            for (var elemName in declsByElem) {
                if (dirtyEnv && !declsByElem.hasOwnProperty(elemName)) continue;

                if (elemName === '__no_value__') {
                    res.push('case undefined:');
                } else {
                    res.push('case "' + escapeStr(elemName) + '":');
                }
                var decls = declsByElem[elemName];
                for (j = 0, l = decls.length; j < l; j++) {
                    decl = decls[j];
                    var fn = decl.fn;
                    var conds = [];
                    conds.push('!json.' + fn.__id);
                    if (decl.mod) {
                        conds.push('json.mods');
                        if (decl.modVal === '*') {
                            conds.push('json.mods["' + escapeStr(decl.mod) + '"]');
                        } else {
                            conds.push(
                                'json.mods["' + escapeStr(decl.mod) + '"] === ' +
                                (decl.modVal === true || '"' + escapeStr(decl.modVal) + '"')
                            );
                        }
                    }
                    if (decl.blockMod) {
                        conds.push('json.blockMods');
                        if (decl.blockModVal === '*') {
                            conds.push('json.blockMods["' + escapeStr(decl.blockMod) + '"]');
                        } else {
                            conds.push(
                                'json.blockMods["' + escapeStr(decl.blockMod) + '"] === ' +
                                (decl.blockModVal === true || '"' + escapeStr(decl.blockModVal) + '"')
                            );
                        }
                    }
                    res.push('if (' + conds.join(' && ') + ') {');
                    res.push('json.' + fn.__id + ' = true;');
                    res.push('subRes = _m' + decl.index + '(ctx, json);');
                    res.push('if (subRes) { return subRes; }');
                    res.push('if (newCtx = ctx.newCtx) { ctx.newCtx = null; return newCtx; }');
                    res.push('if (json._stop) return;');
                    res.push('}');
                }
                res.push('return;');
            }
            res.push('}');

            res.push('return;');
        }
        res.push('}');
        res.push('};');
        res.push('return applyMatchers;');
        return res.join('\n');
    },

    /**
     * Раскрывает BEMJSON, превращая его из краткого в полный.
     * @param {Object|Array} bemJson
     * @param {String} [blockName]
     * @param {Boolean} [ignoreContent]
     * @returns {Object|Array}
     */
    processBemJson: function (bemJson, blockName, ignoreContent) {
        if (!this._inited) {
            this._init();
        }
        var resultArr = [bemJson];
        var nodes = [{ json: bemJson, arr: resultArr, index: 0, blockName: blockName, blockMods: bemJson.mods || {} }];
        var node, json, block, blockMods, i, l, p, child, subRes;
        var compiledMatcher = (this._fastMatcher || (this._fastMatcher = Function('ms', this.buildMatcher())(this._matchers)));
        var processContent = !ignoreContent;
        var infiniteLoopDetection = this._infiniteLoopDetection;

        /**
         * Враппер для json-узла.
         * @constructor
         */
        function Ctx() {
            this.ctx = null;
            this.newCtx = null;
        }
        Ctx.prototype = this.utils;
        var ctx = new Ctx();
        while (node = nodes.shift()) {
            json = node.json;
            block = node.blockName;
            blockMods = node.blockMods;
            if (Array.isArray(json)) {
                for (i = 0, l = json.length; i < l; i++) {
                    child = json[i];
                    if (child !== false && child != null && typeof child === 'object') {
                        nodes.push({ json: child, arr: json, index: i, blockName: block, blockMods: blockMods, parentNode: node });
                    }
                }
            } else {
                var content, stopProcess = false;
                if (json.elem) {
                    block = json.block = json.block || block;
                    blockMods = json.blockMods = json.blockMods || blockMods;
                    if (json.elemMods) {
                        json.mods = json.elemMods;
                    }
                } else if (json.block) {
                    block = json.block;
                    blockMods = json.mods || (json.mods = {});
                }

                if (json.block) {

                    if (infiniteLoopDetection) {
                        json.__processCounter = (json.__processCounter || 0) + 1;
                        if (json.__processCounter > 100) {
                            throw new Error('Infinite loop detected at "' + json.block + (json.elem ? '__' + json.elem : '') + '".');
                        }
                    }

                    subRes = null;

                    if (!json._stop) {
                        ctx.node = node;
                        ctx.ctx = json;
                        subRes = compiledMatcher(ctx, json);
                        if (subRes) {
                            json = subRes;
                            node.json = json;
                            node.blockName = block;
                            node.blockMods = blockMods;
                            nodes.push(node);
                            stopProcess = true;
                        }
                    }

                }
                if (!stopProcess) {
                    if (Array.isArray(json)) {
                        node.json = json;
                        node.blockName = block;
                        node.blockMods = blockMods;
                        nodes.push(node);
                    } else {
                        if (processContent && (content = json.content)) {
                            if (Array.isArray(content)) {
                                var flatten;
                                do {
                                    flatten = false;
                                    for (i = 0, l = content.length; i < l; i++) {
                                        if (Array.isArray(content[i])) {
                                            flatten = true;
                                            break;
                                        }
                                    }
                                    if (flatten) {
                                        json.content = content = content.concat.apply([], content);
                                    }
                                } while (flatten);
                                for (i = 0, l = content.length, p = l - 1; i < l; i++) {
                                    child = content[i];
                                    if (child !== false && child != null && typeof child === 'object') {
                                        nodes.push({ json: child, arr: content, index: i, blockName: block, blockMods: blockMods, parentNode: node });
                                    }
                                }
                            } else {
                                nodes.push({ json: content, arr: json, index: 'content', blockName: block, blockMods: blockMods, parentNode: node });
                            }
                        }
                    }
                }
            }
            node.arr[node.index] = json;
        }
        return resultArr[0];
    },

    /**
     * Превращает раскрытый BEMJSON в HTML.
     * @param {Object|Array|String} json
     * @returns {String}
     */
    toHtml: function (json) {
        var res, i, l, item;
        if (json === false || json == null) return '';
        if (typeof json !== 'object') {
            return json;
        } else if (Array.isArray(json)) {
            res = '';
            for (i = 0, l = json.length; i < l; i++) {
                item = json[i];
                if (item !== false && item != null) {
                    res += this.toHtml(item);
                }
            }
            return res;
        } else {
            if (json.mix && !Array.isArray(json.mix)) {
                json.mix = [json.mix];
            }
            var cls = json.bem !== false && json.block ? toBemCssClasses(json, json.block) : '',
                jattr, jval, attrs = '', jsParams, hasMixJsParams = false;

            if (jattr = json.attrs) {
                if (dirtyEnv) {
                    for (i in jattr) {
                        jval = jattr[i];
                        if (jattr.hasOwnProperty(i) && jval !== null && jval !== undefined) {
                            attrs += ' ' + i + '="' + escapeAttr(jval) + '"';
                        }
                    }
                } else {
                    for (i in jattr) {
                        jval = jattr[i];
                        if (jval !== null && jval !== undefined) {
                            attrs += ' ' + i + '="' + escapeAttr(jval) + '"';
                        }
                    }
                }
            }

            if (json.js) {
                (jsParams = {})[json.block + (json.elem ? '__' + json.elem : '')] = json.js === true ? {} : json.js;
            }

            var mixes = json.mix;
            if (mixes && mixes.length) {
                for (i = 0, l = mixes.length; i < l; i++) {
                    var mix = mixes[i];
                    if (mix.js) {
                        (jsParams = jsParams || {})[(mix.block || json.block) + (mix.elem ? '__' + mix.elem : '')] = mix.js === true ? {} : mix.js;
                        hasMixJsParams = true;
                    }
                }
            }

            if (jsParams) {
                if (json.bem !== false) {
                    cls = cls + ' i-bem';
                }
                var jsData = (!hasMixJsParams && json.js === true ?
                    '{&quot;' + json.block + (json.elem ? '__' + json.elem : '') + '&quot;:{}}' :
                    escapeAttr(JSON.stringify(jsParams)));
                attrs += ' ' + (json.jsAttr || this._optJsAttrName) + '="' +
                    (this._optJsAttrIsJs ? 'return ' + jsData + ';' : jsData) + '"';
            }

            if (json.cls) {
                cls = cls ? cls + ' ' + json.cls : json.cls;
            }

            var content, tag = (json.tag || 'div');
            res = '<' + tag + (cls ? ' class="' + escapeAttr(cls) + '"' : '') + (attrs ? attrs : '');

            if (selfCloseHtmlTags[tag]) {
                res += '/>';
            } else {
                res += '>';
                if ((content = json.content) != null) {
                    if (Array.isArray(content)) {
                        for (i = 0, l = content.length; i < l; i++) {
                            item = content[i];
                            if (item !== false && item != null) {
                                res += this.toHtml(item);
                            }
                        }
                    } else {
                        res += this.toHtml(content);
                    }
                }
                res += '</' + tag + '>';
            }
            return res;
        }
    },

    /**
     * Инициализация BH.
     */
    _init: function() {
        this._inited = true;
        /*
            Копируем ссылку на BEM.I18N в bh.lib.i18n, если это возможно.
        */
        if (typeof BEM !== 'undefined' && typeof BEM.I18N !== 'undefined') {
            this.lib.i18n = this.lib.i18n || BEM.I18N;
        }
    }
};

/**
 * @deprecated
 */
BH.prototype.processBemjson = BH.prototype.processBemJson;

var selfCloseHtmlTags = {
    area: 1,
    base: 1,
    br: 1,
    col: 1,
    command: 1,
    embed: 1,
    hr: 1,
    img: 1,
    input: 1,
    keygen: 1,
    link: 1,
    meta: 1,
    param: 1,
    source: 1,
    wbr: 1
};

var escapeAttr = function (attrVal) {
    attrVal += '';
    if (~attrVal.indexOf('&')) {
        attrVal = attrVal.replace(/&/g, '&amp;');
    }
    if (~attrVal.indexOf('"')) {
        attrVal = attrVal.replace(/"/g, '&quot;');
    }
    return attrVal;
};

var escapeStr = function (str) {
    str += '';
    if (~str.indexOf('\\')) {
        str = str.replace(/\\/g, '\\\\');
    }
    if (~str.indexOf('"')) {
        str = str.replace(/"/g, '\\"');
    }
    return str;
};

var toBemCssClasses = function (json, blockName) {
    var mods, mod, res,
        base = (json.block || blockName) + (json.elem ? '__' + json.elem : ''),
        mix, i, l;
    res = base;
    if (mods = json.mods) {
        if (dirtyEnv) {
            for (i in mods) {
                if (mods.hasOwnProperty(i) && (mod = mods[i])) {
                    res += ' ' + base + '_' + i + (mod === true ? '' : '_' + mod);
                }
            }
        } else {
            for (i in mods) {
                if (mod = mods[i]) {
                    res += ' ' + base + '_' + i + (mod === true ? '' : '_' + mod);
                }
            }
        }
    }
    if ((mix = json.mix) && (l = mix.length)) {
        for (i = 0; i < l; i++) {
            res += ' ' + toBemCssClasses(mix[i], blockName);
        }
    }
    return res;
};

return BH;
})();

if (typeof module !== 'undefined') {
    module.exports = BH;
}

var bh = new BH();
bh.setOptions({
    jsAttrName: 'data-bem',
    jsAttrScheme: 'json'
});
// begin: ../../libs/bem-core/common.blocks/page/page.bh.js


    bh.match('page', function(ctx, json) {
        ctx
            .tag('body')
            .content([
                ctx.content(),
                json.scripts
            ], true);

        return [
            json.doctype || '<!DOCTYPE html>',
            {
                tag : 'html',
                cls : 'ua_js_no',
                content : [
                    {
                        elem : 'head',
                        content : [
                            { tag : 'meta', attrs : { charset : 'utf-8' } },
                            { tag : 'title', content : json.title },
                            { block : 'ua' },
                            json.styles,
                            json.head,
                            json.favicon? { elem : 'favicon', url : json.favicon } : '',
                        ]
                    },
                    json
                ]
            }
        ];
    });

    bh.match('page__head', function(ctx) {
        ctx.bem(false).tag('head');
    });

    bh.match('page__meta', function(ctx) {
        ctx.bem(false).tag('meta');
    });

    bh.match('page__link', function(ctx) {
        ctx.bem(false).tag('link');
    });

    bh.match('page__favicon', function(ctx, json) {
        ctx
            .bem(false)
            .tag('link')
            .attr('rel', 'shortcut icon')
            .attr('href', json.url);
    });


// end: ../../libs/bem-core/common.blocks/page/page.bh.js

// begin: ../../libs/bem-core/desktop.blocks/page/page.bh.js


    bh.match('page__head', function(ctx, json) {
        ctx.content([
            json['x-ua-compatible'] === false?
                false :
                {
                    tag : 'meta',
                    attrs : {
                        'http-equiv' : 'X-UA-Compatible',
                        content : json['x-ua-compatible'] || 'IE=edge'
                    }
                },
            ctx.content()
        ], true);
    });


// end: ../../libs/bem-core/desktop.blocks/page/page.bh.js

// begin: ../../libs/bem-core/common.blocks/ua/ua.bh.js


    bh.match('ua', function(ctx) {
        ctx
            .bem(false)
            .tag('script')
            .content([
                '(function(e,c){',
                    'e[c]=e[c].replace(/(ua_js_)no/g,"$1yes");',
                '})(document.documentElement,"className");',
                ctx.content()
            ], true);
    });


// end: ../../libs/bem-core/common.blocks/ua/ua.bh.js

// begin: ../../libs/bem-core/common.blocks/page/__css/page__css.bh.js


    bh.match('page__css', function(ctx, json) {
        ctx.bem(false);

        if(json.url) {
            ctx
                .tag('link')
                .attr('rel', 'stylesheet')
                .attr('href', json.url);
        } else {
            ctx.tag('style');
        }

    });


// end: ../../libs/bem-core/common.blocks/page/__css/page__css.bh.js

// begin: ../../libs/bem-core/desktop.blocks/page/__css/page__css.bh.js


    bh.match('page__css', function(ctx, json) {
        if(json.hasOwnProperty('ie')) {
            var ie = json.ie;
            if(ie === true) {
                var url = json.url;
                return [6, 7, 8, 9].map(function(v) {
                    return { elem : 'css', url : url + '.ie' + v + '.css', ie : 'IE ' + v };
                });
            } else {
                var hideRule = !ie?
                    ['gt IE 9', '<!-->', '<!--'] :
                    ie === '!IE'?
                        [ie, '<!-->', '<!--'] :
                        [ie, '', ''];
                return [
                    '<!--[if' + hideRule[0] + ']>' + hideRule[1],
                    json,
                    hideRule[2] + '<![endif]-->'
                ];
            }
        }
    });


// end: ../../libs/bem-core/desktop.blocks/page/__css/page__css.bh.js

// begin: ../../libs/bem-core/common.blocks/page/__js/page__js.bh.js


    bh.match('page__js', function(ctx, json) {
        ctx
            .bem(false)
            .tag('script');
        json.url && ctx.attr('src', json.url);
    });


// end: ../../libs/bem-core/common.blocks/page/__js/page__js.bh.js

// begin: ../../libs/bem-core/common.blocks/ua/__svg/ua__svg.bh.js


    bh.match('ua', function(ctx) {
        ctx.content([
            '(function(d,n){',
                'd.documentElement.className+=',
                '" ua_svg_"+(d[n]&&d[n]("http://www.w3.org/2000/svg","svg").createSVGRect?"yes":"no");',
            '})(document,"createElementNS");',
            ctx.content()
        ], true);
    });


// end: ../../libs/bem-core/common.blocks/ua/__svg/ua__svg.bh.js

// begin: ../../design/common.blocks/table/table.bh.js


    bh.match('table', function(ctx) {
        ctx.tag('table');
    });

    bh.match('table__row', function(ctx) {
        ctx.tag('tr');
    });

    bh.match('table__title', function(ctx) {
        ctx.tag('th');
    });

    bh.match('table__cell', function(ctx) {
        ctx.tag('td');
    });


// end: ../../design/common.blocks/table/table.bh.js

// begin: ../../common.blocks/link/link.bh.js


    bh.match('link', function(ctx, json) {
        ctx.tag('a');

        var attrs = {},
            url = json.url,
            typeOfUrl = typeof url;

        typeOfUrl !== 'undefined' && (attrs.href = typeOfUrl === 'string'?
            url :
            url); // TODO: реализовать возможность отдавать bemjson в url

        json.title && (attrs.title = json.title);
        json.target && (attrs.target = json.target);

        ctx.attrs(attrs);
    });


// end: ../../common.blocks/link/link.bh.js

// begin: ../../common.blocks/attach/attach.bh.js


    bh.match('attach', function(ctx, json) {
        ctx
            .tParam('_attach', json)

            .tag('span')

            .js(true);

        if(typeof ctx.content() === 'undefined') {
            var buttonText = json.buttonText,
                button = json.button;

            button || (button = {
                block : 'button',
                tag : 'span',
                text : buttonText
            });

            button.mods || (button.mods = {});
            var modNames = ['size', 'theme', 'disabled'], i = 0, modName;
            while(modName = modNames[i++])
                button.mods[modName] || (button.mods[modName] = ctx.mod(modName));

            ctx.content([
                button,
                {
                    elem : 'no-file',
                    content : json.noFileText
                }
            ]);
        }
    });


// end: ../../common.blocks/attach/attach.bh.js

// begin: ../../common.blocks/button/button.bh.js


    bh.match('button', function(ctx, json) {
        ctx.mod('togglable') && ctx.mod('checked') && ctx.mod('pressed', true);

        ctx.js(true);

        // Common attributes
        ctx.attr('role', 'button');

        json.tabIndex && ctx.attr('tabindex', json.tabIndex);

        // Attributes for button variant
        if(!ctx.mod('type')) {
            json.tag || ctx.attr('type', json.type || 'button');
            json.name && ctx.attr('name', json.name);
            json.val && ctx.attr('value', json.val);
            ctx.mod('disabled') && ctx.attr('disabled', 'disabled');
        }

        ctx.tag(json.tag || 'button');

        var content = ctx.content();
        if(typeof content === 'undefined') {
            content = [json.icon];
            json.text && content.push({ elem : 'text', content : json.text });
            ctx.content(content);
        }
    });


// end: ../../common.blocks/button/button.bh.js

// begin: ../../common.blocks/button/__text/button__text.bh.js

    bh.match('button__text', function(ctx) {
        ctx.tag('span');
    });

// end: ../../common.blocks/button/__text/button__text.bh.js

// begin: ../../common.blocks/attach/__button/attach__button.bh.js


    bh.match('button', function(ctx) {
        if(ctx.tParam('_attach')) {
            ctx
                .applyBase()
                .tag('span', true)
                .content([
                    { block : 'attach', elem : 'control' },
                    ctx.content()
                ], true);
        }
    });


// end: ../../common.blocks/attach/__button/attach__button.bh.js

// begin: ../../common.blocks/attach/__control/attach__control.bh.js


    bh.match('attach__control', function(ctx) {
        var attrs = { type : 'file' },
            attach = ctx.tParam('_attach');

        // в js генерим html для attach__control без самого attach
        if(attach) {
            attrs.name = attach.name;
            attach.mods && attach.mods.disabled && (attrs.disabled = 'disabled');
            attach.tabIndex && (attrs.tabindex = attach.tabIndex);
        }

        ctx
            .tag('input')
            .attrs(attrs);

    });


// end: ../../common.blocks/attach/__control/attach__control.bh.js

// begin: ../../common.blocks/attach/__no-file/attach__no-file.bh.js

    bh.match('attach__no-file', function(ctx) {
        ctx.tag('span');
    });

// end: ../../common.blocks/attach/__no-file/attach__no-file.bh.js

// begin: ../../common.blocks/attach/__file/attach__file.bh.js

    bh.match('attach__file', function(ctx) {
        ctx.tag('span');
    });

// end: ../../common.blocks/attach/__file/attach__file.bh.js

// begin: ../../common.blocks/attach/__icon/attach__icon.bh.js

    bh.match('attach__icon', function(ctx) {
        ctx.tag('i');
    });

// end: ../../common.blocks/attach/__icon/attach__icon.bh.js

// begin: ../../common.blocks/attach/__text/attach__text.bh.js

    bh.match('attach__text', function(ctx) {
        ctx.tag('span');
    });

// end: ../../common.blocks/attach/__text/attach__text.bh.js

// begin: ../../common.blocks/attach/__clear/attach__clear.bh.js

    bh.match('attach__clear', function(ctx) {
        ctx.tag('i');
    });

// end: ../../common.blocks/attach/__clear/attach__clear.bh.js

// begin: ../../common.blocks/button/__icon/button__icon.bh.js

    bh.match('button__icon', function(ctx) {
        ctx.tag('i');
    });

// end: ../../common.blocks/button/__icon/button__icon.bh.js

// begin: ../../common.blocks/button/_type/button_type_link.bh.js


    bh.match('button_type_link', function(ctx, json) {
        ctx
            .tag('a')
            .attr('href', json.url);

        json.target && ctx.attr('target', json.target);
        ctx.mod('disabled') && ctx.attr('aria-disabled', true);
    });


// end: ../../common.blocks/button/_type/button_type_link.bh.js

// begin: ../../common.blocks/input/input.bh.js


    bh.match('input', function(ctx, json) {
        ctx.tag('span')

            .js(true)

            .param('id', ctx.generateId())

            .tParam('_input', json);

        var content = ctx.content();
        if(typeof content === 'undefined') {
            content = [{ elem : 'control' }];
            // NOTE: не вынесли в отдельные шаблоны ради оптимизации
            ctx.label && content.unshift({ elem : 'label', content : ctx.label });
            ctx.content(content);
        }
    });


// end: ../../common.blocks/input/input.bh.js

// begin: ../../common.blocks/input/__box/input__box.bh.js

    bh.match('input__box', function(ctx) {
        ctx.tag('span');
    });

// end: ../../common.blocks/input/__box/input__box.bh.js

// begin: ../../common.blocks/input/__control/input__control.bh.js


    bh.match('input__control', function(ctx) {
        ctx.tag('input');

        var input = ctx.tParam('_input'),
            attrs = {
                id : input.id,
                name : input.name,
                value : input.val,
                maxlength : input.maxLength,
                tabindex : input.tabIndex,
                placeholder : input.placeholder
            };

        input.autocomplete === false && (attrs.autocomplete = 'off');
        ctx.mod('disabled') && (attrs.disabled = 'disabled');

        ctx.attrs(attrs);

        if(!ctx.tParam('_input__control'))
            return {
                elem : 'box',
                content : ctx.json()
            };
    });


// end: ../../common.blocks/input/__control/input__control.bh.js

// begin: ../../common.blocks/input/_has-clear/input_has-clear.bh.js


    bh.match('input_has-clear__control', function(ctx) {
        ctx.tParam('_input__control', true);
        return {
            elem : 'box',
            content : [
                ctx.json(),
                { elem : 'clear' }
            ]
        };
    });


// end: ../../common.blocks/input/_has-clear/input_has-clear.bh.js

// begin: ../../common.blocks/input/__clear/input__clear.bh.js

    bh.match('input__clear', function(ctx) {
        ctx.tag('i');
    });

// end: ../../common.blocks/input/__clear/input__clear.bh.js

// begin: ../../common.blocks/checkbox/checkbox.bh.js


    bh.match('checkbox', function(ctx, json) {
        ctx.tag('label')
            .js(true)
            .content([
                {
                    elem : 'box',
                    content : {
                        elem : 'control',
                        checked : ctx.mod('checked'),
                        disabled : ctx.mod('disabled'),
                        name : json.name,
                        val : json.val
                    }
                },
                json.text
            ]);
    });


// end: ../../common.blocks/checkbox/checkbox.bh.js

// begin: ../../common.blocks/checkbox/__box/checkbox__box.bh.js

    bh.match('checkbox__box', function(ctx) {
        ctx.tag('span');
    });

// end: ../../common.blocks/checkbox/__box/checkbox__box.bh.js

// begin: ../../common.blocks/checkbox/__control/checkbox__control.bh.js


    bh.match('checkbox__control', function(ctx, json) {
        ctx.tag('input');

        // NOTE: don't remove autocomplete attribute, otherwise js and DOM may be desynced
        var attrs = { type : 'checkbox', autocomplete : 'off' };

        attrs.name = json.name;
        attrs.value = json.val;
        json.checked && (attrs.checked = 'checked');
        json.disabled && (attrs.disabled = 'disabled');

        ctx.attrs(attrs);
    });


// end: ../../common.blocks/checkbox/__control/checkbox__control.bh.js

// begin: ../../common.blocks/checkbox/_type/checkbox_type_button.bh.js


    bh.match('checkbox_type_button', function(ctx, json) {
        var mods = ctx.mods(),
            buttonMods = {
                togglable : 'check',
                checked : mods.checked,
                disabled : mods.disabled,
                theme : mods.theme,
                size : mods.size
            },
            buttonContent = [
                {
                    block : 'checkbox',
                    elem : 'control',
                    checked : mods.checked,
                    disabled : mods.disabled,
                    name : json.name,
                    val : json.val
                },
                json.icon
            ];

        typeof json.text !== 'undefined' &&
            buttonContent.push({ elem : 'text', content : json.text });

        return {
            block : 'button',
            mix : { block : 'checkbox', mods : mods, js : json.js || true },
            tag : 'label',
            mods : buttonMods,
            content : buttonContent
        };
    });


// end: ../../common.blocks/checkbox/_type/checkbox_type_button.bh.js

// begin: ../../common.blocks/radio/radio.bh.js


    bh.match('radio', function(ctx, json) {
        ctx.tParam('_radio', json);

        ctx.tag('span');

        var js = ctx.js() || {};
        js === true && (js = {});
        js.id || (js.id = json.id || 'radio-' + json.name);
        ctx.js(js, true);

        var curVal = json.val,
            mods = ctx.mods(),
            checked;
        ctx.content((json.options || []).map(function(option) {
            checked = typeof option.val !== 'undefined' && (option.val === curVal);
            return {
                block : 'radio-option',
                mods : {
                    type : mods.type,
                    theme : mods.theme,
                    size : mods.size,
                    checked : checked,
                    disabled : option.disabled || mods.disabled
                },
                name : json.name,
                val : option.val,
                text : option.text,
                icon : option.icon
            };
        }));
    });


// end: ../../common.blocks/radio/radio.bh.js

// begin: ../../common.blocks/radio-option/radio-option.bh.js


    bh.match('radio-option', function(ctx, json) {
        ctx
            .tag('label')
            .js(true)
            .content([
                {
                    elem : 'box',
                    content : {
                        elem : 'control',
                        checked : ctx.mod('checked'),
                        disabled : ctx.mod('disabled'),
                        name : json.name,
                        val : json.val
                    }
                },
                json.text
            ]);
    });


// end: ../../common.blocks/radio-option/radio-option.bh.js

// begin: ../../common.blocks/radio-option/__box/radio-option__box.bh.js

    bh.match('radio-option__box', function(ctx) {
        ctx.tag('span');
    });

// end: ../../common.blocks/radio-option/__box/radio-option__box.bh.js

// begin: ../../common.blocks/radio-option/__control/radio-option__control.bh.js


    bh.match('radio-option__control', function(ctx, json) {
        ctx.tag('input');

        // NOTE: don't remove autocomplete attribute, otherwise js and DOM may be desynced
        var attrs = {
                type : 'radio',
                autocomplete : 'off',
                name : json.name,
                value : json.val
            };

        json.checked && (attrs.checked = 'checked');
        json.disabled && (attrs.disabled = 'disabled');

        ctx.attrs(attrs);
    });


// end: ../../common.blocks/radio-option/__control/radio-option__control.bh.js

// begin: ../../common.blocks/radio-option/_type/radio-option_type_button.bh.js


    bh.match('radio-option_type_button', function(ctx, json) {
        var mods = ctx.mods(),
            buttonMods = {
                togglable : 'radio',
                checked : mods.checked,
                disabled : mods.disabled
            },
            buttonContent = [
                {
                    block : 'radio-option',
                    elem : 'control',
                    checked : mods.checked,
                    disabled : mods.disabled,
                    name : json.name,
                    val : json.val
                },
                json.icon
            ];

        var radio = ctx.tParam('_radio');
        if(radio) {
            var radioMods = radio.mods;
            if(radioMods) {
                buttonMods.theme = radioMods.theme;
                buttonMods.size = radioMods.size;
            }
        }

        typeof json.text !== 'undefined' &&
            buttonContent.push({ elem : 'text', content : json.text });

        return {
            block : 'button',
            mix : { block : 'radio-option', mods : mods, js : true },
            tag : 'label',
            mods : buttonMods,
            content : buttonContent
        };
    });


// end: ../../common.blocks/radio-option/_type/radio-option_type_button.bh.js
/** BEMHTML mimic */var BEMHTML = bh;
module.exports = bh;
bh.BEMHTML = { apply: function(bemjson) { return bh.apply(bemjson); } };