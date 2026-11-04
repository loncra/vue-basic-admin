#[tauri::command]
pub fn system_shell() -> String {
    match std::env::consts::OS {
        "windows" => "powershell".to_string(),
        _ => "bash".to_string(),
    }
}
