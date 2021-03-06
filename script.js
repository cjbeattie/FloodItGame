// Flood-It
// Made by Courtney Beattie as part of a student project for General Assembly's Software Engineering Immersive program.
// A play on the game by Unixpapa: "https://unixpapa.com/floodit/" - there was no peeking at the code! 


// DATA

const colorBank = ["darkpurple", "lightyellow", "darkgreen", "pink", "lightblue", "beige", "lightpurple", "darkyellow"];
const targetMovesLookupTable = {
    // gridSize:  {numberOfColours: targetMoves}
    "2": { "3": 2, "4": 2, "5": 2, "6": 3, "7": 4, "8": 4 }, // Adding 1 just to the first one
    "6": { "3": 6, "4": 8, "5": 9, "6": 11, "7": 13, "8": 15 }, // Adding 1 to original
    "10": { "3": 11, "4": 14, "5": 17, "6": 20, "7": 23, "8": 26 }, // Added 3 to original
    "14": { "3": 17, "4": 19, "5": 25, "6": 30, "7": 34, "8": 38 }, // Added 5 to original
    "18": { "3": 21, "4": 26, "5": 31, "6": 37, "7": 42, "8": 47 }, // Added 5 to original
    "22": { "3": 25, "4": 32, "5": 37, "6": 45, "7": 51, "8": 57 }, // Added 6 to original
    "26": { "3": 29, "4": 36, "5": 44, "6": 52, "7": 60, "8": 67 } // Added 6 to original
};
const gridSizeToColorsDefaultLookupTable = {
    // gridSize: numColors
    "2": 3,
    "6": 4,
    "10": 5,
    "14": 6,
    "18": 7,
    "22": 8,
    "26": 8
}

// GAME STATE VARIABLES

let possibleColorsArr = [];
let gridArr = [];
let gridSize = 0;
let numColors = 0;
let activeColor = "";
let debugEnabled = false;
let targetMoves = 0;
let playerMoveCounter = 0;

// CLASSES

class Cell {
    constructor(color) {
        this.color = color;
        this.isFillable = false;
        this.isChecked = false;
    }
}

// CLICK HANDLERS

const cellClickHandler = (event) => {
    // Update debug view if enabled
    if (initDebugView) {
        $("#gridContainerPrevious").empty();
        $("#gridContainer").clone().appendTo($("#gridContainerPrevious"));
    }

    let clickedColor = $(event.target).attr("data-color");
    if (clickedColor !== activeColor) {
        updatePlayerMoveCounter();
    }

    // Get the color of the cell the user just clicked
    activeColor = clickedColor;
    console.log("clicked color:", activeColor);

    // Update the color property of fillable cells in object
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (gridArr[i][j].isFillable === true) {
                gridArr[i][j].color = activeColor;
            }
        }
    }
    updateIsFillable(0, 0);
    renderGrid();
    resetIsChecked();
    checkWin();
    updateGridCSS();
}

const newGameClickHandler = () => {
    // let isConfirmed = confirm("Are you sure you want to start a new game?");
    // if (isConfirmed) {
    //     newGame();
    // }


    // $("#dialog").dialog({
    //     buttons : {
    //       "Confirm" : function() {
    //         console.log("yay");
    //       },
    //       "Cancel" : function() {
    //         $(this).dialog("close");
    //       }
    //     }
    //   });
    $("#confirm").dialog("open");
}


// FUNCTIONS

const initGame = () => {
    // Init confirm popup (must happen before newGame() is called)
    $("#confirm").dialog({ autoOpen: false });
    $("#confirm").dialog({
        buttons: [
            {
                text: "Cancel",
                click: function () {
                    $(this).dialog("close");
                }
            },
            {
                text: "Yes",
                click: newGame,
            }
        ]
    });
    newGame();
    $("#newGame").on("click", newGameClickHandler);
    $("#gridSize").on("change", updateNumColorsSelection);
}

const newGame = () => {
    gridSize = $("#gridSize").val();
    numColors = $("#numColors").val();
    playerMoveCounter = 0;
    updatePossibleColorsArr();
    createGrid();
    updateIsFillable(0, 0);
    renderGrid();
    initTargetMoves();
    resetIsChecked();
    initDebugView();
    $("#result").text("");
    updateGridCSS();
    $("#confirm").dialog("close");
}

const updateNumColorsSelection = () => {
    let autoNumColors = gridSizeToColorsDefaultLookupTable[$("#gridSize").val()];
    $("#numColors").val(autoNumColors);
}

