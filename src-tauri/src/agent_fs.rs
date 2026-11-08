use serde_json::{json, Value};
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

use crate::shell_cmd;

const WORKSPACE_ROOT: &str = "/workspace";
const DATA_ROOT: &str = ".loncra-agent";
const MAX_LIST_ENTRIES: usize = 5000;
const MAX_GREP_MATCHES: usize = 1000;
const MAX_GREP_FILES: usize = 5000;
const MAX_GREP_FILE_BYTES: u64 = 1024 * 1024;

#[tauri::command]
pub async fn agent_fs(
    app: AppHandle,
    operation: String,
    params: Value,
    scope: String,
    roots: Vec<String>,
) -> Result<Value, String> {
    let effective_roots = resolve_roots(&app, &scope, &params, &roots)?;
    let result = dispatch(&operation, &params, &effective_roots).await;
    Ok(match result {
        Ok(data) => success(data),
        Err(message) => failure(&message),
    })
}

fn resolve_roots(
    app: &AppHandle,
    scope: &str,
    params: &Value,
    roots: &[String],
) -> Result<Vec<String>, String> {
    let path_fields = ["path", "fromPath", "toPath"];
    if scope == "store" {
        for field in path_fields {
            let Some(raw) = param_str(params, field) else { continue };
            let rel = relative_path(raw)?;
            if !rel.starts_with(&format!("{DATA_ROOT}/")) {
                return Err("数据区路径必须位于 .loncra-agent 下".into());
            }
        }
        let home = app.path().home_dir().map_err(|error| error.to_string())?;
        return Ok(vec![home.to_string_lossy().to_string()]);
    }
    for field in path_fields {
        if let Some(raw) = param_str(params, field) {
            let rel = relative_path(raw)?;
            if rel == DATA_ROOT || rel.starts_with(&format!("{DATA_ROOT}/")) {
                return Err("无权访问数据区目录".into());
            }
        }
    }
    if roots.is_empty() {
        return Err("工作空间未配置目录".into());
    }
    Ok(roots.to_vec())
}

async fn dispatch(operation: &str, params: &Value, roots: &[String]) -> Result<Value, String> {
    match operation.to_ascii_uppercase().as_str() {
        "LS" => ls(params, roots),
        "READ" => read(params, roots),
        "WRITE" => write(params, roots),
        "EDIT" => edit(params, roots),
        "GREP" => grep(params, roots),
        "GLOB" => glob(params, roots),
        "EXISTS" => exists(params, roots),
        "DELETE" => delete(params, roots),
        "MOVE" => move_path(params, roots),
        "EXECUTE" => execute(params).await,
        other => Err(format!("未知文件系统操作 [{other}]")),
    }
}

fn success(data: Value) -> Value {
    json!({"status": 200, "executeCode": "200", "message": "ok", "data": data, "metadata": {}})
}

fn failure(message: &str) -> Value {
    json!({"status": 500, "executeCode": "500", "message": message, "data": Value::Null, "metadata": {}})
}

fn param_str<'a>(params: &'a Value, key: &str) -> Option<&'a str> {
    params.get(key).and_then(Value::as_str)
}

fn param_i64(params: &Value, key: &str) -> i64 {
    params.get(key).and_then(Value::as_i64).unwrap_or(0)
}

fn relative_path(raw: &str) -> Result<String, String> {
    let mut normalized = raw.trim().replace('\\', "/");
    if normalized.starts_with(WORKSPACE_ROOT) {
        normalized = normalized[WORKSPACE_ROOT.len()..].to_string();
    }
    let normalized = normalized.trim_start_matches('/');
    if normalized.split('/').any(|segment| segment == "..") {
        return Err("路径不允许包含 ..".to_string());
    }
    Ok(normalized.to_string())
}

fn abstract_path(rel: &str) -> String {
    if rel.is_empty() {
        WORKSPACE_ROOT.to_string()
    } else {
        format!("{WORKSPACE_ROOT}/{rel}")
    }
}

