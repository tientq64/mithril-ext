(function() {
	const CSS_UNITLESS = {
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
	}

	const NOOP = () => {}
	const OLD = Symbol('old')

	const assignAttrs = (that, vnode) => {
		that.attrs = {}
		let {attrs} = vnode
		if (attrs) {
			let attrs2
			for (let k in attrs) {
				let val = attrs[k]
				if (val !== m.DELETE) {
					if (k === 'attrs') {
						attrs2 = val
						delete attrs[k]
					} else {
						that.attrs[k] = val
					}
				}
			}
			if (attrs2) {
				for (let k in attrs2) {
					if (!(k in that.attrs)) {
						that.attrs[k] = attrs2[k]
					}
				}
			}
		}
		that.children = vnode.children || []
		that.key = vnode.key
	}

	Object.assign(window.m, {
		DELETE: Symbol('delete'),

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
						if (!CSS_UNITLESS[k] && +val2) {
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
				res = await res[type]()
				if ((type === "yaml" || type === "yml") && window.jsyaml) {
					return jsyaml.safeLoad(res)
				} else {
					return res
				}
			} else {
				throw Error(`${res.statusText} '${res.url}'`)
			}
		},

		comp(props) {
			let {
				oninit = NOOP,
				oncreate = NOOP,
				onbeforeupdate = NOOP,
				onupdate = NOOP,
				onremove = NOOP
			} = props
			return Object.assign({}, props, {
				oninit(vnode) {
					m.bind(this)
					assignAttrs(this, vnode)
					oninit.call(this)
					onbeforeupdate.call(this)
				},
				oncreate(vnode) {
					this.dom = vnode.dom
					oncreate.call(this)
					onupdate.call(this)
					this[OLD] = {dom: this.dom}
				},
				onbeforeupdate(vnode) {
					const old = this[OLD]
					old.attrs = this.attrs
					old.children = this.children
					assignAttrs(this, vnode)
					onbeforeupdate.call(this, old)
				},
				onupdate(vnode) {
					const old = this[OLD]
					old.dom = this.dom
					this.dom = vnode.dom
					onupdate.call(this, old)
				},
				onremove() {
					onremove.call(this)
					delete this.dom
				}
			})
		}
	})
})()