const updateGridCSS = () => {
    let newContainerWidth = (40 * gridSize) + "px";
    let newCellWidth = (1 / gridSize * 100) + "%";

    $("#gridContainer").css("max-width", newContainerWidth);
    $(".cell-image").css("width", newCellWidth);
}

const updatePossibleColorsArr = () => {
    possibleColorsArr = [];
    for (let i = 0; i < numColors; i++) {
        possibleColorsArr.push(colorBank[i]);
    }
}

const getRandomColor = () => {
    let index = Math.floor(Math.random() * possibleColorsArr.length)
    let color = possibleColorsArr[index];
    return color;
}

const createGrid = () => {
    // create empty array of the correct size
    gridArr = new Array(gridSize);
    for (let i = 0; i < gridSize; i++) {
        gridArr[i] = new Array(gridSize);
    }

    // Populate array with cell objects of random color
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            let color = getRandomColor();
            let newCellObject = new Cell(color);
            gridArr[i][j] = newCellObject;
        }
    }

    // Make the top-left color the activeColor
    activeColor = gridArr[0][0].color;
    console.log("The active color is", activeColor);
}

const updateIsFillable = (row, column) => {
    // isChecked flag tells us whether we've already dealth with this cell this round (i.e. per click), so that we don't go back and forth forever!

    // Look at self
    if (gridArr[row][column].color === activeColor && !gridArr[row][column].isChecked) {
        gridArr[row][column].isFillable = true;
        gridArr[row][column].isChecked = true;
        // console.log(`At row:${row} column:${column} SELF has been updated to fillable`);
    }

    // Look right
    if (column < (gridSize - 1)) {
        if (gridArr[row][column + 1].color === activeColor && !gridArr[row][column + 1].isChecked) {
            updateIsFillable(row, (column + 1));
            // console.log(`At row:${row} column:${column} TO MY RIGHT has called updateFillable().`);
        }
    }

    // Look down
    if (row < (gridSize - 1)) {
        if (gridArr[row + 1][column].color === activeColor && !gridArr[row + 1][column].isChecked) {
            updateIsFillable((row + 1), column);
            // console.log(`At row:${row} column:${column} BELOW has called updateFillable()`);
        }
    }

    // Look left
    if (column > 0) {
        if (gridArr[row][column - 1].color === activeColor && !gridArr[row][column - 1].isChecked) {
            updateIsFillable(row, (column - 1));
            // console.log(`At row:${row} column:${column} TO MY LEFT has called updateFillable()`);
        }
    }

    // Look up
    if (row > 0) {
        if (gridArr[row - 1][column].color === activeColor && !gridArr[row - 1][column].isChecked) {
            updateIsFillable((row - 1), column);
            // console.log(`At row:${row} column:${column} ABOVE has called updateFillable()`);
        }
    }
}

const renderGrid = () => {
    // Remove existing grid
    $("#gridContainer").empty();

    // Render gridArray with divs on screen
    for (let i = 0; i < gridSize; i++) {
        let $row = $("<div>").addClass("row").appendTo($("#gridContainer"));
        for (let j = 0; j < gridSize; j++) {
            let color = gridArr[i][j].color;
            if (gridArr[i][j].isFillable) {
                $("<img>").addClass("cell-image fillable").attr({ src: "images/" + color + ".jpg", "data-color": color }).on("click", cellClickHandler).appendTo($($row));
            } else {
                $("<img>").addClass("cell-image").attr({ src: "images/" + color + ".jpg", "data-color": color }).on("click", cellClickHandler).appendTo($($row));
            }
        }
    }
}

const initTargetMoves = () => {
    targetMoves = targetMovesLookupTable[gridSize][numColors];
    updateScore();
}

const updateScore = () => {
    $("#score").text(playerMoveCounter + "/" + targetMoves);
}

const resetIsChecked = () => {
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            gridArr[i][j].isChecked = false;
        }
    }
}

const initDebugView = () => {
    if (debugEnabled) {
        $(".debug").show();
    } else {
        $(".debug").hide();
    }
}

const updatePlayerMoveCounter = () => {
    playerMoveCounter++;
    updateScore();
}

const checkWin = () => {
    let gridFilled = true;
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (gridArr[i][j].isFillable === false) {
                gridFilled = false;
            }
        }
    }

    if (playerMoveCounter < targetMoves) {
        if (gridFilled) {
            $("#result").text("You Win!");
        }
    } else if (playerMoveCounter === targetMoves) {
        if (gridFilled) {
            $("#result").text("You Win!");
        } else {
            $("#result").text("You Lose!");
        }
    } else {
        $("#result").text("You Lose!");
    }
}


// ON LOAD

$(() => {
    initGame();
});