use std::env;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Component, Path, PathBuf};
use std::process::Stdio;
use std::time::UNIX_EPOCH;

use serde::Serialize;
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};
use tokio::process::Command;
use tokio::time::{timeout, Duration};

const WORKSPACE_ROOT: &str = "/workspace";
const MAX_FILE_BYTES: u64 = 10 * 1024 * 1024;
const MAX_WALK: usize = 5_000;
const MAX_OUTPUT_CHARS: usize = 64 * 1024;
const MAX_TIMEOUT_MS: u64 = 120_000;
const POLICY_DENIED: &str = "POLICY_DENIED";
const BLOCKLIST: &[&str] = &[
    "format ",
    "rmdir /s",
    "del /f /s",
    "Remove-Item -Recurse",
    "Shutdown",
    "reg delete",
];

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FileEntry {
    path: String,
    is_directory: bool,
    size: u64,
    modified_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShellExecDto {
    pub exit_code: i32,
    pub stdout: String,
    pub stderr: String,
}

enum ShellMode {
    #[cfg(windows)]
    Powershell,
    #[cfg(windows)]
    Cmd,
    #[cfg(not(windows))]
    Bash,
    #[cfg(not(windows))]
    Sh,
}

struct ShellLaunch {
    name: &'static str,
    program: String,
    mode: ShellMode,
}

struct DispatchBody {
    execute_code: String,
    data: Value,
}

#[tauri::command]
pub async fn agent_fs(
    app: AppHandle,
    operation: String,
    params: Value,
    scope: String,
    roots: Vec<String>,
) -> Result<Value, String> {
    let effective_roots = resolve_roots(&app, &scope, &roots)?;
    let result = dispatch(&operation, &params, &effective_roots).await;
    Ok(match result {
        Ok(body) => success(&body.execute_code, body.data),
        Err(message) => failure(&message),
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    pub execute_shell: String,
    pub client_home: String,
}

#[tauri::command]
pub fn system_info(app: AppHandle) -> Result<SystemInfo, String> {
    let home = app
        .path()
        .home_dir()
        .map_err(|error| error.to_string())?;
    Ok(SystemInfo {
        execute_shell: resolve_shell().name.to_string(),
        client_home: home.to_string_lossy().to_string(),
    })
}

#[tauri::command]
pub async fn run_restricted_shell(
    command: String,
    cwd: Option<String>,
    timeout_ms: u64,
    stdin: Option<String>,
    trusted_cwd: Option<bool>,
) -> Result<ShellExecDto, String> {
    run_shell(command, cwd, timeout_ms, stdin, trusted_cwd.unwrap_or(false)).await
}

async fn dispatch(operation: &str, params: &Value, roots: &[String]) -> Result<DispatchBody, String> {
    let root = roots.first().ok_or("工作空间未配置目录")?;
    match operation.to_ascii_lowercase().as_str() {
        "ls" => ls(params, root),
        "read" => read(params, root),
        "write" => write(params, root),
        "edit" => edit(params, root),
        "grep" => grep(params, root),
        "glob" => glob_files(params, root),
        "upload" => upload(params, root),
        "download" => download(params, root),
        "delete" => delete(params, root),
        "move" => move_path(params, root),
        "exists" => exists(params, root),
        "execute" => execute(params, root).await,
        other => Err(format!("未知文件系统操作 [{other}]")),
    }
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

fn success(execute_code: &str, data: Value) -> Value {
    json!({"status": 200, "executeCode": execute_code, "message": "ok", "data": data, "metadata": {}})
}

fn failure(message: &str) -> Value {
    json!({"status": 500, "executeCode": "500", "message": message, "data": Value::Null, "metadata": {}})
}

fn ok(data: Value) -> Result<DispatchBody, String> {
    Ok(DispatchBody { execute_code: "200".to_string(), data })
}

fn text(params: &Value, key: &str) -> Result<String, String> {
    params.get(key).and_then(Value::as_str).map(str::to_string).ok_or_else(|| format!("缺少 {key}"))
}

fn optional_text(params: &Value, key: &str) -> Option<String> {
    params.get(key).and_then(Value::as_str).filter(|value| !value.is_empty()).map(str::to_string)
}

fn ls(params: &Value, root: &str) -> Result<DispatchBody, String> {
    let raw = optional_text(params, "path").unwrap_or_else(|| WORKSPACE_ROOT.to_string());
    let path = resolve_path(&raw, root)?;
    if !path.is_dir() {
        return ok(json!({"entries": []}));
    }
    let mut entries = Vec::new();
    for entry in fs::read_dir(&path).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        entries.push(file_entry(&entry.path(), &display_path(&entry.path(), root)));
    }
    ok(json!({"entries": entries}))
}

fn read(params: &Value, root: &str) -> Result<DispatchBody, String> {
    let path = resolve_path(&text(params, "path")?, root)?;
    if !path.is_file() {
        return Err("不是普通文件".into());
    }
    let meta = fs::metadata(&path).map_err(|error| error.to_string())?;
    if meta.len() > MAX_FILE_BYTES {
        return Err("文件过大".into());
    }
    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let offset = params.get("offset").and_then(Value::as_i64).unwrap_or(0).max(0) as usize;
    let limit = params.get("limit").and_then(Value::as_i64).unwrap_or(0);
    let lines: Vec<&str> = content.split_inclusive('\n').collect();
    let end = if limit <= 0 { lines.len() } else { (offset + limit as usize).min(lines.len()) };
    let slice = if offset >= lines.len() { "" } else { &lines[offset..end].concat() };
    ok(json!({"content": slice, "encoding": "utf-8"}))
}

fn write(params: &Value, root: &str) -> Result<DispatchBody, String> {
    let raw = text(params, "path")?;
    let path = resolve_path(&raw, root)?;
    let overwrite = params.get("overwrite").and_then(Value::as_bool).unwrap_or(false);
    if path.exists() && !overwrite {
        return Err("文件已存在".into());
    }
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::write(&path, optional_text(params, "content").unwrap_or_default()).map_err(|error| error.to_string())?;
    ok(json!({"path": display_path(&path, root)}))
}

fn edit(params: &Value, root: &str) -> Result<DispatchBody, String> {
    let raw = text(params, "path")?;
    let path = resolve_path(&raw, root)?;
    if !path.is_file() {
        return Err("不是普通文件".into());
    }
    let old = text(params, "oldString")?;
    let new = text(params, "newString")?;
    if old == new {
        return Err("替换内容没有变化".into());
    }
    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    let count = content.matches(&old).count();
    if count == 0 {
        return Err("找不到要替换的内容".into());
    }
    let replace_all = params.get("replaceAll").and_then(Value::as_bool).unwrap_or(false);
    if !replace_all && count != 1 {
        return Err("要替换的内容不唯一".into());
    }
    let updated = if replace_all { content.replace(&old, &new) } else { content.replacen(&old, &new, 1) };
    fs::write(&path, updated).map_err(|error| error.to_string())?;
    ok(json!({"path": display_path(&path, root), "occurrences": count}))
}

fn grep(params: &Value, root: &str) -> Result<DispatchBody, String> {
    let pattern = text(params, "pattern")?;
    let raw = optional_text(params, "path").unwrap_or_else(|| WORKSPACE_ROOT.to_string());
    let base = resolve_path(&raw, root)?;
    let glob = optional_text(params, "glob");
    if !base.exists() {
        return ok(json!({"matches": []}));
    }
    let mut matches = Vec::new();
    let mut walked = 0usize;
    visit(&base, &mut walked, &mut |path| {
        if !path.is_file() {
            return;
        }
        let relative = display_path(path, root);
        if let Some(filter) = &glob {
            let name = path.file_name().and_then(|item| item.to_str()).unwrap_or("");
            if !matches_glob(filter, name) && !matches_glob(filter, &relative) {
                return;
            }
        }
        let Ok(file) = fs::File::open(path) else { return };
        for (index, line) in BufReader::new(file).lines().enumerate() {
            let Ok(line) = line else { return };
            if line.contains(&pattern) {
                matches.push(json!({"path": relative, "line": index + 1, "text": line}));
                if matches.len() >= 200 {
                    return;
                }
            }
        }
    })?;
    ok(json!({"matches": matches}))
}

fn glob_files(params: &Value, root: &str) -> Result<DispatchBody, String> {
    let pattern = text(params, "pattern")?;
    let raw = optional_text(params, "path").unwrap_or_else(|| WORKSPACE_ROOT.to_string());
    let base = resolve_path(&raw, root)?;
    if !base.is_dir() {
        return ok(json!({"matches": []}));
    }
    let mut matches = Vec::new();
    let mut walked = 0usize;
    visit(&base, &mut walked, &mut |path| {
        let relative = path.strip_prefix(&base).map(|item| item.to_string_lossy().replace('\\', "/")).unwrap_or_default();
        if matches_glob(&pattern, &relative) {
            matches.push(file_entry(path, &display_path(path, root)));
        }
    })?;
    ok(json!({"matches": matches}))
}

fn upload(params: &Value, root: &str) -> Result<DispatchBody, String> {
    let files = params.get("files").and_then(Value::as_array).cloned().unwrap_or_default();
    let mut results = Vec::new();
    for file in files {
        let path = file.get("path").and_then(Value::as_str).unwrap_or("");
        let content = file.get("contentBase64").and_then(Value::as_str).unwrap_or("");
        let target = match resolve_path(path, root) {
            Ok(target) => target,
            Err(error) => {
                results.push(json!({"path": path, "error": error}));
                continue;
            }
        };
        if let Some(parent) = target.parent() {
            if let Err(error) = fs::create_dir_all(parent) {
                results.push(json!({"path": path, "error": error.to_string()}));
                continue;
            }
        }
        match base64_decode(content).and_then(|bytes| fs::write(&target, bytes).map_err(|error| error.to_string())) {
            Ok(()) => results.push(json!({"path": path})),
            Err(error) => results.push(json!({"path": path, "error": error})),
        }
    }
    ok(json!(results))
}

fn download(params: &Value, root: &str) -> Result<DispatchBody, String> {
    let paths = params.get("paths").and_then(Value::as_array).cloned().unwrap_or_default();
    let mut results = Vec::new();
    for item in paths {
        let raw = item.as_str().unwrap_or("");
        let path = match resolve_path(raw, root) {
            Ok(path) => path,
            Err(error) => {
                results.push(json!({"path": raw, "error": error}));
                continue;
            }
        };
        if !path.is_file() {
            results.push(json!({"path": raw, "error": "不是普通文件"}));
            continue;
        }
        match fs::read(&path) {
            Ok(bytes) => results.push(json!({"path": raw, "contentBase64": base64_encode(&bytes)})),
            Err(error) => results.push(json!({"path": raw, "error": error.to_string()})),
        }
    }
    ok(json!(results))
}

fn delete(params: &Value, root: &str) -> Result<DispatchBody, String> {
    let raw = text(params, "path")?;
    let path = resolve_path(&raw, root)?;
    if !path.exists() {
        return ok(json!({"path": raw}));
    }
    if path.is_dir() {
        fs::remove_dir_all(&path).map_err(|error| error.to_string())?;
    } else {
        fs::remove_file(&path).map_err(|error| error.to_string())?;
    }
    ok(json!({"path": raw}))
}

fn move_path(params: &Value, root: &str) -> Result<DispatchBody, String> {
    let from = resolve_path(&text(params, "fromPath")?, root)?;
    let to_raw = text(params, "toPath")?;
    let to = resolve_path(&to_raw, root)?;
    if !from.exists() {
        return Err("源路径不存在".into());
    }
    if let Some(parent) = to.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::rename(&from, &to).map_err(|error| error.to_string())?;
    ok(json!({"path": display_path(&to, root)}))
}

fn exists(params: &Value, root: &str) -> Result<DispatchBody, String> {
    let path = resolve_path(&text(params, "path")?, root)?;
    ok(json!({"exists": path.exists()}))
}

async fn execute(params: &Value, root: &str) -> Result<DispatchBody, String> {
    let command = map_virtual_root(&text(params, "command")?, root);
    command_under_root(&command, root)?;
    let timeout_seconds = params.get("timeoutSeconds").and_then(Value::as_i64).unwrap_or(60).max(1);
    let stdin = optional_text(params, "stdin");
    let result = run_shell(command, Some(root.to_string()), timeout_seconds as u64 * 1000, stdin, true).await?;
    Ok(DispatchBody {
        execute_code: result.exit_code.to_string(),
        data: json!({
            "stdout": result.stdout,
            "stderr": result.stderr,
            "truncated": false
        }),
    })
}

fn resolve_path(raw: &str, root: &str) -> Result<PathBuf, String> {
    if raw.split(['/', '\\']).any(|segment| segment == "..") {
        return Err("不允许路径穿越".into());
    }
    let mapped = map_virtual_root(raw, root);
    let path = PathBuf::from(&mapped);
    let path = if path.is_absolute() { path } else { PathBuf::from(root).join(path) };
    under_root(&path, root)?;
    Ok(path)
}

fn under_root(path: &Path, root: &str) -> Result<(), String> {
    let root_path = PathBuf::from(root);
    let root_base = canonicalize_existing(&root_path).unwrap_or(root_path);
    let mut cursor = path.to_path_buf();
    let target = loop {
        if cursor.exists() {
            break canonicalize_existing(&cursor).unwrap_or(cursor);
        }
        match cursor.parent() {
            Some(parent) if parent != cursor => cursor = parent.to_path_buf(),
            _ => break path.to_path_buf(),
        }
    };
    if target.starts_with(&root_base) {
        Ok(())
    } else {
        Err("路径超出工作区".into())
    }
}

fn canonicalize_existing(path: &Path) -> Option<PathBuf> {
    path.canonicalize().ok()
}

fn command_under_root(command: &str, root: &str) -> Result<(), String> {
    let bytes = command.as_bytes();
    let mut index = 0;
    while index + 2 < bytes.len() {
        let absolute = bytes[index].is_ascii_alphabetic()
            && bytes[index + 1] == b':'
            && (bytes[index + 2] == b'\\' || bytes[index + 2] == b'/');
        if !absolute {
            index += 1;
            continue;
        }
        let start = index;
        index += 3;
        while index < bytes.len() && !matches!(bytes[index], b'"' | b'\'' | b' ' | b';' | b'|' | b'&' | b'\n' | b'\r' | b')') {
            index += 1;
        }
        under_root(Path::new(&command[start..index]), root)?;
    }
    Ok(())
}

fn map_virtual_root(command: &str, root: &str) -> String {
    let host = root.replace('\\', "/").trim_end_matches('/').to_string();
    let mut mapped = String::new();
    let mut cursor = 0;
    while let Some(offset) = command[cursor..].find(WORKSPACE_ROOT) {
        let at = cursor + offset;
        mapped.push_str(&command[cursor..at]);
        let next = at + WORKSPACE_ROOT.len();
        let boundary = next >= command.len() || matches!(command.as_bytes()[next], b'/' | b'\'' | b'"');
        if boundary { mapped.push_str(&host); } else { mapped.push_str(WORKSPACE_ROOT); }
        cursor = next;
    }
    mapped.push_str(&command[cursor..]);
    mapped
}

fn file_entry(path: &Path, display: &str) -> FileEntry {
    let meta = fs::metadata(path).ok();
    FileEntry {
        path: display.replace('\\', "/"),
        is_directory: meta.as_ref().map(|item| item.is_dir()).unwrap_or(false),
        size: meta.as_ref().map(|item| item.len()).unwrap_or(0),
        modified_at: meta.and_then(|item| item.modified().ok()).and_then(|time| time.duration_since(UNIX_EPOCH).ok()).map(|duration| duration.as_secs().to_string()).unwrap_or_default(),
    }
}

fn display_path(path: &Path, root: &str) -> String {
    path.strip_prefix(PathBuf::from(root))
        .map(|relative| format!("{WORKSPACE_ROOT}/{}", relative.to_string_lossy().replace('\\', "/")))
        .unwrap_or_else(|_| path.to_string_lossy().replace('\\', "/"))
}

fn visit(path: &Path, walked: &mut usize, visitor: &mut dyn FnMut(&Path)) -> Result<(), String> {
    if *walked >= MAX_WALK {
        return Ok(());
    }
    *walked += 1;
    if path.is_file() {
        visitor(path);
        return Ok(());
    }
    if !path.is_dir() {
        return Ok(());
    }
    for entry in fs::read_dir(path).map_err(|error| error.to_string())? {
        visit(&entry.map_err(|error| error.to_string())?.path(), walked, visitor)?;
    }
    Ok(())
}

fn matches_glob(pattern: &str, text: &str) -> bool {
    let pattern = pattern.trim_start_matches('/');
    let text = text.trim_start_matches('/');
    if let Some(rest) = pattern.strip_prefix("**/") {
        return text.split('/').any(|segment| matches_glob(rest, segment)) || match_star(rest, text);
    }
    match_star(pattern, text) || text.rsplit('/').next().is_some_and(|name| match_star(pattern, name))
}

fn match_star(pattern: &str, text: &str) -> bool {
    let parts: Vec<&str> = pattern.split('*').collect();
    if parts.len() == 1 {
        return pattern == text;
    }
    if !text.starts_with(parts[0]) {
        return false;
    }
    let mut cursor = parts[0].len();
    for (index, part) in parts.iter().enumerate().skip(1) {
        if index == parts.len() - 1 {
            return text[cursor..].ends_with(part);
        }
        if part.is_empty() {
            continue;
        }
        let Some(found) = text[cursor..].find(part) else { return false };
        cursor += found + part.len();
    }
    true
}

async fn run_shell(command: String, cwd: Option<String>, timeout_ms: u64, stdin: Option<String>, trusted: bool) -> Result<ShellExecDto, String> {
    let timeout_ms = timeout_ms.clamp(1, MAX_TIMEOUT_MS);
    if command.trim().is_empty() {
        return Err("empty command".into());
    }
    if is_command_blocked(&command) {
        return Err(POLICY_DENIED.to_string());
    }
    let cwd = resolve_cwd_trusted(cwd.as_deref(), trusted)?;
    let shell = resolve_shell();
    let mut child = Command::new(&shell.program);
    child.args(shell_args(&shell.mode, &command));
    child.current_dir(&cwd).stdin(if stdin.is_some() { Stdio::piped() } else { Stdio::null() }).stdout(Stdio::piped()).stderr(Stdio::piped());
    let mut child = child.spawn().map_err(|error| format!("failed to spawn {}: {error}", shell.program))?;
    if let Some(input) = stdin {
        use tokio::io::AsyncWriteExt;
        let mut pipe = child.stdin.take().ok_or("stdin pipe missing")?;
        pipe.write_all(input.as_bytes()).await.map_err(|error| format!("failed to write stdin: {error}"))?;
    }
    let pid = child.id();
    match timeout(Duration::from_millis(timeout_ms), child.wait_with_output()).await {
        Ok(Ok(output)) => Ok(ShellExecDto {
            exit_code: output.status.code().unwrap_or(-1),
            stdout: truncate_output(String::from_utf8_lossy(&output.stdout).into_owned(), MAX_OUTPUT_CHARS),
            stderr: truncate_output(String::from_utf8_lossy(&output.stderr).into_owned(), MAX_OUTPUT_CHARS),
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

fn resolve_shell() -> ShellLaunch {
    #[cfg(windows)]
    {
        if on_path("powershell") {
            return ShellLaunch { name: "powershell", program: "powershell".to_string(), mode: ShellMode::Powershell };
        }
        return ShellLaunch { name: "cmd", program: env::var("COMSPEC").unwrap_or_else(|_| "cmd.exe".to_string()), mode: ShellMode::Cmd };
    }
    #[cfg(not(windows))]
    {
        if on_path("bash") {
            return ShellLaunch { name: "bash", program: "bash".to_string(), mode: ShellMode::Bash };
        }
        ShellLaunch { name: "sh", program: "sh".to_string(), mode: ShellMode::Sh }
    }
}

fn shell_args(mode: &ShellMode, command: &str) -> Vec<String> {
    match mode {
        #[cfg(windows)]
        ShellMode::Powershell => vec!["-NoProfile".to_string(), "-NonInteractive".to_string(), "-Command".to_string(), command.to_string()],
        #[cfg(windows)]
        ShellMode::Cmd => vec!["/c".to_string(), command.to_string()],
        #[cfg(not(windows))]
        ShellMode::Bash => vec!["-lc".to_string(), command.to_string()],
        #[cfg(not(windows))]
        ShellMode::Sh => vec!["-c".to_string(), command.to_string()],
    }
}

fn on_path(name: &str) -> bool {
    let Ok(path) = env::var("PATH") else { return false };
    env::split_paths(&path).any(|dir| dir.join(name).is_file() || dir.join(format!("{name}.exe")).is_file())
}

fn resolve_cwd_trusted(requested: Option<&str>, trusted: bool) -> Result<PathBuf, String> {
    let allow_root = user_home()?.canonicalize().map_err(|error| format!("failed to canonicalize HOME: {error}"))?;
    let cwd = match requested {
        Some(path) if !path.trim().is_empty() => PathBuf::from(path),
        _ => allow_root.clone(),
    };
    if cwd.components().any(|component| matches!(component, Component::ParentDir)) {
        return Err(POLICY_DENIED.to_string());
    }
    let canonical = cwd.canonicalize().map_err(|error| format!("invalid cwd: {error}"))?;
    if !trusted && !canonical.starts_with(&allow_root) {
        return Err(POLICY_DENIED.to_string());
    }
    Ok(canonical)
}

fn user_home() -> Result<PathBuf, String> {
    #[cfg(windows)]
    { env::var("USERPROFILE").map(PathBuf::from).map_err(|_| "USERPROFILE not set".to_string()) }
    #[cfg(not(windows))]
    { env::var("HOME").map(PathBuf::from).map_err(|_| "HOME not set".to_string()) }
}

fn is_command_blocked(command: &str) -> bool {
    let lower = command.to_lowercase();
    BLOCKLIST.iter().any(|blocked| lower.contains(&blocked.to_lowercase()))
}

fn truncate_output(value: String, max: usize) -> String {
    if value.len() <= max { value } else { value.chars().take(max).collect() }
}

#[cfg(windows)]
async fn kill_process_tree(pid: u32) {
    let _ = Command::new("taskkill").args(["/F", "/T", "/PID", &pid.to_string()]).stdout(Stdio::null()).stderr(Stdio::null()).status().await;
}

#[cfg(not(windows))]
async fn kill_process_tree(pid: u32) {
    let _ = Command::new("kill").args(["-9", &pid.to_string()]).stdout(Stdio::null()).stderr(Stdio::null()).status().await;
}

fn base64_encode(bytes: &[u8]) -> String {
    const TABLE: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::new();
    let mut index = 0;
    while index + 3 <= bytes.len() {
        let value = ((bytes[index] as u32) << 16) | ((bytes[index + 1] as u32) << 8) | bytes[index + 2] as u32;
        out.push(TABLE[((value >> 18) & 63) as usize] as char);
        out.push(TABLE[((value >> 12) & 63) as usize] as char);
        out.push(TABLE[((value >> 6) & 63) as usize] as char);
        out.push(TABLE[(value & 63) as usize] as char);
        index += 3;
    }
    if index < bytes.len() {
        let remain = bytes.len() - index;
        let mut value = (bytes[index] as u32) << 16;
        if remain == 2 { value |= (bytes[index + 1] as u32) << 8; }
        out.push(TABLE[((value >> 18) & 63) as usize] as char);
        out.push(TABLE[((value >> 12) & 63) as usize] as char);
        if remain == 2 {
            out.push(TABLE[((value >> 6) & 63) as usize] as char);
            out.push('=');
        } else {
            out.push('=');
            out.push('=');
        }
    }
    out
}

fn base64_decode(text: &str) -> Result<Vec<u8>, String> {
    fn value(byte: u8) -> Result<u8, String> {
        match byte {
            b'A'..=b'Z' => Ok(byte - b'A'),
            b'a'..=b'z' => Ok(byte - b'a' + 26),
            b'0'..=b'9' => Ok(byte - b'0' + 52),
            b'+' => Ok(62),
            b'/' => Ok(63),
            _ => Err("内容不是 base64".into()),
        }
    }
    let bytes = text.as_bytes();
    let mut out = Vec::new();
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'=' { break; }
        let first = value(bytes[index])?;
        let second = value(*bytes.get(index + 1).ok_or("内容不是 base64")?)?;
        let third = bytes.get(index + 2).copied().unwrap_or(b'=');
        let fourth = bytes.get(index + 3).copied().unwrap_or(b'=');
        out.push((first << 2) | (second >> 4));
        if third != b'=' {
            let third = value(third)?;
            out.push((second << 4) | (third >> 2));
            if fourth != b'=' { out.push((third << 6) | value(fourth)?); }
        }
        index += 4;
    }
    Ok(out)
}
