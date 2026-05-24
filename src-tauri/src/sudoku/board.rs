pub type Grid = [[Option<u8>; 9]; 9];
pub type SolutionGrid = [[u8; 9]; 9];

pub struct Board {
    pub cells: Grid,
}

impl Board {
    pub fn new(cells: Grid) -> Self {
        Board { cells }
    }

    pub fn empty() -> Self {
        Board { cells: [[None; 9]; 9] }
    }

    pub fn get(&self, row: usize, col: usize) -> Option<u8> {
        if row < 9 && col < 9 {
            self.cells[row][col]
        } else {
            None
        }
    }

    pub fn set(&mut self, row: usize, col: usize, val: Option<u8>) {
        if row < 9 && col < 9 {
            self.cells[row][col] = val;
        }
    }

    pub fn is_complete(&self) -> bool {
        self.cells.iter().all(|row| row.iter().all(|c| c.is_some()))
    }

    pub fn to_vec(&self) -> Vec<Vec<Option<i32>>> {
        self.cells
            .iter()
            .map(|row| row.iter().map(|c| c.map(|v| v as i32)).collect())
            .collect()
    }

    pub fn from_vec(grid: Vec<Vec<Option<i32>>>) -> Self {
        let mut cells = [[None; 9]; 9];
        for (i, row) in grid.iter().enumerate().take(9) {
            for (j, val) in row.iter().enumerate().take(9) {
                cells[i][j] = val.map(|v| v as u8);
            }
        }
        Board { cells }
    }
}