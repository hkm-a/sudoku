use serde::Serialize;
use crate::sudoku::board::Board;
use crate::sudoku::generator;
use crate::sudoku::solver;

#[derive(Serialize)]
pub struct PuzzleResponse {
    puzzle: Vec<Vec<Option<i32>>>,
    solution: Vec<Vec<i32>>,
}

#[derive(Serialize)]
pub struct HintResponse {
    row: usize,
    col: usize,
    num: i32,
}

#[tauri::command]
pub fn generate_puzzle(difficulty: String) -> Result<PuzzleResponse, String> {
    let (puzzle_grid, solution_grid) = generator::generate_puzzle(&difficulty);

    // Convert puzzle to Vec<Vec<Option<i32>>>
    let puzzle: Vec<Vec<Option<i32>>> = puzzle_grid
        .iter()
        .map(|row| row.iter().map(|c| c.map(|v| v as i32)).collect())
        .collect();

    // Convert solution to Vec<Vec<i32>>
    let solution: Vec<Vec<i32>> = solution_grid
        .iter()
        .map(|row| row.iter().map(|&v| v as i32).collect())
        .collect();

    Ok(PuzzleResponse { puzzle, solution })
}

#[tauri::command]
pub fn get_hint(board: Vec<Vec<Option<i32>>>, solution: Vec<Vec<i32>>) -> Result<HintResponse, String> {
    let board = Board::from_vec(board);

    for row in 0..9 {
        for col in 0..9 {
            if board.cells[row][col].is_none() {
                let hint_num = solution[row][col];
                return Ok(HintResponse {
                    row,
                    col,
                    num: hint_num as i32,
                });
            }
        }
    }

    Err("Board is already complete".to_string())
}

#[tauri::command]
pub fn solve_board(board: Vec<Vec<Option<i32>>>) -> Result<Vec<Vec<i32>>, String> {
    let board = Board::from_vec(board);
    let grid = board.cells;

    match solver::solve(&grid) {
        Some(solved) => {
            let result: Vec<Vec<i32>> = solved
                .iter()
                .map(|row| row.iter().map(|&c| c.map(|v| v as i32).unwrap_or(0)).collect())
                .collect();
            Ok(result)
        }
        None => Err("No solution found".to_string()),
    }
}