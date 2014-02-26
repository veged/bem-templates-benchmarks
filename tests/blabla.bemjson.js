module.exports = function(rnd) {
    return [
        { block: 'b1', content: rnd('content') },
        {
            block: 'b1',
            content: [
                { block: 'b2', content: rnd('content') },
                { block: 'b2', mods: { m2: 'v1' }, content: rnd('content') },
                { block: 'b2', mods: { m2: 'v2' }, content: rnd('content') }
            ]
        },
        { block: 'b1', mods: { m1: 'v1' }, content: rnd('content') },
        { block: 'b1', mods: { m1: 'v2' }, content: rnd('content') }
    ]
}
