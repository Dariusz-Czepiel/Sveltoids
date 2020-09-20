
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    class Particle {
        //type the constructor
        constructor(args) {
            this.delete = false;
            this.position = args.position;
            this.velocity = args.velocity;
            this.radius = args.size;
            this.lifeSpan = args.lifeSpan;
            this.inertia = 0.98;
        }
        destroy() {
            this.delete = true;
        }
        render(state) {
            // Move
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            this.velocity.x *= this.inertia;
            this.velocity.y *= this.inertia;
            // Shrink
            this.radius -= 0.1;
            if (this.radius < 0.1) {
                this.radius = 0.1;
            }
            if (this.lifeSpan-- < 0) {
                this.destroy();
            }
            // Draw
            const context = state.context;
            context.save();
            context.translate(this.position.x, this.position.y);
            context.fillStyle = '#ffffff';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(0, -this.radius);
            context.arc(0, 0, this.radius, 0, 2 * Math.PI);
            context.closePath();
            context.fill();
            context.restore();
        }
    }

    /**
     * Generates vertices for asteroid polygon with certain count and radius
     * @param  {Number} count   Number of vertices
     * @param  {Number} rad     Maximal radius of polygon
     * @return {Array}        Array of vertices: {x: Number, y: Number}
     */
    function asteroidVertices(count, rad) {
        let p = [];
        for (let i = 0; i < count; i++) {
            p.push({
                x: (-Math.sin((360 / count) * i * Math.PI / 180) + Math.round(Math.random() * 2 - 1) * Math.random() / 3) * rad,
                y: (-Math.cos((360 / count) * i * Math.PI / 180) + Math.round(Math.random() * 2 - 1) * Math.random() / 3) * rad
            });
        }
        return p;
    }
    /**
     * Rotate point around center on certain angle
     * @param {Object} p        {x: Number, y: Number}
     * @param {Object} center   {x: Number, y: Number}
     * @param {Number} angle    Angle in radians
     */
    function rotatePoint(p, center, angle) {
        return {
            x: ((p.x - center.x) * Math.cos(angle) - (p.y - center.y) * Math.sin(angle)) + center.x,
            y: ((p.x - center.x) * Math.sin(angle) + (p.y - center.y) * Math.cos(angle)) + center.y
        };
    }
    /**
     * Random Number between 2 numbers
     */
    function randomNumBetween(min, max) {
        return Math.random() * (max - min + 1) + min;
    }
    /**
     * Random Number between 2 numbers excluding a certain range
     */
    function randomNumBetweenExcluding(min, max, exMin, exMax) {
        let random = randomNumBetween(min, max);
        while (random > exMin && random < exMax) {
            random = Math.random() * (max - min + 1) + min;
        }
        return random;
    }

    class Asteroid {
        constructor(args) {
            this.delete = false;
            this.position = args.position;
            this.velocity = {
                x: randomNumBetween(-1.5, 1.5),
                y: randomNumBetween(-1.5, 1.5)
            };
            this.rotation = 0;
            this.rotationSpeed = randomNumBetween(-1, 1);
            this.radius = args.size;
            this.score = (80 / this.radius) * 5;
            this.create = args.create;
            this.addScore = args.addScore;
            this.vertices = asteroidVertices(8, args.size);
        }
        destroy() {
            this.delete = true;
            this.addScore(this.score);
            // Explode
            for (let i = 0; i < this.radius; i++) {
                const particle = new Particle({
                    lifeSpan: randomNumBetween(60, 100),
                    size: randomNumBetween(1, 3),
                    position: {
                        x: this.position.x + randomNumBetween(-this.radius / 4, this.radius / 4),
                        y: this.position.y + randomNumBetween(-this.radius / 4, this.radius / 4)
                    },
                    velocity: {
                        x: randomNumBetween(-1.5, 1.5),
                        y: randomNumBetween(-1.5, 1.5)
                    }
                });
                this.create(particle, 'particles');
            }
            // Break into smaller asteroids
            if (this.radius > 10) {
                for (let i = 0; i < 2; i++) {
                    let asteroid = new Asteroid({
                        size: this.radius / 2,
                        position: {
                            x: randomNumBetween(-10, 20) + this.position.x,
                            y: randomNumBetween(-10, 20) + this.position.y
                        },
                        create: this.create.bind(this),
                        addScore: this.addScore.bind(this)
                    });
                    this.create(asteroid, 'asteroids');
                }
            }
            else {
                let asteroid = new Asteroid({
                    size: 80,
                    position: {
                        x: randomNumBetween(-10, 20) + this.position.x,
                        y: randomNumBetween(-10, 20) + this.position.y
                    },
                    create: this.create.bind(this),
                    addScore: this.addScore.bind(this)
                });
                this.create(asteroid, 'asteroids');
            }
        }
        render(state) {
            // Move
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            // Rotation
            this.rotation += this.rotationSpeed;
            if (this.rotation >= 360) {
                this.rotation -= 360;
            }
            if (this.rotation < 0) {
                this.rotation += 360;
            }
            // Screen edges
            if (this.position.x > state.screen.width + this.radius)
                this.position.x = -this.radius;
            else if (this.position.x < -this.radius)
                this.position.x = state.screen.width + this.radius;
            if (this.position.y > state.screen.height + this.radius)
                this.position.y = -this.radius;
            else if (this.position.y < -this.radius)
                this.position.y = state.screen.height + this.radius;
            // Draw
            const context = state.context;
            context.save();
            context.translate(this.position.x, this.position.y);
            context.rotate(this.rotation * Math.PI / 180);
            context.strokeStyle = '#FFF';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(0, -this.radius);
            for (let i = 1; i < this.vertices.length; i++) {
                context.lineTo(this.vertices[i].x, this.vertices[i].y);
            }
            context.closePath();
            context.stroke();
            context.restore();
        }
    }

    class Bullet {
        //type args
        constructor(args) {
            this.delete = false;
            let posDelta = rotatePoint({ x: 0, y: -20 }, { x: 0, y: 0 }, args.ship.rotation * Math.PI / 180);
            this.position = {
                x: args.ship.position.x + posDelta.x,
                y: args.ship.position.y + posDelta.y
            };
            this.rotation = args.ship.rotation;
            this.velocity = {
                x: posDelta.x / 2,
                y: posDelta.y / 2
            };
            this.radius = 2;
        }
        destroy() {
            this.delete = true;
        }
        //type state
        render(state) {
            // Move
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            // Delete if it goes out of bounds
            if (this.position.x < 0
                || this.position.y < 0
                || this.position.x > state.screen.width
                || this.position.y > state.screen.height) {
                this.destroy();
            }
            // Draw
            const context = state.context;
            context.save();
            context.translate(this.position.x, this.position.y);
            context.rotate(this.rotation * Math.PI / 180);
            context.fillStyle = '#FFF';
            context.lineWidth = 0.5;
            context.beginPath();
            context.arc(0, 0, 2, 0, 2 * Math.PI);
            context.closePath();
            context.fill();
            context.restore();
        }
    }

    class Ship {
        //type constructor
        constructor(args) {
            this.delete = false;
            this.position = args.position;
            this.velocity = {
                x: 0,
                y: 0
            };
            this.rotation = 0;
            this.rotationSpeed = 4;
            this.speed = 0.15;
            this.inertia = 0.99;
            this.radius = 20;
            this.lastShot = 0;
            this.create = args.create;
            this.onDie = args.onDie;
        }
        destroy() {
            this.delete = true;
            this.onDie();
            // Explode
            for (let i = 0; i < 60; i++) {
                const particle = new Particle({
                    lifeSpan: randomNumBetween(60, 100),
                    size: randomNumBetween(1, 4),
                    position: {
                        x: this.position.x + randomNumBetween(-this.radius / 4, this.radius / 4),
                        y: this.position.y + randomNumBetween(-this.radius / 4, this.radius / 4)
                    },
                    velocity: {
                        x: randomNumBetween(-1.5, 1.5),
                        y: randomNumBetween(-1.5, 1.5)
                    }
                });
                this.create(particle, 'particles');
            }
        }
        rotate(dir) {
            if (dir == 'LEFT') {
                this.rotation -= this.rotationSpeed;
            }
            if (dir == 'RIGHT') {
                this.rotation += this.rotationSpeed;
            }
        }
        //why is this not read?
        accelerate(val) {
            this.velocity.x -= Math.sin(-this.rotation * Math.PI / 180) * this.speed;
            this.velocity.y -= Math.cos(-this.rotation * Math.PI / 180) * this.speed;
            // Thruster particles
            let posDelta = rotatePoint({ x: 0, y: -10 }, { x: 0, y: 0 }, (this.rotation - 180) * Math.PI / 180);
            const particle = new Particle({
                lifeSpan: randomNumBetween(20, 40),
                size: randomNumBetween(1, 3),
                position: {
                    x: this.position.x + posDelta.x + randomNumBetween(-2, 2),
                    y: this.position.y + posDelta.y + randomNumBetween(-2, 2)
                },
                velocity: {
                    x: posDelta.x / randomNumBetween(3, 5),
                    y: posDelta.y / randomNumBetween(3, 5)
                }
            });
            this.create(particle, 'particles');
        }
        //type state
        render(state) {
            // Controls
            if (state.keys.up) {
                this.accelerate(1);
            }
            if (state.keys.left) {
                this.rotate('LEFT');
            }
            if (state.keys.right) {
                this.rotate('RIGHT');
            }
            if (state.keys.space && Date.now() - this.lastShot > 300) {
                const bullet = new Bullet({ ship: this });
                this.create(bullet, 'bullets');
                this.lastShot = Date.now();
            }
            // Move
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;
            this.velocity.x *= this.inertia;
            this.velocity.y *= this.inertia;
            // Rotation
            if (this.rotation >= 360) {
                this.rotation -= 360;
            }
            if (this.rotation < 0) {
                this.rotation += 360;
            }
            // Screen edges
            if (this.position.x > state.screen.width)
                this.position.x = 0;
            else if (this.position.x < 0)
                this.position.x = state.screen.width;
            if (this.position.y > state.screen.height)
                this.position.y = 0;
            else if (this.position.y < 0)
                this.position.y = state.screen.height;
            // Draw
            const context = state.context;
            context.save();
            context.translate(this.position.x, this.position.y);
            context.rotate(this.rotation * Math.PI / 180);
            context.strokeStyle = '#ffffff';
            context.fillStyle = '#000000';
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(0, -15);
            context.lineTo(10, 10);
            context.lineTo(5, 7);
            context.lineTo(-5, 7);
            context.lineTo(-10, 10);
            context.closePath();
            context.fill();
            context.stroke();
            context.restore();
        }
    }

    /* src\UI.svelte generated by Svelte v3.24.1 */

    const file = "src\\UI.svelte";

    // (11:0) {#if !gameData.inGame}
    function create_if_block(ctx) {
    	let div;
    	let p0;
    	let t1;
    	let p1;
    	let t2;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			p0.textContent = "Game over, man!";
    			t1 = space();
    			p1 = element("p");
    			t2 = text(/*message*/ ctx[1]);
    			t3 = space();
    			button = element("button");
    			button.textContent = "try again?";
    			add_location(p0, file, 12, 4, 351);
    			add_location(p1, file, 13, 4, 379);
    			attr_dev(button, "class", "svelte-4iyxfz");
    			add_location(button, file, 14, 4, 401);
    			attr_dev(div, "class", "endgame svelte-4iyxfz");
    			set_style(div, "--eg-font-size", /*endGameFontSize*/ ctx[5]);
    			add_location(div, file, 11, 0, 281);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(div, t1);
    			append_dev(div, p1);
    			append_dev(p1, t2);
    			append_dev(div, t3);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 2) set_data_dev(t2, /*message*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(11:0) {#if !gameData.inGame}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let t0;
    	let div3;
    	let div0;
    	let t1;
    	let t2_value = /*gameData*/ ctx[0].currentScore + "";
    	let t2;
    	let t3;
    	let div1;
    	let t4;
    	let br;
    	let t5;
    	let t6;
    	let div2;
    	let t7;
    	let t8;
    	let if_block = !/*gameData*/ ctx[0].inGame && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div3 = element("div");
    			div0 = element("div");
    			t1 = text("Score: ");
    			t2 = text(t2_value);
    			t3 = space();
    			div1 = element("div");
    			t4 = text("Use [A][S][W][D] or [←][↑][↓][→] to MOVE");
    			br = element("br");
    			t5 = text("\r\n\t\tUse [SPACE] to SHOOT");
    			t6 = space();
    			div2 = element("div");
    			t7 = text("Top Score: ");
    			t8 = text(/*topScore*/ ctx[2]);
    			attr_dev(div0, "class", "score svelte-4iyxfz");
    			add_location(div0, file, 20, 1, 562);
    			add_location(br, file, 22, 42, 693);
    			attr_dev(div1, "class", "score controls svelte-4iyxfz");
    			add_location(div1, file, 21, 1, 620);
    			attr_dev(div2, "class", "score svelte-4iyxfz");
    			add_location(div2, file, 25, 1, 734);
    			attr_dev(div3, "class", "ui-top-container svelte-4iyxfz");
    			set_style(div3, "--font-size", /*baseFontSize*/ ctx[4]);
    			add_location(div3, file, 19, 0, 492);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div3, t3);
    			append_dev(div3, div1);
    			append_dev(div1, t4);
    			append_dev(div1, br);
    			append_dev(div1, t5);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, t7);
    			append_dev(div2, t8);
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*gameData*/ ctx[0].inGame) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*gameData*/ 1 && t2_value !== (t2_value = /*gameData*/ ctx[0].currentScore + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*topScore*/ 4) set_data_dev(t8, /*topScore*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	
    	let { isMobile } = $$props;
    	let { gameData } = $$props;
    	let { message } = $$props;
    	let { topScore } = $$props;
    	let { startGame } = $$props;
    	const baseFontSize = isMobile ? "2em" : "1.2em";
    	const endGameFontSize = Number(baseFontSize[0]) * 1.5 + "em";
    	const writable_props = ["isMobile", "gameData", "message", "topScore", "startGame"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<UI> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("UI", $$slots, []);
    	const click_handler = () => startGame();

    	$$self.$$set = $$props => {
    		if ("isMobile" in $$props) $$invalidate(6, isMobile = $$props.isMobile);
    		if ("gameData" in $$props) $$invalidate(0, gameData = $$props.gameData);
    		if ("message" in $$props) $$invalidate(1, message = $$props.message);
    		if ("topScore" in $$props) $$invalidate(2, topScore = $$props.topScore);
    		if ("startGame" in $$props) $$invalidate(3, startGame = $$props.startGame);
    	};

    	$$self.$capture_state = () => ({
    		isMobile,
    		gameData,
    		message,
    		topScore,
    		startGame,
    		baseFontSize,
    		endGameFontSize
    	});

    	$$self.$inject_state = $$props => {
    		if ("isMobile" in $$props) $$invalidate(6, isMobile = $$props.isMobile);
    		if ("gameData" in $$props) $$invalidate(0, gameData = $$props.gameData);
    		if ("message" in $$props) $$invalidate(1, message = $$props.message);
    		if ("topScore" in $$props) $$invalidate(2, topScore = $$props.topScore);
    		if ("startGame" in $$props) $$invalidate(3, startGame = $$props.startGame);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		gameData,
    		message,
    		topScore,
    		startGame,
    		baseFontSize,
    		endGameFontSize,
    		isMobile,
    		click_handler
    	];
    }

    class UI extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			isMobile: 6,
    			gameData: 0,
    			message: 1,
    			topScore: 2,
    			startGame: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UI",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*isMobile*/ ctx[6] === undefined && !("isMobile" in props)) {
    			console.warn("<UI> was created without expected prop 'isMobile'");
    		}

    		if (/*gameData*/ ctx[0] === undefined && !("gameData" in props)) {
    			console.warn("<UI> was created without expected prop 'gameData'");
    		}

    		if (/*message*/ ctx[1] === undefined && !("message" in props)) {
    			console.warn("<UI> was created without expected prop 'message'");
    		}

    		if (/*topScore*/ ctx[2] === undefined && !("topScore" in props)) {
    			console.warn("<UI> was created without expected prop 'topScore'");
    		}

    		if (/*startGame*/ ctx[3] === undefined && !("startGame" in props)) {
    			console.warn("<UI> was created without expected prop 'startGame'");
    		}
    	}

    	get isMobile() {
    		throw new Error("<UI>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isMobile(value) {
    		throw new Error("<UI>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gameData() {
    		throw new Error("<UI>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gameData(value) {
    		throw new Error("<UI>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get message() {
    		throw new Error("<UI>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<UI>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get topScore() {
    		throw new Error("<UI>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set topScore(value) {
    		throw new Error("<UI>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startGame() {
    		throw new Error("<UI>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startGame(value) {
    		throw new Error("<UI>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    //dane dotyczace okna przegladarki
    const screen = writable({
        width: window.innerWidth,
        height: window.innerHeight,
        ratio: window.devicePixelRatio || 1
    });
    //informacja ktory przycisk jest przycisniety w danym momencie
    const keys = writable({
        left: false,
        right: false,
        up: false,
        down: false,
        space: false
    });
    //ilosc asteroid
    const asteroidCount = writable(3);
    //dane gry. Wynik i informacja czy przegrales
    const gameData = writable({
        currentScore: 0,
        inGame: false
    });
    //najlepszy wynik
    //moze uzyj czegos innego niz localstorage
    const topScore = writable(localStorage['topscore'] || 0);

    /* src\GameCanvas.svelte generated by Svelte v3.24.1 */
    const file$1 = "src\\GameCanvas.svelte";

    function create_fragment$1(ctx) {
    	let canvas;
    	let canvas_width_value;
    	let canvas_height_value;

    	const block = {
    		c: function create() {
    			canvas = element("canvas");
    			attr_dev(canvas, "width", canvas_width_value = /*$screen*/ ctx[1].width * /*$screen*/ ctx[1].ratio);
    			attr_dev(canvas, "height", canvas_height_value = /*$screen*/ ctx[1].height * /*$screen*/ ctx[1].ratio);
    			attr_dev(canvas, "class", "svelte-1skxn5t");
    			add_location(canvas, file$1, 18, 0, 484);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas, anchor);
    			/*canvas_binding*/ ctx[2](canvas);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$screen*/ 2 && canvas_width_value !== (canvas_width_value = /*$screen*/ ctx[1].width * /*$screen*/ ctx[1].ratio)) {
    				attr_dev(canvas, "width", canvas_width_value);
    			}

    			if (dirty & /*$screen*/ 2 && canvas_height_value !== (canvas_height_value = /*$screen*/ ctx[1].height * /*$screen*/ ctx[1].ratio)) {
    				attr_dev(canvas, "height", canvas_height_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas);
    			/*canvas_binding*/ ctx[2](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $screen;
    	validate_store(screen, "screen");
    	component_subscribe($$self, screen, $$value => $$invalidate(1, $screen = $$value));
    	let { canvasRef } = $$props;

    	const handleResize = e => {
    		screen.set({
    			width: window.innerWidth,
    			height: window.innerHeight,
    			ratio: window.devicePixelRatio || 1
    		});
    	};

    	onMount(() => {
    		window.addEventListener("resize", handleResize);
    	});

    	onDestroy(() => {
    		window.removeEventListener("resize", handleResize);
    	});

    	const writable_props = ["canvasRef"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GameCanvas> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("GameCanvas", $$slots, []);

    	function canvas_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvasRef = $$value;
    			$$invalidate(0, canvasRef);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("canvasRef" in $$props) $$invalidate(0, canvasRef = $$props.canvasRef);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		screen,
    		canvasRef,
    		handleResize,
    		$screen
    	});

    	$$self.$inject_state = $$props => {
    		if ("canvasRef" in $$props) $$invalidate(0, canvasRef = $$props.canvasRef);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvasRef, $screen, canvas_binding];
    }

    class GameCanvas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { canvasRef: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameCanvas",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*canvasRef*/ ctx[0] === undefined && !("canvasRef" in props)) {
    			console.warn("<GameCanvas> was created without expected prop 'canvasRef'");
    		}
    	}

    	get canvasRef() {
    		throw new Error("<GameCanvas>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set canvasRef(value) {
    		throw new Error("<GameCanvas>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.24.1 */

    const { Object: Object_1 } = globals;

    const file$2 = "src\\App.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let ui;
    	let t;
    	let gamecanvas;
    	let updating_canvasRef;
    	let current;

    	ui = new UI({
    			props: {
    				gameData: /*$gameData*/ ctx[3],
    				message: /*message*/ ctx[2],
    				topScore: /*$topScore*/ ctx[4],
    				startGame: /*startGame*/ ctx[5],
    				isMobile: /*isMobile*/ ctx[1]
    			},
    			$$inline: true
    		});

    	function gamecanvas_canvasRef_binding(value) {
    		/*gamecanvas_canvasRef_binding*/ ctx[6].call(null, value);
    	}

    	let gamecanvas_props = {};

    	if (/*canvasRef*/ ctx[0] !== void 0) {
    		gamecanvas_props.canvasRef = /*canvasRef*/ ctx[0];
    	}

    	gamecanvas = new GameCanvas({ props: gamecanvas_props, $$inline: true });
    	binding_callbacks.push(() => bind(gamecanvas, "canvasRef", gamecanvas_canvasRef_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(ui.$$.fragment);
    			t = space();
    			create_component(gamecanvas.$$.fragment);
    			attr_dev(div, "class", "container svelte-vviivg");
    			add_location(div, file$2, 204, 0, 6883);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(ui, div, null);
    			append_dev(div, t);
    			mount_component(gamecanvas, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const ui_changes = {};
    			if (dirty & /*$gameData*/ 8) ui_changes.gameData = /*$gameData*/ ctx[3];
    			if (dirty & /*message*/ 4) ui_changes.message = /*message*/ ctx[2];
    			if (dirty & /*$topScore*/ 16) ui_changes.topScore = /*$topScore*/ ctx[4];
    			if (dirty & /*isMobile*/ 2) ui_changes.isMobile = /*isMobile*/ ctx[1];
    			ui.$set(ui_changes);
    			const gamecanvas_changes = {};

    			if (!updating_canvasRef && dirty & /*canvasRef*/ 1) {
    				updating_canvasRef = true;
    				gamecanvas_changes.canvasRef = /*canvasRef*/ ctx[0];
    				add_flush_callback(() => updating_canvasRef = false);
    			}

    			gamecanvas.$set(gamecanvas_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ui.$$.fragment, local);
    			transition_in(gamecanvas.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ui.$$.fragment, local);
    			transition_out(gamecanvas.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(ui);
    			destroy_component(gamecanvas);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $keys;
    	let $screen;
    	let $asteroidCount;
    	let $gameData;
    	let $topScore;
    	validate_store(keys, "keys");
    	component_subscribe($$self, keys, $$value => $$invalidate(9, $keys = $$value));
    	validate_store(screen, "screen");
    	component_subscribe($$self, screen, $$value => $$invalidate(10, $screen = $$value));
    	validate_store(asteroidCount, "asteroidCount");
    	component_subscribe($$self, asteroidCount, $$value => $$invalidate(11, $asteroidCount = $$value));
    	validate_store(gameData, "gameData");
    	component_subscribe($$self, gameData, $$value => $$invalidate(3, $gameData = $$value));
    	validate_store(topScore, "topScore");
    	component_subscribe($$self, topScore, $$value => $$invalidate(4, $topScore = $$value));
    	

    	// const KEY = {
    	// 	LEFT:  37,
    	// 	RIGHT: 39,
    	// 	UP: 38,
    	// 	A: 65,
    	// 	D: 68,
    	// 	W: 87,
    	// 	SPACE: 32
    	// };
    	let objects = {
    		ship: [],
    		asteroids: [],
    		bullets: [],
    		particles: []
    	};

    	let context;
    	let canvasRef;
    	let isMobile = false;

    	//obluga przyciskow
    	const handleKeys = e => {
    		let keysTemp = $keys;
    		const isPressed = e.type === "keydown";

    		//TODO zmien to na key i zobacz jakie sa
    		//console.log(e.code);
    		//sprawdz jeszcze e.code
    		if (e.key.toLowerCase() === "a" || e.key === "ArrowLeft") set_store_value(keys, $keys.left = isPressed, $keys);

    		if (e.key.toLowerCase() === "d" || e.key === "ArrowRight") set_store_value(keys, $keys.right = isPressed, $keys);
    		if (e.key.toLowerCase() === "w" || e.key === "ArrowUp") set_store_value(keys, $keys.up = isPressed, $keys);
    		if (e.key === " ") set_store_value(keys, $keys.space = isPressed, $keys);

    		// if(e.keyCode === KEY.LEFT   || e.keyCode === KEY.A) $keys.left  = isPressed;
    		// if(e.keyCode === KEY.RIGHT  || e.keyCode === KEY.D) $keys.right = isPressed;
    		// if(e.keyCode === KEY.UP     || e.keyCode === KEY.W) $keys.up    = isPressed;
    		// if(e.keyCode === KEY.SPACE) $keys.space = isPressed;
    		keys.set(keysTemp);
    	};

    	onMount(() => {
    		window.addEventListener("keyup", handleKeys);
    		window.addEventListener("keydown", handleKeys);
    		const context2D = canvasRef.getContext("2d");
    		startGame();

    		if (context2D != null) {
    			context = context2D;

    			requestAnimationFrame(() => {
    				update();
    			});
    		}

    		//check if mobile
    		if ("maxTouchPoints" in navigator || "msMacTouchPoints" in navigator) $$invalidate(1, isMobile = navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);
    	}); //console.log(isMobile)
    	//alert(isMobile ? "yes" : "no");

    	onDestroy(() => {
    		window.removeEventListener("keyup", handleKeys);
    		window.removeEventListener("keydown", handleKeys);
    	});

    	//dzieje sie za kazdym razem kiedy cos sie zmienia na canvas
    	const update = () => {
    		const contextTemp = context;
    		contextTemp.save();
    		contextTemp.scale($screen.ratio, $screen.ratio);

    		// Motion trail
    		contextTemp.fillStyle = "#000";

    		contextTemp.globalAlpha = 0.4;
    		contextTemp.fillRect(0, 0, $screen.width, $screen.height);
    		contextTemp.globalAlpha = 1;

    		// Next set of asteroids
    		if (!objects.asteroids.length) {
    			let count = $asteroidCount + 1;
    			asteroidCount.set(count);
    			generateAsteroids(count);
    		}

    		// Check for colisions
    		checkCollisionsWith(objects.bullets, objects.asteroids);

    		checkCollisionsWith(objects.ship, objects.asteroids);

    		// Remove or render
    		updateObjects(objects.particles, "particles");

    		updateObjects(objects.asteroids, "asteroids");
    		updateObjects(objects.bullets, "bullets");
    		updateObjects(objects.ship, "ship");
    		contextTemp.restore();

    		// Next frame
    		requestAnimationFrame(() => {
    			update();
    		});
    	};

    	const addScore = points => {
    		if ($gameData.inGame) {
    			gameData.update(gd => Object.assign(Object.assign({}, gd), { currentScore: gd.currentScore + points }));
    		}
    	};

    	//zaczyna gre
    	//tworzy statek i pierwsze asteroidy
    	const startGame = () => {
    		gameData.set({ inGame: true, currentScore: 0 });

    		// Make ship
    		const ship = new Ship({
    				position: {
    					x: $screen.width / 2,
    					y: $screen.height / 2
    				},
    				create: createObject.bind(this),
    				onDie: gameOver.bind(this)
    			});

    		createObject(ship, "ship");

    		// Make asteroids
    		objects.asteroids = [];

    		generateAsteroids($asteroidCount);
    	};

    	//konczy gre
    	//zapisuje najlepszy wynik i wyswietla div-a z Game Over
    	const gameOver = () => {
    		gameData.update(gd => Object.assign(Object.assign({}, gd), { inGame: false }));

    		// Replace top score
    		if ($gameData.currentScore > $topScore) {
    			topScore.set($gameData.currentScore);
    			localStorage["topscore"] = $gameData.currentScore;
    		}
    	};

    	//generuje asteroidy w ilosci takiej jak howMany
    	const generateAsteroids = howMany => {
    		//let asteroids = [];
    		let myShip = objects.ship[0];

    		//console.log(objects.ship);
    		for (let i = 0; i < howMany; i++) {
    			let asteroid = new Asteroid({
    					size: 80,
    					position: {
    						x: randomNumBetweenExcluding(0, $screen.width, myShip.position.x - 60, myShip.position.x + 60),
    						y: randomNumBetweenExcluding(0, $screen.height, myShip.position.y - 60, myShip.position.y + 60)
    					},
    					create: createObject.bind(this),
    					addScore: addScore.bind(this)
    				});

    			createObject(asteroid, "asteroids");
    		}
    	};

    	//dodaje statki,asteroidy,pociski i efekty
    	const createObject = (item, group) => {
    		objects[group].push(item);
    	};

    	//aktualizuje statki,asteroidy,pociski i efekty
    	const updateObjects = (items, group) => {
    		//console.log(items);
    		let index = 0;

    		for (let item of items) {
    			if (item.delete) {
    				objects[group].splice(index, 1);
    			} else {
    				items[index].render({
    					screen: $screen,
    					context,
    					keys: $keys,
    					asteroidCount: $asteroidCount,
    					topScore: $topScore,
    					currentScore: $gameData.currentScore,
    					inGame: $gameData.inGame
    				});
    			}

    			index++;
    		}
    	};

    	//sprawdza zderzenie sie 2 obiektow np.: czy asteroida zderzyla sie z statkiem
    	const checkCollisionsWith = (items1, items2) => {
    		var a = items1.length - 1;
    		var b;

    		for (a; a > -1; --a) {
    			b = items2.length - 1;

    			for (b; b > -1; --b) {
    				var item1 = items1[a];
    				var item2 = items2[b];

    				if (checkCollision(item1, item2)) {
    					item1.destroy();
    					item2.destroy();
    				}
    			}
    		}
    	};

    	const checkCollision = (obj1, obj2) => {
    		var vx = obj1.position.x - obj2.position.x;
    		var vy = obj1.position.y - obj2.position.y;
    		var length = Math.sqrt(vx * vx + vy * vy);

    		if (length < obj1.radius + obj2.radius) {
    			return true;
    		}

    		return false;
    	};

    	let message;
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	function gamecanvas_canvasRef_binding(value) {
    		canvasRef = value;
    		$$invalidate(0, canvasRef);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		Asteroid,
    		Ship,
    		UI,
    		GameCanvas,
    		randomNumBetweenExcluding,
    		screen,
    		keys,
    		asteroidCount,
    		gameData,
    		topScore,
    		objects,
    		context,
    		canvasRef,
    		isMobile,
    		handleKeys,
    		update,
    		addScore,
    		startGame,
    		gameOver,
    		generateAsteroids,
    		createObject,
    		updateObjects,
    		checkCollisionsWith,
    		checkCollision,
    		message,
    		$keys,
    		$screen,
    		$asteroidCount,
    		$gameData,
    		$topScore
    	});

    	$$self.$inject_state = $$props => {
    		if ("objects" in $$props) objects = $$props.objects;
    		if ("context" in $$props) context = $$props.context;
    		if ("canvasRef" in $$props) $$invalidate(0, canvasRef = $$props.canvasRef);
    		if ("isMobile" in $$props) $$invalidate(1, isMobile = $$props.isMobile);
    		if ("message" in $$props) $$invalidate(2, message = $$props.message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$gameData, $topScore*/ 24) {
    			//kod ponizej obsluguje koniec gry
    			 if ($gameData.currentScore <= 0) {
    				$$invalidate(2, message = "0 points... So sad.");
    			} else if ($gameData.currentScore >= $topScore) {
    				$$invalidate(2, message = "Top score with " + $gameData.currentScore + " points. Woo!");
    			} else {
    				$$invalidate(2, message = $gameData.currentScore + " Points though :)");
    			}
    		}
    	};

    	return [
    		canvasRef,
    		isMobile,
    		message,
    		$gameData,
    		$topScore,
    		startGame,
    		gamecanvas_canvasRef_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({ target: document.body });

    return app;

}());
//# sourceMappingURL=bundle.js.map
