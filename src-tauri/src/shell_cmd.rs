use std::process::Stdio;

use serde::Serialize;
use tokio::process::Command;
use tokio::time::{timeout, Duration};

use crate::shell_policy::{
    is_command_blocked, resolve_cwd, truncate_output, MAX_OUTPUT_CHARS,
};

pub const MAX_TIMEOUT_MS: u64 = 120_000;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShellExecDto {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

#[tauri::command]
pub async fn run_restricted_shell(
    command: String,
    cwd: Option<String>,
    timeout_ms: u64,
) -> Result<ShellExecDto, String> {
    let timeout_ms = timeout_ms.clamp(1, MAX_TIMEOUT_MS);

    if command.trim().is_empty() {
        return Err("empty command".into());
    }

    if is_command_blocked(&command) {
        return Err("POLICY_DENIED".into());
    }

    let cwd = resolve_cwd(cwd.as_deref())?;

    let mut child = Command::new("powershell");
    child
        .args(["-NoProfile", "-NonInteractive", "-Command", &command])
        .current_dir(&cwd)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let duration = Duration::from_millis(timeout_ms);
    let child = child
        .spawn()
        .map_err(|error| format!("failed to spawn powershell: {error}"))?;

    let pid = child.id();

    match timeout(duration, child.wait_with_output()).await {
        Ok(Ok(output)) => Ok(ShellExecDto {
            exit_code: output.status.code().unwrap_or(-1),
            stdout: truncate_output(
                String::from_utf8_lossy(&output.stdout).into_owned(),
                MAX_OUTPUT_CHARS,
            ),
            stderr: truncate_output(
                String::from_utf8_lossy(&output.stderr).into_owned(),
                MAX_OUTPUT_CHARS,
            ),
        }),
        Ok(Err(error)) => Err(format!("command execution failed: {error}")),
        Err(_) => {
            if let Some(pid) = pid {
                kill_process_tree(pid).await;
            }
            Err(format!("execution timed out after {timeout_ms}ms"))
        }
    }
}

#[cfg(windows)]
async fn kill_process_tree(pid: u32) {
    let _ = Command::new("taskkill")
        .args(["/F", "/T", "/PID", &pid.to_string()])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await;
}

#[cfg(not(windows))]
async fn kill_process_tree(pid: u32) {
    let _ = Command::new("kill")
        .args(["-9", &pid.to_string()])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .await;
}
