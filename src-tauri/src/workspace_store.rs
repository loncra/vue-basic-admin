use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager};

pub const LOCAL_DEFAULT_WORKSPACE_KEY: &str = "local.default.workspace";

const DATA_DIR_NAME: &str = ".loncra-agent";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentWorkspace {
    pub key: String,
    pub default: bool,
    #[serde(default)]
    pub roots: Vec<String>,
    pub created_at: u64,
}

fn store_file(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .home_dir()
        .map_err(|error| error.to_string())?
        .join(DATA_DIR_NAME);
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir.join("workspaces.json"))
}

fn read_all(app: &AppHandle) -> Result<Vec<AgentWorkspace>, String> {
    let path = store_file(app)?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let raw = fs::read_to_string(&path).map_err(|error| error.to_string())?;
    serde_json::from_str(&raw).map_err(|error| error.to_string())
}

fn write_all(app: &AppHandle, list: &[AgentWorkspace]) -> Result<(), String> {
    let path = store_file(app)?;
    let raw = serde_json::to_string_pretty(list).map_err(|error| error.to_string())?;
    fs::write(&path, raw).map_err(|error| error.to_string())
}

fn now_unix() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or(0)
}

fn local_default_roots(app: &AppHandle) -> Result<Vec<String>, String> {
    let home = app
        .path()
        .home_dir()
        .map_err(|error| error.to_string())?;
    Ok(vec![home.to_string_lossy().to_string()])
}

fn ensure_local_default(app: &AppHandle, mut list: Vec<AgentWorkspace>) -> Result<Vec<AgentWorkspace>, String> {
    let roots = local_default_roots(app)?;
    if !list.iter().any(|item| item.default) {
        list.insert(
            0,
            AgentWorkspace {
                key: LOCAL_DEFAULT_WORKSPACE_KEY.to_string(),
                default: true,
                roots: roots.clone(),
                created_at: now_unix(),
            },
        );
    } else if let Some(entry) = list.iter_mut().find(|item| item.default) {
        if entry.roots.is_empty() {
            entry.roots = roots;
        }
    }
    Ok(list)
}

#[tauri::command]
pub fn list_workspaces(app: AppHandle) -> Result<Vec<AgentWorkspace>, String> {
    let list = ensure_local_default(&app, read_all(&app)?)?;
    write_all(&app, &list)?;
    Ok(list)
}

#[tauri::command]
pub fn add_workspace(app: AppHandle, key: String, roots: Vec<String>) -> Result<AgentWorkspace, String> {
    if roots.is_empty() {
        return Err("WORKSPACE_ROOTS_EMPTY".into());
    }
    let mut list = read_all(&app)?;
    if list
        .iter()
        .any(|item| item.roots.iter().any(|root| roots.contains(root)))
    {
        return Err("WORKSPACE_ROOT_EXISTS".into());
    }
    let item = AgentWorkspace {
        key,
        default: false,
        roots,
        created_at: now_unix(),
    };
    list.push(item.clone());
    write_all(&app, &list)?;
    Ok(item)
}

#[tauri::command]
pub fn remove_workspace(app: AppHandle, key: String) -> Result<(), String> {
    let list = read_all(&app)?;
    if list.iter().any(|item| item.key == key && item.default) {
        return Err("LOCAL_DEFAULT_WORKSPACE_UNDELETABLE".into());
    }
    let remaining: Vec<AgentWorkspace> = list.into_iter().filter(|item| item.key != key).collect();
    write_all(&app, &remaining)
}

#[tauri::command]
pub fn device_fingerprint() -> Result<String, String> {
    machine_uid::get().map_err(|error| error.to_string())
}