fn read_candidate(roots: &[String], rel: &str) -> Option<PathBuf> {
    roots
        .iter()
        .map(|root| Path::new(root).join(rel))
        .find(|candidate| candidate.exists())
}

fn write_target(roots: &[String], rel: &str) -> Result<PathBuf, String> {
    let root = roots.first().ok_or("客户端未配置工作空间根路径")?;
    Ok(Path::new(root).join(rel))
}

fn file_info(rel: &str, is_dir: bool, size: u64) -> Value {
    json!({"path": abstract_path(rel), "isDirectory": is_dir, "size": size, "modifiedAt": ""})
}

fn ls(params: &Value, roots: &[String]) -> Result<Value, String> {
    let rel = relative_path(param_str(params, "path").ok_or("缺少 path")?)?;
    let mut entries = Vec::new();

    if let Some(dir) = read_candidate(roots, &rel) {
        if dir.is_dir() {
            for entry in fs::read_dir(&dir).map_err(|error| error.to_string())? {
                let entry = entry.map_err(|error| error.to_string())?;
                let metadata = entry.metadata().map_err(|error| error.to_string())?;
                let name = entry.file_name().to_string_lossy().to_string();
                let child_rel = if rel.is_empty() { name } else { format!("{rel}/{name}") };
                entries.push(file_info(&child_rel, metadata.is_dir(), metadata.len()));
            }
        }
    }

    entries.truncate(MAX_LIST_ENTRIES);
    Ok(json!(entries))
}

fn read(params: &Value, roots: &[String]) -> Result<Value, String> {
    let rel = relative_path(param_str(params, "path").ok_or("缺少 path")?)?;
    let path = read_candidate(roots, &rel).ok_or(format!("文件不存在: {}", abstract_path(&rel)))?;

    let bytes = fs::read(&path).map_err(|error| error.to_string())?;
    let (mut content, encoding) = match String::from_utf8(bytes) {
        Ok(text) => (text, "utf-8"),
        Err(error) => (base64_encode(&error.into_bytes()), "base64"),
    };

    let offset = param_i64(params, "offset");
    let limit = param_i64(params, "limit");
    if offset > 0 || limit > 0 {
        let lines: Vec<&str> = content.lines().collect();
        let start = (offset.max(0) as usize).min(lines.len());
        let end = if limit > 0 { (start + limit as usize).min(lines.len()) } else { lines.len() };
        content = lines[start..end].join("\n");
    }

    Ok(json!({"content": content, "encoding": encoding, "createdAt": Value::Null, "modifiedAt": Value::Null}))
}

fn write(params: &Value, roots: &[String]) -> Result<Value, String> {
    let rel = relative_path(param_str(params, "path").ok_or("缺少 path")?)?;
    let content = param_str(params, "content").ok_or("缺少 content")?;
    let target = write_target(roots, &rel)?;

    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    fs::write(&target, content).map_err(|error| error.to_string())?;
    Ok(json!(true))
}

fn edit(params: &Value, roots: &[String]) -> Result<Value, String> {
    let rel = relative_path(param_str(params, "path").ok_or("缺少 path")?)?;
    let old_string = param_str(params, "oldString").ok_or("缺少 oldString")?;
    let new_string = param_str(params, "newString").ok_or("缺少 newString")?;
    let replace_all = params.get("replaceAll").and_then(Value::as_bool).unwrap_or(false);

    let path = read_candidate(roots, &rel).ok_or(format!("文件不存在: {}", abstract_path(&rel)))?;
    let content = fs::read_to_string(&path).map_err(|error| error.to_string())?;

    let occurrences = content.matches(old_string).count();
    if occurrences == 0 {
        return Ok(json!({"path": Value::Null, "error": "未找到待替换内容", "occurrences": Value::Null}));
    }

    let updated = if replace_all {
        content.replace(old_string, new_string)
    } else {
        content.replacen(old_string, new_string, 1)
    };
    fs::write(&path, updated).map_err(|error| error.to_string())?;

    Ok(json!({"path": abstract_path(&rel), "error": Value::Null, "occurrences": occurrences}))
}

