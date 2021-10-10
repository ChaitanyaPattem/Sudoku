var BOARD_SEL = "#sudoku-board";
var TABS_SEL = "#generator-tabs";
var MESSAGE_SEL = "#message";
var PUZZLE_CONTROLS_SEL = "#puzzle-controls";
var IMPORT_CONTROLS_SEL = "#import-controls";
var SOLVER_CONTROLS_SEL = "#solver-controls";

var boards = {
    "easy": null,
    "medium": null,
    "hard": null,
    "import": null,
};

var build_board = function(){
    
    for(var r = 0; r < 9; ++r){
        var $row = $("<tr/>", {});
        for(var c = 0; c < 9; ++c){
            var $square = $("<td/>", {});
            if(c % 3 == 2 && c != 8){
                $square.addClass("border-right");
            }
            $square.append(
                $("<input/>", {
                    id: "row" + r + "-col" + c,
                    class: "square",
                    maxlength: "9",
                    type: "text"
                })
            );
            $row.append($square);
        }
        if(r % 3 == 2 && r != 8){
            $row.addClass("border-bottom");
        }
        $(BOARD_SEL).append($row);
    }
};

var init_board = function(){
    
    $(BOARD_SEL + " input.square").change(function(){
        
        var $square = $(this);
        var nr_digits = $square.val().length;
        var font_size = "40px";
        if(nr_digits === 3){
            font_size = "35px";
        } else if(nr_digits === 4){
            font_size = "25px";
        } else if(nr_digits === 5){
            font_size = "20px";
        } else if(nr_digits === 6){
            font_size = "17px";
        } else if(nr_digits === 7){
            font_size = "14px";
        } else if(nr_digits === 8){
            font_size = "13px";
        } else if(nr_digits >= 9){
            font_size = "11px";
        }
        $(this).css("font-size", font_size);
    });
    $(BOARD_SEL + " input.square").keyup(function(){
        
        $(this).change();
    });

};

var init_tabs = function(){
    
    $(TABS_SEL + " a").click(function(e){
        e.preventDefault();
        var $t = $(this);
        var t_name = $t.attr("id");
        
        $(MESSAGE_SEL).hide();
        
        if(t_name === "import"){
            $(PUZZLE_CONTROLS_SEL).hide();
            $(IMPORT_CONTROLS_SEL).show();
        
        } else {
            $(PUZZLE_CONTROLS_SEL).show();
            $(IMPORT_CONTROLS_SEL).hide();
        }
        show_puzzle(t_name);
        $t.tab('show');
    });
};

var init_controls = function(){
    
    $(PUZZLE_CONTROLS_SEL + " #refresh").click(function(e){
        
        e.preventDefault();
        var tab_name = get_tab();
        if(tab_name !== "import"){
            show_puzzle(tab_name, true);
        }
    });
    
    $(IMPORT_CONTROLS_SEL + " #import-string").change(function(){
        
        var import_val = $(this).val();
        var processed_board = "";
        for(var i = 0; i < 81; ++i){
            if(typeof import_val[i] !== "undefined" &&
                    (sudoku._in(import_val[i], sudoku.DIGITS) || 
                    import_val[i] === sudoku.BLANK_CHAR)){
                processed_board += import_val[i];
            } else {
                processed_board += sudoku.BLANK_CHAR;
            }
        }
        boards["import"] = sudoku.board_string_to_grid(processed_board);
        show_puzzle("import");
    });
    $(IMPORT_CONTROLS_SEL + " #import-string").keyup(function(){
        
        $(this).change();
    });
    
    $(SOLVER_CONTROLS_SEL + " #solve").click(function(e){
        
        e.preventDefault();
        solve_puzzle(get_tab());
    });
    
    $(SOLVER_CONTROLS_SEL + " #get-options").click(function(e){
        e.preventDefault();
        get_options(get_tab());
    });
};

var init_message = function(){
    $(MESSAGE_SEL).hide();
}

var solve_puzzle = function(puzzle){
    if(typeof boards[puzzle] !== "undefined"){
        display_puzzle(boards[puzzle], true);
        
        var error = false;
        try{
            var solved_board = 
                sudoku.solve(sudoku.board_grid_to_string(boards[puzzle]));
        } catch(e) {
            error = true;
        }
        
        if(solved_board && !error){
            display_puzzle(sudoku.board_string_to_grid(solved_board), true);
            $(MESSAGE_SEL).hide();
        } else {
            $(MESSAGE_SEL + " #text")
                .html("<strong>Unable to solve!</strong> "
                    + "Check puzzle and try again.");
            $(MESSAGE_SEL).show();
        }
    }
};

var get_options = function(puzzle){
    
    if(typeof boards[puzzle] !== "undefined"){
        display_puzzle(boards[puzzle], true);
        
        var error = false;
        try{
            var options = 
                sudoku.get_options(
                    sudoku.board_grid_to_string(boards[puzzle])
                );
        } catch(e) {
            error = true;
        }
        
        if(options && !error){
            display_puzzle(options, true);
            $(MESSAGE_SEL).hide();
        } else {
            $(MESSAGE_SEL + " #text")
                .html("<strong>Unable to display candidates!</strong> " +
                    "Contradictions encountered. Check puzzle and try again.");
            $(MESSAGE_SEL).show();
        }
    }
}

var show_puzzle = function(puzzle, refresh){
    
    refresh = refresh || false;
    
    if(typeof boards[puzzle] === "undefined"){
        puzzle = "easy";
    }
    
    if(boards[puzzle] === null || refresh){
        if(puzzle === "import"){
            boards[puzzle] = sudoku.board_string_to_grid(sudoku.BLANK_BOARD);
        } else {
            boards[puzzle] = 
                sudoku.board_string_to_grid(sudoku.generate(puzzle));
        }
    }
    
    display_puzzle(boards[puzzle]);
}

var display_puzzle = function(board, highlight){
    for(var r = 0; r < 9; ++r){
        for(var c = 0; c < 9; ++c){
            var $square = $(BOARD_SEL + " input#row" + r + "-col" + c);
            $square.removeClass("btn-success");
            $square.attr("disabled", "disabled");
            if(board[r][c] != sudoku.BLANK_CHAR){
                var board_val = board[r][c];
                var square_val = $square.val();
                if(highlight && board_val != square_val){
                    $square.addClass("btn-success");
                }
                $square.val(board_val);
            } else {
                $square.val('');
            }
            $square.change();
        }
    }
};

var get_tab = function(){
    return $(TABS_SEL + " li.active a").attr("id");
};

var click_tab = function(tab_name){
    $(TABS_SEL + " #" + tab_name).click();
};

$(function(){
    build_board();
    init_board();
    init_tabs();
    init_controls();
    init_message();
    
    click_tab("easy");
    
    $("#app-wrap").removeClass("hidden");
    $("#loading").addClass("hidden");
});