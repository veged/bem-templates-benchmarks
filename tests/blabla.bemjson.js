module.exports = function() {
    return [
        { block: 'b1' },
        {
            block: 'b1',
            content: [
                { block: 'b2' },
                { block: 'b2', mods: { m2: 'v1' } },
                { block: 'b2', mods: { m2: 'v2' } }
            ]
        },
        { block: 'b1', mods: { m1: 'v1' } },
        { block: 'b1', mods: { m1: 'v2' } }
    ]
}
