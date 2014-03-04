var FS = require('fs'),
    ASSERT = require('assert'),
    Benchmark = require('benchmark');

FS.readdirSync('./tests').forEach(function(path) {
    var match = path.match(/(.*)\.bemjson.js$/);
    if(match) {
        createSuite(match[1]);
    }
});

function createSuite(suiteName) {
    var suite = new Benchmark.Suite,
        suitePrefix = './tests/' + suiteName + '.',
        bemjsonPath = suitePrefix + 'bemjson.js',
        bemjson = BEMJSON(bemjsonPath),
        bemhtmlPath = suitePrefix + 'bemhtml',
        bemhtml = BEMHTML(bemhtmlPath),
        bhPath = suitePrefix + 'bh',
        bh = BH(bhPath),
        bemjson0 = bemjson(),
        results = {
            bemhtml: bemhtml.apply(bemjson0),
            bh: bh.apply(bemjson0)
        };

    console.log('== Create suite "' + suiteName + '" (' + bemjsonPath + ')');

    //ASSERT.equal(results.bemhtml, results.bh, 'BEMHTML: ' + results.bemhtml + '\n\nBH: ' + results.bh + '\n\n');
    process.env.ENV == 'development' && console.log('RESULT: ' + results.bemhtml + '\n\n');

    suite
        .add('-- bemhtml (' + bemhtmlPath + ')', function() {
            bemhtml.apply(bemjson());
        })
        .add('-- bh (' + bhPath + ')', function() {
            bh.apply(bemjson());
        })
        .on('cycle', function(event) {
            console.log(String(event.target));
        })
        .on('complete', function() {
            console.log('Fastest ' + this.filter('fastest').pluck('name') + '\n');
        })
        .run();
}

function BEMJSON(path, count) {
    count || (count = 1000);
    var generator = require(path),
        i = count,
        variants = [],
        rndCount = 0;
        rnd = function(prefix) { return (prefix || 'rnd') + ++rndCount };

    while(i--) variants.push(generator(rnd));

    return function() {
        ++i < count || (i = 0);
        return variants[i];
    }
}

function BEMHTML(path) {
    if(FS.existsSync(path))
        return require('bem-xjst').compile(
            FS.readFileSync('libs/bem-core/common.blocks/i-bem/i-bem.bemhtml') +
                FS.readFileSync(path),
            {});

    return require(path + '.js').BEMHTML
}

function BH(path) {
    if(FS.existsSync(path))
        return require(path)(new (require('bh').BH)());

    return require(path + '.js')
}
