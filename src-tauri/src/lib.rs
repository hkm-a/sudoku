mod sudoku;
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::generate_puzzle,
            commands::get_hint,
            commands::solve_board,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}