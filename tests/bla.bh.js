module.exports = function(bh) {


    bh.match('bla', function(ctx) {
        ctx.tag('span');
    });


    return bh;
}
