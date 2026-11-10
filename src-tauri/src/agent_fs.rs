use serde_json::{json, Value};
use tauri::{AppHandle, Manager};

use crate::shell_cmd;

const WORKSPACE_ROOT: &str = "/workspace";

#[tauri::command]
pub async fn agent_fs(
    app: AppHandle,
    operation: String,
    params: Value,
    scope: String,
    roots: Vec<String>,
) -> Result<Value, String> {
    if !operation.eq_ignore_ascii_case("execute") {
        return Ok(failure(&format!("未知文件系统操作 [{operation}]")));
    }
    let effective_roots = resolve_roots(&app, &scope, &roots)?;
    let result = execute(&params, &effective_roots).await;
    Ok(match result {
        Ok(data) => success(data),
        Err(message) => failure(&message),
    })
}

fn resolve_roots(app: &AppHandle, scope: &str, roots: &[String]) -> Result<Vec<String>, String> {
    if scope == "store" {
        let home = app.path().home_dir().map_err(|error| error.to_string())?;
        return Ok(vec![home.to_string_lossy().to_string()]);
    }
    if roots.is_empty() {
        return Err("工作空间未配置目录".into());
    }
    Ok(roots.to_vec())
}

fn success(data: Value) -> Value {
    json!({"status": 200, "executeCode": "200", "message": "ok", "data": data, "metadata": {}})
}

fn failure(message: &str) -> Value {
    json!({"status": 500, "executeCode": "500", "message": message, "data": Value::Null, "metadata": {}})
}

fn map_virtual_root(command: &str, root: &str) -> String {
    let host = root.replace('\\', "/").trim_end_matches('/').to_string();
    let mut mapped = String::new();
    let mut cursor = 0;
    while let Some(offset) = command[cursor..].find(WORKSPACE_ROOT) {
        let at = cursor + offset;
        mapped.push_str(&command[cursor..at]);
        let next = at + WORKSPACE_ROOT.len();
        let boundary = next >= command.len()
            || matches!(command.as_bytes()[next], b'/' | b'\'' | b'"');
        if boundary {
            mapped.push_str(&host);
        } else {
            mapped.push_str(WORKSPACE_ROOT);
        }
        cursor = next;
    }
    mapped.push_str(&command[cursor..]);
    mapped
}

async fn execute(params: &Value, roots: &[String]) -> Result<Value, String> {
    let command = params
        .get("command")
        .and_then(Value::as_str)
        .ok_or("缺少 command")?
        .to_string();
    let timeout_seconds = params.get("timeoutSeconds").and_then(Value::as_i64).unwrap_or(60).max(1);
    let root = roots.first().ok_or("工作空间未配置目录")?;
    let command = map_virtual_root(&command, root);
    let stdin = params.get("stdin").and_then(Value::as_str).map(str::to_string);
    let result = shell_cmd::run_restricted_shell(
        command,
        Some(root.to_string()),
        timeout_seconds as u64 * 1000,
        stdin,
        Some(true),
    )
    .await?;

    Ok(json!({
        "stdout": result.stdout,
        "stderr": result.stderr,
        "exitCode": result.exit_code,
        "truncated": false
    }))
}
