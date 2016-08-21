var board = new Array();
var updatedStatus = new Array();
var score = 0;

//grid cell width
var WIDTH = 4;
//grid cell height
var HEIGHT = 4;

var startx = 0;
var starty = 0;
var endx = 0;
var endy = 0;

var BackgroundColor = {
    '2' : '#eee4da',
    '4' : '#ede0c8',
    '8' : '#f2b179',
    '16': '#f59563',
    '32': '#f67c5f',
    '64': '#f65e3b',
    '128': "#edcf72",
    '256': "#edcc61",
    '512': "#9c0",
    '1024': "#33b5e5",
    "2048": "#09c",
    "4096": "#a6c",
    "8192": "#93c"
}

$(document).ready(function() {
    prepareForMobile();
    newgame();
});


$(document).keydown(function(event) {
    switch (event.keyCode) {
        case 37: //left
            //prevent the default result of event
            event.preventDefault();
            if (moveLeft()) {
                generateRandomNumber();
            }
            isGameOver();
            break;
        case 38: //up
            //prevent the default result of event
            event.preventDefault();
            if (moveUp()) {
                generateRandomNumber();
            }
            isGameOver();
            break;
        case 39: //right
            //prevent the default result of event
            event.preventDefault();
            if (moveRight()) {
                generateRandomNumber();
            }
            isGameOver();
            break;
        case 40: //down
            //prevent the default result of event
            event.preventDefault();
            if (moveDown()) {
                generateRandomNumber();
            }
            isGameOver();
            break;
        default:
            break;
    }
});

// fix some bugs
document.addEventListener('touchmove', function(event) {
    event.preventDefault();
});

document.addEventListener('touchstart', function(event) {
    startx = event.touches[0].pageX;
    starty = event.touches[0].pageY;
});

document.addEventListener('touchend', function(event) {
    endx = event.changedTouches[0].pageX;
    endy = event.changedTouches[0].pageY;

    var deltax = endx - startx;
    var deltay = endy - starty;

    if (Math.abs(deltax) < 0.2 * documentWidth && Math.abs(deltay) < 0.2 * documentWidth) return;

    // direction x
    if (Math.abs(deltax) >= Math.abs(deltay)) {
        // move right
        if (deltax > 0) {
            if (moveRight()) {
                generateRandomNumber();
            }
        }
        // move left
        else {
            if (moveLeft()) {
                generateRandomNumber();
            }
        }
    }
    // direction y
    else {
        // move down
        if (deltay > 0) {
            if (moveDown()) {
                generateRandomNumber();
            }
        }
        // move up
        else {
            if (moveUp()) {
                generateRandomNumber();
            }
        }
    }
});

function prepareForMobile() {

    if (documentWidth > 500) {
        gridContainerWidth = 500;
        cellSideLength = 100;
        cellSpace = 20;
    }

    var $gridContainer = $('#grid-container');
    var $gridCell = $('.grid-cell');

    $gridContainer.css('width', gridContainerWidth - 2*cellSpace);
    $gridContainer.css('height', gridContainerWidth - 2*cellSpace);
    $gridContainer.css('padding', cellSpace);
    $gridContainer.css('border-radius', 0.02 * cellSideLength);

    $gridCell.css('width', cellSideLength);
    $gridCell.css('height', cellSideLength);
    $gridCell.css('border-radius', 0.02*cellSideLength);
}

function newgame() {
    // init grid
    init();
    // generate two random numbers
    generateRandomNumber();
    generateRandomNumber();
}

function init() {
    for (var i = 0; i < HEIGHT; i++)
        for (var j = 0; j < WIDTH; j++) {
            var $gridCell = $("#grid-cell-"+i+"-"+j);
            $gridCell.css("top", getPosTop(i, j));
            $gridCell.css("left", getPosLeft(i, j));
        }

    for (var i = 0; i < HEIGHT; i++) {
        board[i] = new Array();
        updatedStatus[i] = new Array();
        for (var j = 0; j < WIDTH; j++)
            board[i][j] = 0;
            updatedStatus[i][j] = false;
    }
    updateBoardView();
    score = 0;
}

function updateBoardView() {
    $(".number-cell").remove();
    var $gridContainer = $('#grid-container');

    for (var i = 0; i < HEIGHT; i++)
        for (var j = 0; j < WIDTH; j++) {
            $gridContainer.append('<div class="number-cell" id="number-cell-'+i+'-'+j+'"></div>');
            var curNumberCell = $("#number-cell-"+i+"-"+j);

            if (board[i][j] == 0) {
                curNumberCell.css('width', 0);
                curNumberCell.css('height', 0);
                // curNumberCell.css('top', getPosTop(i,j) + 50);
                // curNumberCell.css('left', getPosLeft(i,j) + 50);
                curNumberCell.css('top', getPosTop(i,j) + cellSideLength / 2);
                curNumberCell.css('left', getPosLeft(i,j) + cellSideLength / 2);
            } else {
                // curNumberCell.css('width', 100);
                // curNumberCell.css('height', 100);
                curNumberCell.css('width', cellSideLength);
                curNumberCell.css('height', cellSideLength);
                curNumberCell.css('top', getPosTop(i,j));
                curNumberCell.css('left', getPosLeft(i,j));
                curNumberCell.css('background-color', BackgroundColor[board[i][j].toString()]);
                curNumberCell.css('color', getNumberCellColor(board[i][j]));
                curNumberCell.text(board[i][j]);
            }

            updatedStatus[i][j] = false;
        }
    $('.number-cell').css('line-height', cellSideLength+'px');
    $('.number-cell').css('font-size', 0.6 * cellSideLength+'px');
    updateScoreAnimation(score);
}

