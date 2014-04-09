module.exports = function(rnd) {
    return buildDeep(5, rndFromArray([
        { block: 'b1', content: rnd('content') },
        { block: 'b1', mods: { m1: 'v1' }, content: rnd('content') },
        { block: 'b1', mods: { m1: 'v2', m3: 'v3' }, content: rnd('content') },
        { block: 'b1', mods: { m1: 'v2', m3: 'v3', m4: 'v4' }, content: rnd('content') },
        { block: 'b2', content: rnd('content') },
        { block: 'b2', mods: { m2: 'v1' }, content: rnd('content') },
        { block: 'b2', mods: { m2: 'v2', m3: 'v3' }, content: rnd('content') },
        { block: 'b2', mods: { m2: 'v2', m3: 'v3', m4: 'v4' }, content: rnd('content') }
    ]));
};

function rndFromArray(arr) {
    var l = arr.length;
    return function() {
        var b = JSON.parse(JSON.stringify(arr[Math.floor(Math.random() * l)]));
        return b
    }
}

function buildDeep(count, rnd) {
    if(count === 1) {
        return rnd();
    } else {
        return Array(count).join().split(',').map(function() {
            return buildDeep(count - 1, rnd);
        });
    }
}

//console.log(JSON.stringify(module.exports(function() { return '' + new Date() }), null, 4));
