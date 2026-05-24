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
            if let Some(value) = board.cells[row][col] {
                if value as i32 != solution[row][col] {
                    return Ok(HintResponse {
                        row,
                        col,
                        num: solution[row][col],
                    });
                }
            }
        }
    }

    for row in 0..9 {
        for col in 0..9 {
            if board.cells[row][col].is_none() {
                return Ok(HintResponse {
                    row,
                    col,
                    num: solution[row][col],
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

#[cfg(test)]
mod tests {
    use super::*;

    fn solved_grid() -> Vec<Vec<i32>> {
        vec![
            vec![5, 3, 4, 6, 7, 8, 9, 1, 2],
            vec![6, 7, 2, 1, 9, 5, 3, 4, 8],
            vec![1, 9, 8, 3, 4, 2, 5, 6, 7],
            vec![8, 5, 9, 7, 6, 1, 4, 2, 3],
            vec![4, 2, 6, 8, 5, 3, 7, 9, 1],
            vec![7, 1, 3, 9, 2, 4, 8, 5, 6],
            vec![9, 6, 1, 5, 3, 7, 2, 8, 4],
            vec![2, 8, 7, 4, 1, 9, 6, 3, 5],
            vec![3, 4, 5, 2, 8, 6, 1, 7, 9],
        ]
    }

    #[test]
    fn get_hint_returns_wrong_filled_cell_before_empty_cell() {
        let solution = solved_grid();
        let mut board: Vec<Vec<Option<i32>>> = solution
            .iter()
            .map(|row| row.iter().map(|&value| Some(value)).collect())
            .collect();
        board[0][2] = Some(9);
        board[0][3] = None;

        let hint = get_hint(board, solution).unwrap();

        assert_eq!(hint.row, 0);
        assert_eq!(hint.col, 2);
        assert_eq!(hint.num, 4);
    }
}