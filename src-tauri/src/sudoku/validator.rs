use crate::sudoku::board::Grid;

/// Check if placing `num` at position (`row`, `col`) is valid.
pub fn is_valid_move(board: &Grid, row: usize, col: usize, num: u8) -> bool {
    // Check row
    for c in 0..9 {
        if c != col && board[row][c] == Some(num) {
            return false;
        }
    }

    // Check column
    for r in 0..9 {
        if r != row && board[r][col] == Some(num) {
            return false;
        }
    }

    // Check 3x3 box
    let box_row = (row / 3) * 3;
    let box_col = (col / 3) * 3;
    for r in box_row..box_row + 3 {
        for c in box_col..box_col + 3 {
            if (r != row || c != col) && board[r][c] == Some(num) {
                return false;
            }
        }
    }

    true
}

/// Return all cells that have conflicts (duplicate numbers in row/col/box).
pub fn find_conflicts(board: &Grid) -> Vec<(usize, usize)> {
    let mut conflicts = Vec::new();
    for row in 0..9 {
        for col in 0..9 {
            if board[row][col].is_some() && !is_valid_move(board, row, col, board[row][col].unwrap()) {
                conflicts.push((row, col));
            }
        }
    }
    conflicts
}

/// Check if a specific cell has a conflict.
pub fn has_conflict(board: &Grid, row: usize, col: usize) -> bool {
    if let Some(num) = board[row][col] {
        !is_valid_move(board, row, col, num)
    } else {
        false
    }
}