function generateRandomNumber() {
    var blankCells = new Array();
    for (var i = 0; i < HEIGHT; i++)
        for (var j = 0; j < WIDTH; j++) {
            if (board[i][j] == 0) blankCells.push(i * WIDTH + j);
        }

    //check whether the board has space
    if (blankCells.length == 0) return false;

    // random one position
    var value = blankCells[Math.floor(Math.random()*blankCells.length)];
    var randx = parseInt(value / WIDTH);
    var randy = value % WIDTH;

    // random one number
    var randNumber = Math.random() < 0.5 ? 2 : 4;

    // show number
    board[randx][randy] = randNumber;
    showNumberWithAnimation(randx, randy, randNumber);

    return true;
}

function moveLeft() {
    if (!canMoveLeft(board)) return false;
    // move left
    for (var i = 0; i < HEIGHT; i++)
        for (var j = 1; j < WIDTH; j++) {
            if (board[i][j] == 0) continue;

            for (var k = 0; k < j; k++) {
                if (board[i][k] == 0 && noBlockHorizontal(i, k, j, board)) {
                    // move
                    showMoveAnimation(i, j, i, k);
                    board[i][k] = board[i][j];
                    board[i][j] = 0;
                    continue
                } else if (board[i][k] == board[i][j] && noBlockHorizontal(i, k, j, board) && !updatedStatus[i][k]) {
                    // move
                    showMoveAnimation(i, j, i, k);
                    // add
                    board[i][k] += board[i][j];
                    board[i][j] = 0;

                    // update updatedStatus
                    updatedStatus[i][k] = true;

                    // add score
                    score += board[i][k];
                    continue;
                }
            }
        }
    //update
    setTimeout("updateBoardView()", 200);
    return true;
}

function moveRight(){
    if( !canMoveRight( board ) )
        return false;

    //moveRight
    for( var i = 0 ; i < 4 ; i ++ )
        for( var j = 2 ; j >= 0 ; j -- ){
            if( board[i][j] != 0 ){
                for( var k = 3 ; k > j ; k -- ){

                    if( board[i][k] == 0 && noBlockHorizontal( i , j , k , board ) ){
                        showMoveAnimation( i , j , i , k );
                        board[i][k] = board[i][j];
                        board[i][j] = 0;
                        continue;
                    }
                    else if( board[i][k] == board[i][j] && noBlockHorizontal( i , j , k , board ) && !updatedStatus[i][k] ){
                        showMoveAnimation( i , j , i , k);
                        board[i][k] *= 2;
                        board[i][j] = 0;

                        // update updatedStatus
                        updatedStatus[i][k] = true;

                        score += board[i][k];
                        continue;
                    }
                }
            }
        }

    setTimeout("updateBoardView()",200);
    return true;
}

function moveUp(){

    if( !canMoveUp( board ) )
        return false;

    //moveUp
    for( var j = 0 ; j < 4 ; j ++ )
        for( var i = 1 ; i < 4 ; i ++ ){
            if( board[i][j] != 0 ){
                for( var k = 0 ; k < i ; k ++ ){

                    if( board[k][j] == 0 && noBlockVertical( j , k , i , board ) ){
                        showMoveAnimation( i , j , k , j );
                        board[k][j] = board[i][j];
                        board[i][j] = 0;
                        continue;
                    }
                    else if( board[k][j] == board[i][j] && noBlockVertical( j , k , i , board ) && !updatedStatus[k][j] ){
                        showMoveAnimation( i , j , k , j );
                        board[k][j] *= 2;
                        board[i][j] = 0;

                        // update updatedStatus
                        updatedStatus[k][j] = true;
                        score += board[k][j];
                        continue;
                    }
                }
            }
        }

    setTimeout("updateBoardView()",200);
    return true;
}

function moveDown(){
    if( !canMoveDown( board ) )
        return false;

    //moveDown
    for( var j = 0 ; j < 4 ; j ++ )
        for( var i = 2 ; i >= 0 ; i -- ){
            if( board[i][j] != 0 ){
                for( var k = 3 ; k > i ; k -- ){

                    if( board[k][j] == 0 && noBlockVertical( j , i , k , board ) ){
                        showMoveAnimation( i , j , k , j );
                        board[k][j] = board[i][j];
                        board[i][j] = 0;
                        continue;
                    }
                    else if( board[k][j] == board[i][j] && noBlockVertical( j , i , k , board ) && !updatedStatus[k][j]){
                        showMoveAnimation( i , j , k , j );
                        board[k][j] *= 2;
                        board[i][j] = 0;

                        // update updatedStatus
                        updatedStatus[k][j] = true;

                        score += board[k][j];
                        continue;
                    }
                }
            }
        }

    setTimeout("updateBoardView()",200);
    return true;
}

function isGameOver() {
    if (canMoveLeft(board) || canMoveRight(board) || canMoveUp(board) || canMoveDown(board)) return false;
    gameOver();
}

function gameOver() {
    alert("Game Over");
}
