use std::process::Stdio;

use serde::Serialize;
use tokio::process::Command;
use tokio::time::{timeout, Duration};

use crate::shell_policy::{
    is_command_blocked, resolve_cwd_trusted, truncate_output, MAX_OUTPUT_CHARS,
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
    stdin: Option<String>,
    trusted_cwd: Option<bool>,
) -> Result<ShellExecDto, String> {
    let timeout_ms = timeout_ms.clamp(1, MAX_TIMEOUT_MS);

    if command.trim().is_empty() {
        return Err("empty command".into());
    }

    if is_command_blocked(&command) {
        return Err("POLICY_DENIED".into());
    }

    let cwd = resolve_cwd_trusted(cwd.as_deref(), trusted_cwd.unwrap_or(false))?;

    let mut child = Command::new(shell_program());
    child.args(shell_args(&command));
    child
        .current_dir(&cwd)
        .stdin(if stdin.is_some() {
            Stdio::piped()
        } else {
            Stdio::null()
        })
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    let duration = Duration::from_millis(timeout_ms);
    let mut child = child
        .spawn()
        .map_err(|error| format!("failed to spawn {}: {error}", shell_program()))?;

    if let Some(input) = stdin {
        use tokio::io::AsyncWriteExt;
        let mut pipe = child.stdin.take().ok_or("stdin pipe missing")?;
        pipe.write_all(input.as_bytes())
            .await
            .map_err(|error| format!("failed to write stdin: {error}"))?;
    }

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

fn shell_program() -> &'static str {
    if cfg!(windows) {
        "powershell"
    } else {
        "bash"
    }
}

fn shell_args(command: &str) -> Vec<String> {
    if cfg!(windows) {
        vec![
            "-NoProfile".to_string(),
            "-NonInteractive".to_string(),
            "-Command".to_string(),
            command.to_string(),
        ]
    } else {
        vec!["-lc".to_string(), command.to_string()]
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
