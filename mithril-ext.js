Object.assign(window.m, {
	CSS_UNITLESS: {
		animationIterationCount: true,
		aspectRatio: true,
		borderImageOutset: true,
		borderImageSlice: true,
		borderImageWidth: true,
		boxFlex: true,
		boxFlexGroup: true,
		boxOrdinalGroup: true,
		columnCount: true,
		columns: true,
		flex: true,
		flexGrow: true,
		flexPositive: true,
		flexShrink: true,
		flexNegative: true,
		flexOrder: true,
		gridArea: true,
		gridRow: true,
		gridRowEnd: true,
		gridRowSpan: true,
		gridRowStart: true,
		gridColumn: true,
		gridColumnEnd: true,
		gridColumnSpan: true,
		gridColumnStart: true,
		fontWeight: true,
		lineClamp: true,
		lineHeight: true,
		opacity: true,
		order: true,
		orphans: true,
		tabSize: true,
		widows: true,
		zIndex: true,
		zoom: true,
		fillOpacity: true,
		floodOpacity: true,
		stopOpacity: true,
		strokeDasharray: true,
		strokeDashoffset: true,
		strokeMiterlimit: true,
		strokeOpacity: true,
		strokeWidth: true
	},

	NOOP() {},

	class(...vals) {
		let res = []
		for (let val of vals) {
			if (Array.isArray(val)) {
				res.push(m.class(...val))
			}
			else if (val instanceof Object) {
				for (let k in val) {
					if (val[k]) {
						res.push(k)
					}
				}
			}
			else {
				res.push(val)
			}
		}
		return res.join(' ')
	},

	style(...vals) {
		let res = {}
		for (let val of vals) {
			if (Array.isArray(val)) {
				val = m.style(...val)
			}
			if (val instanceof Object) {
				for (let k in val) {
					let val2 = val[k]
					if (!m.CSS_UNITLESS[k] && +val2) {
						res[k] = val2 + 'px'
					} else {
						res[k] = val2
					}
				}
			}
		}
		return res
	},

	bind(obj, thisArg = obj, assignObj = obj) {
		for (let k in obj) {
			if (!obj.__lookupGetter__(k)) {
				let val = obj[k]
				if (typeof val === 'function' && val.name !== 'bound ' && val.name !== 'class ') {
					assignObj[k] = val.bind(thisArg)
				}
			}
		}
		return assignObj
	},

	async fetch(url, opts, type = 'text') {
		if (typeof opts === 'string') {
			[opts, type] = [, opts]
		}
		let res = await fetch(url, opts)
		if (res.ok) {
			return res[type]()
		} else {
			throw Error(`${res.statusText} '${res.url}'`)
		}
	},

	comp(props, ...statics) {
		let {oninit, oncreate, onbeforeupdate, onupdate, onremove} = props
		let comp = Object.assign({}, props, {
			oninit(vnode) {
				this.oninit$$ = oninit
				this.oncreate$$ = oncreate
				this.onbeforeupdate$$ = onbeforeupdate || m.NOOP
				this.onupdate$$ = onupdate || m.NOOP
				this.onremove$$ = onremove
				m.bind(this)
				this.attrs = vnode.attrs || {}
				if (this.attrs.children === undefined) {
					this.attrs.children = vnode.children || []
				}
				if (this.oninit$$) {
					this.oninit$$()
				}
				this.onbeforeupdate$$(this.old$$)
			},
			oncreate(vnode) {
				this.dom = vnode.dom
				if (this.oncreate$$) {
					this.oncreate$$()
				}
				this.onupdate$$(this.old$$)
				this.old$$ = {dom: this.dom}
			},
			onbeforeupdate(vnode) {
				this.old$$.attrs = this.attrs
				this.attrs = vnode.attrs || {}
				if (this.attrs.children === undefined) {
					this.attrs.children = vnode.children || []
				}
				this.onbeforeupdate$$(this.old$$)
			},
			onupdate(vnode) {
				this.old$$.dom = this.dom
				this.dom = vnode.dom
				this.onupdate$$(this.old$$)
			},
			onremove() {
				if (this.onremove$$) {
					this.onremove$$()
				}
				delete this.dom
			}
		})
		if (statics.length) {
			Object.assign(comp, ...statics)
		}
		return comp
	}
})
