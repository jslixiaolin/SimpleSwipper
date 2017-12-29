const swipper = new Swipper({
    container: '.tabview-container',
    view: '.tabview',
    curIndex: 0,
    horizontalCbk: function () {
        console.log(1)
    }
});