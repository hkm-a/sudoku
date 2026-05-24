use crate::sudoku::board::{Grid, SolutionGrid};
use crate::sudoku::solver::{count_solutions, solve};
use rand::seq::SliceRandom;
use rand::thread_rng;

/// Generate a complete solved board by filling diagonal boxes then solving.
pub fn generate_complete() -> SolutionGrid {
    let mut grid = [[0u8; 9]; 9];
    let mut rng = thread_rng();

    // Fill the three diagonal 3x3 boxes with random permutations of 1-9
    for box_idx in 0..3 {
        let mut nums: Vec<u8> = (1..=9).collect();
        nums.shuffle(&mut rng);
        let start_row = box_idx * 3;
        let start_col = box_idx * 3;
        for i in 0..3 {
            for j in 0..3 {
                grid[start_row + i][start_col + j] = nums[i * 3 + j];
            }
        }
    }

    // Convert to Option grid for solver
    let mut opt_grid: Grid = [[None; 9]; 9];
    for i in 0..9 {
        for j in 0..9 {
            opt_grid[i][j] = Some(grid[i][j]);
        }
    }

    // Solve the rest
    let solved = solve(&opt_grid).expect("Failed to generate complete board");
    
    // Convert back to SolutionGrid
    let mut result = [[0u8; 9]; 9];
    for i in 0..9 {
        for j in 0..9 {
            result[i][j] = solved[i][j].unwrap();
        }
    }
    result
}

/// Get number of empty cells for a given difficulty level.
fn empty_count_for_difficulty(difficulty: &str) -> usize {
    let range = match difficulty {
        "easy" => 30..=35,
        "medium" => 36..=45,
        "hard" => 46..=52,
        "expert" => 53..=58,
        _ => 36..=45,
    };
    use rand::Rng;
    let mut rng = rand::thread_rng();
    rng.gen_range(range)
}

/// Generate a puzzle with a unique solution at the given difficulty.
pub fn generate_puzzle(difficulty: &str) -> (Grid, SolutionGrid) {
    let solution = generate_complete();
    let target_empty = empty_count_for_difficulty(difficulty);

    // Convert solution to Option grid
    let mut puzzle: Grid = [[None; 9]; 9];
    for i in 0..9 {
        for j in 0..9 {
            puzzle[i][j] = Some(solution[i][j]);
        }
    }

    // Create shuffled list of all positions
    let mut rng = thread_rng();
    let mut positions: Vec<(usize, usize)> = (0..9)
        .flat_map(|i| (0..9).map(move |j| (i, j)))
        .collect();
    positions.shuffle(&mut rng);

    let mut removed = 0usize;
    for (row, col) in positions {
        if removed >= target_empty {
            break;
        }

        let backup = puzzle[row][col];
        puzzle[row][col] = None;

        // Check if the puzzle still has exactly one solution
        if count_solutions(&puzzle, 2) == 1 {
            removed += 1;
        } else {
            puzzle[row][col] = backup; // Restore
        }
    }

    (puzzle, solution)
}