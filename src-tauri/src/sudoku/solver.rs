use crate::sudoku::board::Grid;
use crate::sudoku::validator::is_valid_move;

/// Get all valid candidates for a cell.
pub fn get_candidates(board: &Grid, row: usize, col: usize) -> Vec<u8> {
    if board[row][col].is_some() {
        return Vec::new();
    }
    let mut candidates = Vec::with_capacity(9);
    for num in 1..=9 {
        if is_valid_move(board, row, col, num) {
            candidates.push(num);
        }
    }
    candidates
}

/// Find the empty cell with the fewest candidates (MRV heuristic).
fn find_best_cell(board: &Grid) -> Option<(usize, usize, Vec<u8>)> {
    let mut best: Option<(usize, usize, Vec<u8>)> = None;
    for row in 0..9 {
        for col in 0..9 {
            if board[row][col].is_none() {
                let candidates = get_candidates(board, row, col);
                if candidates.is_empty() {
                    // Dead end - early termination
                    return Some((row, col, candidates));
                }
                match &best {
                    None => best = Some((row, col, candidates)),
                    Some((_, _, best_cands)) if candidates.len() < best_cands.len() => {
                        best = Some((row, col, candidates));
                    }
                    _ => {}
                }
            }
        }
    }
    best
}

/// Solve the board using backtracking with MRV heuristic.
pub fn solve(board: &Grid) -> Option<Grid> {
    let mut cloned = *board;
    if solve_internal(&mut cloned) {
        Some(cloned)
    } else {
        None
    }
}

fn solve_internal(board: &mut Grid) -> bool {
    let cell = match find_best_cell(board) {
        Some((_, _, cands)) if cands.is_empty() => return false,
        Some(cell) => cell,
        None => return true, // All cells filled
    };

    let (row, col, candidates) = cell;
    for num in candidates {
        board[row][col] = Some(num);
        if solve_internal(board) {
            return true;
        }
        board[row][col] = None;
    }
    false
}

/// Count solutions up to a limit (used to check unique solvability).
pub fn count_solutions(board: &Grid, limit: u32) -> u32 {
    let mut count = 0u32;
    let mut cloned = *board;
    count_solutions_internal(&mut cloned, &mut count, limit);
    count
}

fn count_solutions_internal(board: &mut Grid, count: &mut u32, limit: u32) {
    if *count >= limit {
        return;
    }

    let (row, col) = match find_empty(board) {
        Some(pos) => pos,
        None => {
            *count += 1;
            return;
        }
    };

    for num in 1..=9 {
        if is_valid_move(board, row, col, num) {
            board[row][col] = Some(num);
            count_solutions_internal(board, count, limit);
            board[row][col] = None;
            if *count >= limit {
                return;
            }
        }
    }
}

fn find_empty(board: &Grid) -> Option<(usize, usize)> {
    for row in 0..9 {
        for col in 0..9 {
            if board[row][col].is_none() {
                return Some((row, col));
            }
        }
    }
    None
}