(function () {
    var cssUnitless = new Set([
        "animationIterationCount",
        "aspectRatio",
        "borderImageOutset",
        "borderImageSlice",
        "borderImageWidth",
        "boxFlex",
        "boxFlexGroup",
        "boxOrdinalGroup",
        "columnCount",
        "columns",
        "flex",
        "flexGrow",
        "flexPositive",
        "flexShrink",
        "flexNegative",
        "flexOrder",
        "gridArea",
        "gridRow",
        "gridRowEnd",
        "gridRowSpan",
        "gridRowStart",
        "gridColumn",
        "gridColumnEnd",
        "gridColumnSpan",
        "gridColumnStart",
        "fontWeight",
        "lineClamp",
        "lineHeight",
        "opacity",
        "order",
        "orphans",
        "scale",
        "tabSize",
        "widows",
        "zIndex",
        "zoom",
        "fillOpacity",
        "floodOpacity",
        "stopOpacity",
        "strokeDasharray",
        "strokeDashoffset",
        "strokeMiterlimit",
        "strokeOpacity",
        "strokeWidth",
        "webkitLineClamp"
    ]);

    var NOOP = () => { };
    var OLD = Symbol("OLD");

    var assignAttrs = (that, vnode) => {
        var attrs, attrs2, k, val;
        that.attrs = {};
        attrs = vnode.attrs;
        if (attrs) {
            for (k in attrs) {
                val = attrs[k];
                if (val === m.DELETE) continue;
                if (k === "attrs") {
                    attrs2 = val;
                    delete attrs[k];
                } else {
                    that.attrs[k] = val;
                }
            }
            if (attrs2) {
                for (k in attrs2) {
                    val = attrs2[k];
                    if (val === m.DELETE || Object.hasOwn(k)) continue;
                    that.attrs[k] = val;
                }
            }
        }
        that.children = vnode.children || [];
        that.key = vnode.key;
    };

    Object.assign(window.m, {
        DELETE: Symbol("DELETE"),

        class(...vals) {
            var res, val, k;
            res = [];
            for (val of vals) {
                if (Array.isArray(val)) {
                    res.push(m.class(...val));
                }
                else if (val instanceof Object) {
                    for (k in val) {
                        if (val[k]) {
                            res.push(k);
                        }
                    }
                }
                else {
                    res.push(val);
                }
            }
            return res.join(" ");
        },

        style(...vals) {
            var res, val, k, val2;
            res = {};
            for (val of vals) {
                if (Array.isArray(val)) {
                    val = m.style(...val);
                }
                if (val instanceof Object) {
                    for (k in val) {
                        val2 = val[k];
                        if (cssUnitless.has(k) || k.startsWith("--") || isNaN(val2)) {
                            res[k] = val2;
                        } else {
                            res[k] = val2 + "px";
                        }
                    }
                }
            }
            return res;
        },

        bind(obj, thisArg = obj, assignObj = obj) {
            var k, val;
            for (k in obj) {
                if (obj.__lookupGetter__(k)) continue;
                val = obj[k];
                if (typeof val !== "function" || val.name === "bound " || val.name === "class ") continue;
                assignObj[k] = val.bind(thisArg);
            }
            return assignObj;
        },

        async fetch(url, opts, type = "text") {
            var res, resType;
            if (typeof opts === "string") {
                [opts, type] = [, opts];
            }
            res = await fetch(url, opts);
            if (!res.ok) {
                throw Error(`${res.statusText}: ${res.url}`);
            }
            if (type === "yml") {
                type = "yaml";
            }
            resType = type === "yaml" ? "text" : type;
            res = await res[resType]();
            if (type === "yaml" && window.jsyaml) {
                return jsyaml.safeLoad(res);
            }
            return res;
        },

        comp(props) {
            var {
                oninit = NOOP,
                oncreate = NOOP,
                onbeforeupdate = NOOP,
                onupdate = NOOP,
                onremove = NOOP
            } = props;
            return {
                ...props,
                oninit(vnode) {
                    m.bind(this);
                    assignAttrs(this, vnode);
                    oninit.call(this);
                    onbeforeupdate.call(this);
                },
                oncreate(vnode) {
                    this.dom = vnode.dom;
                    oncreate.call(this);
                    onupdate.call(this);
                    this[OLD] = { dom: this.dom };
                },
                onbeforeupdate(vnode) {
                    var old = this[OLD];
                    old.attrs = this.attrs;
                    old.children = this.children;
                    assignAttrs(this, vnode);
                    onbeforeupdate.call(this, old);
                },
                onupdate(vnode) {
                    var old = this[OLD];
                    old.dom = this.dom;
                    this.dom = vnode.dom;
                    onupdate.call(this, old);
                },
                onremove() {
                    onremove.call(this);
                    delete this.dom;
                }
            };
        }
    });
})();
