module.exports = function(rnd) {
    return Array(10).join().split(',').map(function() {
        return { block: rnd('block') }
    })
};