fn grep(params: &Value, roots: &[String]) -> Result<Value, String> {
    let pattern = param_str(params, "pattern").ok_or("缺少 pattern")?.to_string();
    let glob = param_str(params, "glob").map(|value| value.to_string());
    let rel = relative_path(param_str(params, "path").unwrap_or(""))?;

    let mut matches = Vec::new();
    let mut visited = 0usize;
    for root in roots {
        let base = Path::new(root).join(&rel);
        if !base.exists() {
            continue;
        }
        walk_grep(&base, Path::new(root), &pattern, glob.as_deref(), &mut matches, &mut visited)?;
        if matches.len() >= MAX_GREP_MATCHES || visited >= MAX_GREP_FILES {
            break;
        }
    }

    matches.truncate(MAX_GREP_MATCHES);
    Ok(json!(matches))
}

fn walk_grep(
    dir: &Path,
    root: &Path,
    pattern: &str,
    glob: Option<&str>,
    matches: &mut Vec<Value>,
    visited: &mut usize,
) -> Result<(), String> {
    if matches.len() >= MAX_GREP_MATCHES || *visited >= MAX_GREP_FILES {
        return Ok(());
    }

    let entries = fs::read_dir(dir).map_err(|error| error.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();

        if path.is_dir() {
            walk_grep(&path, root, pattern, glob, matches, visited)?;
        } else {
            *visited += 1;
            if *visited > MAX_GREP_FILES || matches.len() >= MAX_GREP_MATCHES {
                return Ok(());
            }
            let metadata = entry.metadata().map_err(|error| error.to_string())?;
            if metadata.len() > MAX_GREP_FILE_BYTES {
                continue;
            }
            let rel_path = path
                .strip_prefix(root)
                .map(|value| value.to_string_lossy().replace('\\', "/"))
                .unwrap_or_default();
            if let Some(glob_pattern) = glob {
                if !glob_match(glob_pattern, &rel_path) {
                    continue;
                }
            }
            let Ok(content) = fs::read_to_string(&path) else { continue };
            for (index, line) in content.lines().enumerate() {
                if line.contains(pattern) {
                    matches.push(json!({"path": abstract_path(&rel_path), "line": index + 1, "text": line}));
                    if matches.len() >= MAX_GREP_MATCHES {
                        return Ok(());
                    }
                }
            }
        }
    }
    Ok(())
}

fn glob(params: &Value, roots: &[String]) -> Result<Value, String> {
    let pattern = param_str(params, "pattern").ok_or("缺少 pattern")?.to_string();
    let rel = relative_path(param_str(params, "path").unwrap_or(""))?;

    let mut matches = Vec::new();
    for root in roots {
        let base = Path::new(root).join(&rel);
        if base.is_dir() {
            walk_glob(&base, &rel, &pattern, &mut matches)?;
        }
    }

    matches.sort_by(|left, right| {
        let left_path = left.get("path").and_then(Value::as_str).unwrap_or_default();
        let right_path = right.get("path").and_then(Value::as_str).unwrap_or_default();
        left_path.cmp(right_path)
    });
    matches.dedup_by(|left, right| left.get("path") == right.get("path"));
    Ok(json!(matches))
}

fn walk_glob(dir: &Path, rel: &str, pattern: &str, matches: &mut Vec<Value>) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|error| error.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        let child_rel = if rel.is_empty() { name } else { format!("{rel}/{name}") };
        let is_dir = path.is_dir();

        if glob_match(pattern, &child_rel) {
            let metadata = entry.metadata().map_err(|error| error.to_string())?;
            matches.push(file_info(&child_rel, is_dir, metadata.len()));
        }
        if is_dir {
            walk_glob(&path, &child_rel, pattern, matches)?;
        }
    }
    Ok(())
}

fn exists(params: &Value, roots: &[String]) -> Result<Value, String> {
    let rel = relative_path(param_str(params, "path").ok_or("缺少 path")?)?;
    let found = roots.iter().any(|root| Path::new(root).join(&rel).exists());
    Ok(json!(found))
}

