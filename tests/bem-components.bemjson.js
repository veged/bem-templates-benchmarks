var COUNT = 10;
module.exports = function(rnd) {
    return {
        block : 'page',
        title : 'bem-components',
        mods : { theme : 'normal' },
        head : [
            { elem : 'css', url : '_index.css' },
            { elem : 'js', url : '_index.js' }
        ],
        content : [
            { tag : 'h2', content : rnd('Library variety') },
            Array(COUNT).join().split(',').map(function() {
                return {
                    block : 'table',
                    content : [
                        {
                            elem : 'row',
                            content : [
                                { elem : 'title', content : rnd('theme') },
                                { elem : 'title', content : rnd('&mdash;') },
                                { elem : 'title', content : rnd('simple') },
                                { elem : 'title', content : rnd('normal') }
                            ]
                        },
                        {
                            elem : 'row',
                            content : [
                                { elem : 'cell', content : 'link' },
                                {
                                    elem : 'cell',
                                    content : {
                                        block : 'link',
                                        url : '#',
                                        title : 'link',
                                        target : '_blank',
                                        content : 'link'
                                    }
                                },
                                {
                                    elem : 'cell',
                                    content : {
                                        block : 'link',
                                        mods : { theme : 'simple' },
                                        url : '#',
                                        title : 'link',
                                        target : '_blank',
                                        content : 'link'
                                    }
                                },
                                {
                                    elem : 'cell',
                                    content : {
                                        block : 'link',
                                        mods : { theme : 'normal' },
                                        url : '#',
                                        title : 'link',
                                        target : '_blank',
                                        content : 'link'
                                    }
                                }
                            ]
                        },
                        {
                            elem : 'row',
                            content : [
                                { elem : 'cell', content : 'attach' },
                                {
                                    elem : 'cell',
                                    content : [
                                        {
                                            block : 'attach',
                                            buttonText : 'file',
                                            noFileText : 'no file selected'
                                        },
                                        { tag : 'br' },
                                        {
                                            block : 'attach',
                                            button : {
                                                block : 'button',
                                                icon : { elem : 'icon' }
                                            },
                                            noFileText : 'no file selected'
                                        }
                                    ]
                                },
                                {
                                    elem : 'cell',
                                    content : [
                                        {
                                            block : 'attach',
                                            mods : { theme : 'simple' },
                                            buttonText : 'file',
                                            noFileText : 'no file selected'
                                        },
                                        { tag : 'br' },
                                        {
                                            block : 'attach',
                                            mods : { theme : 'simple' },
                                            button : {
                                                block : 'button',
                                                mods : { theme : 'simple' },
                                                icon : { elem : 'icon' }
                                            },
                                            noFileText : 'no file selected'
                                        }
                                    ]
                                },
                                {
                                    elem : 'cell',
                                    content : '&mdash;'
                                }
                            ]
                        },
                        {
                            elem : 'row',
                            content : [
                                { elem : 'cell', content : 'input' },
                                {
                                    elem : 'cell',
                                    content : {
                                        block : 'input',
                                        val : 'value',
                                        placeholder : 'default'
                                    }
                                },
                                {
                                    elem : 'cell',
                                    content : {
                                        block : 'input',
                                        mods : { theme : 'simple', 'has-clear' : true },
                                        val : 'value',
                                        placeholder : 'simple'
                                    }
                                },
                                {
                                    elem : 'cell',
                                    content : {
                                        block : 'input',
                                        mods : { theme : 'normal', size : 'm', 'has-clear' : true },
                                        val : 'value',
                                        placeholder : 'normal'
                                    }
                                }
                            ]
                        },
                        {
                            elem : 'row',
                            content : [
                                { elem : 'cell', content : 'button' },
                                {
                                    elem : 'cell',
                                    content : [
                                        { block : 'button', text : 'default' },
                                        ' ',
                                        { block : 'button', text : 'with icon', icon : { elem : 'icon' } },
                                        ' ',
                                        { block : 'button', icon : { elem : 'icon' } },
                                        ' ',
                                        { block : 'button', mods : { 'type' : 'link' }, url : '#', text : 'link' }
                                    ]
                                },
                                {
                                    elem : 'cell',
                                    content : [
                                        { block : 'button', mods : { theme : 'simple' }, text : 'default' },
                                        ' ',
                                        {
                                            block : 'button',
                                            mods : { theme : 'simple' },
                                            text : 'with icon',
                                            icon : { elem : 'icon' }
                                        },
                                        ' ',
                                        { block : 'button', mods : { theme : 'simple' }, icon : { elem : 'icon' } },
                                        ' ',
                                        {
                                            block : 'button',
                                            mods : { theme : 'simple', type : 'link' },
                                            url : '#',
                                            text : 'link'
                                        }
                                    ]
                                },
                                {
                                    elem : 'cell',
                                    content : [
                                        {
                                            block : 'button',
                                            mods : { theme : 'normal', size : 'm' },
                                            text : 'button'
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            elem : 'row',
                            content : [
                                { elem : 'cell', content : 'checkbox' },
                                {
                                    elem : 'cell',
                                    content : [
                                        {
                                            block : 'checkbox',
                                            val : 1,
                                            text : 'label1'
                                        },
                                        ' ',
                                        {
                                            block : 'checkbox',
                                            mods : { checked : true },
                                            val : 2,
                                            text : 'label2'
                                        },
                                        ' ',
                                        {
                                            block : 'checkbox',
                                            mods : { type : 'button' },
                                            val : 1,
                                            text : 'label1'
                                        },
                                        ' ',
                                        {
                                            block : 'checkbox',
                                            mods : { type : 'button', checked : true },
                                            val : 2,
                                            text : 'label2'
                                        }
                                    ]
                                },
                                {
                                    elem : 'cell',
                                    content : [
                                        {
                                            block : 'checkbox',
                                            mods : { theme : 'simple' },
                                            val : 1,
                                            text : 'label1'
                                        },
                                        ' ',
                                        {
                                            block : 'checkbox',
                                            mods : { theme : 'simple', checked : true },
                                            val : 2,
                                            text : 'label2'
                                        },
                                        ' ',
                                        {
                                            block : 'checkbox',
                                            mods : { theme : 'simple', type : 'button' },
                                            val : 1,
                                            text : 'label1'
                                        },
                                        ' ',
                                        {
                                            block : 'checkbox',
                                            mods : { theme : 'simple', type : 'button', checked : true },
                                            val : 2,
                                            text : 'label2'
                                        }
                                    ]
                                },
                                {
                                    elem : 'cell',
                                    content : [
                                        {
                                            block : 'checkbox',
                                            mods : { theme : 'normal', size : 'm' },
                                            val : 1,
                                            text : 'label1'
                                        },
                                        ' ',
                                        {
                                            block : 'checkbox',
                                            mods : { theme : 'normal', size : 'm', checked : true },
                                            val : 2,
                                            text : 'label2'
                                        },
                                        ' ',
                                        {
                                            block : 'checkbox',
                                            mods : { theme : 'normal', size : 'm', type : 'button' },
                                            val : 1,
                                            text : 'label1'
                                        },
                                        ' ',
                                        {
                                            block : 'checkbox',
                                            mods : { theme : 'normal', size : 'm', type : 'button', checked : true },
                                            val : 2,
                                            text : 'label2'
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            elem : 'row',
                            content : [
                                { elem : 'cell', content : 'radio' },
                                {
                                    elem : 'cell',
                                    content : [
                                        {
                                            block : 'radio',
                                            name : 'radio-default1',
                                            options : [
                                                { val : 1, text : 'first' },
                                                { val : 2, text : 'second' }
                                            ],
                                            val : 2
                                        },
                                        ' ',
                                        {
                                            block : 'radio',
                                            mods : { type : 'button' },
                                            name : 'radio-default2',
                                            options : [
                                                { val : 1, text : 'first' },
                                                { val : 2, text : 'second' }
                                            ],
                                            val : 2
                                        }
                                    ]
                                },
                                {
                                    elem : 'cell',
                                    content : [
                                        {
                                            block : 'radio',
                                            mods : { theme : 'simple' },
                                            name : 'radio-simple1',
                                            options : [
                                                { val : 1, text : 'first' },
                                                { val : 2, text : 'second' }
                                            ],
                                            val : 2
                                        },
                                        ' ',
                                        {
                                            block : 'radio',
                                            mods : { theme : 'simple', type : 'button' },
                                            name : 'radio-simple2',
                                            options : [
                                                { val : 1, text : 'first' },
                                                { val : 2, text : 'second' }
                                            ],
                                            val : 2
                                        }
                                    ]
                                },
                                {
                                    elem : 'cell',
                                    content : [
                                        {
                                            block : 'radio',
                                            mods : { theme : 'normal', size : 'm' },
                                            name : 'radio-normal1',
                                            options : [
                                                { val : 1, text : 'first' },
                                                { val : 2, text : 'second' }
                                            ],
                                            val : 2
                                        },
                                        ' ',
                                        {
                                            block : 'radio',
                                            mods : { theme : 'normal', size : 'm', type : 'button' },
                                            name : 'radio-normal2',
                                            options : [
                                                { val : 1, text : 'first' },
                                                { val : 2, text : 'second' }
                                            ],
                                            val : 2
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }),
            Array(COUNT).join().split(',').map(function() {
                return [
                    { tag : 'h2', content : 'Normal theme' },

                    {
                        block : 'line',
                        mods : { size : 's' },
                        content : [
                            'size s (24px height) ',
                            {
                                block : 'input',
                                mods : { theme : 'normal', size : 's', 'has-clear' : true },
                                val : 'value',
                                placeholder : 'placeholder'
                            },
                            ' ',
                            {
                                block : 'button',
                                mods : { theme : 'normal', size : 's' },
                                text : 'button'
                            },
                            ' ',
                            {
                                block : 'radio',
                                mods : { theme : 'normal', size : 's', type : 'button' },
                                name : 'radio-sizes-s',
                                options : [
                                    { val : 1, text : 'first' },
                                    { val : 2, text : 'second' }
                                ],
                                val : 2
                            },
                            ' ',
                            {
                                block : 'checkbox',
                                mods : { theme : 'normal', size : 's', type : 'button' },
                                val : 1,
                                text : 'check'
                            }
                        ]
                    },

                    { tag : 'br' },

                    {
                        block : 'line',
                        mods : { size : 'm' },
                        content : [
                            'size m (28px height) ',
                            {
                                block : 'input',
                                mods : { theme : 'normal', size : 'm', 'has-clear' : true },
                                val : 'value',
                                placeholder : 'placeholder'
                            },
                            ' ',
                            {
                                block : 'button',
                                mods : { theme : 'normal', size : 'm' },
                                text : 'button'
                            },
                            ' ',
                            {
                                block : 'radio',
                                mods : { theme : 'normal', size : 'm', type : 'button' },
                                name : 'radio-sizes-m',
                                options : [
                                    { val : 1, text : 'first' },
                                    { val : 2, text : 'second' }
                                ],
                                val : 2
                            },
                            ' ',
                            {
                                block : 'checkbox',
                                mods : { theme : 'normal', size : 'm', type : 'button' },
                                val : 1,
                                text : 'check'
                            }
                        ]
                    },

                    { tag : 'br' },

                    {
                        block : 'line',
                        mods : { size : 'l' },
                        content : [
                            'size l (32px height) ',
                            {
                                block : 'input',
                                mods : { theme : 'normal', size : 'l', 'has-clear' : true },
                                val : 'value',
                                placeholder : 'placeholder'
                            },
                            ' ',
                            {
                                block : 'button',
                                mods : { theme : 'normal', size : 'l' },
                                text : 'button'
                            },
                            ' ',
                            {
                                block : 'radio',
                                mods : { theme : 'normal', size : 'l', type : 'button' },
                                name : 'radio-sizes-l',
                                options : [
                                    { val : 1, text : 'first' },
                                    { val : 2, text : 'second' }
                                ],
                                val : 2
                            },
                            ' ',
                            {
                                block : 'checkbox',
                                mods : { theme : 'normal', size : 'l', type : 'button' },
                                val : 1,
                                text : 'check'
                            }
                        ]
                    },

                    { tag : 'br' },

                    {
                        block : 'line',
                        mods : { size : 'xl' },
                        content : [
                            'size xl (38px height) ',
                            {
                                block : 'input',
                                mods : { theme : 'normal', size : 'xl', 'has-clear' : true },
                                val : 'value',
                                placeholder : 'placeholder'
                            },
                            ' ',
                            {
                                block : 'button',
                                mods : { theme : 'normal', size : 'xl' },
                                text : 'button'
                            },
                            ' ',
                            {
                                block : 'radio',
                                mods : { theme : 'normal', size : 'xl', type : 'button' },
                                name : 'radio-sizes-xl',
                                options : [
                                    { val : 1, text : 'first' },
                                    { val : 2, text : 'second' }
                                ],
                                val : 2
                            },
                            ' ',
                            {
                                block : 'checkbox',
                                mods : { theme : 'normal', size : 'xl', type : 'button' },
                                val : 1,
                                text : 'check'
                            }
                        ]
                    }
                ]
            })
        ]
    }
};
