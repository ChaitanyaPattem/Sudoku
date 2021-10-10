
(function(root){
    var sudoku = root.sudoku = {};  

    sudoku.DIGITS = "123456789";    
    var ROWS = "ABCDEFGHI";         
    var COLS = sudoku.DIGITS;       
    var SQUARES = null;             

    var UNITS = null;               
    var SQUARE_UNITS_MAP = null;    
    var SQUARE_PEERS_MAP = null;    
    
    var MIN_GIVENS = 17;            
    var NR_SQUARES = 81;            
    
    var DIFFICULTY = {
        "easy":         62,
        "medium":       53,
        "hard":         44,
    };

    // Blank character and board representation
    sudoku.BLANK_CHAR = '.';
    sudoku.BLANK_BOARD = "...................................................."+
            ".............................";

    // Init
    
    function initialize(){
        SQUARES             = sudoku._cross(ROWS, COLS);
        UNITS               = sudoku._get_all_units(ROWS, COLS);
        SQUARE_UNITS_MAP    = sudoku._get_square_units_map(SQUARES, UNITS);
        SQUARE_PEERS_MAP    = sudoku._get_square_peers_map(SQUARES, 
                                    SQUARE_UNITS_MAP);
    }

    // Generate
    
    sudoku.generate = function(difficulty, unique){
        if(typeof difficulty === "string" || typeof difficulty === "undefined"){
            difficulty = DIFFICULTY[difficulty] || DIFFICULTY.easy;
        }
        
        difficulty = sudoku._force_range(difficulty, NR_SQUARES + 1, 
                MIN_GIVENS);
        
        unique = unique || true;
        
        var blank_board = "";
        for(var i = 0; i < NR_SQUARES; ++i){
            blank_board += '.';
        }
        var options = sudoku._get_options_map(blank_board);
        
        var shuffled_squares = sudoku._shuffle(SQUARES);
        for(var si in shuffled_squares){
            var square = shuffled_squares[si];
            
            var rand_option_idx = 
                    sudoku._rand_range(options[square].length);
            var rand_option = options[square][rand_option_idx];
            if(!sudoku._assign(options, square, rand_option)){
                break;
            }
            
            var single_options = [];
            for(var si in SQUARES){
                var square = SQUARES[si];
                
                if(options[square].length == 1){
                    single_options.push(options[square]);
                }
            }
            
            if(single_options.length >= difficulty && 
                    sudoku._strip_dups(single_options).length >= 8){
                var board = "";
                var givens_idxs = [];
                for(var i in SQUARES){
                    var square = SQUARES[i];
                    if(options[square].length == 1){
                        board += options[square];
                        givens_idxs.push(i);
                    } else {
                        board += sudoku.BLANK_CHAR;
                    }
                }
                
                var nr_givens = givens_idxs.length;
                if(nr_givens > difficulty){
                    givens_idxs = sudoku._shuffle(givens_idxs);
                    for(var i = 0; i < nr_givens - difficulty; ++i){
                        var target = parseInt(givens_idxs[i]);
                        board = board.substr(0, target) + sudoku.BLANK_CHAR + 
                            board.substr(target + 1);
                    }
                }
                
                if(sudoku.solve(board)){
                    return board;
                }
            }
        }
        
        return sudoku.generate(difficulty);
    };

    // Solve
    sudoku.solve = function(board, reverse){
        var report = sudoku.validate_board(board);
        if(report !== true){
            throw report;
        }
        
        var nr_givens = 0;
        for(var i in board){
            if(board[i] !== sudoku.BLANK_CHAR && sudoku._in(board[i], sudoku.DIGITS)){
                ++nr_givens;
            }
        }
        if(nr_givens < MIN_GIVENS){
            throw "Too few givens. Minimum givens is " + MIN_GIVENS;
        }

        reverse = reverse || false;

        var options = sudoku._get_options_map(board);
        var result = sudoku._search(options, reverse);
        
        if(result){
            var solution = "";
            for(var square in result){
                solution += result[square];
            }
            return solution;
        }
        return false;
    };

    sudoku.get_options = function(board){
        var report = sudoku.validate_board(board);
        if(report !== true){
            throw report;
        }
        
        var options_map = sudoku._get_options_map(board);
        
        if(!options_map){
            return false;
        }
        
        var rows = [];
        var cur_row = [];
        var i = 0;
        for(var square in options_map){
            var options = options_map[square];
            cur_row.push(options);
            if(i % 9 == 8){
                rows.push(cur_row);
                cur_row = [];
            }
            ++i;
        }
        return rows;
    }

    sudoku._get_options_map = function(board){
        var report = sudoku.validate_board(board);
        if(report !== true){
            throw report;
        }
        
        var option_map = {};
        var squares_values_map = sudoku._get_square_vals_map(board);
        
        for(var si in SQUARES){
            option_map[SQUARES[si]] = sudoku.DIGITS;
        }
        
        for(var square in squares_values_map){
            var val = squares_values_map[square];
            
            if(sudoku._in(val, sudoku.DIGITS)){
                var new_options = sudoku._assign(option_map, square, val);
                
                if(!new_options){
                    return false;
                }
            }
        }
        
        return option_map;
    };

    sudoku._search = function(options, reverse){
        if(!options){
            return false;
        }
        
        reverse = reverse || false;
        
        var max_nr_options = 0;
        var max_options_square = null;
        for(var si in SQUARES){
            var square = SQUARES[si];
            
            var nr_options = options[square].length;
                
            if(nr_options > max_nr_options){
                max_nr_options = nr_options;
                max_options_square = square;
            }
        }
        if(max_nr_options === 1){
            return options;
        }
        
        var min_nr_options = 10;
        var min_options_square = null;
        for(si in SQUARES){
            var square = SQUARES[si];
            
            var nr_options = options[square].length;
            
            if(nr_options < min_nr_options && nr_options > 1){
                min_nr_options = nr_options;
                min_options_square = square;
            }
        }
        
        var min_options = options[min_options_square];
        if(!reverse){
            for(var vi in min_options){
                var val = min_options[vi];
                
                var options_copy = JSON.parse(JSON.stringify(options));
                var options_next = sudoku._search(
                    sudoku._assign(options_copy, min_options_square, val)
                );
                
                if(options_next){
                    return options_next;
                }
            }
            
        } else {
            for(var vi = min_options.length - 1; vi >= 0; --vi){
                var val = min_options[vi];
                
                // TODO: Implement a non-rediculous deep copy function
                var options_copy = JSON.parse(JSON.stringify(options));
                var options_next = sudoku._search(
                    sudoku._assign(options_copy, min_options_square, val), 
                    reverse
                );
                
                if(options_next){
                    return options_next;
                }
            }
        }
        
        return false;
    };

    sudoku._assign = function(options, square, val){
        var other_vals = options[square].replace(val, "");

        for(var ovi in other_vals){
            var other_val = other_vals[ovi];

            var options_next =
                sudoku._eliminate(options, square, other_val);

            if(!options_next){
                //console.log("Contradiction found by _eliminate.");
                return false;
            }
        }

        return options;
    };

    sudoku._eliminate = function(options, square, val){
        if(!sudoku._in(val, options[square])){
            return options;
        }

        options[square] = options[square].replace(val, '');
           
        var nr_options = options[square].length;
        if(nr_options === 1){
            var target_val = options[square];
            
            for(var pi in SQUARE_PEERS_MAP[square]){
                var peer = SQUARE_PEERS_MAP[square][pi];
                
                var options_new = 
                        sudoku._eliminate(options, peer, target_val);
                        
                if(!options_new){
                    return false;
                }
            }
        
        } if(nr_options === 0){
            return false;
        }
        
        for(var ui in SQUARE_UNITS_MAP[square]){
            var unit = SQUARE_UNITS_MAP[square][ui];
            
            var val_places = [];
            for(var si in unit){
                var unit_square = unit[si];
                if(sudoku._in(val, options[unit_square])){
                    val_places.push(unit_square);
                }
            }
            
            if(val_places.length === 0){
                return false;
                
            } else if(val_places.length === 1){
                var options_new = 
                    sudoku._assign(options, val_places[0], val);
                
                if(!options_new){
                    return false;
                }
            }
        }
        
        return options;
    };

    
    // Square relationships
    // Squares, and their relationships with values, units, and peers.
    
    sudoku._get_square_vals_map = function(board){
        var squares_vals_map = {};
        
        // Make sure `board` is a string of length 81
        if(board.length != SQUARES.length){
            throw "Board/squares length mismatch.";
            
        } else {
            for(var i in SQUARES){
                squares_vals_map[SQUARES[i]] = board[i];
            }
        }
        
        return squares_vals_map;
    };

    sudoku._get_square_units_map = function(squares, units){
        var square_unit_map = {};

        for(var si in squares){
            var cur_square = squares[si];

            var cur_square_units = [];

            for(var ui in units){
                var cur_unit = units[ui];

                if(cur_unit.indexOf(cur_square) !== -1){
                    cur_square_units.push(cur_unit);
                }
            }

            square_unit_map[cur_square] = cur_square_units;
        }

        return square_unit_map;
    };

    sudoku._get_square_peers_map = function(squares, units_map){
        var square_peers_map = {};

        for(var si in squares){
            var cur_square = squares[si];
            var cur_square_units = units_map[cur_square];

            var cur_square_peers = [];

            for(var sui in cur_square_units){
                var cur_unit = cur_square_units[sui];

                for(var ui in cur_unit){
                    var cur_unit_square = cur_unit[ui];

                    if(cur_square_peers.indexOf(cur_unit_square) === -1 && 
                            cur_unit_square !== cur_square){
                        cur_square_peers.push(cur_unit_square);
                    }
                }
            }
            
            square_peers_map[cur_square] = cur_square_peers;
        }

        return square_peers_map;
    };
    
    sudoku._get_all_units = function(rows, cols){
        var units = [];

        for(var ri in rows){
            units.push(sudoku._cross(rows[ri], cols));
        }

        for(var ci in cols){
           units.push(sudoku._cross(rows, cols[ci]));
        }

        var row_squares = ["ABC", "DEF", "GHI"];
        var col_squares = ["123", "456", "789"];
        for(var rsi in row_squares){
            for(var csi in col_squares){
                units.push(sudoku._cross(row_squares[rsi], col_squares[csi]));
            }
        }

        return units;
    };
    

    // Conversions
    sudoku.board_string_to_grid = function(board_string){
        var rows = [];
        var cur_row = [];
        for(var i in board_string){
            cur_row.push(board_string[i]);
            if(i % 9 == 8){
                rows.push(cur_row);
                cur_row = [];
            }
        }
        return rows;
    };
    
    sudoku.board_grid_to_string = function(board_grid){
        var board_string = "";
        for(var r = 0; r < 9; ++r){
            for(var c = 0; c < 9; ++c){
                board_string += board_grid[r][c];
            }   
        }
        return board_string;
    };
    

    // Utility
    sudoku.print_board = function(board){
        var report = sudoku.validate_board(board);
        if(report !== true){
            throw report;
        }
        
        var V_PADDING = " ";  
        var H_PADDING = '\n'; 
        
        var V_BOX_PADDING = "  ";
        var H_BOX_PADDING = '\n';

        var display_string = "";
        
        for(var i in board){
            var square = board[i];
            
            display_string += square + V_PADDING;
            
            if(i % 3 === 2){
                display_string += V_BOX_PADDING;
            }
            
            if(i % 9 === 8){
                display_string += H_PADDING;
            }
            
            if(i % 27 === 26){
                display_string += H_BOX_PADDING;
            }
        }

        console.log(display_string);
    };

    sudoku.validate_board = function(board){
        if(!board){
            return "Empty board";
        }
        
        if(board.length !== NR_SQUARES){
            return "Invalid board size. Board must be exactly " + NR_SQUARES +
                    " squares.";
        }
        
        for(var i in board){
            if(!sudoku._in(board[i], sudoku.DIGITS) && board[i] !== sudoku.BLANK_CHAR){
                return "Invalid board character encountered at index " + i + 
                        ": " + board[i];
            }
        }
        
        return true;
    };

    sudoku._cross = function(a, b){
        var result = [];
        for(var ai in a){
            for(var bi in b){
                result.push(a[ai] + b[bi]);
            }
        }
        return result;
    };
    
    sudoku._in = function(v, seq){
        return seq.indexOf(v) !== -1;
    };
    
    sudoku._first_true = function(seq){
        for(var i in seq){
            if(seq[i]){
                return seq[i];
            }
        }
        return false;
    };

    sudoku._shuffle = function(seq){
        var shuffled = [];
        for(var i = 0; i < seq.length; ++i){
            shuffled.push(false);
        }
        
        for(var i in seq){
            var ti = sudoku._rand_range(seq.length);
            
            while(shuffled[ti]){
                ti = (ti + 1) > (seq.length - 1) ? 0 : (ti + 1);
            }
            
            shuffled[ti] = seq[i];
        }
        
        return shuffled;
    };

    sudoku._rand_range = function(max, min){
        min = min || 0;
        if(max){
            return Math.floor(Math.random() * (max - min)) + min;
        } else {
            throw "Range undefined";
        }
    };

    sudoku._strip_dups = function(seq){
        var seq_set = [];
        var dup_map = {};
        for(var i in seq){
            var e = seq[i];
            if(!dup_map[e]){
                seq_set.push(e);
                dup_map[e] = true;
            }
        }
        return seq_set;
    };
    
    sudoku._force_range = function(nr, max, min){
        min = min || 0
        nr = nr || 0
        if(nr < min){
            return min;
        }
        if(nr > max){
            return max;
        }
        return nr
    }

    initialize();

})(this);