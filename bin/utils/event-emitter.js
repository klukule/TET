class EventEmitter {
    constructor() {
        this._subscriptions = [];
    }
    get IsBound() {
        return this._subscriptions.length > 0;
    }
    Emit(...args) {
        for (const subscription of this._subscriptions) {
            subscription(...args);
        }
    }
    Subscribe(callback) {
        if (this._subscriptions.findIndex(callback) == -1) {
            this._subscriptions.push(callback);
        }
        else {
            console.warn('Duplicate subscription detected');
        }
    }
    ;
    Unsubscribe(callback) {
        const idx = this._subscriptions.findIndex(callback);
        if (idx > -1) {
            this._subscriptions.splice(idx, 1);
        }
        else {
            console.warn('Unsubscribing unregistered callback');
        }
    }
}
