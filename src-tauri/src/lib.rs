mod agent_fs;
mod shell_cmd;
mod shell_policy;
mod system_shell;
mod workspace_store;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      shell_cmd::run_restricted_shell,
      agent_fs::agent_fs,
      system_shell::system_shell,
      workspace_store::list_workspaces,
      workspace_store::add_workspace,
      workspace_store::remove_workspace,
      workspace_store::device_fingerprint
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
