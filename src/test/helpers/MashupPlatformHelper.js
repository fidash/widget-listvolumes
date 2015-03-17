var MyStrategy = function MyStrategy () {};
MyStrategy.prototype.getImplementation = function getImplementation (method, obj) {
    "use strict";

    return function (arg) {
        if (obj) {
            return obj[arg];
        }

        return obj;
    };
};