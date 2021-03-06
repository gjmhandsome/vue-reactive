import { extend } from "../shared";

class ReactiveEffect {
    private _fn: any;
    deps = [];
    active = true;
    onStop?: () => void;
    constructor(fn, public scheduler?) {
        this._fn = fn;
    }
    run() {
        activeEffect = this;
        return this._fn();
    }
    stop() {
        if (this.active) {
            if (this.onStop) {
                this.onStop();
            }
            cleanupEffect(this);
            this.active = false;
        }
    }
}

function cleanupEffect(effect) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect);
    })
}

const targetMap = new Map();
export function track(target, key) {
    // target => key => dep
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    if (!activeEffect) return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
export function tigger(target, key) {
    const depsMap = targetMap.get(target);
    const deps = depsMap.get(key);
    for (const effect of deps) {
        if (effect.scheduler) {
            effect.scheduler();
        } else {
            effect.run();
        }
    }
}

export function stop(runner) {
    runner.effect.stop();
}

let activeEffect;
export function effect(fn, options: any = {}) {
    const scheduler = options.scheduler;
    // const onStop = options.onStop;
    const _effect = new ReactiveEffect(fn, scheduler);
    // Object.assign(_effect, options);
    // _effect.onStop = onStop;
    extend(_effect, options);
    _effect.run();
    const runner: any = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}