fn delete(params: &Value, roots: &[String]) -> Result<Value, String> {
    let rel = relative_path(param_str(params, "path").ok_or("缺少 path")?)?;
    let path = read_candidate(roots, &rel).ok_or(format!("路径不存在: {}", abstract_path(&rel)))?;

    if path.is_dir() {
        fs::remove_dir_all(&path).map_err(|error| error.to_string())?;
    } else {
        fs::remove_file(&path).map_err(|error| error.to_string())?;
    }
    Ok(json!(true))
}

fn move_path(params: &Value, roots: &[String]) -> Result<Value, String> {
    let from_rel = relative_path(param_str(params, "fromPath").ok_or("缺少 fromPath")?)?;
    let to_rel = relative_path(param_str(params, "toPath").ok_or("缺少 toPath")?)?;
    let from = read_candidate(roots, &from_rel).ok_or(format!("路径不存在: {}", abstract_path(&from_rel)))?;
    let to = write_target(roots, &to_rel)?;

    if let Some(parent) = to.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    if fs::rename(&from, &to).is_err() {
        fs::copy(&from, &to).map_err(|error| error.to_string())?;
        if from.is_dir() {
            fs::remove_dir_all(&from).map_err(|error| error.to_string())?;
        } else {
            fs::remove_file(&from).map_err(|error| error.to_string())?;
        }
    }
    Ok(json!(true))
}

async fn execute(params: &Value) -> Result<Value, String> {
    let command = param_str(params, "command").ok_or("缺少 command")?.to_string();
    let timeout_seconds = params.get("timeoutSeconds").and_then(Value::as_i64).unwrap_or(60).max(1);
    let result = shell_cmd::run_restricted_shell(command, None, timeout_seconds as u64 * 1000).await?;

    let output = format!("{}{}", result.stdout, result.stderr);
    Ok(json!({"output": output, "exitCode": result.exit_code, "truncated": false}))
}

fn glob_match(pattern: &str, candidate: &str) -> bool {
    match_segments(
        pattern.split('/').collect::<Vec<_>>().as_slice(),
        candidate.split('/').collect::<Vec<_>>().as_slice(),
    )
}

fn match_segments(pattern: &[&str], candidate: &[&str]) -> bool {
    if pattern.is_empty() {
        return candidate.is_empty();
    }
    if pattern[0] == "**" {
        return (0..=candidate.len()).any(|skip| match_segments(&pattern[1..], &candidate[skip..]));
    }
    if candidate.is_empty() {
        return false;
    }
    segment_match(pattern[0], candidate[0]) && match_segments(&pattern[1..], &candidate[1..])
}

fn segment_match(pattern: &str, value: &str) -> bool {
    fn inner(pattern: &[u8], value: &[u8]) -> bool {
        if pattern.is_empty() {
            return value.is_empty();
        }
        match pattern[0] {
            b'*' => (0..=value.len()).any(|skip| inner(&pattern[1..], &value[skip..])),
            b'?' => !value.is_empty() && inner(&pattern[1..], &value[1..]),
            byte => !value.is_empty() && value[0] == byte && inner(&pattern[1..], &value[1..]),
        }
    }
    inner(pattern.as_bytes(), value.as_bytes())
}

fn base64_encode(data: &[u8]) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut output = String::with_capacity(data.len().div_ceil(3) * 4);
    for chunk in data.chunks(3) {
        let first = chunk[0] as u32;
        let second = *chunk.get(1).unwrap_or(&0) as u32;
        let third = *chunk.get(2).unwrap_or(&0) as u32;
        let triple = (first << 16) | (second << 8) | third;
        output.push(TABLE[(triple >> 18) as usize & 0x3f] as char);
        output.push(TABLE[(triple >> 12) as usize & 0x3f] as char);
        output.push(if chunk.len() > 1 { TABLE[(triple >> 6) as usize & 0x3f] as char } else { '=' });
        output.push(if chunk.len() > 2 { TABLE[triple as usize & 0x3f] as char } else { '=' });
    }
    output
}
