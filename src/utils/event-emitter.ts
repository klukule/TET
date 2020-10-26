// Made by Lukáš 'klukule' Jech at Pozitron Group s.r.o. © 2018-2020

/**
 * Custom event emitter implementation
 * TODO: Generics?
 */
class EventEmitter {
    private _subscriptions: ((...args: any[]) => void)[] = [];

    public get IsBound(): boolean {
        return this._subscriptions.length > 0;
    }

    public Emit(...args: any[]) {
        for (const subscription of this._subscriptions) {
            subscription(...args);
        }
    }

    public Subscribe(callback: (...args: any[]) => void) {
        if (this._subscriptions.findIndex(callback) == -1) {
            this._subscriptions.push(callback);
        } else {
            console.warn('Duplicate subscription detected');
        }
    };

    public Unsubscribe(callback: (...args: any[]) => void) {
        const idx = this._subscriptions.findIndex(callback);
        if (idx > -1) {
            this._subscriptions.splice(idx, 1);
        } else {
            console.warn('Unsubscribing unregistered callback');
        }
    }
}