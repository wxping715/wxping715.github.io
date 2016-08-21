function showNumberWithAnimation(x, y, number) {
    var $numberCell = $('#number-cell-'+x+'-'+y);
    $numberCell.css('background-color', BackgroundColor[number.toString()]);
    $numberCell.css('color', getNumberCellColor(number));
    $numberCell.text(number);

    $numberCell.animate({
        // width: "100px",
        // height: "100px",
        width: cellSideLength,
        height: cellSideLength,
        top: getPosTop(x, y),
        left: getPosLeft(x, y)
    }, 50);
}

function showMoveAnimation(fromx, fromy, tox, toy) {
    var $numberCell = $('#number-cell-'+fromx+'-'+fromy);
    $numberCell.animate({
        top: getPosTop(tox, toy),
        left: getPosLeft(tox, toy)
    }, 200);
}

function updateScoreAnimation(score) {
    $('#score-id').text(score);
}
